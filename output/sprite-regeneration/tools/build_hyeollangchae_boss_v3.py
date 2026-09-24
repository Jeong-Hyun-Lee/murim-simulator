"""Build the globally scale- and ground-locked Hyeollangchae boss v3 atlas.

The generated source strips intentionally keep each pose as an isolated alpha
component.  This builder assigns those components by their visual order, uses
one scale for every motion, and only translates frames to the shared support
point.  It never normalizes or recenters a frame independently.
"""

from __future__ import annotations

import importlib.util
from pathlib import Path

import numpy as np
from PIL import Image


SCRIPT = Path(__file__).with_name('build_mokhyeon_base.py')
SPEC = importlib.util.spec_from_file_location('build_mokhyeon_base', SCRIPT)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f'cannot load builder: {SCRIPT}')
BUILDER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(BUILDER)


def extract_ordered_frames(
    image: Image.Image,
    cols: int,
    rows: int,
    frame_count: int | None = None,
) -> list[dict[str, np.ndarray]]:
    """Extract poses at the lowest-alpha trough between generated cells.

    Generated strips do not always use mathematically exact cell edges.  The
    least-populated column near each expected quarter is a more reliable split.
    Inside each resulting region, disconnected neighboring fragments are
    discarded while meaningful weapon/effect components remain attached to the
    owning pose.
    """
    if rows != 1:
        raise ValueError('boss production strips must use one row')
    count = frame_count if frame_count is not None else cols
    rgba = np.asarray(image.convert('RGBA'))
    mask = rgba[:, :, 3] >= BUILDER.ALPHA_THRESHOLD
    profile = mask.sum(axis=0)
    cuts = [0]
    search_radius = max(48, round(image.width / cols * 0.19))
    for boundary in range(1, cols):
        expected = round(boundary * image.width / cols)
        left = max(cuts[-1] + 1, expected - search_radius)
        right = min(image.width, expected + search_radius)
        cut = left + int(np.argmin(profile[left:right]))
        cuts.append(cut)
    cuts.append(image.width)
    extracted: list[dict[str, np.ndarray]] = []
    for index in range(count):
        left, right = cuts[index], cuts[index + 1]
        region_mask = mask[:, left:right]
        components = BUILDER.connected_components(region_mask)
        if not components:
            raise ValueError(f'frame {index + 1} contains no visible artwork')
        main = max(components, key=len)
        main_center = main.mean(axis=0)
        kept = [main]
        for component in components:
            if component is main or len(component) < max(24, len(main) * 0.003):
                continue
            if np.linalg.norm(component.mean(axis=0) - main_center) <= image.height * 0.78:
                kept.append(component)
        coords = np.concatenate(kept)
        pixels = rgba[coords[:, 0], coords[:, 1] + left]
        extracted.append(
            {
                'coords': coords,
                'pixels': pixels,
                'cellWidth': np.asarray(right - left),
                'cellHeight': np.asarray(image.height),
                'sourceIndex': np.asarray(index),
                'splitAlphaCount': np.asarray(int(profile[right]) if right < image.width else 0),
            },
        )
    return extracted


def support_reference(frame: dict[str, np.ndarray]) -> tuple[float, float]:
    """Locate the right-side support contact and actual ground pixels."""
    coords = frame['coords']
    y_values = coords[:, 0]
    x_values = coords[:, 1]
    top = float(np.percentile(y_values, 0.5))
    ground = float(np.percentile(y_values, 99.5))
    lower = y_values >= ground - max(8.0, (ground - top) * 0.12)
    lower_x = x_values[lower]
    if lower_x.size == 0:
        raise ValueError('cannot locate support contact')
    return float(np.percentile(lower_x, 82)), ground


def render_ground_locked(
    motion: str,
    frames: list[dict[str, np.ndarray]],
) -> tuple[list[Image.Image], dict[str, float]]:
    """Apply one global scale and translate every support to one root."""
    scale = BUILDER.FIXED_CHARACTER_SCALE
    if scale is None:
        raise ValueError('boss build requires one explicit global scale')
    rendered: list[Image.Image] = []
    source_heights: list[float] = []
    source_roots: list[float] = []
    source_grounds: list[float] = []
    for index, frame in enumerate(frames):
        coords = frame['coords']
        pixels = frame['pixels']
        root_x, ground = support_reference(frame)
        min_y, min_x = coords.min(axis=0)
        max_y, max_x = coords.max(axis=0)
        source_heights.append(float(max_y - min_y + 1))
        source_roots.append(root_x)
        source_grounds.append(ground)
        width = int(max_x - min_x + 1)
        height = int(max_y - min_y + 1)
        source = np.zeros((height, width, 4), dtype=np.uint8)
        source[coords[:, 0] - min_y, coords[:, 1] - min_x] = pixels
        source_image = Image.fromarray(source, 'RGBA')
        resized = source_image.resize(
            (
                max(1, round(width * scale)),
                max(1, round(height * scale)),
            ),
            Image.Resampling.LANCZOS,
        )
        left = round(BUILDER.ROOT_X + (min_x - root_x) * scale)
        top = round(BUILDER.GROUND_Y + (min_y - ground) * scale)
        offsets = BUILDER.MOTION_FRAME_OFFSETS.get(motion, [])
        offset_x, offset_y = offsets[index] if index < len(offsets) else (0, 0)
        left += offset_x
        top += offset_y
        right = left + resized.width
        bottom = top + resized.height
        if (
            left < BUILDER.SAFE
            or top < BUILDER.SAFE
            or right > BUILDER.CELL - BUILDER.SAFE
            or bottom > BUILDER.CELL - BUILDER.SAFE
        ):
            raise ValueError(
                f'{motion} frame {index + 1} violates safe margin: '
                f'{left},{top},{right},{bottom}',
            )
        cell = Image.new('RGBA', (BUILDER.CELL, BUILDER.CELL))
        cell.alpha_composite(resized, (left, top))
        rendered.append(cell)
    return rendered, {
        'appliedScale': float(scale),
        'sourceHeightMin': round(min(source_heights), 3),
        'sourceHeightMax': round(max(source_heights), 3),
        'sourceRootXMin': round(min(source_roots), 3),
        'sourceRootXMax': round(max(source_roots), 3),
        'sourceGroundMin': round(min(source_grounds), 3),
        'sourceGroundMax': round(max(source_grounds), 3),
        'packedRootX': float(BUILDER.ROOT_X),
        'packedGroundY': float(BUILDER.GROUND_Y),
    }


BUILDER.SOURCE = BUILDER.ROOT / 'output' / 'sprite-regeneration' / 'hyeollangchae-boss-v3'
BUILDER.OUTPUT = BUILDER.SOURCE
BUILDER.CELL = 896
BUILDER.ROOT_X = 624
BUILDER.GROUND_Y = 770
BUILDER.ANCHOR = {
    'x': BUILDER.ROOT_X / BUILDER.CELL,
    'y': BUILDER.GROUND_Y / BUILDER.CELL,
}
BUILDER.BUILD_NAME = 'hyeollangchae-boss-v3'
BUILDER.FRAME_PREFIX = 'hyeollangchae-boss-v3'
BUILDER.STRICT_CANONICAL_SCALE = True
BUILDER.FIXED_CHARACTER_SCALE = 0.93
BUILDER.extract_frames = extract_ordered_frames
BUILDER.render_motion = render_ground_locked
BUILDER.VERIFICATION_NOTES = {
    'character': 'Hyeollangchae boss',
    'globalMotionPlan': 'four-motion master board before production strips',
    'motionCounts': {'idle': 12, 'attack1': 16, 'attack2': 16, 'death': 10},
    'singleGlobalScale': True,
    'perFrameScaling': False,
    'perMotionScaling': False,
    'groundLock': 'actual support-contact alpha translated to packed y=770',
    'rootLock': 'right-side support axis translated to packed x=624',
    'orientation': 'screen-left; source artwork is never mirrored',
    'runtimeScale': 0.5,
    'runtimeZoomLogic': False,
}


if __name__ == '__main__':
    BUILDER.main()

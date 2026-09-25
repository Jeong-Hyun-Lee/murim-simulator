"""Build the globally scale- and ground-locked Hyeollangchae grunt v3 atlas."""

from __future__ import annotations

import importlib.util
from pathlib import Path

import numpy as np
from PIL import Image


SCRIPT = Path(__file__).with_name('build_hyeollangchae_boss_v3.py')
SPEC = importlib.util.spec_from_file_location('build_hyeollangchae_boss_v3', SCRIPT)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f'cannot load builder: {SCRIPT}')
BOSS = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(BOSS)
BUILDER = BOSS.BUILDER


def extract_main_frames(
    image: Image.Image,
    cols: int,
    rows: int,
    frame_count: int | None = None,
) -> list[dict[str, np.ndarray]]:
    """Keep only each pose's connected body/weapon/effect group.

    The grunt strips keep the saber connected to its hand and attack effect.
    Discarding secondary components prevents a neighboring pose's overhanging
    blade from being assigned to the current frame without resizing artwork.
    """
    if rows != 1:
        raise ValueError('grunt production strips must use one row')
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
        cuts.append(left + int(np.argmin(profile[left:right])))
    cuts.append(image.width)
    extracted: list[dict[str, np.ndarray]] = []
    for index in range(count):
        left, right = cuts[index], cuts[index + 1]
        components = BUILDER.connected_components(mask[:, left:right])
        if not components:
            raise ValueError(f'frame {index + 1} contains no visible artwork')
        coords = max(components, key=len)
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

BUILDER.SOURCE = BUILDER.ROOT / 'output' / 'sprite-regeneration' / 'hyeollangchae-grunt-v3'
BUILDER.OUTPUT = BUILDER.SOURCE
BUILDER.CELL = 896
BUILDER.ROOT_X = 612
BUILDER.GROUND_Y = 770
BUILDER.ANCHOR = {
    'x': BUILDER.ROOT_X / BUILDER.CELL,
    'y': BUILDER.GROUND_Y / BUILDER.CELL,
}
BUILDER.BUILD_NAME = 'hyeollangchae-grunt-v3'
BUILDER.FRAME_PREFIX = 'hyeollangchae-grunt-v3'
BUILDER.STRICT_CANONICAL_SCALE = True
BUILDER.FIXED_CHARACTER_SCALE = 0.93
BUILDER.extract_frames = extract_main_frames
BUILDER.render_motion = BOSS.render_ground_locked
BUILDER.VERIFICATION_NOTES = {
    'character': 'Hyeollangchae grunt',
    'globalMotionPlan': 'four-motion master board before production strips',
    'motionCounts': {'idle': 12, 'attack1': 16, 'attack2': 16, 'death': 10},
    'singleGlobalScale': True,
    'perFrameScaling': False,
    'perMotionScaling': False,
    'groundLock': 'actual support-contact alpha translated to packed y=770',
    'rootLock': 'right-side support axis translated to packed x=612',
    'orientation': 'screen-left; source artwork is never mirrored',
    'runtimeScale': 0.45,
    'runtimeZoomLogic': False,
}


if __name__ == '__main__':
    BUILDER.main()

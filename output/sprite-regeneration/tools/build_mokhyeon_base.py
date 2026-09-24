"""Shared Mokhyeon storyboard extraction and PixiJS packing utilities.

Version-specific builders configure the source, fixed root and scale.  This
module never rescales or recenters an individual frame, and it fails instead
of silently clipping pixels outside the 768px runtime cell.
"""

from __future__ import annotations

from collections import deque
import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[3]
SOURCE = ROOT / 'output' / 'sprite-regeneration' / 'mokhyeon-v10'
OUTPUT = SOURCE
ASSET = ROOT / 'assets' / 'sprites' / 'character'
CELL = 768
ROOT_X = 192
GROUND_Y = 624
SAFE = 32
ANCHOR = {'x': 0.25, 'y': 0.8125}
ALPHA_THRESHOLD = 8
TARGET_STANDING_HEIGHT = 512
SOURCE_ROOT_X_FRACTION = 0.245
BUILD_NAME = 'mokhyeon-v10'
FRAME_PREFIX = 'mokhyeon'
STRICT_CANONICAL_SCALE = False
FIXED_CHARACTER_SCALE: float | None = None
MOTION_FRAME_OFFSETS: dict[str, list[tuple[int, int]]] = {}
VERIFICATION_NOTES: dict[str, object] = {}
MOTIONS = {
    'idle': {'count': 12, 'parts': [4, 4, 4]},
    'attack1': {'count': 16, 'parts': [4, 4, 4, 4]},
    'attack2': {'count': 16, 'parts': [4, 4, 4, 4]},
    'death': {'count': 10, 'parts': [4, 4, 2]},
}
DURATIONS = {
    'idle': [80] * 12,
    'attack1': [45] * 16,
    'attack2': [45] * 16,
    'death': [80] * 9 + [360],
}


def storyboard_path(motion: str) -> Path:
    return SOURCE / f'{motion}-storyboard.png'


def part_path(motion: str, part: int) -> Path:
    return SOURCE / f'{motion}-part{part}.png'


def connected_components(mask: np.ndarray) -> list[np.ndarray]:
    """Return 8-connected component coordinates as arrays of ``(y, x)``."""
    height, width = mask.shape
    visited = np.zeros(mask.shape, dtype=np.bool_)
    components: list[np.ndarray] = []
    for start_y, start_x in zip(*np.nonzero(mask & ~visited)):
        if visited[start_y, start_x]:
            continue
        queue = deque([(int(start_y), int(start_x))])
        visited[start_y, start_x] = True
        points: list[tuple[int, int]] = []
        while queue:
            y, x = queue.popleft()
            points.append((y, x))
            for next_y in range(max(0, y - 1), min(height, y + 2)):
                for next_x in range(max(0, x - 1), min(width, x + 2)):
                    if mask[next_y, next_x] and not visited[next_y, next_x]:
                        visited[next_y, next_x] = True
                        queue.append((next_y, next_x))
        if len(points) >= 4:
            components.append(np.asarray(points, dtype=np.int32))
    return components


def extract_frames(
    image: Image.Image,
    cols: int,
    rows: int,
    frame_count: int | None = None,
) -> list[dict[str, np.ndarray]]:
    """Read the regular storyboard grid without trimming individual poses.

    The generator can leave antialiased pixels touching across neighboring
    cells, so connected-component ownership is not reliable.  Keeping the
    authored equal-cell coordinate system is also what preserves the shared
    root.  Boundary contact is reported later and never hidden by recentering.
    """
    rgba = np.asarray(image.convert('RGBA'))
    extracted: list[dict[str, np.ndarray]] = []
    x_edges = [round(column * image.width / cols) for column in range(cols + 1)]
    y_edges = [round(row * image.height / rows) for row in range(rows + 1)]
    expected_count = frame_count if frame_count is not None else cols * rows
    grouped: list[list[np.ndarray]] = [[] for _ in range(expected_count)]
    components = connected_components(rgba[:, :, 3] >= ALPHA_THRESHOLD)
    for component in components:
        center_y, center_x = component.mean(axis=0)
        column = min(cols - 1, max(0, int(center_x * cols / image.width)))
        row = min(rows - 1, max(0, int(center_y * rows / image.height)))
        index = row * cols + column
        if index < expected_count:
            grouped[index].append(component)

    for index, components_for_frame in enumerate(grouped):
        if not components_for_frame:
            raise ValueError(f'frame {index + 1} contains no visible artwork')
        main = max(components_for_frame, key=len)
        main_center = main.mean(axis=0)
        kept = [main]
        for component in components_for_frame:
            if component is main or len(component) < max(24, len(main) * 0.004):
                continue
            if np.linalg.norm(component.mean(axis=0) - main_center) <= image.height * 0.72:
                kept.append(component)
        global_coords = np.concatenate(kept)
        pixels = rgba[global_coords[:, 0], global_coords[:, 1]]
        row, column = divmod(index, cols)
        left, right = x_edges[column], x_edges[column + 1]
        top, bottom = y_edges[row], y_edges[row + 1]
        local_coords = global_coords.copy()
        local_coords[:, 0] -= top
        local_coords[:, 1] -= left
        extracted.append({
            'coords': local_coords,
            'pixels': pixels,
            'cellWidth': np.asarray(right - left),
            'cellHeight': np.asarray(bottom - top),
        })
    return extracted


def standing_reference(frame: dict[str, np.ndarray]) -> tuple[float, float, float]:
    coords = frame['coords']
    y_values = coords[:, 0]
    x_values = coords[:, 1]
    top = float(np.percentile(y_values, 0.5))
    ground = float(np.percentile(y_values, 99.5))
    lower = y_values >= ground - max(8, (ground - top) * 0.18)
    lower_x = x_values[lower]
    if lower_x.size == 0:
        raise ValueError('cannot locate lower-body root')
    # The runtime root is the rear planted-foot axis rather than the visual
    # centre of the wide SD stance.  A left-biased lower-body percentile keeps
    # trailing hair inside the protagonist's smaller rear allocation.
    root_x = float(np.percentile(lower_x, 30))
    return root_x, ground, ground - top


def render_motion(
    motion: str,
    frames: list[dict[str, np.ndarray]],
) -> tuple[list[Image.Image], dict[str, float]]:
    root_x, source_ground, source_height = standing_reference(frames[0])
    # The generation strips place the same wide stance at slightly different
    # visual centres.  Use the approved reference pose's rear-foot axis for
    # every motion instead of letting sword/ribbon pixels move the pivot.
    root_x_fraction = SOURCE_ROOT_X_FRACTION
    root_x = root_x_fraction * float(frames[0]['cellWidth'])
    ground_fraction = source_ground / float(frames[0]['cellHeight'])
    requested_scale = TARGET_STANDING_HEIGHT / source_height

    # Find the largest single motion-wide scale that preserves every pixel and
    # the required transparent safety border.  No frame-specific correction is
    # allowed because that would reintroduce visible zoom and pivot jitter.
    scale_limits = [requested_scale]
    for frame in frames:
        coords = frame['coords']
        frame_root_x = root_x_fraction * float(frame['cellWidth'])
        frame_ground = ground_fraction * float(frame['cellHeight'])
        min_y, min_x = coords.min(axis=0)
        max_y, max_x = coords.max(axis=0)
        if frame_root_x > min_x:
            scale_limits.append((ROOT_X - SAFE) / (frame_root_x - min_x))
        if max_x > frame_root_x:
            scale_limits.append((CELL - SAFE - 1 - ROOT_X) / (max_x - frame_root_x))
        if frame_ground > min_y:
            scale_limits.append((GROUND_Y - SAFE) / (frame_ground - min_y))
        if max_y > frame_ground:
            scale_limits.append((CELL - SAFE - 1 - GROUND_Y) / (max_y - frame_ground))
    if FIXED_CHARACTER_SCALE is not None:
        scale = FIXED_CHARACTER_SCALE
    else:
        scale = requested_scale if STRICT_CANONICAL_SCALE else min(scale_limits)

    rendered: list[Image.Image] = []
    for index, frame in enumerate(frames):
        coords = frame['coords']
        pixels = frame['pixels']
        frame_root_x = root_x_fraction * float(frame['cellWidth'])
        frame_ground = ground_fraction * float(frame['cellHeight'])
        min_y, min_x = coords.min(axis=0)
        max_y, max_x = coords.max(axis=0)
        width = int(max_x - min_x + 1)
        height = int(max_y - min_y + 1)
        source = np.zeros((height, width, 4), dtype=np.uint8)
        source[coords[:, 0] - min_y, coords[:, 1] - min_x] = pixels
        source_image = Image.fromarray(source, 'RGBA')
        target_size = (
            max(1, round(source_image.width * scale)),
            max(1, round(source_image.height * scale)),
        )
        resized = source_image.resize(target_size, Image.Resampling.LANCZOS)
        offsets = MOTION_FRAME_OFFSETS.get(motion, [])
        offset_x, offset_y = offsets[index] if index < len(offsets) else (0, 0)
        left = round(ROOT_X + (min_x - frame_root_x) * scale) + offset_x
        top = round(GROUND_Y + (min_y - frame_ground) * scale) + offset_y
        right = left + resized.width
        bottom = top + resized.height
        if left < SAFE or top < SAFE or right > CELL - SAFE or bottom > CELL - SAFE:
            raise ValueError(
                f'frame {index + 1} violates safe margin: '
                f'{left},{top},{right},{bottom}'
            )
        cell = Image.new('RGBA', (CELL, CELL))
        cell.alpha_composite(resized, (left, top))
        rendered.append(cell)
    return rendered, {
        'sourceRootX': round(root_x, 3),
        'sourceGroundY': round(source_ground, 3),
        'sourceRootXFraction': round(root_x_fraction, 6),
        'sourceGroundFraction': round(ground_fraction, 6),
        'sourceStandingHeight': round(source_height, 3),
        'requestedScale': round(requested_scale, 6),
        'appliedScale': round(scale, 6),
        'standingHeight': round(source_height * scale, 3),
    }


def alpha_bbox(image: Image.Image) -> tuple[int, int, int, int]:
    bbox = image.getchannel('A').point(
        lambda alpha: 255 if alpha >= ALPHA_THRESHOLD else 0,
    ).getbbox()
    if bbox is None:
        raise ValueError('transparent-only frame')
    return bbox


def pack(cells: dict[str, list[Image.Image]]) -> tuple[Image.Image, dict]:
    entries = []
    for motion, frames in cells.items():
        for index, cell in enumerate(frames):
            name = f'{FRAME_PREFIX}/{motion}/{index}'
            bbox = alpha_bbox(cell)
            entries.append((name, cell.crop(bbox), bbox, DURATIONS[motion][index]))

    # Canonical-scale cells are larger than the legacy motion-scaled cells.
    # Height-first shelves avoid wasting a tall remainder at the end of each
    # row while frame names keep animation playback order independent of atlas
    # placement.
    if STRICT_CANONICAL_SCALE:
        entries.sort(key=lambda entry: (entry[1].height, entry[1].width), reverse=True)

    x = y = row_height = 0
    placed = []
    for name, image, bbox, duration in entries:
        if x + image.width > 4096:
            x = 0
            y += row_height
            row_height = 0
        if y + image.height > 4096:
            raise ValueError('atlas exceeds 4096px')
        placed.append((name, image, bbox, duration, x, y))
        x += image.width
        row_height = max(row_height, image.height)

    atlas_width = max(item[4] + item[1].width for item in placed)
    atlas_height = max(item[5] + item[1].height for item in placed)
    atlas = Image.new('RGBA', (atlas_width, atlas_height))
    frames_data: dict[str, dict] = {}
    for name, image, bbox, duration, atlas_x, atlas_y in placed:
        atlas.alpha_composite(image, (atlas_x, atlas_y))
        frames_data[name] = {
            'frame': {
                'x': atlas_x,
                'y': atlas_y,
                'w': image.width,
                'h': image.height,
            },
            'rotated': False,
            'trimmed': True,
            'spriteSourceSize': {
                'x': bbox[0],
                'y': bbox[1],
                'w': image.width,
                'h': image.height,
            },
            'sourceSize': {'w': CELL, 'h': CELL},
            'anchor': ANCHOR,
            'duration': duration,
        }
    return atlas, {
        'frames': frames_data,
        'animations': {
            motion: [f'{FRAME_PREFIX}/{motion}/{index}' for index in range(spec['count'])]
            for motion, spec in MOTIONS.items()
        },
        'meta': {
            'image': f'{BUILD_NAME}-sheet.png',
            'format': 'RGBA8888',
            'scale': '1',
        },
    }


def build_review(cells: dict[str, list[Image.Image]]) -> Image.Image:
    review = Image.new('RGBA', (CELL * 16, CELL * 4))
    for row, motion in enumerate(MOTIONS):
        for column, cell in enumerate(cells[motion]):
            review.alpha_composite(cell, (column * CELL, row * CELL))
    return review


def save_gifs(cells: dict[str, list[Image.Image]]) -> None:
    for motion, frames in cells.items():
        durations = DURATIONS[motion]
        frames[0].save(
            OUTPUT / f'{BUILD_NAME}-{motion}.gif',
            save_all=True,
            append_images=frames[1:],
            duration=durations,
            loop=0,
            disposal=2,
        )
        frames[0].save(
            OUTPUT / f'{BUILD_NAME}-{motion}-slow.gif',
            save_all=True,
            append_images=frames[1:],
            duration=[duration * 2 for duration in durations],
            loop=0,
            disposal=2,
        )


def main() -> None:
    cells: dict[str, list[Image.Image]] = {}
    transforms: dict[str, dict[str, float]] = {}
    for motion, spec in MOTIONS.items():
        extracted: list[dict[str, np.ndarray]] = []
        for part, part_count in enumerate(spec['parts'], start=1):
            path = part_path(motion, part)
            if not path.exists():
                raise FileNotFoundError(path)
            source = Image.open(path).convert('RGBA')
            # All production strips use four equal authored cells.  The final
            # death strip intentionally leaves cells three and four empty.
            extracted.extend(extract_frames(source, 4, 1, part_count))
        if len(extracted) != spec['count']:
            raise ValueError(f'{motion}: expected {spec["count"]} frames')
        cells[motion], transforms[motion] = render_motion(motion, extracted)

    atlas, data = pack(cells)
    OUTPUT.mkdir(parents=True, exist_ok=True)
    ASSET.mkdir(parents=True, exist_ok=True)
    build_review(cells).save(OUTPUT / f'{BUILD_NAME}-cells.png')
    save_gifs(cells)
    atlas.save(OUTPUT / f'{BUILD_NAME}-sheet.png')
    (OUTPUT / f'{BUILD_NAME}-sheet.json').write_text(
        json.dumps(data, ensure_ascii=False, indent=2),
        encoding='utf-8',
    )
    atlas.save(ASSET / f'{BUILD_NAME}-sheet.png')
    (ASSET / f'{BUILD_NAME}-sheet.json').write_text(
        json.dumps(data, ensure_ascii=False, indent=2),
        encoding='utf-8',
    )

    report = {
        'frameCount': sum(spec['count'] for spec in MOTIONS.values()),
        'cellSize': [CELL, CELL],
        'root': [ROOT_X, GROUND_Y],
        'safeMargin': SAFE,
        'fixedCharacterScale': FIXED_CHARACTER_SCALE,
        'motionFrameOffsets': MOTION_FRAME_OFFSETS,
        'verificationNotes': VERIFICATION_NOTES,
        'atlas': list(atlas.size),
        'durationTotals': {
            motion: sum(durations)
            for motion, durations in DURATIONS.items()
        },
        'motionTransforms': transforms,
        'sourceHashes': {
            part_path(motion, part).name: hashlib.sha256(
                part_path(motion, part).read_bytes(),
            ).hexdigest()
            for motion, spec in MOTIONS.items()
            for part in range(1, len(spec['parts']) + 1)
        },
    }
    (OUTPUT / 'verification.json').write_text(
        json.dumps(report, ensure_ascii=False, indent=2),
        encoding='utf-8',
    )
    print(json.dumps(report, ensure_ascii=False, indent=2))

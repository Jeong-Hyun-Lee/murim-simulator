"""Pack independently generated Mokhyeon v4 frames into one PixiJS spritesheet.

This intentionally never slices a multi-pose source image: every input is one
independent transparent character frame.  The same scale and ground line are
used for every motion before trimming into the runtime atlas.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[3]
SOURCE = ROOT / 'wiki' / 'raw' / 'assets'
OUTPUT = ROOT / 'output' / 'sprite-regeneration' / 'mokhyeon-v4'
ASSET = ROOT / 'assets' / 'sprites' / 'character'
CELL = 768
GROUND_Y = 624
SAFE = 32
ANCHOR = {'x': 0.25, 'y': 0.8125}
MOTIONS = {'idle': 12, 'attack1': 16, 'attack2': 16, 'death': 14}
DURATIONS = {
    'idle': [80] * 12,
    'attack1': [45] * 16,
    'attack2': [45] * 16,
    # First 13 frames are 720ms in total; the final downed pose holds 360ms.
    'death': [56] * 5 + [55] * 8 + [360],
}


def source_path(motion: str, index: int) -> Path:
    # Idle candidates began at 00, then continued with 01…08 and 10…12.
    # Keep their original names while mapping the final twelve-frame order.
    if motion == 'idle':
        idle_sources = [0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12]
        return SOURCE / f'mokhyeon-v4-idle-{idle_sources[index - 1]:02d}-candidate.png'
    return SOURCE / f'mokhyeon-v4-{motion}-{index:02d}-candidate.png'


def alpha_bbox(image: Image.Image) -> tuple[int, int, int, int]:
    bbox = image.getchannel('A').getbbox()
    if bbox is None:
        raise ValueError('transparent-only source frame')
    return bbox


def make_cell(image: Image.Image, scale: float) -> Image.Image:
    """Scale a complete isolated frame once, ground it, and keep a safe border."""
    bbox = alpha_bbox(image)
    crop = image.crop(bbox)
    width = max(1, round(crop.width * scale))
    height = max(1, round(crop.height * scale))
    crop = crop.resize((width, height), Image.Resampling.LANCZOS)
    if width > CELL - SAFE * 2 or height > GROUND_Y - SAFE:
        raise ValueError(f'frame cannot fit safely: {width}x{height}')

    # Preserve the full source subject.  This sets one common horizontal
    # composition for the hero and a shared ground line for standing/death poses.
    left = SAFE
    top = GROUND_Y - height
    cell = Image.new('RGBA', (CELL, CELL))
    cell.alpha_composite(crop, (left, top))
    actual = alpha_bbox(cell)
    if min(actual[0], actual[1], CELL - actual[2], CELL - actual[3]) < SAFE:
        raise ValueError(f'safety margin violated: {actual}')
    return cell


def pack(cells: list[tuple[str, Image.Image, int]]) -> tuple[Image.Image, dict]:
    """Pack trimmed cells row-wise, retaining source-cell restoration metadata."""
    entries = []
    for name, cell, duration in cells:
        bbox = alpha_bbox(cell)
        entries.append((name, cell.crop(bbox), bbox, duration))

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
    frames: dict[str, dict] = {}
    for name, image, bbox, duration, px, py in placed:
        atlas.alpha_composite(image, (px, py))
        frames[name] = {
            'frame': {'x': px, 'y': py, 'w': image.width, 'h': image.height},
            'rotated': False,
            'trimmed': True,
            'spriteSourceSize': {'x': bbox[0], 'y': bbox[1], 'w': image.width, 'h': image.height},
            'sourceSize': {'w': CELL, 'h': CELL},
            'anchor': ANCHOR,
            'duration': duration,
        }
    data = {
        'frames': frames,
        'animations': {
            motion: [f'mokhyeon/{motion}/{index}' for index in range(count)]
            for motion, count in MOTIONS.items()
        },
        'meta': {'image': 'mokhyeon-v4-sheet.png', 'format': 'RGBA8888', 'scale': '1'},
    }
    return atlas, data


def build_review(cells: dict[str, list[Image.Image]]) -> Image.Image:
    review = Image.new('RGBA', (CELL * 16, CELL * 4))
    for row, motion in enumerate(MOTIONS):
        for column, cell in enumerate(cells[motion]):
            review.alpha_composite(cell, (column * CELL, row * CELL))
    return review


def save_motion_gifs(cells: dict[str, list[Image.Image]]) -> None:
    for motion, frames in cells.items():
        durations = DURATIONS[motion]
        frames[0].save(
            OUTPUT / f'mokhyeon-v4-{motion}.gif',
            save_all=True,
            append_images=frames[1:],
            duration=durations,
            loop=0,
            disposal=2,
        )
        frames[0].save(
            OUTPUT / f'mokhyeon-v4-{motion}-slow.gif',
            save_all=True,
            append_images=frames[1:],
            duration=[duration * 2 for duration in durations],
            loop=0,
            disposal=2,
        )


def main() -> None:
    raw: dict[str, list[Image.Image]] = {}
    max_height = 0
    for motion, count in MOTIONS.items():
        raw[motion] = []
        for index in range(1, count + 1):
            path = source_path(motion, index)
            if not path.exists():
                raise FileNotFoundError(path)
            image = Image.open(path).convert('RGBA')
            raw[motion].append(image)
            bbox = alpha_bbox(image)
            max_height = max(max_height, bbox[3] - bbox[1])

    # A single scale for the entire character set: the tallest independent
    # source becomes 512px, so every pose retains the same physical scale.
    scale = 512 / max_height
    normalized = {
        motion: [make_cell(image, scale) for image in images]
        for motion, images in raw.items()
    }

    cells = []
    for motion, count in MOTIONS.items():
        for index in range(count):
            cells.append((f'mokhyeon/{motion}/{index}', normalized[motion][index], DURATIONS[motion][index]))
    atlas, data = pack(cells)

    OUTPUT.mkdir(parents=True, exist_ok=True)
    ASSET.mkdir(parents=True, exist_ok=True)
    review = build_review(normalized)
    review.save(OUTPUT / 'mokhyeon-v4-cells.png')
    save_motion_gifs(normalized)
    atlas.save(OUTPUT / 'mokhyeon-v4-sheet.png')
    (OUTPUT / 'mokhyeon-v4-sheet.json').write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
    atlas.save(ASSET / 'mokhyeon-v4-sheet.png')
    (ASSET / 'mokhyeon-v4-sheet.json').write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')

    report = {
        'frameCount': len(cells),
        'scale': scale,
        'atlas': atlas.size,
        'durationTotals': {motion: sum(values) for motion, values in DURATIONS.items()},
        'sourceHashes': {
            path.name: hashlib.sha256(path.read_bytes()).hexdigest()
            for motion, count in MOTIONS.items()
            for index in range(1, count + 1)
            for path in [source_path(motion, index)]
        },
    }
    (OUTPUT / 'verification.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps(report, ensure_ascii=False))


if __name__ == '__main__':
    main()

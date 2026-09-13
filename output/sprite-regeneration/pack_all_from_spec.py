"""IMPLEMENTATION-SPEC.md의 권장 규격으로 transparent/ 27장 전체를 재패킹.

규칙(스펙 그대로):
- 캐릭터별 idle 기준 신체 높이를 256px로 정규화(등방 스케일, 캐릭터 내 모든 모션에 동일 적용).
- 안전 여백 6.25%(512 기준 32px)를 상하좌우에 확보하도록 캐릭터별 셀 크기를 역산(부족하면 512보다 키움).
- 서 있는 기준점은 셀의 (0.5, 0.875) — 모든 프레임이 이 바닥선에 발을 맞춘다(사망 등 월드 기준점 보존).
- 개별 축 스케일(가로/세로 다른 배율) 금지 — 등방 스케일만 적용해 비율 왜곡 방지.
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent
TRANSPARENT = ROOT / 'transparent'
OUT_DIR = ROOT.parent.parent / 'assets' / 'sprites' / 'character'

TARGET_BODY_HEIGHT = 256
MARGIN_RATIO = 32 / 512  # 0.0625
ANCHOR_RATIO = 448 / 512  # 0.875
MIN_CELL = 512

CHAR_MOTIONS = {
    'mokhyeon': ['idle', 'attack1', 'attack2', 'hurt', 'death', 'victory'],
    'boss': ['idle', 'attack1', 'attack2', 'hurt', 'death', 'victory'],
    'grunt': ['idle', 'attack1', 'attack2', 'hurt', 'death'],
    'archer': ['idle', 'attack1', 'attack2', 'hurt', 'death'],
    'elite': ['idle', 'attack1', 'attack2', 'hurt', 'death'],
}
OUT_PREFIX = {
    'mokhyeon': 'mokhyeon',
    'boss': 'hyeollangchae-boss',
    'grunt': 'hyeollangchae-grunt',
    'archer': 'hyeollangchae-archer',
    'elite': 'hyeollangchae-elite',
}
FRAME_COUNTS = {'idle': 6, 'attack1': 7, 'attack2': 7, 'hurt': 3, 'death': 6, 'victory': 5}
DURATIONS_MS = {'idle': 160, 'attack1': 90, 'attack2': 90, 'hurt': 100, 'death': 120, 'victory': 140}
OUT_MOTION_NAME = {'attack1': 'attack'}  # 나머지는 원래 이름 그대로(attack2/hurt/death/victory/idle)


def find_cut(profile, expected, window):
    lo = max(0, expected - window)
    hi = min(len(profile), expected + window)
    seg = profile[lo:hi]
    idx = int(np.argmin(seg))
    return lo + idx, int(seg[idx])


def split_frames(im, count):
    a = np.array(im)[:, :, 3] > 0
    colsum = a.sum(axis=0)
    rowsum = a.sum(axis=1)
    cuts_x = [0]
    gaps = []
    for e in (443, 887, 1330):
        c, val = find_cut(colsum, e, 120)
        cuts_x.append(c)
        gaps.append(val)
    cuts_x.append(1774)
    cut_y, row_gap = find_cut(rowsum, 443, 150)
    cuts_y = [0, cut_y, 887]
    boxes = []
    idx = 0
    for row in range(2):
        for col in range(4):
            if idx >= count:
                break
            boxes.append((cuts_x[col], cuts_y[row], cuts_x[col + 1], cuts_y[row + 1]))
            idx += 1
    if any(g > 0 for g in gaps) or row_gap > 0:
        print(f'  경고: 프레임 경계에 알파 잔존(col_gaps={gaps}, row_gap={row_gap}) — 육안 확인 필요')
    return boxes


def content_bbox(im, box):
    crop = im.crop(box)
    a = np.array(crop)[:, :, 3] > 0
    ys, xs = np.where(a)
    return (int(xs.min()), int(ys.min()), int(xs.max() + 1), int(ys.max() + 1))


def load_source(char, motion):
    return Image.open(TRANSPARENT / f'{char}-{motion}.png').convert('RGBA')


def character_scale(char):
    """idle 모션 신체 높이를 256px로 맞추는 등방 배율."""
    src = load_source(char, 'idle')
    boxes = split_frames(src, FRAME_COUNTS['idle'])
    sizes = [content_bbox(src, b) for b in boxes]
    heights = [b[3] - b[1] for b in sizes]
    widths = [b[2] - b[0] for b in sizes]
    scale_h = TARGET_BODY_HEIGHT / float(np.median(heights))
    print(
        f'{char}: idle median h={np.median(heights):.1f} w={np.median(widths):.1f} '
        f'-> scale={scale_h:.3f}'
    )
    return scale_h


def gather_all_scaled_frames(char, motions, scale):
    """캐릭터의 전 모션 프레임을 등방 스케일까지 적용한 {motion: [PIL조각,...]} 로 수집."""
    pieces = {}
    max_w = max_h = 0
    for motion in motions:
        src = load_source(char, motion)
        boxes = split_frames(src, FRAME_COUNTS[motion])
        frame_pieces = []
        for box in boxes:
            cb = content_bbox(src, box)
            piece = src.crop((box[0] + cb[0], box[1] + cb[1], box[0] + cb[2], box[1] + cb[3]))
            w, h = piece.size
            new_w, new_h = max(1, round(w * scale)), max(1, round(h * scale))
            piece = piece.resize((new_w, new_h), Image.LANCZOS)
            frame_pieces.append(piece)
            max_w = max(max_w, new_w)
            max_h = max(max_h, new_h)
        pieces[motion] = frame_pieces
    return pieces, max_w, max_h


def required_cell(max_w, max_h):
    cell_w = max_w / (1 - 2 * MARGIN_RATIO)
    cell_h = max_h / (ANCHOR_RATIO - MARGIN_RATIO)
    return max(MIN_CELL, int(np.ceil(max(cell_w, cell_h))))


for char, motions in CHAR_MOTIONS.items():
    scale = character_scale(char)
    pieces_by_motion, max_w, max_h = gather_all_scaled_frames(char, motions, scale)
    cell = required_cell(max_w, max_h)
    anchor_y_px = round(cell * ANCHOR_RATIO)
    center_x = cell // 2
    print(f'{char}: max_content=({max_w},{max_h}) -> cell={cell} anchor_y={anchor_y_px}')

    for motion in motions:
        count = FRAME_COUNTS[motion]
        pieces = pieces_by_motion[motion]
        cols = min(count, 4)
        rows = -(-count // 4)  # ceil
        canvas = Image.new('RGBA', (cols * cell, rows * cell), (0, 0, 0, 0))
        frames_json = []
        for i, piece in enumerate(pieces):
            w, h = piece.size
            px = center_x - w // 2
            py = anchor_y_px - h
            col, row = i % 4, i // 4
            if px < 0 or py < 0 or px + w > cell or py + h > cell:
                print(f'  경고: {char}-{motion} 프레임{i} 셀 초과 (px={px},py={py},w={w},h={h},cell={cell})')
            canvas.alpha_composite(piece, (col * cell + px, row * cell + py))
            frames_json.append(
                {'frame': {'x': col * cell, 'y': row * cell, 'w': cell, 'h': cell}, 'duration': DURATIONS_MS[motion]}
            )
        out_motion = OUT_MOTION_NAME.get(motion, motion)
        out_name = f'{OUT_PREFIX[char]}-{out_motion}-sheet'
        canvas.save(OUT_DIR / f'{out_name}.png')
        meta = {
            'frames': frames_json,
            'meta': {
                'image': f'{out_name}.png',
                'frameTags': [{'name': out_motion, 'from': 0, 'to': count - 1}],
            },
        }
        (OUT_DIR / f'{out_name}.json').write_text(json.dumps(meta, indent=2), encoding='utf-8')
        print(f'  저장: {out_name}.png/.json ({count}프레임, {canvas.width}x{canvas.height})')

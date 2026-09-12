"""새 모션(공격2/피격/쓰러짐/승리)을 기존 896px 셀·바닥선(y=840) 규격으로 재패킹.

ponytail: transparent/ 원화를 그대로 크롭+리사이즈한다 — 기존에 이미 반영된 idle/attack1/두목
세트는 별도 AI 업스케일 공정을 거친 것으로 보여 픽셀 단위로 동일 결과를 재현할 수 없다.
대신 idle 모션 기준으로 캐릭터별 배율을 역산해 일관된 크기로 맞춘다. 화질 향상이 필요하면
Aseprite 업스케일 필터를 프레임별로 재적용.
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent
TRANSPARENT = ROOT / 'transparent'
OUT_DIR = ROOT.parent.parent / 'assets' / 'sprites' / 'character'
CELL = 896
BASELINE_Y = 840
CENTER_X = CELL // 2


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


def character_scale(char):
    """idle 모션으로 캐릭터별 배율 역산(폭/높이 배율의 기하평균, 등방 스케일 유지)."""
    src = Image.open(TRANSPARENT / f'{char}-idle.png').convert('RGBA')
    boxes = split_frames(src, 6)
    orig_sizes = []
    for b in boxes:
        cb = content_bbox(src, b)
        orig_sizes.append((cb[2] - cb[0], cb[3] - cb[1]))
    conv_name = 'mokhyeon-idle-sheet.png' if char == 'mokhyeon' else 'hyeollangchae-grunt-idle-sheet.png'
    conv = Image.open(OUT_DIR / conv_name).convert('RGBA')
    conv_arr = np.array(conv)[:, :, 3]
    conv_sizes = []
    for i in range(6):
        seg = conv_arr[:, i * CELL:(i + 1) * CELL]
        ys, xs = np.where(seg > 0)
        conv_sizes.append((int(xs.max() + 1 - xs.min()), int(ys.max() + 1 - ys.min())))
    scale_w = np.median([c[0] / o[0] for o, c in zip(orig_sizes, conv_sizes)])
    scale_h = np.median([c[1] / o[1] for o, c in zip(orig_sizes, conv_sizes)])
    scale = float(np.sqrt(scale_w * scale_h))
    print(f'{char} 배율 역산: scale_w={scale_w:.3f} scale_h={scale_h:.3f} -> 등방 적용 scale={scale:.3f}')
    return scale


TARGETS = [
    # (파일명 원화 접두, 모션, 프레임수, duration, 출력 시트 파일명 접두)
    ('mokhyeon', 'attack2', 7, 90, 'mokhyeon'),
    ('mokhyeon', 'hurt', 3, 100, 'mokhyeon'),
    ('mokhyeon', 'death', 6, 120, 'mokhyeon'),
    ('mokhyeon', 'victory', 5, 140, 'mokhyeon'),
    ('grunt', 'attack2', 7, 90, 'hyeollangchae-grunt'),
    ('grunt', 'hurt', 3, 100, 'hyeollangchae-grunt'),
    ('grunt', 'death', 6, 120, 'hyeollangchae-grunt'),
]

scales = {'mokhyeon': character_scale('mokhyeon'), 'grunt': character_scale('grunt')}

for char, motion, count, duration, out_prefix in TARGETS:
    src = Image.open(TRANSPARENT / f'{char}-{motion}.png').convert('RGBA')
    boxes = split_frames(src, count)
    scale = scales[char]
    canvas = Image.new('RGBA', (CELL * count, CELL), (0, 0, 0, 0))
    frames_json = []
    for i, box in enumerate(boxes):
        cb = content_bbox(src, box)
        piece = src.crop((box[0] + cb[0], box[1] + cb[1], box[0] + cb[2], box[1] + cb[3]))
        w, h = piece.size
        new_w, new_h = max(1, round(w * scale)), max(1, round(h * scale))
        piece = piece.resize((new_w, new_h), Image.LANCZOS)
        px = CENTER_X - new_w // 2
        py = BASELINE_Y - new_h
        if px < 0 or py < 0 or px + new_w > CELL or py + new_h > CELL:
            print(f'  경고: {char}-{motion} 프레임{i} 배치가 896 캔버스를 벗어남 (px={px},py={py},w={new_w},h={new_h})')
        canvas.alpha_composite(piece, (i * CELL + px, py))
        frames_json.append({'frame': {'x': i * CELL, 'y': 0, 'w': CELL, 'h': CELL}, 'duration': duration})
    out_name = f'{out_prefix}-{motion}-sheet'
    canvas.save(OUT_DIR / f'{out_name}.png')
    meta = {
        'frames': frames_json,
        'meta': {
            'image': f'{out_name}.png',
            'frameTags': [{'name': motion, 'from': 0, 'to': count - 1}],
        },
    }
    (OUT_DIR / f'{out_name}.json').write_text(json.dumps(meta, indent=2), encoding='utf-8')
    print(f'저장: {out_name}.png/.json ({count}프레임)')

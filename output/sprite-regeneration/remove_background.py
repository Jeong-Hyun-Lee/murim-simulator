"""Remove baked neutral backgrounds without moving/resizing source pixels."""
from pathlib import Path
import json
import shutil
import sys
import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'transparent'
OUT.mkdir(exist_ok=True)
report = []
for source in sorted((ROOT / 'sources').glob('*.png')):
    if len(sys.argv) > 1 and source.stem not in sys.argv[1:]:
        continue
    original = Image.open(source)
    destination = OUT / source.name
    if original.mode == 'RGBA' and original.getchannel('A').getextrema()[0] == 0:
        shutil.copy2(source, destination)
        report.append({'file': source.name, 'preserved_existing_alpha': True})
        continue
    rgb = np.asarray(original.convert('RGB')).astype(np.int16)
    height, width = rgb.shape[:2]
    low, high = rgb.min(axis=2), rgb.max(axis=2)
    border = np.concatenate((rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]))
    black = np.median(border) < 20
    tolerance = 22 if source.name.startswith('archer-') else 8
    candidate = (high < 35) if black else ((high-low <= tolerance) & (low >= 85))
    # Closed outlines protect gray metal and white clothing from the exterior fill.
    mask_image = Image.fromarray(np.where(candidate, 255, 0).astype('uint8')).filter(ImageFilter.MinFilter(5)).filter(ImageFilter.MaxFilter(5)).copy()
    from PIL import ImageDraw
    for x, y in [(0, 0), (width-1, 0), (0, height-1), (width-1, height-1)]:
        if mask_image.getpixel((x, y)) == 255:
            ImageDraw.floodfill(mask_image, (x, y), 128)
    removed = np.asarray(mask_image) == 128
    # Seed enclosed checkerboard holes only when a small patch has neutral,
    # alternating bright/dark tiles; never seed merely because a pixel is gray.
    if not black:
        for y in range(6, height-6, 6):
            for x in range(6, width-6, 6):
                if mask_image.getpixel((x, y)) != 255:
                    continue
                patch = rgb[y-5:y+6, x-5:x+6]
                pale_hole = source.name.startswith('archer-') and np.max(patch.max(2)-patch.min(2)) <= 22 and patch.min() >= 180
                checker_hole = np.max(patch.max(2)-patch.min(2)) <= 8 and patch.min() >= 95 and np.std(patch.mean(2)) > 17
                if pale_hole or checker_hole:
                    ImageDraw.floodfill(mask_image, (x, y), 128)
        removed = np.asarray(mask_image) == 128
    expanded = np.asarray(Image.fromarray((removed*255).astype('uint8')).filter(ImageFilter.MaxFilter(5))) > 0
    removed |= expanded & candidate
    # Hand-checked effect-only areas: tinted checkerboard enclosed by gold arcs.
    effect_boxes = {
        'elite-attack1.png': [(495,150,585,270),(585,250,665,285),(900,140,1055,275),(1055,282,1300,335),(1330,75,1700,185),(1405,170,1530,205),(0,510,180,650),(0,678,205,735),(480,620,615,740)],
        'elite-attack2.png': [(1380,70,1445,290),(1445,75,1510,145),(1510,65,1625,98),(35,460,185,710),(490,535,615,715)],
    }
    for x1,y1,x2,y2 in effect_boxes.get(source.name, []):
        removed[y1:y2,x1:x2] |= ((high-low <= 35) & (low >= 85) & (high < 220))[y1:y2,x1:x2]
        removed[y1:y2,x1:x2] &= ~(low >= 220)[y1:y2,x1:x2]
    alpha = Image.fromarray(np.where(removed, 0, 255).astype('uint8'))
    # Subpixel edge antialiasing only; interior RGB and alpha remain untouched.
    alpha = alpha.filter(ImageFilter.GaussianBlur(0.35))
    result = original.convert('RGBA')
    result.putalpha(alpha)
    result.save(destination)
    check = Image.open(destination)
    assert check.size == original.size and check.mode == 'RGBA'
    assert check.getchannel('A').getextrema() == (0, 255)
    assert np.array_equal(np.asarray(check)[:, :, :3], rgb.astype('uint8'))
    report.append({'file': source.name, 'size': list(check.size), 'removed_fraction': round(float(removed.mean()), 4), 'rgb_pixels_unchanged': True})
    print(source.name, report[-1]['removed_fraction'], flush=True)
(ROOT / 'transparency-report.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
assert len(report) == (len(sys.argv)-1 if len(sys.argv)>1 else 27)

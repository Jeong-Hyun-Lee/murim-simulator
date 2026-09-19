from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).parents[3]
SRC = ROOT / 'output/ui-elements/source'
TAB_OUT = ROOT / 'assets/ui/tab'
ICON_OUT = ROOT / 'assets/ui/icon'
FONT = ROOT / 'assets/fonts/ui-labels/NanumMyeongjo-ExtraBold.ttf'
SPRITE = ROOT / 'output/ui-elements/source/tab-icons-generated.png'

TABS = [('gong', '무공'), ('gear', '장비'), ('sect', '문파'), ('shop', '상점')]
BOXES = [(36, 72, 488, 610), (534, 72, 1008, 610), (1050, 72, 1536, 610), (1572, 72, 2142, 610)]

def fit_icon(image):
    bbox = image.getbbox()
    image = image.crop(bbox) if bbox else image
    image.thumbnail((74, 74), Image.Resampling.LANCZOS)
    icon = Image.new('RGBA', (72, 72), (0, 0, 0, 0))
    icon.alpha_composite(image, ((72 - image.width) // 2, (72 - image.height) // 2))
    return icon

def make_background(active):
    image = Image.new('RGBA', (292, 192), (20, 18, 15, 255))
    draw = ImageDraw.Draw(image)
    if active:
        draw.rounded_rectangle((3, 3, 288, 188), radius=16, fill=(20, 38, 62, 255), outline=(225, 180, 83, 255), width=6)
        draw.rounded_rectangle((12, 12, 280, 180), radius=10, outline=(85, 116, 145, 255), width=3)
    else:
        draw.rounded_rectangle((3, 3, 288, 188), radius=16, fill=(55, 38, 26, 255), outline=(109, 77, 40, 255), width=6)
        draw.rounded_rectangle((12, 12, 280, 180), radius=10, outline=(39, 28, 20, 255), width=3)
    return image

TAB_OUT.mkdir(parents=True, exist_ok=True)
ICON_OUT.mkdir(parents=True, exist_ok=True)
sprite = Image.open(SPRITE).convert('RGBA')
font = ImageFont.truetype(str(FONT), 48)
for (asset, text), box in zip(TABS, BOXES):
    icon = fit_icon(sprite.crop(box))
    icon.save(SRC / f'icon-tab-{asset}.png', 'PNG')
    icon.save(ICON_OUT / f'icon-tab-{asset}.webp', 'WEBP', quality=92, method=6)
    for active in (False, True):
        tab = make_background(active)
        shown = icon if active else icon.copy()
        if not active:
            alpha = shown.getchannel('A')
            shown.putalpha(alpha.point(lambda a: int(a * 0.58)))
        tab.alpha_composite(shown, (110, 23))
        draw = ImageDraw.Draw(tab)
        left, top, right, bottom = font.getbbox(text, stroke_width=2)
        x = (292 - (right - left)) // 2 - left
        fill = (240, 204, 113, 255) if active else (166, 127, 76, 255)
        stroke = (38, 25, 15, 255)
        draw.text((x, 112 - top), text, font=font, fill=fill, stroke_width=2, stroke_fill=stroke)
        suffix = '-active' if active else ''
        tab.save(SRC / f'tab-{asset}{suffix}.png', 'PNG')
        tab.save(TAB_OUT / f'tab-{asset}{suffix}.webp', 'WEBP', quality=92, method=6)
        print(f'tab-{asset}{suffix}', tab.size)

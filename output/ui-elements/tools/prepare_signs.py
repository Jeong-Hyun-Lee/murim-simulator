import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).parents[3]
SOURCE = ROOT / 'output' / 'ui-elements' / 'source'
LABELS = ROOT / 'assets' / 'ui' / 'label'
MANIFEST = ROOT / 'assets' / 'ui' / 'manifest.json'
FONT = ROOT / 'assets' / 'fonts' / 'ui-labels' / 'NanumBrushScript-Regular.ttf'
SIZE = (1074, 216)


def fit_base() -> Image.Image:
    with Image.open(SOURCE / 'sign-sect-qingyun-base-generated.png').convert('RGBA') as image:
        alpha = image.getchannel('A')
        bounds = alpha.getbbox()
        if bounds is None:
            raise RuntimeError('signboard source has no visible pixels')
        cropped = image.crop(bounds)
        cropped.thumbnail(SIZE, Image.Resampling.LANCZOS)
        canvas = Image.new('RGBA', SIZE, (0, 0, 0, 0))
        offset = ((SIZE[0] - cropped.width) // 2, (SIZE[1] - cropped.height) // 2)
        canvas.alpha_composite(cropped, offset)
        return canvas


def render_sign(base: Image.Image, asset_id: str, text: str) -> None:
    image = base.copy()
    draw = ImageDraw.Draw(image)
    font = ImageFont.truetype(str(FONT), 104)
    left, top, right, bottom = draw.textbbox((0, 0), text, font=font, stroke_width=3)
    position = ((image.width - (right - left)) // 2 - left, (image.height - (bottom - top)) // 2 - top - 4)
    draw.text(position, text, font=font, fill='#f4d66e', stroke_width=3, stroke_fill='#2a1d16')
    image.save(SOURCE / f'{asset_id}.png', 'PNG')
    image.save(LABELS / f'{asset_id}.webp', 'WEBP', quality=92, method=6)


def update_manifest() -> None:
    data = json.loads(MANIFEST.read_text(encoding='utf-8'))
    existing = {entry['id'] for entry in data}
    for asset_id, text in (('sign-sect-qingyun', '청운문'), ('sign-tower', '수련탑')):
        if asset_id not in existing:
            data.append({
                'id': asset_id,
                'file': f'label/{asset_id}.webp',
                'kind': 'fixed',
                'cssSize': {'w': 358, 'h': 72},
                'sourceSize': {'w': 1074, 'h': 216},
                'slice': None,
                'priority': 'P1',
                'text': text,
            })
    MANIFEST.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def main() -> None:
    LABELS.mkdir(parents=True, exist_ok=True)
    base = fit_base()
    base.save(SOURCE / 'sign-sect-qingyun-base.png', 'PNG')
    render_sign(base, 'sign-sect-qingyun', '청운문')
    render_sign(base, 'sign-tower', '수련탑')
    update_manifest()


if __name__ == '__main__':
    main()

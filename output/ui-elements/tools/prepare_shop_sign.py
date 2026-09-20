import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).parents[3]
SOURCE = ROOT / 'output' / 'ui-elements' / 'source'
LABELS = ROOT / 'assets' / 'ui' / 'label'
MANIFEST = ROOT / 'assets' / 'ui' / 'manifest.json'
FONT = ROOT / 'assets' / 'fonts' / 'ui-labels' / 'NanumMyeongjo-ExtraBold.ttf'
SIZE = (1074, 216)


def main() -> None:
    with Image.open(SOURCE / 'sign-shop-elixir-generated.png').convert('RGBA') as image:
        bounds = image.getchannel('A').getbbox()
        if bounds is None:
            raise RuntimeError('signboard source has no visible pixels')
        sign = image.crop(bounds)
        crop_height = sign.width * SIZE[1] // SIZE[0]
        top = (sign.height - crop_height) // 2
        sign = sign.crop((0, top, sign.width, top + crop_height)).resize(SIZE, Image.Resampling.LANCZOS)

    SOURCE.mkdir(parents=True, exist_ok=True)
    LABELS.mkdir(parents=True, exist_ok=True)
    sign.save(SOURCE / 'sign-shop-elixir-base.png', 'PNG')
    draw = ImageDraw.Draw(sign)
    text = '영약 교환소'
    font = ImageFont.truetype(str(FONT), 78)
    left, top, right, bottom = draw.textbbox((0, 0), text, font=font, stroke_width=2)
    position = ((SIZE[0] - (right - left)) // 2 - left, (SIZE[1] - (bottom - top)) // 2 - top - 3)
    draw.text(position, text, font=font, fill='#f4d66e', stroke_width=2, stroke_fill='#1b1409')
    sign.save(SOURCE / 'sign-shop-elixir.png', 'PNG')
    sign.save(LABELS / 'sign-shop-elixir.webp', 'WEBP', quality=92, method=6)

    data = json.loads(MANIFEST.read_text(encoding='utf-8'))
    if not any(entry['id'] == 'sign-shop-elixir' for entry in data):
        data.append({
            'id': 'sign-shop-elixir',
            'file': 'label/sign-shop-elixir.webp',
            'kind': 'fixed',
            'cssSize': {'w': 358, 'h': 72},
            'sourceSize': {'w': 1074, 'h': 216},
            'slice': None,
            'priority': 'P1',
            'text': text,
        })
    MANIFEST.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()

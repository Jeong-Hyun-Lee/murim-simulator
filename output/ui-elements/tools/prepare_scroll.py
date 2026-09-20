import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).parents[3]
SOURCE = ROOT / 'output' / 'ui-elements' / 'source'
SCROLLS = ROOT / 'assets' / 'ui' / 'scroll'
MANIFEST = ROOT / 'assets' / 'ui' / 'manifest.json'
SIZE = (512, 320)


def prepare() -> Path:
    with Image.open(SOURCE / 'scroll-parchment-dialog-generated.png').convert('RGBA') as image:
        alpha = image.getchannel('A')
        bounds = alpha.getbbox()
        if bounds is None:
            raise RuntimeError('dialog scroll source has no visible pixels')
        cropped = image.crop(bounds)
        cropped.thumbnail(SIZE, Image.Resampling.LANCZOS)
        canvas = Image.new('RGBA', SIZE, (0, 0, 0, 0))
        offset = ((SIZE[0] - cropped.width) // 2, (SIZE[1] - cropped.height) // 2)
        canvas.alpha_composite(cropped, offset)
        source_path = SOURCE / 'scroll-parchment-dialog.png'
        source_path.parent.mkdir(parents=True, exist_ok=True)
        canvas.save(source_path, 'PNG')
        SCROLLS.mkdir(parents=True, exist_ok=True)
        canvas.save(SCROLLS / 'scroll-parchment-dialog.webp', 'WEBP', quality=90, method=6)
        return source_path


def update_manifest() -> None:
    data = json.loads(MANIFEST.read_text(encoding='utf-8'))
    if not any(entry['id'] == 'scroll-parchment-dialog' for entry in data):
        data.append({
            'id': 'scroll-parchment-dialog',
            'file': 'scroll/scroll-parchment-dialog.webp',
            'kind': 'nine-slice',
            'cssSize': {'w': 256, 'h': 160},
            'sourceSize': {'w': 512, 'h': 320},
            'slice': {'top': 64, 'right': 40, 'bottom': 64, 'left': 40},
            'priority': 'P1',
        })
    MANIFEST.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


if __name__ == '__main__':
    prepare()
    update_manifest()

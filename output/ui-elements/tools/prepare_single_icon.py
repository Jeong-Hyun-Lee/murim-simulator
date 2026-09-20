import json
import sys
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).parents[3]
SOURCE = ROOT / 'output' / 'ui-elements' / 'source'
ICONS = ROOT / 'assets' / 'ui' / 'icon'
MANIFEST = ROOT / 'assets' / 'ui' / 'manifest.json'


def main(asset_id: str, display_size: int) -> None:
    target = display_size * 3
    with Image.open(SOURCE / f'{asset_id}-generated.png').convert('RGBA') as image:
        bounds = image.getchannel('A').getbbox()
        if bounds is None:
            raise RuntimeError(f'{asset_id} has no visible pixels')
        icon = image.crop(bounds)
        icon.thumbnail((target - 12, target - 12), Image.Resampling.LANCZOS)
        canvas = Image.new('RGBA', (target, target), (0, 0, 0, 0))
        canvas.alpha_composite(icon, ((target - icon.width) // 2, (target - icon.height) // 2))
        canvas.save(SOURCE / f'{asset_id}.png', 'PNG')
        ICONS.mkdir(parents=True, exist_ok=True)
        canvas.save(ICONS / f'{asset_id}.webp', 'WEBP', lossless=True, method=6)

    data = json.loads(MANIFEST.read_text(encoding='utf-8'))
    if not any(entry['id'] == asset_id for entry in data):
        data.append({
            'id': asset_id,
            'file': f'icon/{asset_id}.webp',
            'kind': 'fixed',
            'cssSize': {'w': display_size, 'h': display_size},
            'sourceSize': {'w': target, 'h': target},
            'slice': None,
            'priority': 'P1',
        })
    MANIFEST.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


if __name__ == '__main__':
    if len(sys.argv) != 3:
        raise SystemExit('usage: prepare_single_icon.py <asset-id> <display-size>')
    main(sys.argv[1], int(sys.argv[2]))

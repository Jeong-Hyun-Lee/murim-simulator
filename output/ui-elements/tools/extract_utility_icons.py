import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).parents[3]
SOURCE = ROOT / 'output' / 'ui-elements' / 'source'
ICONS = ROOT / 'assets' / 'ui' / 'icon'
MANIFEST = ROOT / 'assets' / 'ui' / 'manifest.json'
IDS = ('icon-unlock', 'icon-info', 'icon-check', 'icon-sort', 'icon-filter')
SIZE = (60, 60)


def extract() -> None:
    with Image.open(SOURCE / 'icon-utility-p1-sheet-generated.png').convert('RGBA') as sheet:
        cell_w = sheet.width // len(IDS)
        for index, asset_id in enumerate(IDS):
            cell = sheet.crop((index * cell_w, 0, (index + 1) * cell_w, sheet.height))
            bounds = cell.getchannel('A').getbbox()
            if bounds is None:
                raise RuntimeError(f'{asset_id} has no visible pixels')
            icon = cell.crop(bounds)
            icon.thumbnail((52, 52), Image.Resampling.LANCZOS)
            canvas = Image.new('RGBA', SIZE, (0, 0, 0, 0))
            canvas.alpha_composite(icon, ((SIZE[0] - icon.width) // 2, (SIZE[1] - icon.height) // 2))
            canvas.save(SOURCE / f'{asset_id}.png', 'PNG')
            ICONS.mkdir(parents=True, exist_ok=True)
            canvas.save(ICONS / f'{asset_id}.webp', 'WEBP', lossless=True, method=6)


def update_manifest() -> None:
    data = json.loads(MANIFEST.read_text(encoding='utf-8'))
    existing = {entry['id'] for entry in data}
    for asset_id in IDS:
        if asset_id not in existing:
            data.append({
                'id': asset_id,
                'file': f'icon/{asset_id}.webp',
                'kind': 'fixed',
                'cssSize': {'w': 20, 'h': 20},
                'sourceSize': {'w': 60, 'h': 60},
                'slice': None,
                'priority': 'P1',
            })
    MANIFEST.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


if __name__ == '__main__':
    extract()
    update_manifest()

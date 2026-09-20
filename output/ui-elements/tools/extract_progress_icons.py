import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).parents[3]
SOURCE = ROOT / 'output' / 'ui-elements' / 'source'
ICONS = ROOT / 'assets' / 'ui' / 'icon'
MANIFEST = ROOT / 'assets' / 'ui' / 'manifest.json'
CELL_IDS = (
    'icon-hold', 'icon-goal-daily', 'icon-goal-milestone', 'icon-backup',
    None, 'icon-stat-atk', 'icon-stat-def', 'icon-stat-status-resist',
)
ALL_IDS = tuple(asset_id for asset_id in CELL_IDS if asset_id) + ('icon-charm',)
SIZE = (60, 60)


def center(icon: Image.Image, asset_id: str) -> None:
    bounds = icon.getchannel('A').getbbox()
    if bounds is None:
        raise RuntimeError(f'{asset_id} has no visible pixels')
    cropped = icon.crop(bounds)
    cropped.thumbnail((52, 52), Image.Resampling.LANCZOS)
    canvas = Image.new('RGBA', SIZE, (0, 0, 0, 0))
    canvas.alpha_composite(cropped, ((SIZE[0] - cropped.width) // 2, (SIZE[1] - cropped.height) // 2))
    canvas.save(SOURCE / f'{asset_id}.png', 'PNG')
    ICONS.mkdir(parents=True, exist_ok=True)
    canvas.save(ICONS / f'{asset_id}.webp', 'WEBP', lossless=True, method=6)


def extract() -> None:
    with Image.open(SOURCE / 'icon-progress-p1-sheet-generated.png').convert('RGBA') as sheet:
        cell_w, cell_h = sheet.width // 4, sheet.height // 2
        for index, asset_id in enumerate(CELL_IDS):
            if asset_id:
                x, y = (index % 4) * cell_w, (index // 4) * cell_h
                center(sheet.crop((x, y, x + cell_w, y + cell_h)), asset_id)
    with Image.open(SOURCE / 'icon-charm-generated.png').convert('RGBA') as charm:
        center(charm, 'icon-charm')


def update_manifest() -> None:
    data = json.loads(MANIFEST.read_text(encoding='utf-8'))
    existing = {entry['id'] for entry in data}
    for asset_id in ALL_IDS:
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

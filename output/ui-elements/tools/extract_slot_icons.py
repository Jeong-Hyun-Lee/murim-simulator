import json
from pathlib import Path

from PIL import Image, ImageOps


ROOT = Path(__file__).parents[3]
SOURCE = ROOT / 'output' / 'ui-elements' / 'source'
ICONS = ROOT / 'assets' / 'ui' / 'icon'
MANIFEST = ROOT / 'assets' / 'ui' / 'manifest.json'
IDS = (
    'icon-slot-weapon', 'icon-slot-body', 'icon-slot-head', 'icon-slot-arm',
    'icon-slot-foot', 'icon-slot-waist', 'icon-slot-neck', 'icon-slot-ring',
)
SIZE = (96, 96)


def bronze_tone(image: Image.Image) -> Image.Image:
    alpha = image.getchannel('A')
    gray = ImageOps.grayscale(image.convert('RGB'))
    bronze = ImageOps.colorize(gray, black='#21170f', white='#d8ad57')
    bronze.putalpha(alpha)
    return bronze


def extract() -> list[Path]:
    with Image.open(SOURCE / 'icon-slot-sheet-generated.png').convert('RGBA') as sheet:
        cell_w, cell_h = sheet.width // 4, sheet.height // 2
        output = []
        for index, asset_id in enumerate(IDS):
            x = (index % 4) * cell_w
            y = (index // 4) * cell_h
            cell = sheet.crop((x, y, x + cell_w, y + cell_h))
            bounds = cell.getchannel('A').getbbox()
            if bounds is None:
                raise RuntimeError(f'{asset_id} has no visible pixels')
            icon = bronze_tone(cell.crop(bounds))
            icon.thumbnail((84, 84), Image.Resampling.LANCZOS)
            canvas = Image.new('RGBA', SIZE, (0, 0, 0, 0))
            canvas.alpha_composite(icon, ((SIZE[0] - icon.width) // 2, (SIZE[1] - icon.height) // 2))
            source_path = SOURCE / f'{asset_id}.png'
            canvas.save(source_path, 'PNG')
            ICONS.mkdir(parents=True, exist_ok=True)
            canvas.save(ICONS / f'{asset_id}.webp', 'WEBP', lossless=True, method=6)
            output.append(source_path)
        return output


def make_check(paths: list[Path]) -> None:
    size, padding = 72, 12
    canvas = Image.new('RGB', ((size + padding) * 4 + padding, (size + padding) * 4 + padding), '#efebe3')
    for index, path in enumerate(paths):
        with Image.open(path).convert('RGBA') as icon:
            for row, background in enumerate(('#efebe3', '#1c1b1d')):
                x = padding + (index % 4) * (size + padding)
                y = padding + row * ((size + padding) * 2) + (index // 4) * (size + padding)
                tile = Image.new('RGBA', (size, size), background)
                scaled = icon.resize((48, 48), Image.Resampling.LANCZOS)
                tile.alpha_composite(scaled, (12, 12))
                canvas.paste(tile.convert('RGB'), (x, y))
    canvas.save(SOURCE / 'icon-slot-sheet-check.png', 'PNG')


def update_manifest() -> None:
    data = json.loads(MANIFEST.read_text(encoding='utf-8'))
    existing = {entry['id'] for entry in data}
    for asset_id in IDS:
        if asset_id not in existing:
            data.append({
                'id': asset_id,
                'file': f'icon/{asset_id}.webp',
                'kind': 'fixed',
                'cssSize': {'w': 32, 'h': 32},
                'sourceSize': {'w': 96, 'h': 96},
                'slice': None,
                'priority': 'P1',
            })
    MANIFEST.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


if __name__ == '__main__':
    paths = extract()
    make_check(paths)
    update_manifest()

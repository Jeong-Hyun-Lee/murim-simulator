"""Remove transparent outer margins from generated UI assets and sync manifest sizes."""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[3]
UI_ROOT = ROOT / 'assets' / 'ui'
MANIFEST_PATH = UI_ROOT / 'manifest.json'
REPORT_PATH = ROOT / 'output' / 'ui-elements' / 'alpha-trim-report.json'
VISIBLE_ALPHA = 8


def alpha_bounds(image: Image.Image) -> tuple[int, int, int, int] | None:
    alpha = image.getchannel('A').point(lambda value: 255 if value > VISIBLE_ALPHA else 0)
    return alpha.getbbox()


def main() -> None:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding='utf-8'))
    by_file = {item['file']: item for item in manifest}
    changes = []

    for path in sorted(UI_ROOT.rglob('*.webp')):
        relative = path.relative_to(UI_ROOT).as_posix()
        image = Image.open(path).convert('RGBA')
        bounds = alpha_bounds(image)
        if bounds is None:
            raise ValueError(f'fully transparent UI asset: {relative}')
        if bounds == (0, 0, *image.size):
            continue

        left, top, right, bottom = bounds
        original_width, original_height = image.size
        cropped = image.crop(bounds)
        cropped.save(path, format='WEBP', lossless=True, method=6)
        entry = by_file.get(relative)
        if entry:
            entry['sourceSize'] = {'w': cropped.width, 'h': cropped.height}
            if entry.get('slice'):
                slice_data = entry['slice']
                slice_data['left'] = max(0, slice_data['left'] - left)
                slice_data['top'] = max(0, slice_data['top'] - top)
                slice_data['right'] = max(0, slice_data['right'] - (original_width - right))
                slice_data['bottom'] = max(0, slice_data['bottom'] - (original_height - bottom))
        changes.append({
            'file': relative,
            'from': {'w': original_width, 'h': original_height},
            'to': {'w': cropped.width, 'h': cropped.height},
            'trim': {'left': left, 'top': top, 'right': original_width - right, 'bottom': original_height - bottom},
        })

    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    REPORT_PATH.write_text(json.dumps({'visibleAlpha': VISIBLE_ALPHA, 'trimmed': changes, 'count': len(changes)}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'trimmed': len(changes)}, ensure_ascii=False))


if __name__ == '__main__':
    main()

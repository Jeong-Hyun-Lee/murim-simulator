import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).parents[3]
SOURCE = ROOT / 'output' / 'ui-elements' / 'source'
FRAMES = ROOT / 'assets' / 'ui' / 'frame'
MANIFEST = ROOT / 'assets' / 'ui' / 'manifest.json'
SIZE = (192, 128)


def main() -> None:
    with Image.open(SOURCE / 'frame-toast-note-generated.png').convert('RGBA') as image:
        frame = image.resize(SIZE, Image.Resampling.LANCZOS)

    SOURCE.mkdir(parents=True, exist_ok=True)
    FRAMES.mkdir(parents=True, exist_ok=True)
    frame.save(SOURCE / 'frame-toast-note.png', 'PNG')
    frame.save(FRAMES / 'frame-toast-note.webp', 'WEBP', lossless=True, method=6)

    data = json.loads(MANIFEST.read_text(encoding='utf-8'))
    if not any(entry['id'] == 'frame-toast-note' for entry in data):
        data.append({
            'id': 'frame-toast-note',
            'file': 'frame/frame-toast-note.webp',
            'kind': 'nine-slice',
            'cssSize': {'w': 96, 'h': 64},
            'sourceSize': {'w': 192, 'h': 128},
            'slice': {'top': 32, 'right': 32, 'bottom': 32, 'left': 32},
            'priority': 'P1',
        })
    MANIFEST.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()

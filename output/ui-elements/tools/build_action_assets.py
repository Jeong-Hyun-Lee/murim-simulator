from pathlib import Path
from PIL import Image

ROOT = Path(r'D:\dev\murim-simulator')
CACHE = Path(r'C:\Users\이정현\.codex\generated_images\01a0ba14-1b11-73f2-823a-fcf4e58b0f00')
SOURCE = ROOT / 'output' / 'ui-elements' / 'source'
RUNTIME = ROOT / 'assets' / 'ui' / 'button'

SPECS = (
    {
        'id': 'btn-goals',
        'generated': 'exec-48733fd6-86b4-4bcc-bc26-22321521bc2b.png',
        'size': (360, 120),
        'layers': (('icon-goal.png', (45, 37), (46, 46)), ('label-goals.png', (126, 34), (150, 40))),
    },
    {
        'id': 'btn-rebirth-ready',
        'generated': 'exec-9fc11232-8ff1-414b-b334-5d716c772349.png',
        'size': (450, 132),
        'layers': (('title-rebirth-ready.png', (130, 43), (238, 43)),),
    },
    {
        'id': 'btn-back-my-info',
        'generated': 'exec-ae23bf69-ca2e-402e-8b29-1b86a6bac00f.png',
        'size': (132, 132),
        'layers': (('icon-back.png', (38, 40), (56, 52)),),
    },
)


def cropped_rgba(path: Path) -> Image.Image:
    image = Image.open(path).convert('RGBA')
    alpha = image.getchannel('A')
    box = alpha.getbbox()
    if box is None:
        raise ValueError(f'No visible pixels: {path}')
    return image.crop(box)


def crop_visible(image: Image.Image, threshold: int = 8) -> Image.Image:
    alpha = image.getchannel('A')
    visible = alpha.point(lambda value: 255 if value >= threshold else 0)
    box = visible.getbbox()
    if box is None:
        raise ValueError('No visible pixels in finished asset')
    image.putalpha(visible)
    return image.crop(box)


def build(spec: dict) -> None:
    original = CACHE / spec['generated']
    if not original.exists():
        raise FileNotFoundError(original)
    generated_copy = SOURCE / f"{spec['id']}-generated.png"
    crop_visible(cropped_rgba(original)).save(generated_copy)
    base = cropped_rgba(original).resize(spec['size'], Image.Resampling.LANCZOS)
    for filename, point, size in spec['layers']:
        layer = cropped_rgba(SOURCE / filename).resize(size, Image.Resampling.LANCZOS)
        base.alpha_composite(layer, point)
    base = crop_visible(base)
    source_path = SOURCE / f"{spec['id']}.png"
    runtime_path = RUNTIME / f"{spec['id']}.webp"
    base.save(source_path)
    base.save(runtime_path, 'WEBP', lossless=True, method=6)
    print(f"{spec['id']}: {base.size}, alpha bbox={base.getchannel('A').getbbox()}")


def main() -> None:
    RUNTIME.mkdir(parents=True, exist_ok=True)
    for spec in SPECS:
        build(spec)


if __name__ == '__main__':
    main()

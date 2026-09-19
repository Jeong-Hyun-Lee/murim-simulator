from pathlib import Path

from PIL import Image, ImageEnhance


ROOT = Path(__file__).parents[3]
SOURCE = ROOT / 'output' / 'ui-elements' / 'source'
THEME = ROOT / 'assets' / 'ui' / 'theme'


def resize(source_name, target_name, size, quality, lossless=False):
    with Image.open(SOURCE / source_name) as image:
        image = image.convert('RGBA' if image.mode == 'RGBA' else 'RGB')
        image = image.resize(size, Image.Resampling.LANCZOS)
        image.save(
            SOURCE / target_name.replace('.webp', '.png'),
            'PNG',
        )
        image.save(
            THEME / target_name,
            'WEBP',
            quality=quality,
            lossless=lossless,
            method=6,
        )


def prepare_wall():
    with Image.open(SOURCE / 'theme-app-wall-generated.png').convert('RGB') as image:
        image = ImageEnhance.Contrast(image).enhance(0.3)
        image = image.resize((512, 512), Image.Resampling.LANCZOS)
        image.save(SOURCE / 'theme-app-wall.png', 'PNG')
        image.save(THEME / 'theme-app-wall.webp', 'WEBP', quality=85, method=6)


def main():
    THEME.mkdir(parents=True, exist_ok=True)
    prepare_wall()
    resize(
        'theme-wall-ink-branch-generated.png',
        'theme-wall-ink-branch.webp',
        (480, 640),
        100,
        True,
    )
    resize(
        'theme-outer-landscape-generated.png',
        'theme-outer-landscape.webp',
        (1920, 1200),
        80,
    )
    resize(
        'theme-divider-ink-generated.png',
        'theme-divider-ink.webp',
        (716, 24),
        100,
        True,
    )


if __name__ == '__main__':
    main()

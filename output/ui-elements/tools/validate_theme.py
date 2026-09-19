from pathlib import Path

from PIL import Image, ImageStat


ROOT = Path(__file__).parents[3]
SOURCE = ROOT / 'output' / 'ui-elements' / 'source'


def main():
    with Image.open(SOURCE / 'theme-app-wall.png').convert('RGB') as image:
        check = Image.new('RGB', (image.width * 2, image.height * 2))
        for x in range(2):
            for y in range(2):
                check.paste(image, (x * image.width, y * image.height))
        check.save(SOURCE / 'theme-app-wall-tile-check.png')

        mean = sum(ImageStat.Stat(image).mean) / 3
        extrema = image.convert('L').getextrema()
        deviation = max(abs(extrema[0] - mean), abs(extrema[1] - mean)) / mean
        if deviation > 0.04:
            raise SystemExit(f'luminance deviation {deviation:.2%} exceeds 4%')
        print(f'luminance deviation: {deviation:.2%}')


if __name__ == '__main__':
    main()

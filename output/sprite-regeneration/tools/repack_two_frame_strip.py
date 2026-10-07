from argparse import ArgumentParser
from pathlib import Path

from PIL import Image


def main() -> None:
    parser = ArgumentParser(
        description='Repack two transparent poses into the first two cells of a four-cell strip.',
    )
    parser.add_argument('source', type=Path)
    parser.add_argument('split_x', type=int)
    parser.add_argument('content_end_x', type=int)
    parser.add_argument('--cell-width', type=int, required=True)
    args = parser.parse_args()

    source = Image.open(args.source).convert('RGBA')
    segments = (
        source.crop((0, 0, args.split_x, source.height)),
        source.crop((args.split_x, 0, args.content_end_x, source.height)),
    )
    output = Image.new('RGBA', (args.cell_width * 4, source.height))

    for index, segment in enumerate(segments):
        bounds = segment.getchannel('A').getbbox()
        if bounds is None:
            raise ValueError(f'pose {index + 1} has no visible pixels')
        pose = segment.crop((bounds[0], 0, bounds[2], source.height))
        if pose.width > args.cell_width:
            raise ValueError(
                f'pose {index + 1} width {pose.width} exceeds cell width {args.cell_width}',
            )
        x = index * args.cell_width + (args.cell_width - pose.width) // 2
        output.alpha_composite(pose, (x, 0))

    output.save(args.source)

    for index in range(2, 4):
        cell = output.crop(
            (
                index * args.cell_width,
                0,
                (index + 1) * args.cell_width,
                output.height,
            ),
        )
        assert cell.getchannel('A').getbbox() is None


if __name__ == '__main__':
    main()

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image


TARGETS = {
    'btn-primary-tile': (360, 112),
    'btn-secondary-brick': (360, 112),
    'btn-travel-jade': (360, 112),
    'btn-danger-brick': (360, 112),
    'btn-segment': (320, 80),
    'btn-segment-active': (320, 80),
    'btn-round': (132, 132),
}


def main() -> None:
    asset_id = sys.argv[1]
    target = TARGETS[asset_id]
    source_dir = Path('output/ui-elements/source')
    generated = Image.open(source_dir / f'{asset_id}-generated.png').convert('RGBA')
    alpha_bounds = generated.getchannel('A').getbbox()
    if alpha_bounds is None:
        raise ValueError(f'{asset_id} has no visible pixels')
    cropped = generated.crop(alpha_bounds)
    fitted = cropped.resize(target, Image.Resampling.LANCZOS)
    fitted.save(source_dir / f'{asset_id}.png')
    fitted.save(Path('assets/ui/button') / f'{asset_id}.webp', 'WEBP', lossless=True, method=6)


if __name__ == '__main__':
    main()

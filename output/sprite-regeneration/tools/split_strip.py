from pathlib import Path
import sys
from PIL import Image

source = Image.open(sys.argv[1]).convert('RGBA')
frames = int(sys.argv[2])
output = Path(sys.argv[3])
output.mkdir(parents=True, exist_ok=True)
cell_width = source.width / frames
for index in range(frames):
    frame = source.crop((round(index * cell_width), 0, round((index + 1) * cell_width), source.height))
    bounds = frame.getchannel('A').getbbox()
    if not bounds:
        continue
    subject = frame.crop(bounds)
    scale = 512 / subject.height
    subject = subject.resize((round(subject.width * scale), 512), Image.Resampling.LANCZOS)
    canvas = Image.new('RGBA', (768, 768))
    canvas.alpha_composite(subject, (192 - round(subject.width * 0.30), 112))
    canvas.save(output / f'{index:02}.png')

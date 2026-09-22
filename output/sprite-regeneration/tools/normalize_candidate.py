from pathlib import Path
from PIL import Image

source = Path('wiki/raw/assets/mokhyeon-idle-v6-candidate.png')
target = Path('wiki/raw/assets/mokhyeon-v3-idle-reference.png')
image = Image.open(source).convert('RGBA')
bounds = image.getchannel('A').getbbox()
assert bounds
subject = image.crop(bounds)
scale = 512 / subject.height
resized = subject.resize((round(subject.width * scale), 512), Image.Resampling.LANCZOS)
canvas = Image.new('RGBA', (768, 768))
left = 192 - round(resized.width * 0.30)
top = 624 - resized.height
canvas.alpha_composite(resized, (left, top))
canvas.save(target)

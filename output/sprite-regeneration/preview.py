from pathlib import Path
from PIL import Image, ImageDraw
root=Path(__file__).resolve().parent
for character in ['mokhyeon','boss','grunt','archer','elite']:
    paths=sorted((root/'transparent').glob(character+'-*.png'))
    board=Image.new('RGB',(1200, len(paths)*320),(50,80,110))
    draw=ImageDraw.Draw(board)
    for i,path in enumerate(paths):
        im=Image.open(path).convert('RGBA')
        im.thumbnail((600,300))
        board.paste(im,(0,i*320+20),im)
        original=Image.open(root/'sources'/path.name).convert('RGBA')
        original.thumbnail((600,300))
        board.paste(original,(600,i*320+20),original)
        draw.text((5,i*320+3),path.name,fill='white')
    board.save(root/(character+'-comparison.jpg'))

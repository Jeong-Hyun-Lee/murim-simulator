from pathlib import Path
import json
import zipfile
import numpy as np
from PIL import Image

root=Path(__file__).resolve().parent
results=[]
paths=sorted((root/'transparent').glob('*.png'))
assert len(paths)==27
for path in paths:
    original=Image.open(root/'sources'/path.name)
    result=Image.open(path)
    assert result.mode=='RGBA' and result.size==original.size
    pixels=np.array(result)
    assert pixels[:,:,3].min()==0 and pixels[:,:,3].max()==255
    assert np.array_equal(pixels[:,:,:3],np.array(original.convert('RGB')))
    if original.mode=='RGBA':
        assert np.array_equal(pixels,np.array(original))
    results.append({'file':path.name,'size':list(result.size),'mode':result.mode,'fully_transparent_pixels':int((pixels[:,:,3]==0).sum()),'rgb_pixels_unchanged':True,'resized_or_repositioned':False})
(root/'transparency-report.json').write_text(json.dumps(results,indent=2),encoding='utf-8')
with zipfile.ZipFile(root/'transparent-motion-sheets.zip','w',zipfile.ZIP_DEFLATED) as archive:
    for path in paths:
        archive.write(path,path.name)
print('PASS: 27 RGBA PNGs, transparent alpha, exact original dimensions/RGB; existing alpha preserved.')

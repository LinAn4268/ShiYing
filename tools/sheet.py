import sys, os
from PIL import Image, ImageDraw
import urllib.request

ids = sys.argv[1:]
outdir = 'tools/cand'
os.makedirs(outdir, exist_ok=True)
imgs = []
for i, pid in enumerate(ids):
    path = os.path.join(outdir, f'{i:02d}.jpg')
    if not os.path.exists(path):
        url = f'https://images.unsplash.com/photo-{pid}?auto=format&fit=crop&w=420&q=60'
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                data = r.read()
        except Exception as e:
            print('skip', pid, e)
            continue
        with open(path, 'wb') as f:
            f.write(data)
    try:
        imgs.append((pid, Image.open(path).convert('RGB')))
    except Exception as e:
        print('bad', path, e)

cols, cw, ch = 4, 320, 250
rows = (len(imgs) + cols - 1) // cols
sheet = Image.new('RGB', (cols * cw, rows * (ch + 18)), 'white')
d = ImageDraw.Draw(sheet)
for i, (pid, im) in enumerate(imgs):
    im.thumbnail((cw - 10, ch - 10))
    x = (i % cols) * cw + 5
    y = (i // cols) * (ch + 18) + 5
    sheet.paste(im, (x, y))
    d.text((x + 4, y + ch - 4), f'{i:02d} {pid[:30]}', fill='black')
sheet.save('tools/contact-sheet.png')
print('ok', len(imgs), sheet.size)

import json, io, os, re

base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
data_dir = os.path.join(base, 'data')

chapters = []
for f in ['ch1-3.json', 'ch4-7.json', 'ch8-10.json']:
    with io.open(os.path.join(data_dir, f), 'r', encoding='utf-8') as fh:
        chapters.extend(json.load(fh)['chapters'])

# Build the exact title list from the data model in document order.
actual = []
for ch in chapters:
    actual.append(ch['title'])
    for s in ch['sections']:
        actual.append(s['title'])
        for item in s['items']:
            actual.append(item['title'])

with io.open(os.path.join(data_dir, 'directory.txt'), 'r', encoding='utf-8') as fh:
    expected = [line.strip() for line in fh if line.strip()]

print('expected headings:', len(expected))
print('actual headings  :', len(actual))

missing = [t for t in expected if t not in actual]
extra = [t for t in actual if t not in expected]

# Check strict order as well
order_ok = expected == actual

print('missing:', missing)
print('extra  :', extra)
print('order identical:', order_ok)

# Verify final index.html embeds all titles
with io.open(os.path.join(base, 'index.html'), 'r', encoding='utf-8') as fh:
    html = fh.read()
not_embedded = [t for t in expected if t.replace('"','\\"') not in html]
print('titles not found in index.html:', len(not_embedded))
for t in not_embedded[:10]:
    print('  ', t)

# Basic structural checks
# 配图覆盖：135 条详解各有唯一一张 Pexels 图片
photo_path = os.path.join(base, 'data', 'photos', 'detail.json')
photos = json.load(io.open(photo_path, encoding='utf-8')) if os.path.exists(photo_path) else {}
detail_ids = []
for i in range(1, 11):
    p = os.path.join(base, 'data', 'detail', 'out', 'ch%d.json' % i)
    if os.path.exists(p):
        detail_ids += [it['id'] for it in json.load(io.open(p, encoding='utf-8'))['items']]
photo_missing = [i for i in detail_ids if i not in photos]
photo_dupe = len(photos) - len({v['id'] for v in photos.values()})
print('photos: %d / %d items, missing %d, duplicate images %d'
      % (len(photos), len(detail_ids), len(photo_missing), photo_dupe))

checks = {
    'lang zh-CN': 'lang="zh-CN"' in html,
    'viewport': 'name="viewport"' in html,
    'description': 'name="description"' in html,
    'skip link': 'class="skip-link"' in html,
    '5 themes': all('data-theme="%s"' % t in html for t in ['paper', 'cinema', 'grid', 'ink', 'mono']),
    'dark mode': 'data-dark' in html,
    'search': 'id="search"' in html and 'doSearch' in html,
    'toc': 'id="tocList"' in html,
    'back to top': 'id="toTop"' in html,
    'progress': 'id="progressText"' in html,
    'photos 135': len(photos) == len(detail_ids) and not photo_missing,
    'no console.log left': 'console.log' not in html,
    'no placeholders left': '__DATA__' not in html and '__GLOSSARY__' not in html,
}
for k, v in checks.items():
    print(('PASS' if v else 'FAIL'), k)

# External image/link sanity
print('img tags:', html.count('<img'))
print('unsplash refs:', html.count('unsplash.com'))
print('target blank links:', html.count('target="_blank"'))

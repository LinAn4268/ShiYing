import io, json, os, re, sys

sys.stdout.reconfigure(encoding='utf-8')

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(BASE, 'data')
SRC = os.path.join(BASE, 'src')

def read(p):
    with io.open(p, 'r', encoding='utf-8') as fh:
        return fh.read()

chapters = []
for f in ['ch1-3.json', 'ch4-7.json', 'ch8-10.json']:
    chapters.extend(json.loads(read(os.path.join(DATA, f)))['chapters'])
glossary = json.loads(read(os.path.join(DATA, 'glossary.json')))

# 导语压缩到 80–120 字区间（原 ch1=130 / ch3=127）
FIX = {
 'ch1': '这一章不谈参数，先谈“看见”。我们从一张照片里藏着的光、时间与选择说起，聊聊人为什么按快门，又怎样从随手拍走向有意识的表达。读完你会明白：摄影不是设备比赛，而是观看方式的练习——先想清“拍什么、为什么拍”，技术才有落点。',
 'ch3': '这一章是摄影技术最核心的一课。光圈、快门、ISO 像三道闸门，共同决定照片明暗，也各自带来不同效果。我们会用“接雨水”的比喻讲清原理，再用卡片对比它们的用途。读完你就能理解：为什么过曝、为什么会糊，以及弱光下如何取舍。',
}
for c in chapters:
    if c['id'] in FIX:
        c['intro'] = FIX[c['id']]
    n = len(c['intro'])
    assert 80 <= n <= 120, (c['id'], n)

def js(obj):
    s = json.dumps(obj, ensure_ascii=False, separators=(',', ':'))
    return s.replace('</', '<\\/').replace('\\u2028', '\\\\u2028').replace('\\u2029', '\\\\u2029')

css = read(os.path.join(SRC, 'style.css'))
layout = read(os.path.join(SRC, 'layout.css'))
app = read(os.path.join(SRC, 'app.js'))
look = read(os.path.join(SRC, 'look.js'))
tpl = read(os.path.join(SRC, 'body.html'))

out = (tpl
  .replace('/*__CSS__*/', css + '\n' + layout)
  .replace('/*__DATA__*/', 'var DATA=' + js(chapters) + ';')
  .replace('/*__GLOSSARY__*/', 'var GLOSSARY=' + js(glossary) + ';')
  .replace('/*__APP__*/', app)
  .replace('/*__LOOK__*/', look))

path = os.path.join(BASE, 'index.html')
with io.open(path, 'w', encoding='utf-8', newline='\n') as fh:
    fh.write(out)

secs = sum(len(c['sections']) for c in chapters)
items = sum(len(s['items']) for c in chapters for s in c['sections'])
print('index.html: chapters=%d sections=%d items=%d terms=%d bytes=%d' % (
    len(chapters), secs, items, len(glossary), len(out.encode('utf-8'))))

# ---------------- 详情页 detail.html ----------------
DETAIL_FIELDS = ('lead', 'principle', 'steps', 'mistakes', 'example', 'case', 'takeaway', 'keywords')

def norm_step(v):
    """把步骤统一成可读字符串：兼容 str / dict{name,title,action,desc,params}。"""
    if isinstance(v, str):
        return v.strip()
    if isinstance(v, dict):
        parts = []
        head = v.get('name') or v.get('title') or ''
        if head:
            parts.append(head.rstrip('：:'))
        action = v.get('action') or v.get('desc') or v.get('description') or ''
        params = v.get('params') or v.get('param') or ''
        if action and params:
            parts.append('%s（%s）' % (action.rstrip('。'), params.rstrip('。')) + '。')
        elif action:
            parts.append(action if action.endswith('。') else action + '。')
        elif params:
            parts.append('参数：' + params.rstrip('。') + '。')
        return '：'.join(parts) if len(parts) > 1 else (parts[0] if parts else '')
    return str(v)

def norm_list(v, field):
    if isinstance(v, str):
        return [v.strip()] if v.strip() else []
    if isinstance(v, list):
        out = []
        for x in v:
            s = norm_step(x) if field == 'steps' else (x.strip() if isinstance(x, str) else str(x))
            if s:
                out.append(s)
        return out
    return []

details = []
missing = []
PHOTOS = json.loads(read(os.path.join(DATA, 'photos', 'detail.json')))
no_photo = []
for i in range(1, 11):
    p = os.path.join(DATA, 'detail', 'out', 'ch%d.json' % i)
    if not os.path.exists(p):
        missing.append('ch%d.json' % i)
        continue
    d = json.loads(read(p))
    for it in d['items']:
        rec = {
            'id': it['id'], 'title': it['title'], 'tag': it.get('tag', ''),
            'section': it.get('section', ''),
            'chapterId': d['chapterId'], 'chapterTitle': d['chapterTitle'],
        }
        for fld in DETAIL_FIELDS:
            if fld == 'case':
                c = it.get('case')
                rec['case'] = {
                    'scene': (c.get('scene') or '').strip(),
                    'setup': (c.get('setup') or '').strip(),
                    'why': (c.get('why') or '').strip(),
                    'note': (c.get('note') or '').strip(),
                } if isinstance(c, dict) and (c.get('scene') or '').strip() else None
            elif fld in ('steps', 'mistakes', 'keywords'):
                rec[fld] = norm_list(it.get(fld, []), fld)
            else:
                rec[fld] = it.get(fld, '')
        ph = PHOTOS.get(it['id'])
        if ph:
            rec['photo'] = ph
        else:
            no_photo.append(it['id'])
        details.append(rec)

if no_photo:
    print('WARNING: details without photo:', ', '.join(no_photo[:10]), '(+%d)' % max(0, len(no_photo) - 10))

if missing:
    print('WARNING: missing detail files:', ', '.join(missing))

# 校验：目录完整性与扩写内容完整性
detail_ids = [d['id'] for d in details]
source_ids = [it['id'] for c in chapters for s in c['sections'] for it in s['items']]
assert len(detail_ids) == len(set(detail_ids)), 'detail ids duplicated'
assert set(detail_ids) == set(source_ids), (
    'detail/source id mismatch; missing=%s extra=%s' % (
        sorted(set(source_ids) - set(detail_ids))[:5], sorted(set(detail_ids) - set(source_ids))[:5]))

thin = [d['id'] for d in details if not all([d['lead'], d['principle'], d['steps'], d['mistakes'], d['example'], d['takeaway'], d['keywords']])]
if thin:
    print('WARNING: incomplete detail content:', ', '.join(thin[:10]))

detail_css = read(os.path.join(SRC, 'detail.css'))
detail_app = read(os.path.join(SRC, 'detail-app.js'))
detail_body = read(os.path.join(SRC, 'detail-body.html'))
detail_html = (detail_body
  .replace('/*__BASE_CSS__*/', css)
  .replace('/*__DETAIL_CSS__*/', detail_css)
  .replace('/*__DATA__*/', 'var DETAILS=' + js(details) + ';')
  .replace('/*__APP__*/', detail_app)
  .replace('/*__LOOK__*/', look))
detail_path = os.path.join(BASE, 'detail.html')
with io.open(detail_path, 'w', encoding='utf-8', newline='\n') as fh:
    fh.write(detail_html)

print('detail.html: items=%d bytes=%d' % (len(details), len(detail_html.encode('utf-8'))))

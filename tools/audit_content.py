# -*- coding: utf-8 -*-
"""内容审计：长度、重复、占位符、格式异常。"""
import json, io, re, sys, os, collections

sys.stdout.reconfigure(encoding='utf-8')
OUT = os.path.join('data', 'detail', 'out')

items = []
for i in range(1, 11):
    d = json.load(io.open(os.path.join(OUT, 'ch%d.json' % i), encoding='utf-8'))
    for it in d['items']:
        it['_ch'] = i
        items.append(it)

print('items', len(items))

def flat(v):
    if isinstance(v, str):
        return v
    if isinstance(v, list):
        return ' '.join(flat(x) for x in v)
    if isinstance(v, dict):
        return ' '.join(flat(x) for x in v.values())
    return str(v)

def prose(it):
    return sum(len(it.get(k, '') or '') for k in ('lead', 'principle', 'example', 'takeaway'))

# 1. prose 长度
lens = [(prose(it), it['id']) for it in items]
short = sorted([x for x in lens if x[0] < 300])[:20]
long_ = sorted([x for x in lens if x[0] > 520], reverse=True)[:20]
print('\n[prose 300-500 之外]')
print('  short:', [(i, n) for n, i in short])
print('  long :', [(i, n) for n, i in long_])
print('  median', sorted(lens)[len(lens)//2][0])

# 2. 占位符 / 空话
BAD = ['TODO', 'XXX', '待补充', '待完善', '略', '示例文本', 'lorem', '此处', '（省略）', '...', '……']
print('\n[可疑占位]')
for it in items:
    t = flat(it)
    for b in BAD:
        if b in t:
            print(' ', it['id'], repr(b), t[max(0, t.find(b)-25):t.find(b)+25].replace('\n', ' '))
            break

# 3. 重复句子（跨条目）
sent_map = collections.defaultdict(set)
for it in items:
    t = flat(it)
    for s in re.split(r'(?<=[。！？])', t):
        s = s.strip()
        if len(s) >= 18:
            sent_map[s].add(it['id'])
dup = [(s, ids) for s, ids in sent_map.items() if len(ids) > 1]
dup.sort(key=lambda x: -len(x[1]))
print('\n[重复句 前12]', len(dup))
for s, ids in dup[:12]:
    print('  x%d %s | %s' % (len(ids), sorted(ids)[:4], s[:56]))

# 4. steps 归一化后的格式问题
print('\n[steps 异常]')
for it in items:
    for k in ('steps', 'mistakes', 'keywords'):
        v = it.get(k)
        if not isinstance(v, list):
            print(' ', it['id'], k, 'not list:', type(v).__name__)
            continue
        for x in v:
            s = flat(x)
            if isinstance(x, dict):
                s = json.dumps(x, ensure_ascii=False)
            if not s.strip():
                print(' ', it['id'], k, 'EMPTY')
            if '：：' in s or '。。' in s or ',,' in s:
                print(' ', it['id'], k, 'PUNCT', s[:60])
            if isinstance(x, dict) and not (x.get('name') or x.get('title') or x.get('action') or x.get('desc')):
                print(' ', it['id'], k, 'DICT-NO-TEXT', json.dumps(x, ensure_ascii=False)[:80])

# 5. 字段缺失 / 类型
REQ = ('lead', 'principle', 'steps', 'mistakes', 'example', 'takeaway', 'keywords')
for it in items:
    for k in REQ:
        if k not in it or it[k] in ('', [], None):
            print(' MISSING', it['id'], k)
    for k in ('lead', 'principle', 'example', 'takeaway'):
        if not isinstance(it.get(k), str):
            print(' TYPE', it['id'], k, type(it.get(k)).__name__)

# 6. 关键词质量
print('\n[keywords 异常]')
for it in items:
    kw = it.get('keywords') or []
    if isinstance(kw, str):
        kw = [kw]
    if not (2 <= len(kw) <= 5):
        print(' ', it['id'], 'count', len(kw), kw)
    for k in kw:
        s = k if isinstance(k, str) else flat(k)
        if len(s) > 10:
            print(' ', it['id'], 'TOO-LONG-KW', s)

# 7. 数字/参数抽查：明显不可能的曝光值
print('\n[参数抽查]')
pat = re.compile(r'(f/\d+(?:\.\d+)?|1/\d+s|ISO\s?\d+|\d+\s?mm|\d+\s?K\b)')
vals = collections.Counter()
for it in items:
    for m in pat.findall(flat(it)):
        vals[m] += 1
print(' ', ' '.join('%s:%d' % (k, v) for k, v in vals.most_common(40)))

# 8. 标点/空白
print('\n[格式]')
for it in items:
    t = flat(it)
    if '\r' in t:
        print(' CRLF', it['id'])
    if re.search(r'[ \t]{2,}', t):
        print(' MULTISPACE', it['id'])
    if re.search(r'[\u4e00-\u9fff][,;:!?]', t):
        print(' 半角标点', it['id'])

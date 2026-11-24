# -*- coding: utf-8 -*-
"""检查改写后文案里的空话、绝对化与模板化表达。"""
import io
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

BANNED = [
    '在当今时代', '随着社会', '众所周知', '毋庸置疑', '不言而喻',
    '综上所述', '总而言之', '本文将', '本文', '笔者',
    '高效', '强大', '完美', '极致', '颠覆', '革命性',
    '100%', '百分百', '绝对', '第一', '唯一', '必看', '封神', '天花板',
    '！！！', '!!!', '～', '~', '😀', '👌', '🔥',
]
WARN = ['最', '极致', '秒懂', '一招', '瞬间']


def collect():
    """返回 [(位置, 文本)]"""
    out = []
    for src in ['data/ch1-3.json', 'data/ch4-7.json', 'data/ch8-10.json']:
        with io.open(os.path.join(ROOT, src), encoding='utf-8') as f:
            data = json.load(f)
        for ch in data['chapters']:
            out.append((ch['id'] + ' intro', ch.get('intro', '')))
            out.append((ch['id'] + ' summary', ch.get('summary', '')))
            out.append((ch['id'] + ' practice', ch.get('practice', '')))
            for s in ch['sections']:
                for i in s['items']:
                    out.append((i['id'], i.get('text', '')))
    for n in range(1, 11):
        p = os.path.join(ROOT, 'data/detail/out/ch%d.json' % n)
        with io.open(p, encoding='utf-8') as f:
            d = json.load(f)
        for it in d['items']:
            for k in ('lead', 'principle', 'example', 'takeaway'):
                out.append((it['id'] + '.' + k, it.get(k) or ''))
            for k in ('steps', 'mistakes'):
                for idx, x in enumerate(it.get(k) or []):
                    out.append(('%s.%s[%d]' % (it['id'], k, idx), json.dumps(x, ensure_ascii=False)))
    return out


def main():
    rows = collect()
    hits = []
    for where, text in rows:
        for b in BANNED:
            if b in text:
                hits.append((where, b, text[:60]))
    warns = []
    for where, text in rows:
        for b in WARN:
            if b in text:
                warns.append((where, b))
    print('scanned fields:', len(rows))
    print('banned hits:', len(hits))
    for h in hits[:30]:
        print('  -', h[0], '|', h[1], '|', h[2])
    print('warn hits:', len(warns))
    for w in warns[:15]:
        print('  ~', w[0], '|', w[1])


if __name__ == '__main__':
    main()

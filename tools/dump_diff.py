# -*- coding: utf-8 -*-
"""导出指定条目的原文 / 改写文对照，供人工修补。"""
import io
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IDS = ['6-1-1', '9-2-4', '10-1-3', '10-3-2', '10-3-4', '10-4-3',
       '3-2-3', '5-3-4', '8-1-1', '8-1-2', '8-1-4', '8-2-1', '8-2-3', '8-2-4', '9-1-2']

CHAPTER_FILES = {}
for n in range(1, 11):
    CHAPTER_FILES[n] = ('data/detail/out/ch%d.json' % n, 'data/rewrite/detail-ch%d.json' % n)


def load(p):
    with io.open(os.path.join(ROOT, p), encoding='utf-8') as f:
        return json.load(f)


def text_of(it):
    parts = ['LEAD: ' + (it.get('lead') or ''), 'PRINCIPLE: ' + (it.get('principle') or ''),
             'EXAMPLE: ' + (it.get('example') or ''), 'TAKEAWAY: ' + (it.get('takeaway') or '')]
    for i, st in enumerate(it.get('steps') or []):
        parts.append('STEP%d: %s' % (i + 1, json.dumps(st, ensure_ascii=False)))
    for i, m in enumerate(it.get('mistakes') or []):
        parts.append('MIST%d: %s' % (i + 1, json.dumps(m, ensure_ascii=False)))
    return '\n'.join(parts)


def nums(s):
    return re.findall(r'\d+(?:\.\d+)?', s)


out = []
for i in IDS:
    ch = int(i.split('-')[0])
    o = load(CHAPTER_FILES[ch][0])
    n = load(CHAPTER_FILES[ch][1])
    oi = next(x for x in o['items'] if x['id'] == i)
    ni = next(x for x in n['items'] if x['id'] == i)
    missing = sorted(set(nums(text_of(oi))) - set(nums(text_of(ni))))
    out.append('=' * 70)
    out.append('ID %s  missing=%s' % (i, missing))
    out.append('--- ORIGINAL ---')
    out.append(text_of(oi))
    out.append('--- REWRITTEN ---')
    out.append(text_of(ni))

with io.open(os.path.join(ROOT, 'data/rewrite/_diff.txt'), 'w', encoding='utf-8', newline='\n') as f:
    f.write('\n'.join(out))
print('written', len(IDS))

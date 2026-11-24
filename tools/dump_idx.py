# -*- coding: utf-8 -*-
"""导出指定的首页条目原文 / 改写文对照。"""
import io
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IDS = ['6-1-1', '9-2-4', '10-1-3', '10-3-2', '10-3-4', '10-4-3']


def load(p):
    with io.open(os.path.join(ROOT, p), encoding='utf-8') as f:
        return json.load(f)


out = []
for i in IDS:
    ch = i.split('-')[0]
    src = {'1': 'data/ch1-3.json', '2': 'data/ch1-3.json', '3': 'data/ch1-3.json',
           '4': 'data/ch4-7.json', '5': 'data/ch4-7.json', '6': 'data/ch4-7.json', '7': 'data/ch4-7.json',
           '8': 'data/ch8-10.json', '9': 'data/ch8-10.json', '10': 'data/ch8-10.json'}[ch]
    d = load(src)
    new = load('data/rewrite/index-ch%s.json' % ch)
    old_item = None
    for c in d['chapters']:
        for s in c['sections']:
            for it in s['items']:
                if it['id'] == i:
                    old_item = it
    new_item = None
    for s in new['sections']:
        for it in s['items']:
            if it['id'] == i:
                new_item = it
    out.append('=' * 60)
    out.append('ID %s  old_len=%d new_len=%d' % (i, len(old_item['text']), len(new_item['text'])))
    out.append('OLD: ' + old_item['text'])
    out.append('NEW: ' + new_item['text'])

with io.open(os.path.join(ROOT, 'data/rewrite/_idxdiff.txt'), 'w', encoding='utf-8', newline='\n') as f:
    f.write('\n'.join(out))
print('ok')

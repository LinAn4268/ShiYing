# -*- coding: utf-8 -*-
"""为 faint / accent / 标签色挑选可达标（≥4.5）且不破坏气质的取值。"""
import sys
sys.stdout.reconfigure(encoding='utf-8')

def hx(s):
    s = s.lstrip('#')
    return tuple(int(s[i:i+2], 16) for i in (0, 2, 4))

def lum(c):
    def f(v):
        v /= 255
        return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2])

def cr(a, b):
    l1, l2 = lum(hx(a)), lum(hx(b))
    return (max(l1, l2) + 0.05) / (min(l1, l2) + 0.05)

cases = [
    # (名称, 前景, [背景...])
    ('paper.faint', ['#8a7c6b', '#857767', '#807263'], ['#f7f2e8', '#fffdf7', '#faf4e8']),
    ('paper.dark.faint', ['#a2957f', '#9d8f7d', '#a89a86'], ['#1b1713', '#26211a', '#2e2820']),
    ('paper.tag-theory', ['#556880', '#526479', '#4f6175'], ['#eef1f4']),
    ('cinema.faint', ['#83868f', '#7f838c', '#7b7f88'], ['#f2f1ee', '#ffffff', '#f7f7f4']),
    ('cinema.accent', ['#8b6515', '#8a6110', '#7f5a10'], ['#f2f1ee', '#ffffff', '#f7f7f4', '#f3e8cd']),
    ('cinema.dark.faint', ['#868b95', '#8a8f99', '#7f848e'], ['#0b0c0f', '#14161b', '#191c22']),
    ('grid.faint', ['#6f888d', '#6b8489', '#678085'], ['#f3f8f7', '#ffffff', '#f4fbfa']),
    ('grid.accent', ['#17706a', '#166b64', '#156660'], ['#f3f8f7', '#ffffff', '#f4fbfa', '#d7efeb']),
    ('grid.tag-tip', ['#7d5f12', '#795c10', '#75590f'], ['#fbf0d6']),
    ('grid.dark.faint', ['#78958f', '#7c998f', '#7a978f'], ['#0f1a1b', '#182a2c', '#1d3234']),
]

for name, cands, bgs in cases:
    print('\n' + name)
    for c in cands:
        vals = [(b, round(cr(c, b), 2)) for b in bgs]
        ok = all(v >= 4.5 for _, v in vals)
        print('  %s %-9s %s %s' % ('OK ' if ok else 'no ', c, vals, '' if ok else '<-- below 4.5'))

# -*- coding: utf-8 -*-
"""计算三套模板浅/暗下关键前景/背景的对比度，标出不足 4.5 的小字组合。"""
import sys
sys.stdout.reconfigure(encoding='utf-8')

def hx(s):
    s = s.lstrip('#')
    return tuple(int(s[i:i+2], 16) for i in (0, 2, 4))

def lum(c):
    def f(v):
        v /= 255
        return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    r, g, b = c
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)

def cr(a, b):
    l1, l2 = lum(a), lum(b)
    return (max(l1, l2) + 0.05) / (min(l1, l2) + 0.05)

themes = {
 'paper light': dict(bg='#f7f2e8', panel='#fffdf7', text='#2f2923', muted='#6d6357', faint='#9b8d7c',
                     do_fg='#9c4730', do_bg='#f6e2d9', theory_fg='#5e7186', theory_bg='#eef1f4',
                     tip_fg='#7c6a3c', tip_bg='#f4eeda', accent='#b0503a'),
 'paper dark': dict(bg='#1b1713', panel='#26211a', text='#e8ded0', muted='#b4a795', faint='#877a6a',
                    do_fg='#eaa88f', do_bg='#34211a', theory_fg='#a7bdd6', theory_bg='#1e2833',
                    tip_fg='#d6c18a', tip_bg='#2c2718', accent='#e08a6b'),
 'cinema light': dict(bg='#f2f1ee', panel='#ffffff', text='#23252b', muted='#6b6e77', faint='#9a9da4',
                      do_fg='#a87b22', do_bg='#f7f7f4', theory_fg='#6d7079', theory_bg='#f7f7f4',
                      tip_fg='#5f646d', tip_bg='#f7f7f4', accent='#a87b22'),
 'cinema dark': dict(bg='#0b0c0f', panel='#14161b', text='#e4e6ea', muted='#9a9ea7', faint='#6b6f78',
                     do_fg='#d8a53f', do_bg='#14161b', theory_fg='#8f95a1', theory_bg='#14161b',
                     tip_fg='#9aa0ab', tip_bg='#14161b', accent='#d8a53f'),
 'grid light': dict(bg='#f3f8f7', panel='#ffffff', text='#1f3033', muted='#5b7176', faint='#8aa1a5',
                    do_fg='#126e63', do_bg='#d9f0ec', theory_fg='#41688c', theory_bg='#e8f0f8',
                    tip_fg='#8a6a17', tip_bg='#fbf0d6', accent='#1f8a7e'),
 'grid dark': dict(bg='#0f1a1b', panel='#182a2c', text='#d9ebe8', muted='#9ab8b5', faint='#74938f',
                   do_fg='#7fe0cd', do_bg='#17352f', theory_fg='#9dc3d8', theory_bg='#1b2c33',
                   tip_fg='#dcc685', tip_bg='#2e2812', accent='#5fd0c0'),
}

for name, t in themes.items():
    print('\n==', name)
    checks = [
        ('text/bg', t['text'], t['bg'], 4.5),
        ('muted/bg', t['muted'], t['bg'], 4.5),
        ('muted/panel', t['muted'], t['panel'], 4.5),
        ('faint/bg', t['faint'], t['bg'], 4.5),
        ('faint/panel', t['faint'], t['panel'], 4.5),
        ('accent/bg', t['accent'], t['bg'], 4.5),
        ('tag-do', t['do_fg'], t['do_bg'], 4.5),
        ('tag-theory', t['theory_fg'], t['theory_bg'], 4.5),
        ('tag-tip', t['tip_fg'], t['tip_bg'], 4.5),
    ]
    for label, fg, bg, need in checks:
        v = cr(hx(fg), hx(bg))
        flag = 'OK ' if v >= need else 'FAIL'
        print('  %s %-12s %-8s on %-8s %.2f' % (flag, label, fg, bg, v))

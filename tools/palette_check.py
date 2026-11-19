# -*- coding: utf-8 -*-
"""主题配色对比度体检：给出每个主题（浅/暗）需要达标的前景/背景对，列出不达标项。

用法：python tools/palette_check.py ink mono
"""
import sys, json

sys.stdout.reconfigure(encoding='utf-8')


def hx(s):
    s = s.lstrip('#')
    return tuple(int(s[i:i + 2], 16) for i in (0, 2, 4))


def lum(c):
    def f(v):
        v /= 255
        return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2])


def cr(a, b):
    l1, l2 = lum(hx(a)), lum(hx(b))
    return (max(l1, l2) + 0.05) / (min(l1, l2) + 0.05)


PALETTES = {
    # ---- 水墨 ----
    'ink': {
        'light': dict(bg='#f4f2ec', panel='#fbfaf6', panel2='#f1ede3', text='#252b2c', strong='#111617',
                      muted='#4e5657', faint='#626a6c', accent='#2f5d57', onaccent='#fbfaf6',
                      soft='#dfeae5', line='#ddd8cc',
                      tagT=('#eef2f0', '#4d6b66', '#d8e3df'), tagD=('#f0e7dd', '#8a4a33', '#e2d2c3'),
                      tagP=('#f2efe2', '#6f6234', '#e3ddc4')),
        'dark': dict(bg='#131719', panel='#1a2022', panel2='#202729', text='#dde5e3', strong='#f1f7f5',
                     muted='#a8b4b1', faint='#93a09d', accent='#7fb8ac', onaccent='#0c1513',
                     soft='#22322f', line='#2b3335',
                     tagT=('#1b272a', '#9dc0ba', '#2a3a3d'), tagD=('#33221c', '#e0a48d', '#4a332b'),
                     tagP=('#2a2718', '#d3c083', '#3f3924')),
    },
    # ---- 银盐 ----
    'mono': {
        'light': dict(bg='#f4f4f4', panel='#ffffff', panel2='#f7f7f7', text='#1b1b1b', strong='#000000',
                      muted='#525252', faint='#6a6a6a', accent='#1f1f1f', onaccent='#ffffff',
                      soft='#e9e9e9', line='#dcdcdc',
                      tagT=('#efefef', '#4d4d4d', '#dedede'), tagD=('#ececec', '#3d3d3d', '#dcdcdc'),
                      tagP=('#f2f2f2', '#5a5a5a', '#e2e2e2')),
        'dark': dict(bg='#0d0d0e', panel='#161617', panel2='#1c1c1d', text='#e9e9e9', strong='#ffffff',
                     muted='#b0b0b0', faint='#949494', accent='#f0f0f0', onaccent='#111111',
                     soft='#242426', line='#2b2b2c',
                     tagT=('#1e1e1f', '#bfbfbf', '#333333'), tagD=('#262626', '#e0e0e0', '#3a3a3a'),
                     tagP=('#242422', '#cfcfcf', '#3a3a39')),
    },
}


def check(name, p):
    bad = []
    def pair(label, fg, bg, need=4.5):
        r = cr(fg, bg)
        if r < need:
            bad.append('%s %.2f (%s on %s)' % (label, r, fg, bg))
    pair('text/bg', p['text'], p['bg'])
    pair('text/panel', p['text'], p['panel'])
    for bgk in ('bg', 'panel', 'panel2'):
        pair('muted/' + bgk, p['muted'], p[bgk])
        pair('faint/' + bgk, p['faint'], p[bgk])
        pair('accent/' + bgk, p['accent'], p[bgk])
    pair('on-accent/accent', p['onaccent'], p['accent'])
    pair('accent/soft', p['accent'], p['soft'])
    for i, (bg, fg, bd) in enumerate((p['tagT'], p['tagD'], p['tagP'])):
        pair('tag%d' % i, fg, bg)
    return bad


if __name__ == '__main__':
    names = sys.argv[1:] or list(PALETTES)
    total = 0
    for n in names:
        for mode in ('light', 'dark'):
            bad = check(n + '.' + mode, PALETTES[n][mode])
            total += len(bad)
            print('%s.%s: %s' % (n, mode, 'OK' if not bad else 'FAIL'))
            for b in bad:
                print('   ', b)
    print('PROBLEMS' if total else 'ALL OK')

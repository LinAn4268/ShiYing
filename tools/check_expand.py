# -*- coding: utf-8 -*-
"""检查 data/expand/*.json 相对原文的扩写倍数，输出逐字段表格。

用法: python tools/check_expand.py [chN ...]
- 不传参数 = 检查全部已有文件
- 只统计「可扩字段」：index 的 text/summary/practice；detail 的 lead/principle/steps.desc/mistakes/example/takeaway/case.*
- 目标区间 [1.45, 2.45]，超出记 WARN，低于 1.45 记 FAIL
"""
import json, io, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LO, HI = 1.45, 2.45


def load(p):
    with io.open(p, encoding='utf-8') as f:
        return json.load(f)


def L(x):
    return len(x) if isinstance(x, str) else 0


def ratio(old, new):
    if L(old) == 0:
        return None
    return L(new) / float(L(old))


def step_desc(x):
    if isinstance(x, dict):
        return x.get('desc') or x.get('action') or ''
    return x if isinstance(x, str) else ''


def main(argv):
    only = set(argv)
    fails, warns, lines = 0, 0, []

    # index
    orig = {}
    for f in ['data/ch1-3.json', 'data/ch4-7.json', 'data/ch8-10.json']:
        for c in load(os.path.join(ROOT, f))['chapters']:
            orig[c['id']] = c

    for n in range(1, 11):
        cid = 'ch%d' % n
        if only and cid not in only:
            continue
        p = os.path.join(ROOT, 'data/expand/index-%s.json' % cid)
        if not os.path.exists(p):
            lines.append('MISSING index-%s.json' % cid)
            continue
        new = load(p)
        old = orig[cid]
        rows = []
        for fld in ('summary', 'practice'):
            r = ratio(old.get(fld), new.get(fld))
            rows.append((cid + '.' + fld, r))
        om = {it['id']: it for s in old['sections'] for it in s['items']}
        for s in new['sections']:
            for it in s['items']:
                o = om.get(it['id'])
                if o:
                    rows.append((it['id'] + '.text', ratio(o.get('text'), it.get('text'))))
        lines.append('--- index %s ---' % cid)
        for tag, r in rows:
            if r is None:
                continue
            flag = ''
            if r < LO:
                flag = ' FAIL'
                fails += 1
            elif r > HI:
                flag = ' WARN'
                warns += 1
            lines.append('  %-14s %.2f%s' % (tag, r, flag))

    # detail
    for n in range(1, 11):
        cid = 'ch%d' % n
        if only and cid not in only:
            continue
        p = os.path.join(ROOT, 'data/expand/detail-%s.json' % cid)
        if not os.path.exists(p):
            lines.append('MISSING detail-%s.json' % cid)
            continue
        new = load(p)
        old = load(os.path.join(ROOT, 'data/detail/out/%s.json' % cid))
        om = {it['id']: it for it in old['items']}
        lines.append('--- detail %s ---' % cid)
        for it in new['items']:
            o = om.get(it['id'])
            if not o:
                continue
            for fld in ('lead', 'principle', 'example', 'takeaway'):
                r = ratio(o.get(fld), it.get(fld))
                if r is None:
                    continue
                flag = ''
                if r < LO:
                    flag = ' FAIL'
                    fails += 1
                elif r > HI:
                    flag = ' WARN'
                    warns += 1
                lines.append('  %-14s %-9s %.2f%s' % (it['id'], fld, r, flag))
            for fld in ('steps', 'mistakes'):
                for i, (a, b) in enumerate(zip(o.get(fld) or [], it.get(fld) or [])):
                    if fld == 'steps':
                        ra, rb = step_desc(a), step_desc(b)
                    else:
                        ra, rb = a, b
                    r = ratio(ra, rb)
                    if r is None:
                        continue
                    flag = ''
                    if r < LO:
                        flag = ' FAIL'
                        fails += 1
                    elif r > HI:
                        flag = ' WARN'
                        warns += 1
                    lines.append('  %-14s %s[%d]  %.2f%s' % (it['id'], fld, i, r, flag))
            if isinstance(o.get('case'), dict) and isinstance(it.get('case'), dict):
                for fld in ('scene', 'setup', 'why', 'note'):
                    r = ratio(o['case'].get(fld), it['case'].get(fld))
                    if r is None:
                        continue
                    flag = ''
                    if r < LO:
                        flag = ' FAIL'
                        fails += 1
                    elif r > HI:
                        flag = ' WARN'
                        warns += 1
                    lines.append('  %-14s case.%-6s %.2f%s' % (it['id'], fld, r, flag))

    print('\n'.join(lines))
    print('\nSUMMARY: fails=%d warns=%d (target %.2f-%.2f)' % (fails, warns, LO, HI))
    return 1 if fails else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))

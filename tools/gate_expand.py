# -*- coding: utf-8 -*-
"""扩写交稿门禁：按章给出 PASS / FAIL。

用法: python tools/gate_expand.py ch3 [ch5 ...]   （不传参数 = 全部）

判定口径（对「整体 1.5–2 倍」的合理落地）：
- 首页 text 字段整体倍数 >= 1.50 且 <= 2.60
- 详情可扩字段整体倍数 >= 1.50 且 <= 2.60
- 单个字段倍数 >= 1.15（杜绝原文照抄、完全没扩的字段）
- 20 个文件齐全（index-chN + detail-chN）
结构硬约束（id/title/条数/数字/段落数/case）由 tools/merge_expand.py 负责。
"""
import json, io, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IDX_MIN, IDX_MAX = 1.50, 2.60
DET_MIN, DET_MAX = 1.50, 2.60
FIELD_MIN = 1.15


def load(p):
    with io.open(p, encoding='utf-8') as f:
        return json.load(f)


def L(x):
    return len(x) if isinstance(x, str) else 0


def sd(x):
    return (x.get('desc') or x.get('action') or '') if isinstance(x, dict) else (x if isinstance(x, str) else '')


def fields(it):
    r = {}
    for f in ('lead', 'principle', 'example', 'takeaway'):
        r[f] = it.get(f, '')
    for f in ('steps', 'mistakes'):
        for i, x in enumerate(it.get(f) or []):
            r['%s[%d]' % (f, i)] = sd(x) if f == 'steps' else x
    c = it.get('case')
    if isinstance(c, dict):
        for f in ('scene', 'setup', 'why', 'note'):
            r['case.' + f] = c.get(f, '')
    return r


def check(n):
    tag = 'ch%d' % n
    pi = os.path.join(ROOT, 'data/expand/index-%s.json' % tag)
    pd = os.path.join(ROOT, 'data/expand/detail-%s.json' % tag)
    errs = []

    # index
    old_ch = None
    for f in ('data/ch1-3.json', 'data/ch4-7.json', 'data/ch8-10.json'):
        for c in load(os.path.join(ROOT, f))['chapters']:
            if c['id'] == tag:
                old_ch = c
    if not os.path.exists(pi):
        errs.append('MISSING index-%s.json' % tag)
        ir = irmin = 0.0
    else:
        new = load(pi)
        om = {it['id']: it['text'] for s in old_ch['sections'] for it in s['items']}
        pairs = [(om[it['id']], it['text']) for s in new['sections'] for it in s['items'] if it['id'] in om]
        to = sum(L(a) for a, b in pairs)
        tn = sum(L(b) for a, b in pairs)
        ir = tn / float(max(1, to))
        irmin = min((L(b) / float(max(1, L(a))) for a, b in pairs), default=0)
        if not (IDX_MIN <= ir <= IDX_MAX):
            errs.append('index composite %.2f 不在 [%.2f,%.2f]' % (ir, IDX_MIN, IDX_MAX))
        low = [it['id'] for s in new['sections'] for it in s['items']
               if it['id'] in om and L(it['text']) / float(max(1, L(om[it['id']]))) < FIELD_MIN]
        if low:
            errs.append('index text 未扩字段 %d 个: %s' % (len(low), ','.join(low[:8])))

    # detail
    if not os.path.exists(pd):
        errs.append('MISSING detail-%s.json' % tag)
        dr = drmin = 0.0
    else:
        new = load(pd)
        old = load(os.path.join(ROOT, 'data/detail/out/%s.json' % tag))
        om = {it['id']: it for it in old['items']}
        to = tn = 0
        lows = []
        for it in new['items']:
            o = om.get(it['id'])
            if not o:
                continue
            fo, fn = fields(o), fields(it)
            for k in fo:
                if k not in fn or L(fo[k]) == 0:
                    continue
                r = L(fn[k]) / float(L(fo[k]))
                to += L(fo[k]); tn += L(fn[k])
                if r < FIELD_MIN:
                    lows.append('%s.%s=%.2f' % (it['id'], k, r))
        dr = tn / float(max(1, to))
        drmin = min((float(x.rsplit('=', 1)[1]) for x in lows), default=99)
        if not (DET_MIN <= dr <= DET_MAX):
            errs.append('detail composite %.2f 不在 [%.2f,%.2f]' % (dr, DET_MIN, DET_MAX))
        if lows:
            errs.append('detail 未扩字段 %d 个: %s' % (len(lows), ','.join(lows[:8])))

    verdict = 'PASS' if not errs else 'FAIL'
    print('%s %-5s index=%.2f(min %.2f) detail=%.2f  %s' %
          (tag, verdict, ir, irmin, dr, ' | '.join(errs)))
    return not errs


def main(argv):
    ns = [int(a[2:]) for a in argv if a.startswith('ch')] or list(range(1, 11))
    ok = 0
    for n in ns:
        ok += 1 if check(n) else 0
    print('\n%d/%d chapters PASS' % (ok, len(ns)))
    return 0 if ok == len(ns) else 1


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))

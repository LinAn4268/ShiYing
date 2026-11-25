# -*- coding: utf-8 -*-
"""把 data/expand/*.json 的扩写文案合并回站点数据，并做完整性校验。

扩写校验（区别于 merge_rewrite.py 的改写校验）：
- 结构/元信息/条数/principle 段落数 逐项不变；
- 数字（参数）只增不减：原文每个数字必须仍出现在扩写文本中；
- case 只在原本有 case 的条目上出现，且字段齐全；
- 各字段长度达到原文的 1.5–2 倍（软警告，不硬失败）；introduction 保持原文。
"""
import json
import io
import os
import re
import shutil
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX_FILES = ['data/ch1-3.json', 'data/ch4-7.json', 'data/ch8-10.json']
OUT = os.path.join(ROOT, 'data', 'expand')
BACKUP = os.path.join(OUT, '_backup')

LOW, HIGH = 1.4, 2.3   # 软警告区间：低于 LOW 或高于 HIGH 就提示


def load(p):
    with io.open(os.path.join(ROOT, p), encoding='utf-8') as f:
        return json.load(f)


def dump(p, obj):
    with io.open(os.path.join(ROOT, p), 'w', encoding='utf-8', newline='\n') as f:
        json.dump(obj, f, ensure_ascii=False, indent=1)
        f.write('\n')


def nums(s):
    return set(re.findall(r'\d+(?:\.\d+)?', s or ''))


def slen(s):
    return len(s) if isinstance(s, str) else 0


def text_of(detail_item):
    """只统计会参与扩写的字段（lead/principle/example/takeaway/steps/mistakes/case）。"""
    parts = [detail_item.get('lead', ''), detail_item.get('principle', ''),
             detail_item.get('example', ''), detail_item.get('takeaway', '')]
    for k in ('steps', 'mistakes'):
        for x in detail_item.get(k) or []:
            parts.append(json.dumps(x, ensure_ascii=False) if not isinstance(x, str) else x)
    c = detail_item.get('case')
    if isinstance(c, dict):
        parts.append(json.dumps(c, ensure_ascii=False))
    return '\n'.join(parts)


def check_ratio(tag, old, new, warns):
    if slen(old) == 0:
        return
    r = slen(new) / float(slen(old))
    if r < LOW or r > HIGH:
        warns.append('%s 长度比 %.2f (%.0f -> %.0f)' % (tag, r, slen(old), slen(new)))


def main():
    errors = []
    warns = []
    stats = []
    if not os.path.isdir(BACKUP):
        os.makedirs(BACKUP)

    # 先在内存里完成所有校验，任何错误都不写回任何文件（避免半合并污染数据）
    index_writes = []   # (src, data)
    detail_writes = []  # (src, data)

    # ---------- 首页章节数据 ----------
    chapters_new = {}
    for n in range(1, 11):
        p = os.path.join(OUT, 'index-ch%d.json' % n)
        if not os.path.exists(p):
            errors.append('缺少 index-ch%d.json' % n)
            continue
        with io.open(p, encoding='utf-8') as f:
            chapters_new['ch%d' % n] = json.load(f)

    for src in INDEX_FILES:
        data = load(src)
        changed = False
        for ch in data['chapters']:
            new = chapters_new.get(ch['id'])
            if not new:
                continue
            if new.get('title') != ch['title']:
                errors.append('章标题被改动: %s' % ch['id'])
            if len(new.get('sections', [])) != len(ch['sections']):
                errors.append('%s 小节数不一致' % ch['id'])
                continue
            for s_old, s_new in zip(ch['sections'], new['sections']):
                if s_old['id'] != s_new['id'] or s_old['title'] != s_new['title']:
                    errors.append('%s 小节结构被改动' % ch['id'])
                    continue
                if s_old.get('kind') != s_new.get('kind'):
                    errors.append('%s/%s kind 被改动' % (ch['id'], s_old['id']))
                if len(s_old['items']) != len(s_new.get('items', [])):
                    errors.append('%s/%s 条目数不一致' % (ch['id'], s_old['id']))
                    continue
                for i_old, i_new in zip(s_old['items'], s_new['items']):
                    if i_old['id'] != i_new.get('id') or i_old['title'] != i_new.get('title'):
                        errors.append('条目标题被改动: %s' % i_old['id'])
                        continue
                    if i_old.get('tag') != i_new.get('tag'):
                        errors.append('tag 被改动: %s' % i_old['id'])
                        continue
                    t = (i_new.get('text') or '').strip()
                    miss = nums(i_old.get('text')) - nums(t)
                    if miss:
                        errors.append('%s text 丢失数字 %s' % (i_old['id'], sorted(miss)))
                    check_ratio('%s.text' % i_old['id'], i_old.get('text'), t, warns)
                    i_old['text'] = t
                    changed = True
            # intro 不扩写，保持原文
            if (new.get('intro') or '').strip() != (ch['intro'] or '').strip():
                warns.append('%s intro 被改动（将保留原文）' % ch['id'])
            for fld in ('summary', 'practice'):
                nv = (new.get(fld) or '').strip()
                miss = nums(ch.get(fld)) - nums(nv)
                if miss:
                    errors.append('%s %s 丢失数字 %s' % (ch['id'], fld, sorted(miss)))
                check_ratio('%s.%s' % (ch['id'], fld), ch.get(fld), nv, warns)
                ch[fld] = nv
        if changed:
            index_writes.append((src, data))

    # ---------- 详解数据 ----------
    for n in range(1, 11):
        src = 'data/detail/out/ch%d.json' % n
        p = os.path.join(OUT, 'detail-ch%d.json' % n)
        if not os.path.exists(p):
            errors.append('缺少 detail-ch%d.json' % n)
            continue
        with io.open(p, encoding='utf-8') as f:
            new = json.load(f)
        data = load(src)
        if new.get('chapterId') != data.get('chapterId'):
            errors.append('detail ch%d chapterId 不一致' % n)
        if new.get('chapterTitle') != data.get('chapterTitle'):
            errors.append('detail ch%d chapterTitle 不一致' % n)
        if len(new.get('items', [])) != len(data['items']):
            errors.append('detail ch%d 条数不一致' % n)
            continue
        for o, nw in zip(data['items'], new['items']):
            oid = o['id']
            for k in ('id', 'title', 'tag', 'section'):
                if o.get(k) != nw.get(k):
                    errors.append('detail %s 的 %s 被改动' % (oid, k))
            for k in ('steps', 'mistakes', 'keywords'):
                if len(o.get(k) or []) != len(nw.get(k) or []):
                    errors.append('detail %s 的 %s 条数变化' % (oid, k))
                elif k == 'keywords':
                    if [str(x) for x in (o.get(k) or [])] != [str(x) for x in (nw.get(k) or [])]:
                        errors.append('detail %s 的 keywords 内容被改动' % oid)
            # steps 结构：dict 的 title/params 必须逐字不变，只许扩 desc；字符串则原样保留条数
            if isinstance(o.get('steps'), list) and isinstance(nw.get('steps'), list):
                for si, (sa, sb) in enumerate(zip(o['steps'], nw['steps'])):
                    if isinstance(sa, dict) and isinstance(sb, dict):
                        # 不同章的 dict 步骤键名不同（title/desc 或 name/action），
                        # 只有描述键允许扩写，其余键（title/name/params 等）逐字不动。
                        for k in sa:
                            if k in ('desc', 'action'):
                                continue
                            if (sa.get(k) or '') != (sb.get(k) or ''):
                                errors.append('detail %s steps[%d].%s 被改动' % (oid, si, k))
                    elif isinstance(sa, str) and isinstance(sb, str):
                        pass
                    else:
                        errors.append('detail %s steps[%d] 结构变化' % (oid, si))
            # principle 段落数不变
            op = (o.get('principle') or '')
            np = (nw.get('principle') or '')
            if op.count('\n') != np.count('\n'):
                errors.append('detail %s principle 段落数变化' % oid)
            # case 存在性必须一致
            o_case = isinstance(o.get('case'), dict) and bool((o['case'].get('scene') or '').strip())
            n_case = isinstance(nw.get('case'), dict) and bool((nw['case'].get('scene') or '').strip())
            if o_case != n_case:
                errors.append('detail %s case 存在性变化' % oid)
            # 数字不丢失
            old_nums = nums(text_of(o))
            new_nums = nums(text_of(nw))
            miss = old_nums - new_nums
            if miss:
                errors.append('detail %s 丢失数字 %s' % (oid, sorted(miss)))
            # 长度比（软警告）
            for fld in ('lead', 'principle', 'example', 'takeaway'):
                check_ratio('detail %s.%s' % (oid, fld), o.get(fld), nw.get(fld), warns)
            for fld in ('steps', 'mistakes'):
                for a, b in zip(o.get(fld) or [], nw.get(fld) or []):
                    if isinstance(a, dict) and isinstance(b, dict):
                        for dk in ('desc', 'action'):
                            if dk in a:
                                check_ratio('detail %s.%s.%s' % (oid, fld, dk), a.get(dk), b.get(dk), warns)
                    else:
                        check_ratio('detail %s.%s' % (oid, fld), a, b, warns)
            if o_case:
                for fld in ('scene', 'setup', 'why', 'note'):
                    check_ratio('detail %s.case.%s' % (oid, fld), o['case'].get(fld), nw['case'].get(fld), warns)
            # 合并（intro 不扩写，保留原文）
            for fld in ('lead', 'principle', 'example', 'takeaway'):
                if fld in nw and nw[fld] is not None:
                    o[fld] = nw[fld].strip() if isinstance(nw[fld], str) else nw[fld]
            for fld in ('steps', 'mistakes'):
                if fld in nw and nw[fld] is not None:
                    o[fld] = nw[fld]
            if o_case:
                o['case'] = {k: (nw['case'].get(k) or '').strip() for k in ('scene', 'setup', 'why', 'note')}
        detail_writes.append((src, data))
        stats.append((n, len(data['items'])))

    if errors:
        print('ERRORS %d' % len(errors))
        for e in errors[:60]:
            print(' -', e)
        print('未写回任何文件（数据保持原样）')
        sys.exit(1)

    # 全部校验通过后才一次性落盘
    for src, data in index_writes + detail_writes:
        shutil.copyfile(os.path.join(ROOT, src), os.path.join(BACKUP, os.path.basename(src)))
        dump(src, data)

    print('merged chapters: %d, detail chapters: %d' % (len(chapters_new), len(stats)))
    if warns:
        print('WARNINGS %d（长度比超出 %.1f–%.1f 区间，需人工判断）' % (len(warns), LOW, HIGH))
        for w in warns[:60]:
            print(' -', w)
    if errors:
        print('ERRORS %d' % len(errors))
        for e in errors[:60]:
            print(' -', e)
        sys.exit(1)
    print('ALL CHECKS PASSED')


if __name__ == '__main__':
    main()

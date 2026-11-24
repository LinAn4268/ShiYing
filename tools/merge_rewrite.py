# -*- coding: utf-8 -*-
"""把 data/rewrite/*.json 的改写文案合并回站点数据，并做完整性校验。"""
import json
import io
import os
import re
import shutil
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX_FILES = ['data/ch1-3.json', 'data/ch4-7.json', 'data/ch8-10.json']
OUT = os.path.join(ROOT, 'data', 'rewrite')
BACKUP = os.path.join(OUT, '_backup')


def load(p):
    with io.open(os.path.join(ROOT, p), encoding='utf-8') as f:
        return json.load(f)


def dump(p, obj):
    with io.open(os.path.join(ROOT, p), 'w', encoding='utf-8', newline='\n') as f:
        json.dump(obj, f, ensure_ascii=False, indent=1)
        f.write('\n')


def nums(s):
    return re.findall(r'\d+(?:\.\d+)?', s or '')


def text_of(detail_item):
    """只统计会被改写的字段，case/keywords 属于原样保留内容，不参与比对。"""
    parts = [detail_item.get('lead', ''), detail_item.get('principle', ''),
             detail_item.get('example', ''), detail_item.get('takeaway', '')]
    for k in ('steps', 'mistakes'):
        for x in detail_item.get(k) or []:
            parts.append(json.dumps(x, ensure_ascii=False) if not isinstance(x, str) else x)
    return '\n'.join(parts)


def main():
    errors = []
    stats = []
    if not os.path.isdir(BACKUP):
        os.makedirs(BACKUP)

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
            if new['title'] != ch['title']:
                errors.append('章标题被改动: %s' % ch['id'])
            # 结构对照
            if len(new.get('sections', [])) != len(ch['sections']):
                errors.append('%s 小节数不一致' % ch['id'])
                continue
            for s_old, s_new in zip(ch['sections'], new['sections']):
                if s_old['id'] != s_new['id'] or s_old['title'] != s_new['title']:
                    errors.append('%s 小节结构被改动' % ch['id'])
                    continue
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
                    if not (85 <= len(t) <= 200):
                        errors.append('%s text 长度 %d' % (i_old['id'], len(t)))
                    miss = set(nums(i_old.get('text'))) - set(nums(t))
                    if miss:
                        errors.append('%s text 丢失数字 %s' % (i_old['id'], sorted(miss)))
                    i_old['text'] = t
                    changed = True
            ch['intro'] = (new.get('intro') or ch['intro']).strip()
            ch['summary'] = (new.get('summary') or ch['summary']).strip()
            ch['practice'] = (new.get('practice') or ch['practice']).strip()
            if not (75 <= len(ch['intro']) <= 130):
                errors.append('%s intro 长度 %d' % (ch['id'], len(ch['intro'])))
        if changed:
            shutil.copyfile(os.path.join(ROOT, src), os.path.join(BACKUP, os.path.basename(src)))
            dump(src, data)

    # ---------- 详解数据 ----------
    FIELDS = ['lead', 'principle', 'steps', 'mistakes', 'example', 'takeaway']
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
            for k in ('id', 'title', 'tag', 'section'):
                if o.get(k) != nw.get(k):
                    errors.append('detail %s 的 %s 被改动' % (o.get('id'), k))
            for k in ('steps', 'mistakes', 'keywords'):
                if len(o.get(k) or []) != len(nw.get(k) or []):
                    errors.append('detail %s 的 %s 条数变化' % (o.get('id'), k))
            if len((nw.get('lead') or '').strip()) < 30:
                errors.append('detail %s lead 过短' % o['id'])
            if len((nw.get('principle') or '').strip()) < 150:
                errors.append('detail %s principle 过短 %d' % (o['id'], len(nw.get('principle') or '')))
            old_nums = set(nums(text_of(o)))
            new_nums = set(nums(text_of(nw)))
            miss = old_nums - new_nums
            if miss:
                errors.append('detail %s 丢失数字 %s' % (o['id'], sorted(miss)))
            for k in FIELDS:
                if k in nw and nw[k] is not None:
                    o[k] = nw[k].strip() if isinstance(nw[k], str) else nw[k]
        shutil.copyfile(os.path.join(ROOT, src), os.path.join(BACKUP, os.path.basename(src)))
        dump(src, data)
        stats.append((n, len(data['items'])))

    print('merged chapters: %d, detail chapters: %d' % (len(chapters_new), len(stats)))
    if errors:
        print('ERRORS %d' % len(errors))
        for e in errors[:40]:
            print(' -', e)
        sys.exit(1)
    print('ALL CHECKS PASSED')


if __name__ == '__main__':
    main()

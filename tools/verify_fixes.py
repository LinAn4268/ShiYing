# -*- coding: utf-8 -*-
"""复检：确认本轮内容订正全部落地、无残留旧表述、无新增结构问题。"""
import io, json, os, re, sys

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.stdout.reconfigure(encoding='utf-8')

def rd(p):
    return json.loads(io.open(os.path.join(BASE, p), encoding='utf-8').read())

items = {}
for i in range(1, 12):
    for it in rd('data/detail/out/ch%d.json' % i)['items']:
        items[it['id']] = it

checks = []
def ck(name, cond, detail=''):
    checks.append((name, bool(cond), detail))

def txt(it):
    parts = [it.get('lead', ''), it.get('example', '')]
    if isinstance(it.get('principle'), str):
        parts.append(it['principle'])
    else:
        parts.extend(it.get('principle', []) if isinstance(it.get('principle'), list) else [])
    for k in ('takeaway',):
        parts.append(it.get(k, ''))
    for s in it.get('steps', []) or []:
        parts.append(s.get('desc', '') if isinstance(s, dict) else s)
    for m in it.get('mistakes', []) or []:
        parts.append(m.get('desc', '') if isinstance(m, dict) else m)
    c = it.get('case') or {}
    for k in ('scene', 'setup', 'why', 'note'):
        parts.append(c.get(k, ''))
    return '\n'.join(str(p) for p in parts)

ALL = '\n'.join(txt(it) for it in items.values())
CHAPTERS = ''
for fn in ('ch1-3.json', 'ch4-7.json', 'ch8-10.json', 'ch11.json'):
    d = rd('data/' + fn)
    for ch in d['chapters']:
        for sec in ch['sections']:
            for it in sec['items']:
                CHAPTERS += str(it.get('text', '')) + '\n'

# 1) 参数订正
ck('ND64→0.5 秒（9-1-2）', 'ND64 慢 6 档，1/125 秒就延长到约 0.5 秒' in txt(items['9-1-2']))
ck('ND64 不再写 2 秒', 'ND64 慢 6 档，1/125 秒就延长到约 2 秒' not in ALL)
ck('ISO100→0.4 秒（8-5-1）', '0.4 秒' in txt(items['8-5-1']))
ck('C2 预设 1/250（10-3-4）', '1/250 秒' in txt(items['10-3-4']) and '1/500 秒' not in txt(items['10-3-4']))
ck('M 档三档 8 倍（3-2-1）', '三档' in txt(items['3-2-1']) and '八倍' in txt(items['3-2-1']))
ck('光圈优先旧误表述清除', '光圈优先固定 f/8' not in txt(items['3-2-1']))

# 2) 术语订正
ck('相机白平衡反向（10-2-3）', '色温值调得越低，画面越偏冷' in txt(items['10-2-3']))
ck('旧「数值越低越暖」清除', '数值越低画面越暖' not in txt(items['10-2-3']))
ck('闪光四分之一功率（5-3-1）', '四分之一功率' in txt(items['5-3-1']))
ck('闪光「四分之一档」清除', '四分之一档' not in txt(items['5-3-1']))
ck('辅光控反差（5-3-2）', '辅光控反差' in txt(items['5-3-2']))
ck('辅光定柔和度清除', '辅光定柔和度' not in txt(items['5-3-2']))
ck('逆光术语（7-1-3）', '明亮的背景托着一张暗下来的脸' in txt(items['7-1-3']))

# 3) 章节正文术语
ck('章节正文前侧光（7-1-3）', '前侧光下人脸亮、背景暗' in CHAPTERS)
ck('章节正文逆光误表述清除', '逆光下人脸亮、背景暗' not in CHAPTERS)
ck('章节正文四分之一功率', '四分之一功率' in CHAPTERS and '四分之一档' not in CHAPTERS)
ck('章节正文白平衡反向', '相机上的色温值调得越低，画面越偏冷' in CHAPTERS)

# 4) 标点残留 / 重复
ck('无「。：」叠加', '。：' not in ALL and '。：' not in CHAPTERS)
ck('ch11 lead 不再逐字等于 example', sum(1 for i in range(1, 7) for j in range(1, 4)
    if items['11-%d-%d' % (i, j)]['lead'] == items['11-%d-%d' % (i, j)]['example']) == 0)
ck('ch11 lead 长度收敛', all(len(items['11-%d-%d' % (i, j)]['lead']) <= 60
    for i in range(1, 7) for j in range(1, 4)))
ck('takeaway 无连续重复短句', not re.search(r'(.{8,}?)\1', ''.join(items[k].get('takeaway', '') for k in items)))

# 5) 结构完整性
ck('条目总数 153', len(items) == 153, 'got %d' % len(items))
ck('id 唯一', len(set(items)) == 153)
ck('无占位符', not re.search(r'TODO|TBD|待补|XXX|占位', ALL + CHAPTERS))
ck('无字面 \\n', '\\n' not in ALL and '\\n' not in CHAPTERS)

# 6) 静态文案
BODY = io.open(os.path.join(BASE, 'src/body.html'), encoding='utf-8').read()
CASES = io.open(os.path.join(BASE, 'data/cases.json'), encoding='utf-8').read()
ck('正文 0 / 11', '0 / 11' in BODY)
ck('正文 153 条', '一百五十三条要点' in BODY)
ck('案例来源说明 153 条', '153 条' in CASES)

passed = sum(1 for _, ok, _ in checks if ok)
failed = [name for name, ok, _ in checks if not ok]
print('复检：%d/%d 通过' % (passed, len(checks)))
for name, ok, detail in checks:
    print(('PASS ' if ok else 'FAIL ') + name + ((' | ' + detail) if detail and not ok else ''))
if failed:
    print('未通过：', failed)
    sys.exit(1)
print('ALL CHECKS PASSED')

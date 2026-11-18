# -*- coding: utf-8 -*-
"""为正文偏短的条目补一段实操向原理说明，使其不少于 300 字。"""
import json, io, os, sys

sys.stdout.reconfigure(encoding='utf-8')
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data', 'detail', 'out')

ADD = {
    '2-1-3': '选机时先问自己拍什么：抓动态就看连拍速度与对焦性能，常拍风景更该关注像素与防抖，喜欢取景器还是翻折屏，则直接决定你更适合单反还是无反。',
    '2-2-4': '这三类镜头都属于专精工具，不必作为第一支镜头购买。先把手中已有的焦段用熟，再按真正遇到的题材补缺，才不会买回来闲置落灰。',
    '2-3-1': '挑选脚架要看承重与自重的比例，别让脚架比相机还沉；拍延时要能把云台锁死，想拍贴地低机位则优先可反向中轴的款式，用起来才顺手。',
    '2-3-3': '三件工具常叠加使用：闪光灯定下光源方向，反光板把漏掉的阴影补回来，柔光罩再决定光线的软硬。顺序对，效果就稳，光线杂乱时先做减法再谈加法。',
    '2-3-4': '把检查固定成习惯：出门前充电、格式化卡、看一眼传感器有没有灰，收工后立刻备份并把卡放回包里的固定格子，能省掉大半突发意外。',
    '4-1-3': '切换时留意对焦框有没有真的落在主体上，拍完放大回看是最可靠的验证方式，别只信相机给出的合焦提示，那只是它自己的判断。',
    '4-1-4': '手动对焦后一定要放大回看确认，取景器里“看起来清楚”往往并不可靠，尤其在像素高、景深浅的机身上，微小的偏差都会被放大成软焦。',
    '4-3-1': '能借力就别硬撑：靠墙、倚栏杆、把肘部架在固定物上，或者干脆蹲下降低重心，都比勉强站直更稳，稳定感是姿势而不是意志换来的。',
}

def prose(it):
    return sum(len(it.get(k, '')) for k in ('lead', 'principle', 'example', 'takeaway'))

changed = 0
for i in range(1, 11):
    p = os.path.join(OUT, 'ch%d.json' % i)
    d = json.load(io.open(p, encoding='utf-8'))
    hit = False
    for it in d['items']:
        extra = ADD.get(it['id'])
        if not extra:
            continue
        if extra in it['principle']:
            continue
        it['principle'] = it['principle'].rstrip('\n') + '\n' + extra
        hit = True
        changed += 1
        print('%s -> %d 字' % (it['id'], prose(it)))
    if hit:
        io.open(p, 'w', encoding='utf-8', newline='\n').write(
            json.dumps(d, ensure_ascii=False, indent=1) + '\n')

print('patched items:', changed)

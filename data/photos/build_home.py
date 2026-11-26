# -*- coding: utf-8 -*-
"""从已验证的 data/photos/detail.json 生成首页配图数据 data/photos/home.json。

每张图都是核验过直链、摄影师与来源页的 Pexels 免费可商用图片。
键 hero/ch1..ch10 对应首页 Hero 与各章配图；themes.* 对应外观面板主题卡。
"""
import io
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DETAIL = json.load(io.open(os.path.join(ROOT, 'data', 'photos', 'detail.json'), encoding='utf-8'))

# 首页各位置 -> 选用哪条已验证详解配图（按题材/画面描述匹配章节）
MAP = {
    'hero': '8-2-5',   # 马特洪峰日出与倒影湖
    'ch1': '1-1-1',    # 林间光柱
    'ch2': '2-1-3',    # 桌面单反
    'ch3': '3-2-2',    # 慢门瀑布
    'ch4': '4-2-1',    # 浅景深绿叶
    'ch5': '5-2-1',    # 阳光斜照进空房间
    'ch6': '6-1-1',    # 日落橘红与蓝
    'ch7': '7-3-1',    # 引导线与三分法
    'ch8': '8-1-1',    # 黄金时刻人像
    'ch9': '9-1-1',    # 高速公路光轨
    'ch10': '10-3-2',  # 三脚架拍日落
    'portrait': '8-1-1',   # 黄金时刻人像
    'landscape': '8-2-5',  # 马特洪峰日出
    'motion': '8-3-1',     # 跑道冲刺
    'food': '8-4-2',       # 寿司静物
    'night': '8-5-4',      # 银河夜空
    'theme.paper': '1-1-2',   # 晨光穿过枝叶
    'theme.cinema': '3-3-1',  # 夜间街头
    'theme.grid': '7-3-2',    # 玻璃幕墙倒影
    'theme.ink': '7-1-1',     # 雾中枯树极简风景
    'theme.mono': '8-5-4',    # 银河夜空
    # 作品赏析栏目 10 张（键 = cases.json 里的 item id）
    '1-1-1': '1-1-1', '5-1-3': '5-1-3', '7-2-1': '7-2-1',
    '8-4-2': '8-4-2', '9-1-1': '9-1-1', '8-1-1': '8-1-1',
    '7-3-2': '7-3-2', '4-2-2': '4-2-2', '8-3-1': '8-3-1',
    '8-5-4': '8-5-4',
}

# 沿用原来的章节说明文字（编辑性文案，与图片描述无关）
CAPS = {
    'ch1': '光先穿过树，再落进画面——摄影，从看见光开始。',
    'ch2': '机身、镜头、卡口：认识装备，是为了少被参数牵着走。',
    'ch3': '光圈、快门、ISO 是三道闸门，先弄懂它们如何互相牵制。',
    'ch4': '清楚不是「对准了」三个字，它由对焦、景深与稳定共同决定。',
    'ch5': '同一个地方，换一个时间，就是另一张照片。',
    'ch6': '颜色是画面的性格：冷暖一旦定下，情绪就定了大半。',
    'ch7': '把世界整理成一幅画：先建立秩序，再考虑打破它。',
    'ch8': '题材各有脾气：先认出它，再决定怎么拍。',
    'ch9': '把时间画进画面，是特殊技法最迷人的部分。',
    'ch10': '拍之前先看光、看路、看人——现场判断比器材更先到。',
    'portrait': '人像先解决「人在哪里、被什么光照着」，再谈焦段与虚化。',
    'landscape': '风光的时间成本占一半：等对光线，比换镜头更有效。',
    'motion': '动态题材考的是预判：快门速度决定凝固还是流动。',
    'food': '静物与美食：光比与背景干净度，往往比器材更决定成败。',
    'night': '弱光先求「稳」再求「亮」：三脚架与长曝光是地基。',
}

LABELS = {
    'hero': 'Pexels · 日出山野',
    'ch1': 'Pexels · 森林光线',
    'ch2': 'Pexels · 单反相机',
    'ch3': 'Pexels · 慢门水流',
    'ch4': 'Pexels · 浅景深',
    'ch5': 'Pexels · 窗边光线',
    'ch6': 'Pexels · 黄昏天空',
    'ch7': 'Pexels · 引导线构图',
    'ch8': 'Pexels · 黄金时刻',
    'ch9': 'Pexels · 光轨长曝',
    'ch10': 'Pexels · 现场判断',
    'portrait': 'Pexels · 黄金时刻人像',
    'landscape': 'Pexels · 山峦日出',
    'motion': 'Pexels · 跑道冲刺',
    'food': 'Pexels · 寿司静物',
    'night': 'Pexels · 银河夜空',
}


def cdn(pid, w):
    return 'https://images.pexels.com/photos/%d/pexels-photo-%d.jpeg?auto=compress&cs=tinysrgb&w=%d' % (pid, pid, w)


out = {}
for key, item_id in MAP.items():
    src = DETAIL[item_id]
    pid = int(src['id'])
    rec = {
        'id': pid,
        'src': cdn(pid, 1400),
        'srcset': cdn(pid, 640) + ' 640w, ' + cdn(pid, 1400) + ' 1400w',
        'page': src['page'],
        'ph': src['ph'],
        'alt': src['alt'],
        'item': item_id,
    }
    if key in CAPS:
        rec['cap'] = CAPS[key]
    if key in LABELS:
        rec['label'] = LABELS[key]
    out[key] = rec

path = os.path.join(ROOT, 'data', 'photos', 'home.json')
with io.open(path, 'w', encoding='utf-8', newline='\n') as fh:
    json.dump(out, fh, ensure_ascii=False, indent=1)
    fh.write('\n')
print('home.json: %d images' % len(out))

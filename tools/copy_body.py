import io

P = 'src/body.html'
s = io.open(P, encoding='utf-8').read()

REPL = [
    # 首屏
    ('<p class="subtitle">把光捡起来，把世界看清楚。<br>一份写给零基础者的摄影前期拍摄入门。</p>',
     '<p class="subtitle">把光捡起来，把世界看清楚。<br>写给第一次想认真按快门的人。</p>'),
    ('<p class="lede">不谈玄学，也不堆参数。十章内容从「看见」开始，把光、曝光、对焦、构图讲成可以判断的道理，再落到真实场景里怎么用。</p>',
     '<p class="lede">不谈玄学，也不背参数表。十章从「看见」讲起：光怎么落在人身上，曝光为什么差了半档，对焦该落在哪只眼睛。读完你会发现，很多废片不是手抖，是按下快门之前没想清楚。</p>'),
    ('<a class="btn btn-primary" href="#ch1">开始学习</a>',
     '<a class="btn btn-primary" href="#ch1">从第一章读起</a>'),
    ('<a class="btn btn-ghost" href="#toc" id="viewToc">查看目录</a>',
     '<a class="btn btn-ghost" href="#toc" id="viewToc">先看目录</a>'),
    # 学习路径
    ('<div class="path-step"><p class="k">STEP 01</p><h3>先懂原理</h3><p>知道光是怎样被记录下来的、曝光为什么会不准，遇到问题能说出原因，而不是碰运气。</p></div>',
     '<div class="path-step"><p class="k">STEP 01</p><h3>先懂原理</h3><p>先弄清光是怎么被记下来的、曝光为什么会偏。拍坏了能说出原因，比碰运气踏实。</p></div>'),
    ('<div class="path-step"><p class="k">STEP 02</p><h3>再练手感</h3><p>带着一个明确意图去拍，把「先想三件事」变成习惯，让原理长成肌肉记忆。</p></div>',
     '<div class="path-step"><p class="k">STEP 02</p><h3>再练手感</h3><p>每次按快门前先想三件事：拍谁、把它放在哪、光够不够。练到不用想，手就记住了。</p></div>'),
    ('<div class="path-step"><p class="k">STEP 03</p><h3>复盘积累</h3><p>记下场景、光线和参数，把每张废片归因到具体环节，慢慢长出自己的经验表。</p></div>',
     '<div class="path-step"><p class="k">STEP 03</p><h3>复盘积累</h3><p>拍完记两行：什么光、什么参数、哪里不满意。废片别急着删，翻回去看差的是哪一口气。</p></div>'),
    # 练习台横幅
    ('<span>在浏览器里拨光圈、快门、ISO 与白平衡，取景器和直方图会立刻给出结果。不会浪费快门，也不怕拍坏。</span>',
     '<span>光圈、快门、ISO、白平衡都能真拨，取景器和直方图当场给结果。不费快门，也拍不坏。</span>'),
    ('<span class="pb-go" aria-hidden="true">去练手 →</span>',
     '<span class="pb-go" aria-hidden="true">去拨一遍 →</span>'),
    # 空状态
    ('<p>拾影把全部要点都保留在目录里，换个说法再试一次。</p>',
     '<p>一百三十五条要点都还在目录里。换个词试试，比如「景深」「逆光」「噪点」。</p>'),
    # 页脚
    ('<p>摄影前期拍摄入门学习页。目录依据《摄影前期拍摄知识概况目录》逐条搭建，十章、三十七个小节、一百三十五条要点全部保留，未增删、未改写。</p>',
     '<p>一个讲摄影前期的学习页。目录照《摄影前期拍摄知识概况目录》逐条搭：十章、三十七个小节、一百三十五条要点，一条没少，标题也没动。</p>'),
]

miss = []
for a, b in REPL:
    if a in s:
        s = s.replace(a, b)
    else:
        miss.append(a[:40])

# meta description / og description
old_desc = '拾影——写给零基础者的摄影前期拍摄学习网页，十章系统讲解从看见、相机与镜头、曝光三要素、对焦与景深、光线、色彩、构图到题材思路与特殊技法，含拍摄前准备与作品欣赏，五套界面模板与暗色模式。'
new_desc = '拾影：写给零基础者的摄影前期学习页。十章从「看见」讲到曝光、对焦、光线、构图与题材思路，一百三十五条要点逐条配详解与实拍案例。'
if old_desc in s:
    s = s.replace(old_desc, new_desc)
else:
    miss.append('meta desc')

io.open(P, 'w', encoding='utf-8', newline='\n').write(s)
print('replaced', len(REPL) + 1 - len(miss), 'missed', len(miss))
for m in miss:
    print('MISS:', m)

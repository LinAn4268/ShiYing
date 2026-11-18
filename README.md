# 拾影 · 摄影前期拍摄入门

**线上访问：<https://linan4268.github.io/ShiYing/>** ｜ 仓库：<https://github.com/LinAn4268/ShiYing>

一个**双击即可运行**的摄影入门学习网页，包含主页 `index.html` 与共用的要点详解页 `detail.html`。目录严格取自《摄影前期拍摄知识概况目录》，10 章 / 37 小节 / 135 条三级标题逐条保留、顺序一致，不增不减不改。每条三级标题都配有一篇短教程（导语 / 先懂原理 / 动手步骤 / 常见误区 / 举个例子 / 一句话小结 / 关键词），可从主页每条要点的「读详解 →」进入。

内容篇幅（实测 135 条）：纯散文部分（导语 + 原理 + 举例 + 小结）**250–637 字，中位数 391**；加上步骤、误区、关键词后的整条正文 **394–974 字，中位数 651**。中位数落在 300–500 区间，个别条目因主题简单或需要更多前提说明而偏短/偏长，均保证叙述完整、无凑字。

---

## 一、文件结构

```
拾影/
├── index.html          ← 交付物：主页单文件（HTML+CSS+JS 全内联），双击即可运行
├── detail.html         ← 交付物：要点详解单文件（135 条短教程，锚点切换），双击即可运行
├── README.md           ← 本说明（结构 / UI 模板 / 功能 / 来源 / 验收）
├── src/                ← 可维护源码（改内容请改这里，再运行构建脚本）
│   ├── body.html       ← 主页静态骨架与占位符
│   ├── style.css       ← 三套模板 + 主页组件样式（含浅/暗两套变量）
│   ├── app.js          ← 主页原生 JS：渲染 / 折叠 / 搜索 / 主题 / 进度 / 术语
│   ├── detail-body.html ← 详情页骨架（目录侧栏 + 正文 + 主题按钮）
│   ├── detail.css      ← 详情页专属样式（dt- 前缀，复用主题变量）
│   ├── detail-app.js   ← 详情页原生 JS：135 条目录 / 锚点切换 / 主题 / 上下篇
│   └── build.py        ← 构建脚本：把 src + data 合成 index.html 与 detail.html
├── data/               ← 内容数据（唯一内容源）
│   ├── ch1-3.json / ch4-7.json / ch8-10.json   ← 十章正文
│   ├── glossary.json   ← 62 条术语首现解释
│   ├── directory.txt   ← 182 行标题清单（校验基准）
│   ├── validate.py     ← 目录完整性 + 关键特性校验
│   └── detail/         ← 135 条短教程内容
│       ├── input/chN.json   ← 从十章正文抽出的标题元信息（N=1..10）
│       └── out/chN.json     ← 扩写后的详解内容（lead/principle/steps/mistakes/example/takeaway/keywords）
└── tools/              ← 本地验收工具（CDP 驱动 Edge，非交付必需）
    ├── cdp.mjs / check.mjs / interact.mjs / shots.mjs / imgcheck.mjs
    ├── check-detail.mjs / dshot.mjs / check-tip.mjs
    ├── audit-page.mjs / audit-contrast-all.mjs / audit-contrast-page.mjs
    ├── audit-controls.mjs / audit_content.py
    └── sheet.py / probe*.mjs
```

**重新构建**：`python src/build.py`（需 Python 3）。产物 `index.html` 与 `detail.html` 均为 UTF-8 / LF 编码，无任何外部 JS/CSS 依赖；图片来自网络，离线时自动降级为占位图，页面其余功能照常可用。两个 HTML 必须放在同一目录：主页「读详解」链接指向 `detail.html#条目ID`。

---

## 二、三套 UI 模板

通过右上角「主题」切换，选择保存在 localStorage，刷新后保留。每套模板都自带浅色与暗色两套配色（暗色按钮独立切换并记忆）。

| 模板 | 气质 | 主色 / 字体 | 造型语言 | 适用场景 |
|---|---|---|---|---|
| **纸刊 paper**（默认） | 暖纸杂志、安静文学感 | 朱砂 `#b0503a`；标题宋体、正文无衬线 | 圆角 14px、柔和阴影、留白充裕；第一章导语带引号装饰 | 长时间沉浸阅读、文学化引入 |
| **影院 cinema** | 暗调胶片、克制高级 | 暗底 `#0b0c0f` + 金 `#d8a53f`；无衬线 | 直角 2px、图片满幅出血、小节用上下细线分割而非卡片 | 作品欣赏、偏视觉/摄影氛围 |
| **网格 grid** | 清爽手册、效率感 | 青绿 `#1f8a7e`；无衬线 | 点阵背景、白色卡片圆角 18px、信息密度高 | 快速查阅、偏教程/工具手册 |

实现位置：`src/style.css` 顶部 `html[data-theme="..."]` 与 `html[data-theme="..."][data-dark="true"]` 两组 CSS 变量，覆盖 bg / panel / text / accent / line / shadow / 圆角 / 字体 / 标签三色 / 卡片列数 / Hero 渐变 / 点阵等。

---

## 三、功能清单

**要点详解页（detail.html）**
- 主页每条三级标题下方有「读详解 →」入口，链接为 `detail.html#条目ID`，如 `detail.html#8-1-3`。
- 135 条短教程共用同一页面，通过 URL 锚点切换：刷新、分享、浏览器前进后退均可定位；无效锚点有降级提示页。
- 每条内容包含：导语、先懂原理（2–3 段）、动手步骤、常见误区、举个例子、一句话小结、关键词。
- 左侧三级目录（章 → 小节 → 条目）可点击跳转并高亮当前条目；移动端为抽屉式目录。
- 上一条 / 下一条导航按顺序串联全部 135 条；面包屑显示所属章与小节。
- 主题与暗色设置和主页共享 localStorage，两端保持一致；支持键盘、skip link、`aria-current`、reduced-motion。

**导航与结构**
- 顶部导航：拾影 logo、目录抽屉按钮、搜索、主题菜单、暗色开关、学习进度。
- 侧栏抽屉目录：10 章 → 37 小节 → 135 条三级标题三级树；滚动时自动高亮当前章；目录节点自动滚动跟随。
- 首页 Hero：站名「拾影」、副标题、开始学习 / 查看目录两个按钮、来源标注。
- 学习路径三步引导、十章正文、页脚（章节索引、术语表入口、站外欣赏链接）。
- 第一章为感性文学化引入；每章 80–120 字导语；章末「本章小结 + 练习建议」（非目录项）。

**阅读交互**
- 二级小节折叠：默认展开第一章，其余折叠；点标题展开/收起；从目录点击自动展开并滚动定位；状态记忆。
- 搜索：过滤三级标题（标题 + 正文），命中数统计、`<mark>` 高亮、空状态与建议词按钮；清空后还原折叠状态。
- 学习进度：按章「已读」勾选，进度条 + 计数，状态记忆。
- 术语：62 个术语首次出现加 `abbr` 提示，页脚可打开完整术语表弹层。

**视觉与图片**
- 每张图片含 `alt`、来源标注、可点击来源链接（新标签 `target=_blank` + `noopener noreferrer`）、加载失败降级占位。
- 图片 `loading=lazy` + `decoding=async`，尺寸经 URL 参数 `w=1400&q=78` 压缩；Hero 图 `fetchpriority=high`。
- 参数对比用卡片/表格（第 2 章焦段速查、第 3 章三要素，含内联 SVG 曝光三角示意图）；第八章题材用卡片网格，每个小节配专属题材图。
- 第五 / 八 / 十章附作品欣赏站外链接。

**工程与可访问性**
- 单文件内联、`lang=zh-CN`、中文 title/description/viewport、语义化标题层级（仅一个 h1）。
- skip link、ARIA（`aria-expanded` / `aria-controls` / `role` / `aria-live`）、`:focus-visible` 焦点样式、`prefers-reduced-motion` 降级。
- 响应式四档断点（1180 / 1040 / 760 / 400px），移动端导航与卡片单列适配。
- 回到顶部按钮、斜杠键聚焦搜索、原生 JS 无 console 错误。

---

## 四、图片与链接来源清单

所有图片来自 **Unsplash**（免费可商用）。图片直链格式：`https://images.unsplash.com/<photo-id>?auto=format&fit=crop&w=1400&q=78`。来源链接指向 Unsplash 对应主题页，`photo-id` 为可核对凭证（Unsplash 单图页有 Cloudflare 拦截，故以主题页 + ID 双重标注）。

| 用途 | photo-id | 来源页 |
|---|---|---|
| Hero 日出山野 | `photo-1470252649378-9c29740c9fa8` | unsplash.com/s/photos/sunrise-landscape |
| 第 1 章 森林光线 | `photo-1441974231531-c6227db76b6e` | unsplash.com/s/photos/forest-light |
| 第 2 章 相机 | `photo-1495707902641-75cac588d2e9` | unsplash.com/s/photos/camera |
| 第 3 章 镜头光圈 | `photo-1516035069371-29a1b244cc32` | unsplash.com/s/photos/camera-lens |
| 第 4 章 人像 | `photo-1524504388940-b1c1722653e1` | unsplash.com/s/photos/portrait |
| 第 5 章 黄金时刻 | `photo-1500534623283-312aade485b7` | unsplash.com/s/photos/golden-hour |
| 第 6 章 色彩 | `photo-1501785888041-af3ef285b470` | unsplash.com/s/photos/turquoise-lake |
| 第 7 章 建筑几何 | `photo-1487958449943-2429e8be8625` | unsplash.com/s/photos/architecture-geometry |
| 第 9 章 夜景街道 | `photo-1519608487953-e999c86e7455` | unsplash.com/s/photos/night-street |
| 第 10 章 山野 | `photo-1470071459604-3b5ec3a7fe05` | unsplash.com/s/photos/landscape-mood |
| 8.1 人像 | `photo-1494790108377-be9c29b29330` | unsplash.com/s/photos/portrait-woman |
| 8.2 风光 | `photo-1500534314209-a25ddb2bd429` | unsplash.com/s/photos/mountain-layers |
| 8.3 动态 | `photo-1548199973-03cce0bbc87b` | unsplash.com/s/photos/running-dog |
| 8.4 美食 | `photo-1504674900247-0877df9cc836` | unsplash.com/s/photos/food-flatlay |
| 8.5 弱光星空 | `photo-1519681393784-d120267933ba` | unsplash.com/s/photos/milky-way |

作品欣赏站外链接（第 5 / 8 / 10 章）：
- [Magnum Photos](https://www.magnumphotos.com/)
- [500px 摄影社区](https://500px.com.cn/)
- [图虫](https://tuchong.com/)
- [LensCulture](https://www.lensculture.com/)
- [1x](https://1x.com/)

---

## 五、验收自检表

| 检查项 | 结果 | 证据 |
|---|---|---|
| 目录完整：10 章 / 37 小节 / 135 三级标题，182 行逐条保留、顺序一致 | ✅ | `validate.py`：actual 182，missing/extra 空，order identical True |
| 标题全部嵌入 index.html | ✅ | `validate.py`：titles not found = 0 |
| 每章导语 80–120 字 | ✅ | check：110/118/109/115/111/118/108/110/116/109 |
| 顶部导航 / 侧栏抽屉目录 / 滚动高亮 | ✅ | interact 全通过 |
| 三级折叠（默认第一章展开）+ 目录点击自动展开定位 | ✅ | interact：默认 3 个小节展开、目录点击滚动到位 |
| 搜索过滤 / 高亮 / 空状态 / 建议词 / 清空还原 | ✅ | interact：命中 11 条、56 处 mark、空态与还原均通过 |
| 三套主题切换 + 暗色 + 持久化 | ✅ | interact + paper/cinema/grid 浅暗截图 |
| 图片来源 / alt / 新标签外链 / 失败降级 | ✅ | 32 图全 ok（旧版），改版后 15 图全 ok；imgfail 截图验证降级 |
| 参数对比表格 / 卡片 / 曝光三角 SVG | ✅ | check：tables 2、cards 22、triangle 截图 |
| 术语首现标注 + 术语表弹层（62 条） | ✅ | interact：术语弹层与条目数通过 |
| 学习进度 + 记忆 / 回到顶部 / 斜杠聚焦搜索 | ✅ | interact 全通过 |
| 移动端适配（390×844）| ✅ | m390-0 / m390-900 截图 |
| 响应式 / 键盘可用 / 焦点样式 / skip link / ARIA / reduced-motion | ✅ | 源码与 interact（skip link、单一 h1、外链安全）通过 |
| `lang=zh-CN`、中文 title/description/viewport | ✅ | validate.py 全 PASS |
| 原生 JS 无 console 错误 | ✅ | probe-err：Errors `[]`（仅 Edge 懒加载 info 提示，非错误） |
| 双击可运行（file:// 协议）| ✅ | 所有测试均以 `file:///.../index.html` 加载 |

| 135 条三级标题各有独立详解内容 | ✅ | 详情 JSON：135 items，missing/extra/meta mismatch 空，字段齐全 |
| 详情页锚点切换 / 目录高亮 / 上下篇 / 无效锚点降级 | ✅ | check-detail.mjs 全通过 |
| 详情页主题/暗色与主页共享并持久化 | ✅ | check-detail.mjs：grid + dark 持久化通过 |
| 详情页移动端抽屉目录 / 无 JS 异常 | ✅ | check-detail.mjs：390×844 抽屉开合 + Errors `[]` |
| 两套页面双击 file:// 可运行 | ✅ | 所有测试均以 `file:///...` 加载 |
| 移动端无横向滚动（320 / 360 / 390 / 430px） | ✅ | `audit-page.mjs`：index 与 detail 八组宽度 `scrollW == 视口宽` |
| 文本对比度 ≥ 4.5（三模板 × 明暗，共 6 组） | ✅ | `audit-contrast-all.mjs`：主页每组 439 元素、详情页每组 218 元素，`below=0` |
| 术语提示可悬停 / 可键盘聚焦 / 贴边不越界 / 不撑破页面 | ✅ | `check-tip.mjs`：桌面与移动端 18 项全 PASS |
| 搜索框等可聚焦元素均有可访问名称 | ✅ | `audit-page.mjs`：`noName: 0`（focusable 132） |

> 所有断言最终结果：`PROBLEMS: none`（check.mjs 与 interact.mjs 双套件）、`DETAIL PROBLEMS: none`（check-detail.mjs）、`TIP PROBLEMS: none`（check-tip.mjs）。

---

## 六、本轮复核与修复记录

用户要求「对任务进行一遍检查，对有问题处进行修改」。以下为实测发现的问题、根因与修改，均已复测通过。

| # | 问题 | 根因 | 修改 |
|---|---|---|---|
| 1 | 390px 视口下页面被撑到 619px，出现横向滚动 | 术语提示伪元素 `.term::after`（`position:absolute` + `opacity:0;visibility:hidden`）**仍参与溢出计算**；`visibility:hidden` 不脱离布局，靠右术语的气泡把文档撑宽 | 气泡改为 `position:fixed` + JS 计算坐标（`placeTip()`），前默认 `display:none`；坐标夹在视口内，顶部空间不足时自动翻到下方 |
| 2 | 搜索框无可访问名称（132 个可聚焦元素中唯一缺失） | 只有 `placeholder` 与 `.sr-only` label，审计与部分读屏器不认 | `#search` 增加 `aria-label="搜索三级标题"`，保留原有 label |
| 3 | 六种主题组合中 `--faint` 等小字对比度不足（最低 2.40） | 为追求层次感把淡色压得过浅 | 重调六组变量：`--faint` 提到刚好达标、`--muted` 再压暗一档以保留层级；cinema/grid 的 `--accent` 也一并加深（如 cinema `#a87b22` → `#8a6110`，grid `#1f8a7e` → `#17706a`）；`.end-box.practice h4`、详情页当前目录项改用 `--accent-2` |
| 4 | 8 条新写内容偏短（prose 229–249 字） | 初稿只写了结论没写「为什么」 | 每条补一段 50–80 字实操向原理，现最短 250 字（2-1-3 已补到 354） |
| 5 | 详情页长目录不会跟随当前条目 | 高亮函数取错了容器（`#dtToc` 内容容器 vs `#dtSide` 滚动容器） | 改为对 `#dtSide` 计算 `scrollTop`，只滚侧栏不动页面 |
| 6 | 移动端 Hero 来源标注被下方卡片遮住 / 折成两行 | 760px 断点只覆盖了 `bottom` 未覆盖 `top`，绝对定位同时受 top/bottom 约束被拉伸 | 断点内补 `top:10px;bottom:auto`，并在 ≤760px 隐藏 `photo-id` 行，保留「图片来源：Unsplash · 主题」单行可点击链接 |

审计工具（`tools/`，非交付必需）：`audit-page.mjs`（多宽度溢出 / 控制台错误 / 可聚焦元素 / 链接安全）、`audit-contrast-all.mjs` 与 `audit-contrast-page.mjs`（按主题遍历全部文本元素算对比度）、`check-tip.mjs`（术语提示交互）、`audit-controls.mjs`（逐按钮点击验证功能）、`audit_content.py`（篇幅 / 重复 / 占位符）、`dshot.mjs`（详情页截图）。

---

## 七、按钮与控件功能审计

逐个控件**真实点击一次**并对比点击前后的状态（hash / scrollY / 主题 / 暗色 / 抽屉 / 展开数 / 进度 / 弹层 / 高亮数），确认「每个能点的东西都真的有效果」，并检查所有链接目标是否存在。共 55 项断言，全部通过。

| 控件 | 预期行为 | 验证方式 |
|---|---|---|
| 开始学习 | 跳到第一章 | hash=`#ch1`、scrollY>200 |
| 查看目录 | 桌面：目录闪动 + 聚焦第一项；≤1040px：打开抽屉 | `.flash` 类 / 抽屉状态 |
| 目录按钮 / 关闭按钮 / 遮罩 | 打开、关闭移动端抽屉 | `body.toc-open` + `aria-expanded` |
| 搜索按钮 / 输入框 / 清空按钮 | 展开搜索并聚焦；过滤并 `<mark>` 高亮；清空后还原 | marks 56 处、章节 10→9→10 |
| 空状态建议词 | 填入关键词并出结果 | 值 + 可见章节数 |
| 主题按钮 + 3 个模板按钮 | 打开菜单、切换生效、选后自动关闭 | `data-theme` 依次为 cinema / grid / paper |
| 暗色按钮 | 切换明暗并记忆 | `data-dark` true→false |
| 小节折叠按钮（37 个） | 改变展开状态、内容真实收起 | 展开数 3→4 + `.unit-body` 高度 |
| 标记已读（10 个） | 进度 0→1→0，可取消 | 进度徽章文本 |
| 目录小节箭头（37 个） | 展开/收起三级条目 | `aria-expanded` + 条目数 |
| 目录小节链接 / 三级条目 | 锚点跳转、自动展开所属小节 | hash + scrollY |
| 术语表按钮 / 关闭按钮 | 打开 62 条术语弹层、可关闭 | `dialog.open` + 条目数 |
| 回到顶部 | 长页面滚回顶部 | scrollY < 60 |
| 页脚章节链接 | 跳转对应章节 | hash + scrollY |
| 斜杠键 / Esc | 聚焦搜索；清空；关菜单；关抽屉 | 焦点与状态 |
| 方向键 / Enter | 主题菜单内移动焦点；键盘触发折叠 | 焦点落在选项 / 展开数 3→4 |
| 详情页 135 条目录链接 | 切换正文、高亮当前条 | hash 与 `.is-current` 一致 |
| 详情页上一条 / 下一条 | 按顺序翻页；首尾为「已是第一条 / 最后一条」静态占位 | 跳转后的 hash；占位无 `href` |
| 详情页返回 / 主题 / 暗色 / 目录 / 遮罩 / 回到顶部 | 同主页对应行为 | 逐一点击验证，返回后 URL 回到 index.html |
| 进度徽章 | 纯展示，不是假按钮 | `tag=P`、无 `role`、`tabIndex=-1` |

链接完整性：主页 196 个页内锚点全部指向存在的元素、135 个「读详解」全部指向有效条目、36 个外链均为 `target=_blank` + `noopener`；详情页 138 个链接（含 skip link）全部有效。

本轮唯一的代码改动：详情页上下篇链接补上 `rel="prev"` / `rel="next"`（语义更准确，也便于工具识别）。其余 6 项「失败」经核查均为**审计脚本自身的判定错误**（把 `body.toc-open` 当成 `.toc.open`；把 `<button>` + JS 跳转的返回键当成 `<a href>`；用 `rel` 选择器找没有 `rel` 的链接；`#top` / `#dt-main` 这类页内锚点未识别；长页面平滑滚动等待不足；CDP 合成 Enter 键未带 `char` 事件故不触发按钮默认行为），已分别修正断言后全部通过——产品本身没有发现死按钮。

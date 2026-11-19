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
├── 404.html            ← 线上 404 页（GitHub Pages 自动使用，风格与主页一致）
├── robots.txt          ← 允许搜索引擎抓取，指向 sitemap
├── sitemap.xml         ← 两条 URL（主页 / 详解页），便于收录
├── .nojekyll           ← 告诉 GitHub Pages 不要走 Jekyll 处理
├── .gitignore / .gitattributes ← 发布用（忽略截图与临时文件、统一 LF）
├── src/                ← 可维护源码（改内容请改这里，再运行构建脚本）
│   ├── body.html       ← 主页静态骨架与占位符
│   ├── style.css       ← 五套模板 + 外观偏好层 + 主页组件样式（含浅/暗两套变量）
│   ├── app.js          ← 主页原生 JS：渲染 / 折叠 / 搜索 / 主题 / 进度 / 术语
│   ├── detail-body.html ← 详情页骨架（目录侧栏 + 正文 + 主题按钮）
│   ├── detail.css      ← 详情页专属样式（dt- 前缀，复用主题变量）
│   ├── detail-app.js   ← 详情页原生 JS：135 条目录 / 锚点切换 / 主题 / 上下篇
│   ├── look.js         ← 外观面板：模板 / 字体 / 字号 / 行距 / 疏密 / 强调色（两页共用）
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
    ├── check-detail.mjs / dshot.mjs / check-tip.mjs / shoturl.mjs
    ├── check-toc.mjs / shotdrawer.mjs / shotlook.mjs
    ├── check-look.mjs / check-accent.mjs / palette_check.py
    ├── shotlook.mjs / livelook.mjs（线上外观面板验证）
    ├── audit-page.mjs / audit-contrast-all.mjs / audit-contrast-page.mjs
    ├── audit-controls.mjs / audit_content.py
    └── sheet.py / probe*.mjs
```

**重新构建**：`python src/build.py`（需 Python 3）。产物 `index.html` 与 `detail.html` 均为 UTF-8 / LF 编码，无任何外部 JS/CSS 依赖；图片来自网络，离线时自动降级为占位图，页面其余功能照常可用。两个 HTML 必须放在同一目录：主页「读详解」链接指向 `detail.html#条目ID`。

---

## 二、五套 UI 模板 + 外观面板

模板决定整体气质，通过右上角「主题」快速切换；更细的字号、行距、疏密与强调色在「外观」面板里调。所有选择都保存在 localStorage，刷新后保留。每套模板都自带浅色与暗色两套配色（月亮按钮独立切换并记忆），**模板 × 明暗 × 字体 × 字号 × 行距 × 疏密 × 强调色**可以任意组合。

| 模板 | 气质 | 主色 / 字体 | 造型语言 | 适用场景 |
|---|---|---|---|---|
| **纸刊 paper**（默认） | 暖纸杂志、安静文学感 | 朱砂 `#b0503a`；标题宋体、正文无衬线 | 圆角 14px、柔和阴影、留白充裕；第一章导语带引号装饰 | 长时间沉浸阅读、文学化引入 |
| **影院 cinema** | 暗调胶片、克制高级 | 暗底 `#0b0c0f` + 金 `#d8a53f`；无衬线 | 直角 2px、图片满幅出血、小节用上下细线分割而非卡片 | 作品欣赏、偏视觉/摄影氛围 |
| **网格 grid** | 清爽手册、效率感 | 青绿 `#1f8a7e`；无衬线 | 点阵背景、白色卡片圆角 18px、信息密度高 | 快速查阅、偏教程/工具手册 |
| **水墨 ink** | 纸本、安静、留白多 | 墨绿 `#2f5d57`；标题与正文都用宋体 | 圆角 6px、极淡分隔线、行高 2.0 | 想读得慢一点、偏东方气质 |
| **银盐 mono** | 黑白影集、零装饰 | 纯灰阶，强调色为黑/白；标题 Times+宋体、正文黑体 | 全直角、无阴影色偏、标签去色 | 专注结构、构图与影调 |

实现位置：`src/style.css` 顶部 `html[data-theme="..."]` 与 `html[data-theme="..."][data-dark="true"]` 两组 CSS 变量，覆盖 bg / panel / text / accent / line / shadow / 圆角 / 字体 / 标签三色 / 卡片列数 / Hero 渐变 / 点阵等。五套模板 × 浅暗共 10 组配色，每组都跑过 477 个文本元素的自动对比度审计（`below=0`）。

### 外观面板

右上角滑杆图标打开，右侧抽屉，改动即时生效并记住：

| 维度 | 可选值 | 实现 |
|---|---|---|
| 界面模板 | 5 套 | `html[data-theme]`，与主题菜单双向同步 |
| 字体方案 | 跟随模板 / 全宋体 / 全黑体 | `html[data-font]` 覆盖 `--font-head` `--font-body` |
| 字号 | 小 / 标准 / 大 / 特大 | `html[data-size]` 写 `--ts`（.94 / 1 / 1.08 / 1.16），正文/标题/目录/详解页文字一起缩放 |
| 行距 | 紧凑 / 标准 / 宽松 | `html[data-lead]` 覆盖 `--lh`（1.72 / 主题默认 / 2.12） |
| 版式疏密 | 宽松 / 紧凑 | `html[data-density="compact"]` 收紧章节、小节、条目与路径卡的内边距 |
| 强调色 | 跟随模板 / 6 个预设 | 见下 |

强调色不是「取色即用」：选中后由 `src/look.js` 把颜色转到 HSL，在明度轴上寻找**最近的**、同时满足「对 bg、panel、panel-2 均 ≥4.5」「`--on-accent` 对强调色 ≥4.5」「强调色压在同色淡底 `--accent-soft` 上 ≥4.5」的取值，再写回行内变量；换模板或切暗色时自动重算。实测 5 模板 × 明暗 × 6 预设 = **60 组全部达标，最差一组 4.51**（`tools/check-accent.mjs`）。

三个「记忆键」彼此独立：`shiying:theme`（模板）、`shiying:dark`（明暗）、`shiying:look*`（外观五项）。首帧前由 `<head>` 内联脚本一次性套用，避免闪白。

---

## 三、功能清单

**外观与多元化**
- 五套 UI 模板（paper / cinema / grid / ink / mono），可在顶栏主题菜单或外观面板里切换。
- 外观面板：字体方案、4 档字号、3 档行距、2 档版式疏密、6 个预设强调色 + 跟随模板、一键恢复默认。
- 强调色自动校正明度，保证对比度 ≥4.5；换模板、切暗色都会重算。
- 抽屉式面板：Esc 关闭、Tab 焦点陷阱、`aria-modal`、`aria-pressed` 状态、操作播报到 `aria-live`。

**要点详解页（detail.html）**
- 主页每条三级标题下方有「读详解 →」入口，链接为 `detail.html#条目ID`，如 `detail.html#8-1-3`。
- 135 条短教程共用同一页面，通过 URL 锚点切换：刷新、分享、浏览器前进后退均可定位；无效锚点有降级提示页。
- 每条内容包含：导语、先懂原理（2–3 段）、动手步骤、常见误区、举个例子、一句话小结、关键词。
- 左侧三级目录（章 → 小节 → 条目）可点击跳转并高亮当前条目；移动端为抽屉式目录。
- 上一条 / 下一条导航按顺序串联全部 135 条；面包屑显示所属章与小节。
- 主题与暗色设置和主页共享 localStorage，两端保持一致；支持键盘、skip link、`aria-current`、reduced-motion。

**导航与结构**
- 顶部导航：拾影 logo、目录抽屉按钮、搜索、主题菜单、暗色开关、学习进度。
- 侧栏抽屉目录：10 章 → 37 小节 → 135 条三级标题三级树；每章右侧有独立箭头，可单独收起/展开整章（第一章可收起）；滚动到新的一章时自动展开该章并收起上一章自动展开的那段，手动开合过的章不会被自动改动；状态记忆。
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
| 目录每章可单独收起（含第一章）+ 状态记忆 | ✅ | check-toc.mjs 10 项全 PASS；audit-controls.mjs 章级箭头两项 PASS |
| 三级折叠（默认第一章展开）+ 目录点击自动展开定位 | ✅ | interact：默认 3 个小节展开、目录点击滚动到位 |
| 搜索过滤 / 高亮 / 空状态 / 建议词 / 清空还原 | ✅ | interact：命中 11 条、56 处 mark、空态与还原均通过 |
| 五套主题切换 + 暗色 + 持久化 | ✅ | interact + paper/cinema/grid/ink/mono 浅暗截图 |
| 外观面板：模板 / 字体 / 字号 / 行距 / 疏密 / 强调色 / 重置 | ✅ | `check-look.mjs` 全部 PASS（含刷新持久化、Esc 关闭、Tab 焦点陷阱） |
| 强调色对比度（5 模板 × 明暗 × 6 预设） | ✅ | `check-accent.mjs`：checked=60 below=0，最差 4.51 |
| 五套模板浅暗各 477 个文本元素对比度 | ✅ | `audit-contrast-all.mjs`：10 组 below=0 |
| 极端组合（特大字+宽松行距+紧凑版式）390px 无横向滚动 | ✅ | `check-look.mjs`：scrollW 390 = 视口 390，越界元素 0 |
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
| 首帧无主题闪烁（已存 dark+grid 时） | ✅ | `<head>` 内联脚本读 localStorage 后先写属性；`.shots/opt1-0.png` 深色 grid 首屏正常 |
| 响应式图片 | ✅ | `currentSrc` 实测：1440px → `w=1900`，390px@2x → `w=900`；章节图 → `w=760/1400` |
| 分享卡片与规范链接 | ✅ | index / detail 均含 `og:title/description/image/url`、`twitter:card=summary_large_image`、`rel=canonical` |
| 无 JS 降级提示 | ✅ | `<noscript>` 说明条（`.noscript-note`），开启 JS 时不显示 |
| 线上 404 / 抓取与站点文件 | ✅ | `404.html`（同风格）、`robots.txt`、`sitemap.xml`、`.nojekyll` 已随仓库发布 |

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
| 目录章级箭头（10 个） | 收起/展开整章（含第一章），可记忆、可被滚动自动展开 | `.is-open` + `aria-expanded` + `.toc-secs` display |
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

---

## 八、第二轮优化（性能、分享与发布质量）

这一轮不改内容与视觉，只补「上线之后才会暴露」的问题：

| # | 优化 | 解决什么 | 实现 |
|---|---|---|---|
| 1 | 首帧前套用主题 | 深色偏好用户打开页面会先白闪一下再变暗（单文件页面解析到 `</body>` 才执行 JS，中间可能已绘制一帧） | 在 `<head>` 里加一段 ~10 行的内联脚本，从 `localStorage`（`shiying:theme` / `shiying:dark`）读值并在首帧前写好 `data-theme` / `data-dark`；无存储时跟随系统 `prefers-color-scheme`。两个页面共用同一段逻辑 |
| 2 | 图片按屏宽取不同尺寸 | 手机也要下载 1900px 大图 | Hero 用 `srcset`（900 / 1300 / 1900w + `sizes="100vw"`），章节配图与题材图用 `srcset`（760 / 1400w + `sizes`）。实测 1440px 桌面取 1900w、390px@2x 取 900w |
| 3 | 预连接图床 | 首屏图要等 DNS + TLS 才能开始下载 | `<link rel="preconnect" href="https://images.unsplash.com" crossorigin>` + `dns-prefetch` |
| 4 | 分享卡与规范链接 | 链接发到微信/Twitter 没有标题、描述、缩略图 | 补齐 `og:*`（type/site_name/locale/title/description/url/image/image:alt）、`twitter:card=summary_large_image`、`rel="canonical"` |
| 5 | 无 JS 时的提示 | 关掉 JavaScript 只看到空壳，不知道原因 | `<noscript>` 一句话说明「正文与交互由 JavaScript 生成」，并给 `.noscript-note` 样式，不影响开启 JS 的渲染 |
| 6 | Pages 站点文件 | 默认 404 是 GitHub 的默认页；`_` 开头的目录可能被 Jekyll 忽略 | 新增 `404.html`（同风格，含返回主页/详解页按钮）、`.nojekyll`、`robots.txt`、`sitemap.xml` |

验证：`check.mjs`（`PROBLEMS: none`）、`interact.mjs`（34 项全 PASS）、`check-detail.mjs`（22 项全 PASS）、`audit-controls.mjs`（55 项全 PASS）、`audit-page.mjs`（8 组宽度无横向滚动、`noName:0`）、`audit-contrast-all.mjs` / `audit-contrast-page.mjs`（6 组主题各 439 / 218 元素，`below=0`）、`validate.py`（182 行目录全 PASS）——改完逐项复跑，均无回归。


## 九、第三轮优化（目录可收纳）

用户反馈：「网页左侧的目录第一章无法收纳」。原因是旧实现里第一章的展开状态被硬编码（`ci === 0` 加 `is-open`），而且「当前章」的样式规则 `.toc-block.is-current .toc-secs{display:block}` 会强制把正在阅读的那一章撑开——于是只要你还在第一章，它就永远收不起来。

| # | 改动 | 说明 |
|---|---|---|
| 1 | 每章新增独立的「收起/展开」按钮 | 章标题右侧 30×30（触屏 40×40）的箭头按钮，`aria-expanded` 同步，`aria-label` 为「展开或收起第 N 章的目录」；章标题本身仍是跳转链接，不再兼任折叠开关 |
| 2 | 状态模型改为「手动 ∪ 当前章，手动优先」 | `openChapters` / `closedChapters` 两个集合记忆在 `localStorage`；`is-open = 当前章 && 未被手动收起 || 被手动展开`。手动收起的章不会被滚动自动弹开 |
| 3 | 滚动跟随改为手风琴式 | 滚到新的一章时自动展开该章，并收起「上一章那段自动展开的」；手动开合过的章不受影响，列表不会随着阅读越滚越长 |
| 4 | 去掉 `.is-current` 强制展开 | 当前章只用红色底标识位置，不再强制显示三级标题，这是「第一章收不起来」的直接原因 |
| 5 | 搜索与折叠状态互不干扰 | 搜索时命中的章全部临时展开；搜索期间暂停滚动自动开合（避免滚动位置跳变把刚展开的章又收回去）；清空搜索后按存储状态还原 |

验证：新增 `tools/check-toc.mjs`（10 项断言：默认展开、点击收起、刷新后保持收起、再次展开、滚动自动展开且不影响手动章、搜索全展开、清空还原、按钮可聚焦）→ `TOC PROBLEMS: none`；回归 `validate.py`（182/182）、`check.mjs`、`interact.mjs`（34 项）、`check-detail.mjs`（22 项）、`audit-controls.mjs`（55 项）、`audit-page.mjs`（8 组宽度无横向滚动、`noName:0`）、`audit-contrast-all.mjs`（6 组各 439 元素 `below=0`）全部无回归。


## 十、第四轮：UI 多元化与外观面板

用户要求：「UI 和设计风格能不能再多元化、自由度高一点，最好可供用户在一定范围自动选择」。做法是把「一套固定皮肤」改成「五套模板 + 一组可自由组合的外观偏好」，并且所有可选值都经过对比度约束，避免自由调节破坏可读性。

| # | 改动 | 说明 |
|---|---|---|
| 1 | 新增两套模板：水墨 `ink`、银盐 `mono` | ink：宣纸底 `#f4f2ec` + 墨绿 `#2f5d57`，标题与正文都用宋体，行高 2.0、留白最多；mono：纯灰阶、全直角、标题 Times+宋体、正文黑体，几乎不带彩色 |
| 2 | 新增外观面板 `src/look.js` | 右侧抽屉（`role="dialog"` + `aria-modal`），分六组：界面模板（5 张带四色条的卡片）、字体、字号、行距、版式疏密、强调色；底部「恢复默认外观」。Esc 关闭、Tab 焦点陷阱、焦点回到触发按钮、改动通过 `aria-live` 播报 |
| 3 | 偏好层与主题/暗色解耦 | 偏好写在 `<html>` 的 `data-font` / `data-size` / `data-lead` / `data-density`，与 `data-theme`、`data-dark` 正交；存储键 `shiying:look*` 与 `shiying:theme`、`shiying:dark` 分别记忆 |
| 4 | 强调色带对比度求解 | 取色 → HSL 明度轴上搜索最近的可行值，要求对 bg / panel / panel-2 ≥4.5、`--on-accent` 对强调色 ≥4.5、强调色压在同色淡底上 ≥4.5；换模板或切暗色时用 `MutationObserver` 自动重算 |
| 5 | 首帧一次性套用全部偏好 | `<head>` 内联脚本从 `localStorage` 读模板、明暗与外观五项，在首次绘制前写好属性，避免「先按默认排版闪一下再变」 |
| 6 | 移动端收敛入口 | ≤560px 时隐藏顶栏的模板按钮（面板里同样能选），顶栏只留目录 / 搜索 / 外观 / 暗色四个按钮，避免挤压 |
| 7 | Hero 图片来源标注加底片 | 亮天空背景下白字几乎看不清，改为半透明深色圆角底 + 轻微模糊，全主题统一可读 |

验证：
- `tools/check-look.mjs`：模板卡片数量、抽屉开合与焦点、五套模板切换、字体/字号/行距/疏密生效与持久化、6 个强调色对比度、暗色与换模板后重算、刷新保留、Esc 与 Tab 焦点陷阱、重置、极端组合 390px 无横向滚动、详情页同样可用 → `LOOK PROBLEMS: none`。
- `tools/check-accent.mjs`：5 模板 × 明暗 × 6 预设 = 60 组，`below=0`，最差 4.51。
- `tools/audit-contrast-all.mjs` / `audit-contrast-page.mjs` 扩到五套模板：10 组 × 477（主页）/ 每组 218（详情页），`below=0`。
- 回归：`validate.py` 182/182、`check.mjs`（`PROBLEMS: none`）、`interact.mjs` 34 项、`check-toc.mjs` 10 项、`check-detail.mjs` 22 项、`audit-controls.mjs`（含新增 26 个面板控件，`CONTROL PROBLEMS: none`）、`audit-page.mjs`（8 组宽度无横向滚动、`noName:0`）全部无回归。

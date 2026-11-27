// 交互验收：折叠 / 目录 / 搜索 / 主题 / 暗色 / 进度 / 回到顶部 / 键盘 / 移动端
import { connect } from './cdp.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');
const c = await connect(file);
await c.send('Page.enable');
await c.send('Runtime.enable');
await c.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 950, deviceScaleFactor: 1, mobile: false });
await c.sleep(1200);
// 每次从干净状态开始（同一 profile 下 localStorage 会残留上一轮的进度/主题）
await c.evaluate('localStorage.clear(); location.reload()');
await c.sleep(2200);

const P = [];
for (const e of c.events) {
  if (e.method === 'Runtime.exceptionThrown') P.push('EXC ' + (e.params.exceptionDetails.exception?.description || e.params.exceptionDetails.text));
  if (e.method === 'Runtime.consoleAPICalled' && e.params.type === 'error') P.push('ERR ' + e.params.args.map(a => a.value ?? a.description).join(' '));
}
const ok = (name, cond, extra = '') => { console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra ? ' :: ' + extra : '')); if (!cond) P.push(name); };
const ev = (js) => c.evaluate(js);

// 1. 默认折叠状态
ok('默认展开仅第一章', (await ev(`document.querySelectorAll('.unit[data-open="true"]').length`)) === 3);

// 2. 展开第二章某小节
await ev(`document.querySelector('#ch2 .unit-head').click()`);
await c.sleep(300);
ok('点击标题展开小节', (await ev(`document.querySelector('#ch2 .unit').getAttribute('data-open')`)) === 'true');
ok('题材小节有专属配图', (await ev(`document.querySelectorAll('#ch8 .genre-fig img').length`)) === 5);

// 3. 目录点击自动展开
await ev(`document.querySelector('.toc-block[data-ch="ch9"] .toc-sec-link').click()`);
await c.sleep(2200);
ok('目录点击后章节小节展开', (await ev(`document.querySelectorAll('#ch9 .unit[data-open="true"]').length`)) >= 1);
ok('目录点击滚动到目标小节', (await ev(`(()=>{const t=document.querySelector('#ch9 .unit').getBoundingClientRect().top;return t>-40&&t<220})()`)),
  await ev(`Math.round(document.querySelector('#ch9 .unit').getBoundingClientRect().top)`));

// 4. 目录小节箭头展开三级标题
await ev(`document.querySelector('.toc-sec[data-sec="2-2"] .toc-sec-toggle').click()`);
await c.sleep(200);
ok('目录三级标题可展开', (await ev(`document.querySelector('.toc-sec[data-sec="2-2"]').classList.contains('is-open')`)) === true);

// 5. 滚动高亮
await ev(`window.scrollTo(0, document.querySelector('#ch4').offsetTop + 100)`);
await c.sleep(700);
ok('滚动高亮当前章', (await ev(`document.querySelector('.toc-block.is-current')?.getAttribute('data-ch')`)) === 'ch4');

// 6. 搜索命中
const openBefore = await ev(`document.querySelectorAll('.unit[data-open="true"]').length`);
await ev(`(()=>{const i=document.querySelector('#search');i.value='光圈';i.dispatchEvent(new Event('input',{bubbles:true}));})()`);
await c.sleep(700);
const s1 = await ev(`({vis:[...document.querySelectorAll('.item')].filter(x=>!x.hidden).length, bar:document.querySelector('#searchBar').classList.contains('show'), marks:document.querySelectorAll('mark').length, empty:document.querySelector('#emptyState').classList.contains('show')})`);
ok('搜索命中并显示结果条', s1.bar && s1.vis > 0, JSON.stringify(s1));
ok('搜索高亮 mark', s1.marks > 0, String(s1.marks));
ok('搜索时章节导语隐藏', (await ev(`[...document.querySelectorAll('.chapter-intro')].every(x=>x.hidden)`)) === true);

// 7. 空状态
await ev(`(()=>{const i=document.querySelector('#search');i.value='量子纠缠';i.dispatchEvent(new Event('input',{bubbles:true}));})()`);
await c.sleep(600);
ok('空搜索显示空状态', (await ev(`document.querySelector('#emptyState').classList.contains('show')`)) === true);
await ev(`document.querySelector('[data-suggest="快门"]').click()`);
await c.sleep(600);
ok('空状态建议词可点击', (await ev(`document.querySelector('#search').value`)) === '快门');

// 8. 清空恢复
await ev(`document.querySelector('#resetSearch').click()`);
await c.sleep(700);
ok('清空搜索恢复全部条目', (await ev(`[...document.querySelectorAll('.item')].every(x=>!x.hidden)`)) === true);
ok('清空后折叠状态还原到搜索前', (await ev(`document.querySelectorAll('.unit[data-open="true"]').length`)) === openBefore,
  openBefore + ' -> ' + (await ev(`document.querySelectorAll('.unit[data-open="true"]').length`)));

// 9. 主题切换
await ev(`document.querySelector('#themeBtn').click()`);
await c.sleep(200);
ok('主题菜单可打开', (await ev(`!document.querySelector('#themeMenu').hidden`)) === true);
await ev(`document.querySelector('[data-theme-choice="cinema"]').click()`);
await c.sleep(500);
ok('切换到影院模板', (await ev(`document.documentElement.dataset.theme`)) === 'cinema');
ok('模板持久化', (await ev(`localStorage.getItem('shiying:theme')`)) === '"cinema"');

// 10. 暗色
await ev(`document.querySelector('#darkBtn').click()`);
await c.sleep(500);
ok('暗色开启', (await ev(`document.documentElement.dataset.dark`)) === 'true');
ok('暗色 aria-pressed', (await ev(`document.querySelector('#darkBtn').getAttribute('aria-pressed')`)) === 'true');

// 11. 学习进度
await ev(`document.querySelector('#ch3 .read-btn').click(); document.querySelector('#ch5 .read-btn').click()`);
await c.sleep(300);
ok('进度计数', (await ev(`document.querySelector('#progressText').textContent`)) === '2 / 11');
ok('进度持久化', (await ev(`JSON.parse(localStorage.getItem('shiying:read')).length`)) === 2);

// 12. 术语
ok('术语首现标注', (await ev(`document.querySelectorAll('.term').length`)) > 30);
await ev(`document.querySelector('#glossaryBtn').click()`);
await c.sleep(300);
ok('术语表弹层', (await ev(`document.querySelector('#glossaryDialog').open`)) === true);
ok('术语表条目数', (await ev(`document.querySelectorAll('.gloss-item').length`)) === 62);
await ev(`document.querySelector('#glossaryDialog').close()`);

// 13. 回到顶部
await ev(`window.scrollTo(0,6000)`); await c.sleep(600);
ok('回到顶部按钮出现', (await ev(`document.querySelector('#toTop').classList.contains('show')`)) === true);
await ev(`document.querySelector('#toTop').click()`); await c.sleep(1200);
ok('回到顶部生效', (await ev(`window.scrollY`)) < 60, String(await ev(`window.scrollY`)));

// 14. 键盘 /
await c.send('Input.dispatchKeyEvent', { type: 'keyDown', key: '/', code: 'Slash', text: '/', windowsVirtualKeyCode: 191 });
await c.sleep(400);
ok('斜杠键聚焦搜索', (await ev(`document.activeElement.id`)) === 'search');

// 15. a11y 结构
ok('lang=zh-CN', (await ev(`document.documentElement.lang`)) === 'zh-CN');
ok('仅一个 h1', (await ev(`document.querySelectorAll('h1').length`)) === 1);
ok('skip link', (await ev(`document.querySelector('.skip-link').getAttribute('href')`)) === '#main');
ok('所有图片有 alt', (await ev(`[...document.images].every(i=>i.alt&&i.alt.length>4)`)) === true);
ok('外链均 target=_blank + noopener', (await ev(`[...document.querySelectorAll('a[target="_blank"]')].every(a=>/noopener/.test(a.rel))`)) === true);
ok('无重复 id', (await ev(`(()=>{const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);return ids.length===new Set(ids).size})()`)) === true);
ok('标题层级：h2 仅章节/路径', (await ev(`[...document.querySelectorAll('.chapter h2')].length`)) === 11);

console.log('PROBLEMS:', P.length ? P : 'none');
await c.close();

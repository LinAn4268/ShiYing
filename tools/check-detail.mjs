import { connect } from './cdp.mjs';
import path from 'node:path';
const file = 'file:///' + path.resolve('detail.html').replace(/\\/g, '/');

function check(cond, label, extra = '') {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (extra ? ' :: ' + extra : ''));
  if (!cond) process.exitCode = 1;
}

const c = await connect('about:blank');
await c.send('Page.enable');
await c.send('Runtime.enable');
await c.send('Log.enable');

// 从主页第一条「读详解」入口进入，验证真实跳转
await c.send('Page.navigate', { url: 'file:///' + path.resolve('index.html').replace(/\\/g, '/') });
await c.sleep(1200);
const firstLink = await c.evaluate(`document.querySelector('.item-detail')?.getAttribute('href') || ''`);
check(/^detail\.html#/.test(firstLink), '主页存在读详解入口', firstLink);
await c.send('Page.navigate', { url: file + (firstLink ? firstLink.split('detail.html')[1] : '#1-1-1') });
await c.sleep(900);

const state = await c.evaluate(`(() => ({
  title: document.title,
  h1: document.querySelector('#dtTitle')?.textContent || '',
  crumb: document.querySelector('#dtCrumb')?.textContent || '',
  lead: document.querySelector('.dt-lead')?.textContent.length || 0,
  blocks: [...document.querySelectorAll('.dt-block h2')].map(x => x.textContent.trim()),
  steps: document.querySelectorAll('.dt-steps li').length,
  mistakes: document.querySelectorAll('.dt-mistakes li').length,
  example: (document.querySelector('.dt-example')?.textContent || '').length,
  takeaway: (document.querySelector('.dt-takeaway')?.textContent || '').length,
  keywords: document.querySelectorAll('.dt-kw em').length,
  tocLinks: document.querySelectorAll('#dtToc a').length,
  current: document.querySelector('#dtToc a.is-current')?.getAttribute('data-id') || '',
  prevNext: document.querySelectorAll('.dt-footnav a').length,
  lang: document.documentElement.lang,
  h1Count: document.querySelectorAll('h1').length,
  skip: !!document.querySelector('.skip-link'),
  details: typeof DETAILS !== 'undefined' ? DETAILS.length : -1
}))()`);
console.log('STATE', JSON.stringify(state));
check(state.details === 153, '详情数据 153 条', String(state.details));
check(state.tocLinks === 153, '侧栏目录 153 条', String(state.tocLinks));
check(state.h1Count === 1 && state.h1, '单页唯一 h1', state.h1.slice(0, 30));
check(state.lead > 40, '导语已渲染', String(state.lead));
check(state.blocks.length === 4, '四大内容板块齐全', state.blocks.join('/'));
check(state.steps > 0 && state.mistakes > 0, '步骤与误区已渲染', state.steps + '/' + state.mistakes);
check(state.example > 60 && state.takeaway > 15, '举例与小结已渲染', state.example + '/' + state.takeaway);
check(state.keywords >= 3, '关键词已渲染', String(state.keywords));
check(state.current === '1-1-1', '当前条目高亮', state.current);
check(state.prevNext === 1, '首条仅显示下一条导航', String(state.prevNext));
check(state.lang === 'zh-CN' && state.skip, 'zh-CN + skip link');

// hash 切换
await c.evaluate(`location.hash = '#8-2-3'`);
await c.sleep(500);
const h2 = await c.evaluate(`({
  title: document.querySelector('#dtTitle')?.textContent || '',
  current: document.querySelector('#dtToc a.is-current')?.getAttribute('data-id') || '',
  crumb: document.querySelector('#dtCrumb')?.textContent || '',
  scroll: window.scrollY
})`);
check(h2.current === '8-2-3' && h2.scroll === 0, '锚点切换并回到顶部', JSON.stringify(h2));
check(h2.crumb.includes('风光'), '面包屑随条目更新', h2.crumb);

// 上/下篇导航
await c.evaluate(`document.querySelector('.dt-footnav a.dt-next')?.click()`);
await c.sleep(500);
const h3 = await c.evaluate(`({hash: location.hash, title: document.querySelector('#dtTitle')?.textContent || ''})`);
check(h3.hash !== '#8-2-3', '下一条导航生效', JSON.stringify(h3));

// 主题与暗色（沿用主页共享 localStorage）
await c.evaluate(`localStorage.clear(); location.reload()`);
await c.sleep(900);
await c.evaluate(`document.querySelector('#dtDarkBtn').click()`);
await c.sleep(200);
let th = await c.evaluate(`({dark: document.documentElement.getAttribute('data-dark'), pressed: document.querySelector('#dtDarkBtn').getAttribute('aria-pressed'), saved: localStorage.getItem('shiying:dark')})`);
check(th.dark === 'true' && th.pressed === 'true' && th.saved === 'true', '暗色切换与持久化', JSON.stringify(th));
await c.evaluate(`document.querySelector('#dtThemeBtn').click()`);
await c.sleep(100);
check(await c.evaluate(`!document.querySelector('#dtThemeMenu').hidden`), '主题菜单可打开');
await c.evaluate(`document.querySelector('[data-theme-choice="grid"]').click()`);
await c.sleep(200);
th = await c.evaluate(`({theme: document.documentElement.getAttribute('data-theme'), saved: localStorage.getItem('shiying:theme'), menuHidden: document.querySelector('#dtThemeMenu').hidden})`);
check(th.theme === 'grid' && th.saved === '"grid"' && th.menuHidden, '主题切换与持久化', JSON.stringify(th));

// 侧栏抽屉（移动端宽度模拟）
await c.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
await c.evaluate(`location.reload()`);
await c.sleep(900);
await c.evaluate(`document.querySelector('#dtSideToggle').click()`);
await c.sleep(200);
const mob = await c.evaluate(`({open: document.querySelector('#dtSide').classList.contains('open'), mask: !document.querySelector('#dtMask').hidden, exp: document.querySelector('#dtSideToggle').getAttribute('aria-expanded')})`);
check(mob.open && mob.mask && mob.exp === 'true', '移动端侧栏抽屉', JSON.stringify(mob));
await c.evaluate(`document.querySelector('#dtMask').click()`);
await c.sleep(150);
check(!(await c.evaluate(`document.querySelector('#dtSide').classList.contains('open')`)), '点击遮罩关闭侧栏');
await c.send('Emulation.clearDeviceMetricsOverride');

// 无效锚点降级（未设置 hash 时加载，随后临时改写为无效 hash 触发 hashchange）
await c.send('Page.navigate', { url: file });
await c.sleep(800);
await c.evaluate(`location.hash = '#nonexistent'`);
await c.sleep(400);
check(await c.evaluate(`!!document.querySelector('.dt-notfound')`), '无效锚点有降级页');

// 错误检查
const errs = c.events.filter(e => e.method === 'Runtime.exceptionThrown');
check(errs.length === 0, '无 JS 异常', JSON.stringify(errs.map(e => e.params.exceptionDetails.text)));
await c.send('Page.captureScreenshot', { format: 'png' }).then(() => {});
c.close();
console.log(errs.length ? 'DETAIL PROBLEMS' : 'DETAIL PROBLEMS: none');

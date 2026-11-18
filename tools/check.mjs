// 验收探针：加载 index.html，收集控制台错误/异常，统计关键数量，截图
import { connect } from './cdp.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');

const w = process.env.W || 1440, h = process.env.H || 950;
const c = await connect(file);
await c.send('Page.enable');
await c.send('Runtime.enable');
await c.send('Log.enable');
await c.send('Emulation.setDeviceMetricsOverride', { width: +w, height: +h, deviceScaleFactor: 1, mobile: false });
await c.sleep(1200);
await c.send('Page.reload', { ignoreCache: true });
await c.sleep(3500);

const probs = [];
for (const e of c.events) {
  if (e.method === 'Runtime.exceptionThrown') probs.push('EXC: ' + (e.params.exceptionDetails.exception?.description || e.params.exceptionDetails.text));
  if (e.method === 'Runtime.consoleAPICalled' && e.params.type === 'error') probs.push('ERR: ' + e.params.args.map(a => a.value ?? a.description).join(' '));
  if (e.method === 'Log.entryAdded' && e.params.entry.level === 'error') probs.push('LOG: ' + e.params.entry.text + ' @' + (e.params.entry.url || ''));
}

const stats = await c.evaluate(`(() => {
  const q = s => document.querySelectorAll(s).length;
  const imgs = [...document.images];
  return {
    chapters: q('.chapter'), units: q('.unit'), items: q('.item'),
    tocCh: q('.toc-block'), tocSec: q('.toc-sec'), tocLeaf: q('.toc-leaves a'),
    imgs: imgs.length, imgOk: imgs.filter(i => i.complete && i.naturalWidth > 0).length,
    imgBroken: imgs.filter(i => i.complete && i.naturalWidth === 0).map(i => i.src.slice(0, 90)),
    terms: q('.term'), tables: q('.cmp table'), cards: q('.topic-card'),
    unitHiddenAttr: q('.unit[data-open="false"]'), unitOpen: q('.unit[data-open="true"]'),
    heroTitle: document.querySelector('#heroTitle')?.textContent,
    docH: document.documentElement.scrollHeight,
    themeAttr: document.documentElement.dataset.theme,
    darkAttr: document.documentElement.dataset.dark,
    introLens: [...document.querySelectorAll('.chapter-intro')].map(p => p.textContent.trim().length)
  };
})()`);

console.log('URL', file);
console.log('PROBLEMS:', probs.length ? probs : 'none');
console.log(JSON.stringify(stats, null, 1));

await c.screenshot('.shots/top.png');
await c.evaluate(`window.scrollTo(0, document.querySelector('#ch1').offsetTop - 40)`);
await c.sleep(900);
await c.screenshot('.shots/ch1.png');
await c.close();

// 主题/暗色/视口截图：TH=模板 DK=暗色 W/H=视口 SCROLLS=逗号分隔滚动位置 TAG=文件名前缀
import { connect } from './cdp.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');
const TH = process.env.TH || 'paper';
const DK = process.env.DK === '1';
const W = +(process.env.W || 1440), H = +(process.env.H || 950);
const TAG = process.env.TAG || TH + (DK ? '-dark' : '');
const mobile = process.env.MOBILE === '1';

const c = await connect(file);
await c.send('Page.enable');
await c.send('Runtime.enable');
await c.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile });
await c.sleep(900);
await c.evaluate(`localStorage.clear();
  localStorage.setItem('shiying:theme', JSON.stringify(${JSON.stringify(TH)}));
  localStorage.setItem('shiying:dark', ${DK});
  localStorage.setItem('shiying:folded', 'true');
  localStorage.setItem('shiying:openUnits', JSON.stringify([]));
  location.reload();`);
await c.sleep(2200);
// 展开被搜索目标章节，便于截图看内容
await c.evaluate(`document.querySelectorAll('#ch1 .unit, #ch8 .unit').forEach(u=>{u.setAttribute('data-open','true');u.querySelector('.unit-head').setAttribute('aria-expanded','true')})`);
await c.sleep(300);

const H2 = await c.evaluate('document.documentElement.scrollHeight');
const step = Math.round(H * 0.85);
for (let y = 0; y < H2; y += step) { await c.evaluate(`window.scrollTo(0,${y})`); await c.sleep(260); }
await c.sleep(1200);
const img = await c.evaluate(`(()=>{const a=[...document.images];return {t:a.length,ok:a.filter(i=>i.complete&&i.naturalWidth>0).length,bad:a.filter(i=>i.complete&&i.naturalWidth===0).map(i=>i.dataset.key)}})()`);
console.log('IMAGES', JSON.stringify(img), 'docH', H2);

const scrolls = (process.env.SCROLLS || '0').split(',').map(Number);
for (const y of scrolls) {
  await c.evaluate(`window.scrollTo(0, ${y})`);
  await c.sleep(800);
  await c.screenshot(`.shots/${TAG}-${y}.png`);
  console.log('shot', TAG, y);
}
await c.close();

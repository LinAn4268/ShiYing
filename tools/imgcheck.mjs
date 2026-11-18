// 等所有图片加载完成，报告失败项与耗时
import { connect } from './cdp.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');
const c = await connect(file);
await c.send('Page.enable');
await c.send('Runtime.enable');
await c.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 950, deviceScaleFactor: 1, mobile: false });
await c.sleep(1500);

const H = await c.evaluate('document.documentElement.scrollHeight');
for (let y = 0; y < H; y += 600) { await c.evaluate(`window.scrollTo(0,${y})`); await c.sleep(300); }

for (let i = 0; i < 40; i++) {
  const s = await c.evaluate(`(() => {
    const a=[...document.images];
    return {t:a.length, done:a.filter(x=>x.complete).length, ok:a.filter(x=>x.complete&&x.naturalWidth>0).length};
  })()`);
  if (s.done === s.t) { console.log('ALL SETTLED', JSON.stringify(s)); break; }
  await c.sleep(500);
  if (i === 39) console.log('TIMEOUT', JSON.stringify(s));
}

const bad = await c.evaluate(`[...document.images].filter(i=>i.complete&&i.naturalWidth===0).map(i=>({key:i.dataset.key,src:i.src,alt:i.alt}))`);
console.log('BAD', JSON.stringify(bad, null, 1));
const pend = await c.evaluate(`[...document.images].filter(i=>!i.complete).map(i=>i.dataset.key+':'+i.loading)`);
console.log('PENDING', JSON.stringify(pend));
await c.close();

// 验收：作品赏析栏目 + 图库推荐 + 图片替换 + 无 JS 异常 + 10 图懒加载
import { connect } from './cdp.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');
const c = await connect(file);
await c.send('Page.enable');
await c.send('Runtime.enable');
await c.send('Log.enable');
await c.sleep(1000);
await c.send('Page.reload', { ignoreCache: true });
await c.sleep(2500);

const probs = [];
for (const e of c.events) {
  if (e.method === 'Runtime.exceptionThrown') probs.push('EXC: ' + (e.params.exceptionDetails.exception?.description || e.params.exceptionDetails.text));
  if (e.method === 'Runtime.consoleAPICalled' && e.params.type === 'error') probs.push('ERR: ' + e.params.args.map(a => a.value ?? a.description).join(' '));
}

const stats = await c.evaluate(`(() => {
  const q = s => document.querySelectorAll(s).length;
  return {
    works: q('#works'), workCards: q('.work-card'), workGenres: q('.work-genre'),
    analyses: [...document.querySelectorAll('.work-analysis')].map(p => p.textContent.length),
    siteCards: q('.site-card'), freeSites: q('.site-badge.yes'), checkSites: q('.site-badge.check'),
    srcHosts: [...new Set([...document.images].map(i => { try { return new URL(i.src).host; } catch { return '?'; } }))],
    hero: (() => { const h = document.querySelector('#heroImg'); return h ? { host: new URL(h.src).host, loaded: h.complete && h.naturalWidth>0 } : null; })(),
  };
})()`);

// 逐卡滚动，触发懒加载
for (let i = 0; i < 10; i++) {
  await c.evaluate(`document.querySelectorAll('.work-card')[${i}]?.scrollIntoView({block:'center'})`);
  await c.sleep(600);
}
await c.sleep(2000);
const imgs = await c.evaluate(`(() => {
  const a = [...document.querySelectorAll('.work-fig img')];
  return { total: a.length, loaded: a.filter(i => i.complete && i.naturalWidth>0).length,
    failed: a.filter(i => i.complete && i.naturalWidth===0).map(i => i.src.split('/').pop()) };
})()`);
console.log(JSON.stringify({ ...stats, imgs }, null, 2));
console.log('PROBLEMS:', probs.length ? probs : 'none');
const ok = stats.workCards === 10 && stats.workGenres === 10 && stats.siteCards === 7 &&
  stats.analyses.every(n => n >= 100) && probs.length === 0 &&
  stats.srcHosts.every(h => h === 'images.pexels.com') &&
  imgs.total === 10 && imgs.loaded === 10 && imgs.failed.length === 0;
console.log(ok ? 'GALLERY OK' : 'GALLERY FAIL');
c.close();

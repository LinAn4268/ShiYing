// 验收：6 主题 × 3 案例 = 18 例，含 6 项拍摄要素 + 图片加载 + 无 JS 异常
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
  const themes = [...document.querySelectorAll('#works .theme-group')];
  const cards = [...document.querySelectorAll('#works .work-card')];
  return {
    works: q('#works'), themeGroups: themes.length,
    themeNames: themes.map(t => t.querySelector('h3')?.textContent),
    perTheme: themes.map(t => t.querySelectorAll('.work-card').length),
    workCards: cards.length, workGenres: q('#works .work-genre'),
    specTotals: cards.map(c => c.querySelectorAll('.work-spec').length),
    analyses: [...document.querySelectorAll('#works .work-analysis')].map(p => p.textContent.length),
    differenceCount: [...document.querySelectorAll('#works .work-spec dt')].filter(d => d.textContent.includes('差异点')).length,
    siteCards: q('.site-card'),
    srcHosts: [...new Set([...document.images].map(i => { try { return new URL(i.src).host; } catch { return '?'; } }))],
    hero: (() => { const h = document.querySelector('#heroImg'); return h ? { host: new URL(h.src).host, loaded: h.complete && h.naturalWidth>0 } : null; })(),
    note: (document.querySelector('#worksNote')||{}).textContent || '',
  };
})()`);

// 逐卡滚动触发懒加载
for (let i = 0; i < stats.workCards; i++) {
  await c.evaluate(`document.querySelectorAll('#works .work-card')[${i}]?.scrollIntoView({block:'center'})`);
  await c.sleep(450);
}
// 轮询等待图片加载完成（全套连续运行时网络/标签页累积会拖慢加载）
let imgs;
for (let attempt = 0; attempt < 20; attempt++) {
  imgs = await c.evaluate(`(() => {
    const a = [...document.querySelectorAll('#works .work-fig img')];
    return { total: a.length, loaded: a.filter(i => i.complete && i.naturalWidth>0).length,
      failed: a.filter(i => i.complete && i.naturalWidth===0).map(i => i.src.split('/').pop()) };
  })()`);
  if (imgs.loaded >= 18 || imgs.failed.length > 0) break;
  await c.sleep(750);
}

console.log(JSON.stringify({ ...stats, imgs }, null, 2));
console.log('PROBLEMS:', probs.length ? probs : 'none');
const ok = stats.themeGroups === 6 && stats.workCards === 18 &&
  stats.perTheme.every(n => n === 3) && stats.specTotals.every(n => n === 6) &&
  stats.differenceCount === 18 && stats.analyses.every(n => n >= 100) &&
  stats.siteCards === 7 && probs.length === 0 &&
  stats.srcHosts.every(h => h === 'images.pexels.com') &&
  imgs.total === 18 && imgs.loaded === 18 && imgs.failed.length === 0;
console.log(ok ? 'GALLERY OK' : 'GALLERY FAIL');
c.close();

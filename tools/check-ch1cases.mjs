// 第一章案例专项验收：18 个案例卡迁入 ch1（1.4–1.9）后的结构、图片、跳转、无异常
import { connect } from './cdp.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');
const c = await connect(file);
await c.send('Page.enable');
await c.send('Runtime.enable');
await c.send('Log.enable');
await c.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 950, deviceScaleFactor: 1, mobile: false });
await c.sleep(1200);
await c.send('Page.reload', { ignoreCache: true });
await c.sleep(4000);

const probs = [];
for (const e of c.events) {
  if (e.method === 'Runtime.exceptionThrown') probs.push('EXC: ' + (e.params.exceptionDetails.exception?.description || e.params.exceptionDetails.text));
  if (e.method === 'Runtime.consoleAPICalled' && e.params.type === 'error') probs.push('ERR: ' + e.params.args.map(a => a.value ?? a.description).join(' '));
}

const stats = await c.evaluate(`(() => {
  const q = s => document.querySelectorAll(s).length;
  const ch1 = document.querySelector('#ch1');
  const caseItems = [...document.querySelectorAll('#ch1 .item.case-item')];
  const figs = [...document.querySelectorAll('#ch1 .case-item .work-fig img')];
  const specs = caseItems.map(it => it.querySelectorAll('.work-spec').length);
  const analyses = caseItems.map(it => it.querySelector('.work-analysis')?.textContent.length || 0);
  const details = caseItems.map(it => !!it.querySelector('.item-detail'));
  const links = caseItems.map(it => !!it.querySelector('.work-link'));
  const jump = document.querySelector('.works-jump a')?.getAttribute('href');
  const titles = caseItems.map(it => it.querySelector('h4')?.textContent);
  return {
    chapters: q('.chapter'),
    ch1Exists: !!ch1,
    ch1Num: ch1?.getAttribute('data-n'),
    caseItems: caseItems.length,
    unitsInCh1: q('#ch1 .unit'),
    figs: figs.length,
    figsWithSrc: figs.filter(i => i.src).length,
    specCounts: [...new Set(specs)],
    minAnalysis: Math.min(...analyses),
    maxAnalysis: Math.max(...analyses),
    allHaveDetail: details.every(Boolean),
    allHaveLink: links.every(Boolean),
    jump,
    firstTitles: titles.slice(0, 3),
    lastTitles: titles.slice(-3),
    galleryCards: q('#works .works-grid .work-card'),
    siteCards: q('#works .sites-grid .site-card')
  };
})()`);
console.log('STATS', JSON.stringify(stats, null, 2));
console.log('EXCEPTIONS', JSON.stringify(probs, null, 2));
const ok = stats.chapters === 10 && stats.ch1Exists && stats.ch1Num === '1' &&
  stats.caseItems === 18 && stats.unitsInCh1 === 9 && stats.figsWithSrc === 18 &&
  stats.specCounts.length === 1 && stats.specCounts[0] === 6 &&
  stats.minAnalysis >= 100 && stats.allHaveDetail && stats.allHaveLink &&
  stats.jump === '#ch1' && stats.galleryCards === 18 && probs.length === 0;
console.log(ok ? 'CH1CASES OK' : 'CH1CASES FAIL');
c.close();
process.exit(ok ? 0 : 1);

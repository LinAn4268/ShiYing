// 校验 135 个详解页的配图：结构、alt、来源链接，并抽样真实加载
import { readFileSync } from 'node:fs';
import { connect } from './cdp.mjs';

const PORT = process.env.CDP_PORT || 9333;
const BASE = 'file:///C:/Users/32289/Desktop/%E6%8B%BE%E5%BD%B1/detail.html';
const ids = JSON.parse(readFileSync('data/detail/valid-ids.json', 'utf8'));
const photos = JSON.parse(readFileSync('data/photos/detail.json', 'utf8'));

const c = await connect();
await c.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
const errs = [];

await c.send('Page.enable');
await c.send('Page.navigate', { url: BASE + '#' + ids[0] });
await c.sleep(3200);

const problems = [];
function ok(cond, msg) { if (!cond) problems.push(msg); return cond; }

// 1) 结构：逐条切换 hash，检查 figure / alt / credit
const structural = await c.evaluate(`(async () => {
  const ids = ${JSON.stringify(ids)};
  const out = [];
  for (const id of ids) {
    location.hash = id;
    await new Promise(r => setTimeout(r, 12));
    const fig = document.querySelector('.dt-fig');
    const img = fig && fig.querySelector('img');
    const a = fig && fig.querySelector('.dt-fig-credit');
    out.push({
      id,
      fig: !!fig,
      src: img ? img.getAttribute('src') : '',
      alt: img ? (img.getAttribute('alt') || '').trim() : '',
      hasSrcset: !!(img && img.getAttribute('srcset')),
      loading: img ? img.getAttribute('loading') : '',
      credit: a ? a.getAttribute('href') : '',
      target: a ? a.getAttribute('target') : '',
      rel: a ? a.getAttribute('rel') : '',
      text: a ? a.textContent.trim() : ''
    });
  }
  return out;
})()`);

const srcs = new Set();
for (const r of structural) {
  ok(r.fig, 'no figure: ' + r.id);
  ok(r.src && r.src.includes('images.pexels.com/photos/' + photos[r.id].id + '/'),
    'src mismatch: ' + r.id);
  ok(r.alt.length >= 8 && r.alt.length <= 60, 'alt length odd: ' + r.id + ' (' + r.alt.length + ')');
  ok(r.hasSrcset, 'no srcset: ' + r.id);
  ok(r.credit && r.credit.startsWith('https://www.pexels.com/photo/') && r.credit.endsWith('-' + photos[r.id].id + '/'),
    'credit url bad: ' + r.id);
  ok(r.target === '_blank' && /noopener/.test(r.rel || ''), 'credit link unsafe: ' + r.id);
  ok(r.text.includes('Pexels'), 'credit text missing source: ' + r.id);
  srcs.add(r.src);
}
ok(srcs.size === ids.length, 'duplicate images: ' + (ids.length - srcs.size));

// 2) 抽样真实加载（每章取 2 条，共 20 张）
const sample = [];
for (let ch = 1; ch <= 10; ch++) {
  const list = ids.filter((i) => i.startsWith(ch + '-'));
  sample.push(list[0], list[list.length - 1]);
}
const load = await c.evaluate(`(async () => {
  const ids = ${JSON.stringify(sample)};
  const out = [];
  for (const id of ids) {
    location.hash = id;
    await new Promise(r => setTimeout(r, 60));
    const img = document.querySelector('.dt-fig img');
    if (!img) { out.push({ id, ok: false, w: 0 }); continue; }
    await new Promise((res) => {
      if (img.complete) return res();
      img.addEventListener('load', res, { once: true });
      img.addEventListener('error', res, { once: true });
      setTimeout(res, 9000);
    });
    out.push({ id, ok: img.complete && img.naturalWidth > 0, w: img.naturalWidth });
  }
  return out;
})()`);
for (const l of load) ok(l.ok && l.w > 0, 'image not loaded: ' + l.id + ' (w=' + l.w + ')');

// 3) 失败降级：把一张图的 src 改坏，figure 应被隐藏
const fallback = await c.evaluate(`(async () => {
  location.hash = '${ids[0]}';
  await new Promise(r => setTimeout(r, 200));
  const img = document.querySelector('.dt-fig img');
  const fig = img.closest('.dt-fig');
  img.removeAttribute('srcset');
  img.src = 'https://images.pexels.com/photos/0/pexels-photo-0.jpeg';
  await new Promise(r => setTimeout(r, 2000));
  return { broken: fig.classList.contains('is-broken'), display: getComputedStyle(fig).display };
})()`);
ok(fallback.broken && fallback.display === 'none', 'fallback not applied: ' + JSON.stringify(fallback));

console.log(JSON.stringify({
  structural: structural.length,
  sampled: load.length,
  images: srcs.size,
  altRange: [Math.min(...structural.map((r) => r.alt.length)), Math.max(...structural.map((r) => r.alt.length))],
  fallback,
  errors: errs.length
}, null, 1));
const errs2 = c.events.filter(e => e.method === 'Runtime.exceptionThrown').map(e => e.params.exceptionDetails.text);
console.log('ERRS', JSON.stringify(errs2.slice(0, 3)));
console.log(problems.length ? 'PHOTO PROBLEMS:\n ' + problems.slice(0, 20).join('\n ') : 'PHOTO PROBLEMS: none');
c.close();

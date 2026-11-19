// 强调色矩阵：5 套模板 × 明暗 × 6 个预设色，逐一校验正文级对比度（≥4.5）
import { connect } from './cdp.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');
const c = await connect(file);
await c.send('Page.enable');
await c.send('Runtime.enable');
await c.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 950, deviceScaleFactor: 1, mobile: false });
await c.evaluate(`localStorage.clear()`);
await c.send('Page.reload');
await c.sleep(2500);
await c.evaluate(`document.querySelector('#lookBtn').click()`);
await c.sleep(300);

const res = await c.evaluate(`(async () => {
  const parse = (s) => {
    s = (s || '').trim();
    if (s.startsWith('#')) { const h = s.slice(1); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); }
    const m = s.match(/[\\d.]+/g); return m ? m.slice(0, 3).map(Number) : [0, 0, 0];
  };
  const lum = (rgb) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(rgb[0]) + 0.7152 * f(rgb[1]) + 0.0722 * f(rgb[2]); };
  const cr = (a, b) => { const l1 = lum(parse(a)), l2 = lum(parse(b)); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
  const root = document.documentElement;
  const themes = ['paper', 'cinema', 'grid', 'ink', 'mono'];
  const accents = ['#b0503a', '#2b5f9e', '#14795f', '#a8701a', '#7a4a8a', '#3f5d57'];
  const out = [];
  for (const th of themes) {
    for (const dk of ['false', 'true']) {
      root.setAttribute('data-theme', th);
      root.setAttribute('data-dark', dk);
      await new Promise(r => setTimeout(r, 60));
      for (const a of accents) {
        document.querySelector('[data-look-group="accent"][data-look-value="' + a + '"]').click();
        await new Promise(r => setTimeout(r, 45));
        const cs = getComputedStyle(root);
        const acc = cs.getPropertyValue('--accent').trim();
        const on = cs.getPropertyValue('--on-accent').trim();
        const soft = cs.getPropertyValue('--accent-soft').trim();
        const bg = cs.getPropertyValue('--bg').trim();
        const panel = cs.getPropertyValue('--panel').trim();
        const panel2 = cs.getPropertyValue('--panel-2').trim();
        out.push({
          theme: th, dark: dk, accent: a, got: acc,
          bg: +cr(acc, bg).toFixed(2), panel: +cr(acc, panel).toFixed(2), panel2: +cr(acc, panel2).toFixed(2),
          on: +cr(on, acc).toFixed(2), soft: +cr(acc, soft).toFixed(2)
        });
      }
    }
  }
  return out;
})()`);

const bad = res.filter((r) => Math.min(r.bg, r.panel, r.panel2, r.on, r.soft) < 4.45);
console.log('checked=' + res.length + ' below=' + bad.length);
for (const b of bad.slice(0, 20)) console.log('  FAIL', JSON.stringify(b));
const worst = res.reduce((m, r) => Math.min(m, r.bg, r.panel, r.panel2, r.on, r.soft), 99);
console.log('worst ratio=' + worst.toFixed(2));
console.log(bad.length ? 'ACCENT PROBLEMS: ' + bad.length : 'ACCENT PROBLEMS: none');
c.close();
process.exit(bad.length ? 1 : 0);

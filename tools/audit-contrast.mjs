import { connect } from './cdp.mjs';
import path from 'node:path';
const idx = 'file:///' + path.resolve('index.html').replace(/\\/g, '/');
const c = await connect('about:blank');
await c.send('Page.enable');
await c.send('Runtime.enable');
await c.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 950, deviceScaleFactor: 1, mobile: false });
await c.send('Page.navigate', { url: idx });
await c.sleep(800);

const js = `(() => {
  const parse = s => { const m = s.match(/[\\d.]+/g); return m ? m.map(Number) : null; };
  const lum = ([r,g,b]) => { const f = v => { v/=255; return v<=0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055,2.4); }; return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b); };
  const cr = (a,b) => { const l1=lum(a), l2=lum(b); return ((Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05)); };
  const bgOf = el => { let n=el; while(n){ const b=getComputedStyle(n).backgroundColor; const p=parse(b); if(p && (p.length<4 || p[3]>0.9)) return p.slice(0,3); n=n.parentElement; } return [255,255,255]; };
  const probe = (sel,label) => { const el=document.querySelector(sel); if(!el) return [label,'MISSING']; const s=getComputedStyle(el); const fg=parse(s.color).slice(0,3); const bg=bgOf(el); return [label, +cr(fg,bg).toFixed(2)]; };
  return [
    probe('body','body'),
    probe('.chapter-intro','chapter-intro'),
    probe('.item-text','item-text'),
    probe('.item h4','item-title'),
    probe('.cmp td','table-cell'),
    probe('.cmp thead th','table-head'),
    probe('.toc a','toc-link'),
    probe('.toc .sec-link','toc-sec'),
    probe('.hero-sub','hero-sub'),
    probe('.tag','tag'),
    probe('.unit-head .u-title','unit-title'),
    probe('.path-grid .p-desc','path-desc'),
    probe('.site-foot p','footer'),
  ];
})()`;

for (const theme of ['paper', 'cinema', 'grid']) {
  for (const dark of [false, true]) {
    await c.evaluate(`localStorage.setItem('shiying:theme', JSON.stringify('${theme}')); localStorage.setItem('shiying:dark','${dark}');`);
    await c.send('Page.reload');
    await c.sleep(700);
    const res = await c.evaluate(js);
    console.log(theme, dark ? 'dark' : 'light', JSON.stringify(res));
  }
}
c.close();

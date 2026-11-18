// 检查 3-4-2 段落内部造成不换行的行内元素
import { connect } from './cdp.mjs';
import path from 'node:path';

const c = await connect('about:blank');
await c.send('Page.enable');
await c.send('Runtime.enable');
await c.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
await c.send('Page.navigate', { url: 'file:///' + path.resolve('index.html').replace(/\\/g, '/') });
await c.sleep(900);

const r = await c.evaluate(`(function(){
  var p = document.querySelector('[id="3-4-2"] .item-text');
  var cs = getComputedStyle(p);
  var kids = [];
  p.querySelectorAll('*').forEach(function(k){
    var b = k.getBoundingClientRect();
    kids.push({ tag: k.tagName.toLowerCase(), cls: (k.className||'').toString().slice(0,20),
                text: (k.textContent||'').slice(0, 24), w: Math.round(b.width),
                ws: getComputedStyle(k).whiteSpace, disp: getComputedStyle(k).display });
  });
  return { text: p.textContent.slice(0, 120), ws: cs.whiteSpace, wb: cs.wordBreak, ow: cs.overflowWrap,
           ta: cs.textAlign, cw: p.clientWidth, sw: p.scrollWidth, kids: kids.slice(0, 14) };
})()`);
console.log(JSON.stringify(r, null, 1));
c.close();

// 找出 scrollWidth 超出 clientWidth 且不裁剪的元素（真正的横向溢出来源）
import { connect } from './cdp.mjs';
import path from 'node:path';

const c = await connect('about:blank');
await c.send('Page.enable');
await c.send('Runtime.enable');
await c.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
await c.send('Page.navigate', { url: 'file:///' + path.resolve('index.html').replace(/\\/g, '/') });
await c.sleep(900);

const r = await c.evaluate(`(function(){
  var out = [];
  var all = document.querySelectorAll('body *');
  for (var i = 0; i < all.length; i++) {
    var el = all[i];
    var cs = getComputedStyle(el);
    if (cs.display === 'none') continue;
    var clips = cs.overflowX !== 'visible';
    if (!clips && el.scrollWidth - el.clientWidth > 2 && el.clientWidth > 0) {
      out.push({ tag: el.tagName.toLowerCase(), id: el.id, cls: (el.className||'').toString().slice(0,28),
                 sw: el.scrollWidth, cw: el.clientWidth, ox: cs.overflowX });
    }
  }
  out.sort(function(a,b){ return (b.sw-b.cw) - (a.sw-a.cw); });
  return { base: document.documentElement.scrollWidth, n: out.length, top: out.slice(0, 12) };
})()`);
console.log(JSON.stringify(r, null, 1));
c.close();

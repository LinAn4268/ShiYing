// 逐个隐藏 topbar 子元素，定位横向溢出源
import { connect } from './cdp.mjs';
import path from 'node:path';

const c = await connect('about:blank');
await c.send('Page.enable');
await c.send('Runtime.enable');
await c.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
await c.send('Page.navigate', { url: 'file:///' + path.resolve('index.html').replace(/\\/g, '/') });
await c.sleep(900);

const r = await c.evaluate(`(function(){
  var res = { base: document.documentElement.scrollWidth };
  var tb = document.querySelector('.topbar');
  var kids = Array.prototype.slice.call(tb.children);
  kids.forEach(function(k){
    var old = k.style.display;
    k.style.display = 'none';
    var w = document.documentElement.scrollWidth;
    if (w !== res.base) res[(k.id || k.className || k.tagName).toString().slice(0, 30)] = w;
    k.style.display = old;
  });
  // 也测 topbar 本身的定位
  var cs = getComputedStyle(tb);
  res.tb = { pos: cs.position, w: tb.getBoundingClientRect().width };
  // 逐个子元素: 看其 scrollWidth / offsetWidth
  res.kidSizes = kids.map(function(k){
    return { id: k.id || (k.className || '').toString().slice(0, 20), ow: k.offsetWidth, sw: k.scrollWidth,
             right: Math.round(k.getBoundingClientRect().right) };
  });
  return res;
})()`);
console.log(JSON.stringify(r, null, 1));
c.close();

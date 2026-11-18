// 检查 topbar 内部元素是否超出视口
import { connect } from './cdp.mjs';
import path from 'node:path';

const c = await connect('about:blank');
await c.send('Page.enable');
await c.send('Runtime.enable');
await c.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
await c.send('Page.navigate', { url: 'file:///' + path.resolve('index.html').replace(/\\/g, '/') });
await c.sleep(900);

const r = await c.evaluate(`(function(){
  var tb = document.querySelector('.topbar');
  var arr = [];
  tb.querySelectorAll('*').forEach(function(el){
    var b = el.getBoundingClientRect();
    var cs = getComputedStyle(el);
    if (b.width > 0) arr.push({tag: el.tagName.toLowerCase(), id: el.id, cls: (el.className || '').toString().slice(0, 26),
      left: Math.round(b.left), right: Math.round(b.right), w: Math.round(b.width), pos: cs.position, ox: cs.overflowX});
  });
  arr.sort(function(a, b){ return b.right - a.right; });
  var tbw = tb.getBoundingClientRect();
  return { tb: {w: Math.round(tbw.width), right: Math.round(tbw.right), ox: getComputedStyle(tb).overflowX},
           top: arr.slice(0, 12) };
})()`);
console.log(JSON.stringify(r, null, 1));
c.close();

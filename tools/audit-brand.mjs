// 定位 .brand / .en / chapter-end h4 的实际颜色与背景
import { connect } from './cdp.mjs';
import path from 'node:path';

const c = await connect('about:blank');
await c.send('Page.enable');
await c.send('Runtime.enable');
await c.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 950, deviceScaleFactor: 1, mobile: false });
await c.send('Page.navigate', { url: 'file:///' + path.resolve('index.html').replace(/\\/g, '/') });
await c.sleep(600);
await c.evaluate(`localStorage.setItem('shiying:theme',JSON.stringify('paper'));localStorage.setItem('shiying:dark','false')`);
await c.send('Page.reload');
await c.sleep(800);

const r = await c.evaluate(`(function(){
  function info(el){
    if(!el) return null;
    var cs=getComputedStyle(el);
    var chain=[];
    var n=el;
    while(n && n!==document.documentElement){
      var b=getComputedStyle(n).backgroundColor;
      chain.push(n.tagName.toLowerCase()+'.'+((n.className||'').toString().split(' ')[0]||'')+'='+b);
      n=n.parentElement;
    }
    return {color:cs.color, fs:cs.fontSize, fw:cs.fontWeight, bgChain:chain.slice(0,5)};
  }
  var brands=[].slice.call(document.querySelectorAll('.brand')).map(function(b){return {txt:b.textContent.trim().slice(0,12), info:info(b)};});
  var h4=info(document.querySelector('.chapter-end h4'));
  return {brands:brands, h4:h4};
})()`);
console.log(JSON.stringify(r, null, 1));
c.close();

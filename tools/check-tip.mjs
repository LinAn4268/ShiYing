// 术语提示气泡：静止隐藏、hover/focus 时可见、不撑出横向滚动、气泡宽度不越界
// headless 下合成鼠标不触发 :hover，故用 CSS.forcePseudoState 强制 hover 状态验证样式分支
import { connect } from './cdp.mjs';
import path from 'node:path';

const url = 'file:///' + path.resolve('index.html').replace(/\\/g, '/');
const c = await connect('about:blank');
await c.send('Page.enable');
await c.send('Runtime.enable');
await c.send('DOM.enable');
await c.send('CSS.enable');
const out = [];
const ok = (n, p, x) => out.push({ n, p, x: x === undefined ? '' : x });

for (const [w, h, label] of [[1440, 950, 'desktop'], [390, 844, 'mobile']]) {
  await c.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 500 });
  await c.send('Page.navigate', { url });
  await c.sleep(500);
  await c.evaluate("localStorage.clear()");
  await c.send('Page.reload');
  await c.sleep(800);

  const before = await c.evaluate(`(function(){
    var t=document.querySelector('.term'); if(!t) return null;
    var cs=getComputedStyle(t,'::after');
    return {disp:cs.display, op:cs.opacity};
  })()`);
  ok(label + ' 静止时提示隐藏', before && before.disp === 'none', JSON.stringify(before));

  const doc = await c.send('DOM.getDocument', { depth: -1 });
  const node = await c.send('DOM.querySelector', { nodeId: doc.root.nodeId, selector: '.term' });
  await c.send('CSS.forcePseudoState', { nodeId: node.nodeId, forcedPseudoClasses: ['hover'] });
  await c.sleep(350);
  const hov = await c.evaluate(`(function(){
    var t=document.querySelector('.term');
    var cs=getComputedStyle(t,'::after');
    var r=t.getBoundingClientRect();
    return {disp:cs.display, op:cs.opacity, left:r.left,
            scrollW:document.documentElement.scrollWidth, vw:window.innerWidth};
  })()`);
  ok(label + ' 悬停后提示可见', hov && hov.disp === 'block' && parseFloat(hov.op) > 0.5, JSON.stringify(hov));
  ok(label + ' 悬停不撑宽页面', hov && hov.scrollW <= hov.vw + 1, hov && hov.scrollW + '/' + hov.vw);
  await c.send('CSS.forcePseudoState', { nodeId: node.nodeId, forcedPseudoClasses: [] });

  // 键盘路径：连续 Tab 直到焦点落在某个术语上（术语已带 tabindex="0"）
  await c.evaluate(`(function(){document.body.focus();})()`);
  await c.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  await c.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  let hitTerm = false;
  for (let i = 0; i < 90; i++) {
    const state = await c.evaluate(`(function(){
      var a=document.activeElement;
      return {cls:(a&&a.className||'').toString(), isTerm:!!(a&&a.classList&&a.classList.contains('term'))};
    })()`);
    if (state.isTerm) { hitTerm = true; break; }
    await c.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    await c.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  }
  await c.sleep(350);
  const foc = await c.evaluate(`(function(){
    var t=document.activeElement;
    var cs=getComputedStyle(t,'::after');
    return {isTerm:!!(t&&t.classList&&t.classList.contains('term')), disp:cs.display, op:cs.opacity,
            fv:!!(t&&t.matches&&t.matches(':focus-visible')),
            scrollW:document.documentElement.scrollWidth, vw:window.innerWidth};
  })()`);
  ok(label + ' Tab 可聚焦到术语', hitTerm && foc.isTerm, JSON.stringify({ hitTerm, isTerm: foc.isTerm }));
  ok(label + ' 聚焦后提示可见', foc && foc.disp === 'block' && parseFloat(foc.op) > 0.5, JSON.stringify(foc));
  ok(label + ' 聚焦不撑宽页面', foc && foc.scrollW <= foc.vw + 1, foc && foc.scrollW + '/' + foc.vw);

  const geo = await c.evaluate(`(function(){
    var t=document.querySelector('.term');
    var r=t.getBoundingClientRect();
    var st=getComputedStyle(t,'::after');
    var mw=parseFloat(st.maxWidth)||0;
    return {left:r.left, mw:mw, vw:window.innerWidth, fits:r.left+mw <= window.innerWidth+2};
  })()`);
  ok(label + ' 气泡最大宽度不越界', geo && geo.fits, JSON.stringify(geo));

  // 最靠右的术语：聚焦后气泡应左移收进视口，页面不得出现横向滚动
  const edge = await c.evaluate(`(function(){
    var all=document.querySelectorAll('.term'), best=null, bx=-1;
    all.forEach(function(t){ var r=t.getBoundingClientRect(); if(r.right>bx){bx=r.right;best=t;} });
    if(!best) return null;
    best.focus();
    var cs=getComputedStyle(best,'::after');
    var maxW=Math.min(280, window.innerWidth-32);
    return {right:bx, x:parseFloat(cs.left), ty:cs.transform, disp:cs.display, op:cs.opacity,
            maxW:maxW, vw:window.innerWidth, scrollW:document.documentElement.scrollWidth,
            fits:(parseFloat(cs.left)+maxW)<=window.innerWidth+1};
  })()`);
  ok(label + ' 靠右术语气泡收进视口', edge && edge.fits && edge.disp === 'block', JSON.stringify(edge));
  ok(label + ' 靠右术语不产生横向滚动', edge && edge.scrollW <= edge.vw + 1, edge && edge.scrollW + '/' + edge.vw);
}

const bad = out.filter(o => !o.p);
out.forEach(o => console.log((o.p ? 'PASS ' : 'FAIL ') + o.n + (o.x ? ' :: ' + o.x : '')));
console.log(bad.length ? 'TIP PROBLEMS: ' + bad.length : 'TIP PROBLEMS: none');
c.close();
process.exit(0);

import { connect } from './cdp.mjs';
const c = await connect('file:///C:/Users/32289/Desktop/%E6%8B%BE%E5%BD%B1/index.html');
await c.send('Page.enable');
await c.evaluate(`localStorage.clear();localStorage.setItem('shiying:theme',JSON.stringify('ink'));localStorage.setItem('shiying:dark','false');`);
await c.send('Page.reload'); await c.sleep(900);
const r = await c.evaluate(`(()=>{
  const out=[];
  document.querySelectorAll('.toc-ch .n').forEach(el=>{
    if(el.textContent.trim()!=='01') return;
    const cs=getComputedStyle(el);
    const row=el.closest('.toc-ch-row');
    out.push({color:cs.color, opacity:cs.opacity, rowBg:getComputedStyle(row).backgroundColor,
      blockCls:el.closest('.toc-block').className, alpha:getComputedStyle(row).backgroundColor.match(/[\\d.]+/g)});
  });
  return out;
})()`);
console.log(JSON.stringify(r,null,1));
c.close();

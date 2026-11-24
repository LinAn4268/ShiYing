import { connect } from './cdp.mjs';
const c = await connect('file:///C:/Users/32289/Desktop/%E6%8B%BE%E5%BD%B1/index.html');
await c.send('Page.enable');
await c.evaluate(`localStorage.clear();localStorage.setItem('shiying:theme',JSON.stringify('ink'));localStorage.setItem('shiying:dark','false');`);
await c.send('Page.reload'); await c.sleep(900);
const r = await c.evaluate(`(()=>{
  const out=[];
  document.querySelectorAll('span,em,b,i').forEach(el=>{
    if(el.children.length) return;
    if((el.textContent||'').trim()!=='01') return;
    const cs=getComputedStyle(el);
    if(parseFloat(cs.fontSize)>11.6) return;
    let p=el, chain=[];
    while(p && p!==document.body){chain.push(p.className||p.tagName);p=p.parentElement;}
    out.push({fs:cs.fontSize,w:cs.fontWeight,color:cs.color,op:cs.opacity,chain:chain.slice(0,4)});
  });
  return out;
})()`);
console.log(JSON.stringify(r,null,1));
c.close();

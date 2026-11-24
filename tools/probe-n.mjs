import { connect } from './cdp.mjs';
const c = await connect('file:///C:/Users/32289/Desktop/%E6%8B%BE%E5%BD%B1/index.html');
await c.send('Page.enable');
await c.evaluate(`localStorage.clear();localStorage.setItem('shiying:theme',JSON.stringify('ink'));localStorage.setItem('shiying:dark','false');`);
await c.send('Page.reload'); await c.sleep(4000);
const r = await c.evaluate(`(()=>{
  const out=[];
  document.querySelectorAll('span.n, .n').forEach(el=>{
    if((el.textContent||'').trim()!=='01') return;
    const cs=getComputedStyle(el);
    let p=el, bg='';
    while(p){const b=getComputedStyle(p).backgroundColor; if(b&&b!=='rgba(0, 0, 0, 0)'&&!/rgba\\(.*, 0\\)/.test(b)){bg=b+' <- '+p.className;break;} p=p.parentElement;}
    out.push({html:el.outerHTML, parent:el.parentElement.className, color:cs.color, fs:cs.fontSize, bg});
  });
  return out.slice(0,6);
})()`);
console.log(JSON.stringify(r,null,1));
c.close();

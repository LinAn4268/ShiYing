// 全量文本对比度审计：遍历所有可见文本元素，向上找实际背景色，按字号判定阈值
import { connect } from './cdp.mjs';
import path from 'node:path';

const themes = ['paper', 'cinema', 'grid', 'ink', 'mono'];
const darks = [false, true];
const c = await connect('about:blank');
await c.send('Page.enable');
await c.send('Runtime.enable');

const base = 'file:///' + path.resolve(process.env.PAGE||'index.html').replace(/\\/g, '/') + '?';
let worst = [];

for (const th of themes) {
  for (const dk of darks) {
    await c.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 950, deviceScaleFactor: 1, mobile: false });
    await c.send('Page.navigate', { url: path0() });
    await c.sleep(500);
    await c.evaluate(`localStorage.setItem('shiying:theme',JSON.stringify('${th}'));localStorage.setItem('shiying:dark','${dk}')`);
    await c.send('Page.reload');
    await c.sleep(800);
    const res = await c.evaluate(`(function(){
      function parse(rgb){
        if(!rgb) return null;
        var m=rgb.match(/[\\d.]+/g); if(!m) return null;
        var nums=m.map(Number);
        if(rgb.indexOf('color(srgb')>=0){ return nums.slice(0,3).map(function(v){return v*255;}); }
        return nums.slice(0,3);
      }
      function alpha(rgb){ var m=rgb?rgb.match(/[\\d.]+/g):null; if(!m) return 1;
        return m.length>=4?parseFloat(m[3]):1; }
      function lum(c){function f(v){v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);}return 0.2126*f(c[0])+0.7152*f(c[1])+0.0722*f(c[2]);}
      function cr(a,b){var l1=lum(a),l2=lum(b);return (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05);}
      function bgOf(el){
        var n=el;
        while(n && n!==document.documentElement){
          var bg=getComputedStyle(n).backgroundColor;
          if(bg && bg!=='rgba(0, 0, 0, 0)' && bg!=='transparent'){
            var p=parse(bg);
            if(p && alpha(bg)>0.55) return p;
          }
          n=n.parentElement;
        }
        return parse(getComputedStyle(document.body).backgroundColor)||[255,255,255];
      }
      function hasText(el){
        for(var i=0;i<el.childNodes.length;i++){var n=el.childNodes[i];
          if(n.nodeType===3 && n.textContent.trim().length>1) return true;}
        return false;
      }
      var bad=[], checked=0;
      document.querySelectorAll('body *').forEach(function(el){
        if(!hasText(el)) return;
        var cs=getComputedStyle(el);
        if(cs.display==='none'||cs.visibility==='hidden'||parseFloat(cs.opacity)===0) return;
        var r=el.getBoundingClientRect(); if(r.width<2||r.height<2) return;
        var fg=parse(cs.color); if(!fg) return;
        var bg=bgOf(el);
        var fs=parseFloat(cs.fontSize), fw=parseInt(cs.fontWeight)||400;
        var large = fs>=24 || (fs>=18.66 && fw>=700);
        var need = large?3.0:4.5;
        var v=cr(fg,bg); checked++;
        if(v<need) bad.push({tag:el.tagName.toLowerCase(),cls:(el.className||'').toString().slice(0,24),
          fs:Math.round(fs),w:fw,v:Math.round(v*100)/100,need:need,
          txt:(el.textContent||'').trim().slice(0,18)});
      });
      return {checked:checked, bad:bad.slice(0,12), nbad:bad.length};
    })()`);
    console.log(`${th}${dk ? ' dark' : ' light'}: checked=${res.checked} below=${res.nbad}`);
    if (res.nbad) console.log('   ', JSON.stringify(res.bad));
  }
}

function path0() { return base.slice(0, -1); }
c.close();

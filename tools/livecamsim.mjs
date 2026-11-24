import { connect } from './cdp.mjs';
const c = await connect('https://linan4268.github.io/ShiYing/camsim.html');
await c.send('Page.enable');
await c.send('Runtime.enable');
await c.sleep(4000);
const r = await c.evaluate(`(function(){
  var qa = function(s){return [].slice.call(document.querySelectorAll(s));};
  var shot = document.querySelector('.cs-shot img');
  return {
    title: document.title,
    iframes: qa('iframe').length,
    shot: shot ? {done: shot.complete, w: shot.naturalWidth, alt: shot.alt.length} : null,
    simLinks: qa('a[href*="/CamSim/"]').length,
    extUnsafe: qa('a[href^="http"]').filter(function(a){return a.target!=='_blank'||!/noopener/.test(a.rel||'')}).length,
    tasks: qa('.cs-tasks > li').length,
    sw: document.documentElement.scrollWidth, vw: innerWidth
  };
})()`);
const errs = c.events.filter(e => e.method === 'Runtime.exceptionThrown').length;
await c.screenshot('.shots/live-camsim.png');
console.log(JSON.stringify(r), 'ERRS', errs);
c.close();

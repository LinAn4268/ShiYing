import { connect } from './cdp.mjs';
const [theme, dark, w, h, name, scroll, load] = process.argv.slice(2);
const c = await connect('file:///C:/Users/32289/Desktop/%E6%8B%BE%E5%BD%B1/camsim.html');
await c.send('Page.enable');
await c.send('Emulation.setDeviceMetricsOverride', { width: +w, height: +h, deviceScaleFactor: 1, mobile: +w < 600 });
await c.evaluate(`localStorage.clear(); localStorage.setItem('shiying:theme', JSON.stringify('${theme}')); localStorage.setItem('shiying:dark', '${dark}');`);
await c.send('Page.reload'); await c.sleep(2200);
if (load === '1') { await c.evaluate(`document.querySelector('#csLoad').click()`); await c.sleep(15000); }
if (scroll) { await c.evaluate(`window.scrollTo(0, ${scroll})`); await c.sleep(800); }
await c.screenshot('.shots/' + name + '.png');
const st = await c.evaluate(`({cover: !!document.querySelector('#csFrameCover'), ifr: document.querySelectorAll('iframe').length, sw: document.documentElement.scrollWidth, vw: innerWidth})`);
console.log('shot', name, JSON.stringify(st));
c.close();

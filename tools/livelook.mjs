// 线上外观面板验证：node livelook.mjs <url> <theme> <dark:0|1> <name>
import { connect } from './cdp.mjs';
const [url, th = 'ink', dk = '0', name = 'live-look'] = process.argv.slice(2);
const c = await connect(url);
await c.send('Page.enable');
await c.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 950, deviceScaleFactor: 1, mobile: false });
await c.sleep(4500);
const errs = c.events.filter(e => e.method === 'Runtime.exceptionThrown');
await c.evaluate(`localStorage.clear(); localStorage.setItem('shiying:theme', JSON.stringify('${th}')); localStorage.setItem('shiying:dark', '${dk === '1'}')`);
await c.send('Page.reload');
await c.sleep(4500);
await c.evaluate(`document.querySelector('#lookBtn').click()`);
await c.sleep(800);
await c.screenshot('.shots/' + name + '.png');
console.log('LIVE', JSON.stringify(await c.evaluate(`({
  open: document.body.classList.contains('look-open'),
  theme: document.documentElement.dataset.theme,
  dark: document.documentElement.dataset.dark,
  cards: document.querySelectorAll('.look-theme').length,
  groups: document.querySelectorAll('.look-group').length,
  sw: document.documentElement.scrollWidth, iw: window.innerWidth,
  hero: (document.querySelector('#heroImg').currentSrc || '').slice(-14)
})`)), 'ERRS', errs.length);
c.close();

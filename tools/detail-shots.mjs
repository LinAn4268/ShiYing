import { connect } from './cdp.mjs';
import path from 'node:path';
const file = 'file:///' + path.resolve('detail.html').replace(/\\/g, '/');
const c = await connect('about:blank');
await c.send('Page.enable');
await c.send('Runtime.enable');
await c.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 950, deviceScaleFactor: 1, mobile: false });
const shots = [
  ['paper-light', 'paper', false, '4-2-2', 1440, 950, false],
  ['cinema-dark', 'cinema', true, '8-3-1', 1440, 950, false],
  ['grid-light', 'grid', false, '1-1-1', 1440, 950, false],
  ['paper-mobile', 'paper', false, '5-1-1', 390, 844, true],
];
for (const [tag, theme, dark, id, w, h, mobile] of shots) {
  await c.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile });
  await c.send('Page.navigate', { url: file + '#' + id });
  await c.sleep(400);
  await c.evaluate(`localStorage.clear(); localStorage.setItem('shiying:theme', ${JSON.stringify(JSON.stringify(theme))}); localStorage.setItem('shiying:dark', ${JSON.stringify(String(dark))});`);
  await c.send('Page.navigate', { url: file + '#' + id });
  await c.sleep(800);
  await c.screenshot('.shots/detail-' + tag + '.png');
  console.log(tag, 'ok', await c.evaluate(`document.title`));
}
await c.send('Emulation.clearDeviceMetricsOverride');
c.close();

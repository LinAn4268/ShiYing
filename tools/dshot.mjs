// 详情页截图：node dshot.mjs <hash> <theme> <dark 0/1> <w> <h> <outname>
import { connect } from './cdp.mjs';
import path from 'node:path';
import fs from 'node:fs';

const [hash = '1-1-1', theme = 'paper', dark = '0', w = '1440', h = '1000', name = 'dshot'] = process.argv.slice(2);
const url = 'file:///' + path.resolve('detail.html').replace(/\\/g, '/') + '#' + hash;
const c = await connect(url);
await c.send('Page.enable');
await c.send('Runtime.enable');
await c.send('Emulation.setDeviceMetricsOverride', {
  width: +w, height: +h, deviceScaleFactor: 1, mobile: +w < 500,
});
await c.sleep(600);
await c.evaluate(`localStorage.setItem('shiying:theme',JSON.stringify('${theme}'));localStorage.setItem('shiying:dark','${dark === '1'}')`);
await c.send('Page.reload');
await c.sleep(1400);
const b = await c.screenshot(path.join('.shots', name + '.png'));
console.log('saved .shots/' + name + '.png');
c.close();
process.exit(0);

// 外观面板截图：node shotlook.mjs <theme> <dark:0|1> <w> <h> <name>
import { connect } from './cdp.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');
const [th = 'paper', dk = '0', w = '1440', h = '950', name = 'look'] = process.argv.slice(2);
const c = await connect(file);
await c.send('Page.enable');
await c.send('Emulation.setDeviceMetricsOverride', { width: +w, height: +h, deviceScaleFactor: 1, mobile: +w < 700 });
await c.evaluate(`localStorage.clear(); localStorage.setItem('shiying:theme', JSON.stringify('${th}')); localStorage.setItem('shiying:dark', '${dk === '1'}')`);
await c.send('Page.reload');
await c.sleep(3000);
await c.evaluate(`document.querySelector('#lookBtn').click()`);
await c.sleep(600);
await c.screenshot('.shots/' + name + '.png');
console.log('shot', name, JSON.stringify(await c.evaluate(`({open:document.body.classList.contains('look-open'),sw:document.documentElement.scrollWidth,iw:window.innerWidth})`)));
c.close();

// 移动端抽屉截图：node shotdrawer.mjs <theme> <dark 0|1> <w> <h> <name>
import { connect } from './cdp.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');
const [theme = 'paper', dark = '0', w = '390', h = '844', name = 'drawer'] = process.argv.slice(2);

const c = await connect(file);
await c.send('Page.enable');
await c.send('Emulation.setDeviceMetricsOverride', { width: +w, height: +h, deviceScaleFactor: 2, mobile: true });
await c.evaluate(`(() => { localStorage.clear();
  localStorage.setItem('shiying:theme', JSON.stringify('${theme}'));
  localStorage.setItem('shiying:dark', '${dark === '1' ? 'true' : 'false'}');
})()`);
await c.send('Page.reload');
await c.sleep(2600);
await c.evaluate(`document.getElementById('tocBtn').click()`);
await c.sleep(600);
await c.screenshot(path.resolve(__dirname, '..', '.shots', name + '.png'));
const state = await c.evaluate(`({
  open: document.body.classList.contains('toc-open'),
  scrollW: document.documentElement.scrollWidth,
  innerW: window.innerWidth,
  blocks: [...document.querySelectorAll('.toc-block')].length,
  toggles: document.querySelectorAll('.toc-ch-toggle').length
})`);
console.log('shot', name, JSON.stringify(state));
c.close();

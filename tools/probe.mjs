import { connect } from './cdp.mjs';
import path from 'node:path';
import url from 'node:url';

const file = 'file:///' + path.resolve('index.html').replace(/\\/g, '/');
const c = await connect('about:blank');
await c.send('Page.enable');
await c.send('Runtime.enable');
await c.send('Log.enable');
const vp = { width: 1440, height: 950 };
await c.send('Emulation.setDeviceMetricsOverride', { ...vp, deviceScaleFactor: 1, mobile: false });
await c.send('Page.navigate', { url: file });
await c.sleep(2500);

const errors = c.events.filter(e => e.method === 'Runtime.exceptionThrown' || (e.method === 'Log.entryAdded' && ['error', 'warning'].includes(e.params.entry.level)));
console.log('console errors:', JSON.stringify(errors.map(e => e.params?.entry?.text || e.params?.exceptionDetails?.text), null, 1));

const info = await c.evaluate(`(() => ({
  chapters: document.querySelectorAll('.chapter').length,
  units: document.querySelectorAll('.unit').length,
  items: document.querySelectorAll('.item').length,
  tocLeaves: document.querySelectorAll('.toc-leaf').length,
  imgs: [...document.images].map(i => ({src: i.currentSrc.slice(0,60), w: i.naturalWidth, h: i.naturalHeight})),
  scrollW: document.documentElement.scrollWidth,
  clientW: document.documentElement.clientWidth,
  heroH: document.querySelector('.hero').getBoundingClientRect().height
}))()`);
console.log(JSON.stringify(info, null, 1).slice(0, 3000));
await c.screenshot('tools/shot-desktop-top.png');
await c.send('Runtime.evaluate', { expression: `document.documentElement.scrollTop = document.body.scrollHeight*0.35` });
await c.sleep(1200);
await c.screenshot('tools/shot-desktop-mid.png');
c.close();

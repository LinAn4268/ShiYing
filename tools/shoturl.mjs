import { connect } from './cdp.mjs';
const [url, out, w = '1280', h = '860'] = process.argv.slice(2);
const c = await connect(url);
await c.send('Page.enable');
await c.send('Emulation.setDeviceMetricsOverride', { width: +w, height: +h, deviceScaleFactor: 1, mobile: false });
await c.sleep(1500);
await c.screenshot(out);
console.log('shot', out);
c.close();

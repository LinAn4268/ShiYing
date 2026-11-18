import { connect } from './cdp.mjs';
const urls = process.argv.slice(2);
const c = await connect('about:blank');
await c.send('Page.enable');
await c.send('Runtime.enable');
await c.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
for (const u of urls) {
  await c.send('Page.navigate', { url: u });
  await c.sleep(5000);
  const info = await c.evaluate(`({url: location.href, title: document.title, h1: document.querySelector('h1')?.textContent?.trim().slice(0,80), og: document.querySelector('meta[property="og:title"]')?.content, img: document.querySelector('meta[property="og:image"]')?.content?.slice(0,100), body: document.body.innerText.slice(0,200)})`);
  console.log(JSON.stringify(info, null, 1));
}
c.close();

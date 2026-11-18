import { connect } from './cdp.mjs';
import fs from 'node:fs';

const queries = process.argv.slice(2);
const c = await connect('about:blank');
await c.send('Page.enable');
await c.send('Runtime.enable');
await c.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });

const out = {};
for (const q of queries) {
  await c.send('Page.navigate', { url: 'https://unsplash.com/s/photos/' + encodeURIComponent(q) });
  await c.sleep(6000);
  const res = await c.evaluate(`(() => {
    const anchors = [...document.querySelectorAll('a[href^="/photos/"]')];
    return anchors.slice(0, 40).map(a => {
      const img = a.querySelector('img');
      return {
        href: a.getAttribute('href'),
        text: (a.getAttribute('title') || a.textContent || '').trim().slice(0, 80),
        img: img ? (img.currentSrc || img.src || '') : '',
        alt: img ? img.alt : ''
      };
    }).filter(x => x.img.includes('images.unsplash.com'));
  })()`);
  out[q] = { title: await c.evaluate('document.title'), items: res };
  console.log('==', q, 'items', res.length);
  for (const it of res.slice(0, 6)) console.log(JSON.stringify(it));
}
fs.writeFileSync('tools/unsplash-scrape.json', JSON.stringify(out, null, 1));
c.close();

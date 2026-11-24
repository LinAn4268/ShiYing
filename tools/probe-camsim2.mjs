import { connect } from './cdp.mjs';
const c = await connect('https://linan4268.github.io/CamSim/');
await c.send('Page.enable');
await c.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await c.sleep(9000);
const tabs = ['曝光','对焦','色彩','驱动','镜头','设置'];
for (const t of tabs) {
  const out = await c.evaluate(`(async () => {
    const b = [...document.querySelectorAll('button')].find(x => (x.innerText||'').trim().includes('${t}') && x.innerText.trim().length < 12);
    if (!b) return { tab: '${t}', err: 'no-tab' };
    b.click();
    await new Promise(r => setTimeout(r, 700));
    const panel = document.querySelector('aside') || document.body;
    return { tab: '${t}', text: panel.innerText.slice(0, 1200) };
  })()`);
  console.log('=== ' + JSON.stringify(out).slice(0, 1400));
}
c.close();

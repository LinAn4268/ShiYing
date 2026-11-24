import { connect } from './cdp.mjs';
const c = await connect('https://linan4268.github.io/CamSim/');
await c.send('Page.enable');
await c.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await c.sleep(9000);
const info = await c.evaluate(`(() => {
  const t = document.body.innerText;
  const btns = [...document.querySelectorAll('button')].map(b => (b.innerText || b.getAttribute('aria-label') || '').trim()).filter(Boolean);
  const labels = [...document.querySelectorAll('label,legend,th,h1,h2,h3')].map(e => e.innerText.trim()).filter(Boolean);
  const inputs = [...document.querySelectorAll('input,select')].map(e => e.type + ':' + (e.name||e.id||'') + ':' + (e.getAttribute('aria-label')||''));
  return { title: document.title, textLen: t.length, text: t.slice(0, 3000), btns: btns.slice(0,60), labels: labels.slice(0,60), inputs: inputs.slice(0,40), canvases: document.querySelectorAll('canvas').length };
})()`);
console.log(JSON.stringify(info, null, 1));
await c.screenshot('.shots/camsim-live.png');
c.close();

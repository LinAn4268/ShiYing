// Minimal CDP driver (no deps, Node 22+ global WebSocket)
import fs from 'node:fs';

const PORT = process.env.CDP_PORT || 9333;
const base = `http://127.0.0.1:${PORT}`;

export async function connect(url) {
  const t = await (await fetch(`${base}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' })).json();
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0;
  const pending = new Map();
  const events = [];
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { res, rej } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result);
    } else if (msg.method) events.push(msg);
  };
  const send = (method, params = {}) => new Promise((res, rej) => {
    const mid = ++id;
    pending.set(mid, { res, rej });
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
  const evaluate = async (expr, awaitPromise = true) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise, userGesture: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'eval error');
    return r.result.value;
  };
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const screenshot = async (file, opts = {}) => {
    const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, ...opts });
    fs.writeFileSync(file, Buffer.from(r.data, 'base64'));
  };
  return { send, evaluate, events, sleep, screenshot, close: () => ws.close() };
}

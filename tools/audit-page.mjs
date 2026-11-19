import { connect } from './cdp.mjs';
import path from 'node:path';

const idx = 'file:///' + path.resolve('index.html').replace(/\\/g, '/');
const det = 'file:///' + path.resolve('detail.html').replace(/\\/g, '/');
const c = await connect('about:blank');
await c.send('Page.enable');
await c.send('Runtime.enable');
await c.send('Log.enable');

function rep(label, v) { console.log(label, JSON.stringify(v)); }

// ---- 1. 移动端横向滚动 ----
for (const [name, url] of [['index', idx], ['detail', det + '#8-1-1']]) {
  for (const w of [320, 360, 390, 430]) {
    await c.send('Emulation.setDeviceMetricsOverride', { width: w, height: 800, deviceScaleFactor: 1, mobile: true });
    await c.send('Page.navigate', { url });
    await c.sleep(700);
    const r = await c.evaluate(`(() => {
      const wide = [...document.querySelectorAll('body *')].filter(el => {
        const b = el.getBoundingClientRect();
        return b.width > 0 && b.right > innerWidth + 1.5 && getComputedStyle(el).position !== 'fixed';
      }).slice(0, 6).map(el => el.tagName + '.' + (el.className || '').toString().split(' ')[0] + ':' + Math.round(el.getBoundingClientRect().right));
      return { sw: document.documentElement.scrollWidth, iw: innerWidth, wide };
    })()`);
    console.log(name, w, 'scrollW=' + r.sw, 'innerW=' + r.iw, r.sw > r.iw ? 'OVERFLOW ' + JSON.stringify(r.wide) : 'ok');
  }
}
await c.send('Emulation.clearDeviceMetricsOverride');

// ---- 2. 桌面 1440：控制台错误 + 布局溢出 ----
await c.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 950, deviceScaleFactor: 1, mobile: false });
for (const [name, url] of [['index', idx], ['detail', det + '#8-1-1']]) {
  c.events.length = 0;
  await c.send('Page.navigate', { url });
  await c.sleep(1500);
  // 展开全部小节以触发所有渲染路径
  if (name === 'index') {
    await c.evaluate(`document.querySelectorAll('.unit-head').forEach(b => { if (b.getAttribute('aria-expanded') === 'false') b.click(); })`);
    await c.sleep(800);
  }
  const errs = c.events.filter(e => e.method === 'Runtime.exceptionThrown' || (e.method === 'Log.entryAdded' && e.params.entry.level === 'error'));
  rep(name + ' errors', errs.map(e => e.params.entry ? e.params.entry.text : e.params.exceptionDetails.text).slice(0, 5));
  const imgs = await c.evaluate(`[...document.images].map(i => ({ src: i.currentSrc.slice(0, 60), done: i.complete, ok: i.complete && i.naturalWidth > 0, alt: !!i.alt }))`);
  rep(name + ' imgs', {
    total: imgs.length,
    ok: imgs.filter(i => i.ok).length,
    pending: imgs.filter(i => !i.done).length,
    noAlt: imgs.filter(i => !i.alt).length,
    bad: imgs.filter(i => i.done && !i.ok).map(i => i.src).slice(0, 5)
  });
}

// ---- 3. 详情页：135 条全量渲染 ----
c.events.length = 0;
await c.send('Page.navigate', { url: det });
await c.sleep(1200);
const all = await c.evaluate(`(() => {
  const ids = DETAILS.map(d => d.id);
  const out = { n: ids.length, fails: [], short: [], emptyBlock: [] };
  location.hash = '#' + ids[0];
  return out;
})()`);
// 逐条切换，检查异常与空块
const bulk = await c.evaluate(`(() => {
  const res = { checked: 0, errs: [], empty: [], tiny: [], noStep: [], noKw: [] };
  const ids = DETAILS.map(d => d.id);
  for (const id of ids) {
    try {
      window.dispatchEvent(new HashChangeEvent('hashchange'));
      location.hash = '#' + id;
      // 手动调用渲染：hashchange 是异步的，直接检查数据层与模板层
      const d = DETAILS.find(x => x.id === id);
      res.checked++;
      if (!d) { res.errs.push(id + ':nodata'); continue; }
      const prose = (d.lead || '').length + (d.principle || '').length + (d.example || '').length + (d.takeaway || '').length;
      if (prose < 250) res.tiny.push(id + ':' + prose);
      if (!d.steps || !d.steps.length) res.noStep.push(id);
      if (!d.keywords || !d.keywords.length) res.noKw.push(id);
      for (const k of ['lead', 'principle', 'example', 'takeaway', 'steps', 'mistakes', 'keywords']) {
        if (!d[k] || (Array.isArray(d[k]) && !d[k].length)) res.empty.push(id + ':' + k);
      }
    } catch (e) { res.errs.push(id + ':' + e.message); }
  }
  return res;
})()`);
rep('detail data audit', bulk);

// ---- 4. 键盘可达性：Tab 焦点是否可见 ----
await c.send('Page.navigate', { url: idx });
await c.sleep(900);
const focusTest = await c.evaluate(`(() => {
  const seq = [];
  document.body.focus();
  for (let i = 0; i < 12; i++) {
    // 无法真正派发 Tab 默认行为，改为检查可聚焦元素与 focus 样式规则
  }
  const els = [...document.querySelectorAll('a[href],button,input,[tabindex]:not([tabindex="-1"])')].filter(e => e.offsetParent !== null);
  const noName = els.filter(e => !(e.getAttribute('aria-label') || e.textContent.trim() || e.getAttribute('title'))).length;
  const styles = [...document.styleSheets].flatMap(s => { try { return [...s.cssRules].map(r => r.cssText); } catch { return []; } });
  return { focusable: els.length, noName, hasFocusVisible: styles.some(s => s.includes(':focus-visible')), hasSkip: !!document.querySelector('.skip-link') };
})()`);
rep('index a11y', focusTest);

// ---- 5. 链接完整性 ----
const links = await c.evaluate(`[...document.querySelectorAll('a[href]')].map(a => ({ h: a.getAttribute('href'), t: a.target, r: a.rel }))`);
const anchors = links.filter(l => l.h.startsWith('#'));
const external = links.filter(l => /^https?:/.test(l.h));
const detailLinks = links.filter(l => l.h.startsWith('detail.html'));
rep('index links', { total: links.length, anchors: anchors.length, external: external.length, detail: detailLinks.length, unsafe: external.filter(l => l.t !== '_blank' || !/noopener/.test(l.r || '')).length });

const badAnchors = await c.evaluate(`[...document.querySelectorAll('a[href^="#"]')].map(a => a.getAttribute('href').slice(1)).filter(id => id && !document.getElementById(id))`);
rep('index broken anchors', badAnchors);

c.close();

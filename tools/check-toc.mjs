// 目录收纳专项测试：章级折叠、持久化、滚动自动展开、搜索还原
import { connect } from './cdp.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');

const c = await connect(file);
await c.send('Page.enable');
await c.send('Runtime.enable');
await c.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 950, deviceScaleFactor: 1, mobile: false });
await c.evaluate(`localStorage.clear()`);
await c.send('Page.reload');
await c.sleep(2500);

const fails = [];
const ok = (name, cond, detail) => { console.log((cond ? 'PASS ' : 'FAIL ') + name + (detail ? ' :: ' + detail : '')); if (!cond) fails.push(name); };

const snap = () => c.evaluate(`(() => {
  const b = document.querySelector('.toc-block[data-ch="ch1"]');
  const secs = b.querySelector('.toc-secs');
  const btn = b.querySelector('.toc-ch-toggle');
  return {
    open: b.classList.contains('is-open'),
    display: getComputedStyle(secs).display,
    aria: btn.getAttribute('aria-expanded'),
    label: btn.getAttribute('aria-label'),
    openBlocks: [...document.querySelectorAll('.toc-block.is-open')].map(x => x.dataset.ch),
    leavesVisible: [...b.querySelectorAll('.toc-leaves li')].filter(li => li.offsetParent !== null).length
  };
})()`);

const click = (sel) => c.evaluate(`document.querySelector('${sel}').click()`);

// 1. 默认第一章展开
let s = await snap();
ok('默认第一章展开', s.open === true && s.display !== 'none', JSON.stringify(s));
ok('章级按钮有无障碍名称', /展开或收起第1章/.test(s.label || ''), s.label);

// 2. 点章级箭头 → 收起
await click('.toc-block[data-ch="ch1"] .toc-ch-toggle');
await c.sleep(200);
s = await snap();
ok('点击后第一章收起', s.open === false && s.display === 'none' && s.aria === 'false', JSON.stringify(s));

// 3. 刷新后保持收起
await c.send('Page.reload');
await c.sleep(2000);
s = await snap();
ok('刷新后仍收起（已记忆）', s.open === false && s.display === 'none', JSON.stringify(s));

// 4. 再次点开
await click('.toc-block[data-ch="ch1"] .toc-ch-toggle');
await c.sleep(200);
s = await snap();
ok('再次点击展开', s.open === true && s.display !== 'none', JSON.stringify(s));

// 5. 滚动到第五章：第五章自动展开，第一章（手动开着）保持
await c.evaluate(`(() => {
  const y = document.getElementById('ch5').getBoundingClientRect().top + window.scrollY - 60;
  window.scrollTo({ top: y, behavior: 'instant' });
})()`);
await c.sleep(1500);
s = await snap();
const ch5 = await c.evaluate(`document.querySelector('.toc-block[data-ch="ch5"]').classList.contains('is-open')`);
ok('滚动到第五章时自动展开', ch5 === true);
ok('手动展开的第一章不受影响', s.open === true, JSON.stringify(s.openBlocks));

// 6. 搜索时命中的章自动展开；清空后还原
await c.evaluate(`(() => { const i = document.getElementById('search'); i.value = '光圈'; i.dispatchEvent(new Event('input', { bubbles: true })); })()`);
await c.sleep(1200);
const during = await c.evaluate(`[...document.querySelectorAll('.toc-block:not([hidden])')].map(b => ({ ch: b.dataset.ch, open: b.classList.contains('is-open') }))`);
ok('搜索时命中章全部展开', during.length > 0 && during.every(x => x.open), JSON.stringify(during));
await c.evaluate(`document.getElementById('searchClear').click()`);
await c.sleep(800);
const after = await c.evaluate(`[...document.querySelectorAll('.toc-block.is-open')].map(b => b.dataset.ch)`);
ok('清空搜索后折叠状态还原（第一章仍开）', after.includes('ch1'), JSON.stringify(after));

// 7. 键盘可用：Tab 能聚焦章级按钮，Enter 可折叠
const focusable = await c.evaluate(`(() => { const b = document.querySelector('.toc-block[data-ch="ch2"] .toc-ch-toggle'); b.focus(); return document.activeElement === b; })()`);
ok('章级按钮可聚焦', focusable === true);

console.log(fails.length ? 'TOC PROBLEMS: ' + fails.join(' | ') : 'TOC PROBLEMS: none');
c.close();

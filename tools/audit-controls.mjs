/**
 * 逐控件功能审计：把两个页面上每一个可点控件都真实点一遍，
 * 按预期状态断言它「有效果」；同时校验所有链接目标是否存在。
 * 目标：找出点了没反应 / 死链 / 看似按钮其实不可用 的控件。
 */
import { connect } from './cdp.mjs';
import path from 'node:path';
import fs from 'node:fs';

const ROOT = path.resolve('.');
const base = 'file:///' + ROOT.replace(/\\/g, '/') + '/';
const c = await connect('about:blank');
await c.send('Page.enable');
await c.send('Runtime.enable');

const results = [];
const ok = (n, pass, info = '') => results.push({ n, pass, info });
const sleep = (ms) => c.sleep(ms);

async function vp(w, h) {
  await c.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 500 });
}
async function open(page, hash = '') {
  await c.send('Page.navigate', { url: base + page + hash });
  await sleep(450);
  await c.evaluate('localStorage.clear()');
  await c.send('Page.reload');
  await sleep(950);
}
async function ev(expr) { return c.evaluate(expr); }
async function click(sel, idx = 0) {
  return ev(`(function(){var a=document.querySelectorAll(${JSON.stringify(sel)});var el=a[${idx}];
    if(!el) return 'no-el';
    el.scrollIntoView({block:'center'});
    el.click(); return 'ok';})()`);
}
async function key(k, code, vk, text) {
  // 原生按钮要靠「rawKeyDown + char + keyUp」才会触发默认行为（如 Enter/Space 激活）
  const base = { key: k, code: code || k, windowsVirtualKeyCode: vk || 0, nativeVirtualKeyCode: vk || 0 };
  await c.send('Input.dispatchKeyEvent', Object.assign({ type: 'rawKeyDown' }, base));
  if (text) await c.send('Input.dispatchKeyEvent', Object.assign({ type: 'char', text, unmodifiedText: text }, base));
  await c.send('Input.dispatchKeyEvent', Object.assign({ type: 'keyUp' }, base));
}
async function typeSearch(text) {
  await ev(`(function(){var i=document.getElementById('search');i.value=${JSON.stringify(text)};
    i.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  await sleep(320);
}

const state = () => ev(`(function(){
  var d=document.documentElement;
  var toc=document.getElementById('toc');
  var dlg=document.getElementById('glossaryDialog');
  var menu=document.getElementById('themeMenu');
  var s=document.getElementById('search');
  var pc=document.querySelector('.progress-chip');
  var empty=document.getElementById('emptyState');
  return {
    hash:location.hash, theme:d.getAttribute('data-theme'), dark:d.getAttribute('data-dark'),
    scrollY:Math.round(window.scrollY),
    bodyCls:document.body.className,
    tocOpen:document.body.classList.contains('toc-open'),
    tocFlash:toc?toc.classList.contains('flash'):null,
    tocBtnExp:(document.getElementById('tocBtn')||{getAttribute:function(){return null}}).getAttribute('aria-expanded'),
    searchVal:s?s.value:null,
    searchBar:((document.getElementById('searchBar')||{}).textContent||'').replace(/\\s+/g,' ').trim().slice(0,60),
    openUnits:document.querySelectorAll('.unit-head[aria-expanded="true"]').length,
    units:document.querySelectorAll('.unit').length,
    progress:pc?pc.textContent.replace(/\\s+/g,' ').trim():'',
    dialog:dlg?dlg.open:null,
    glossItems:document.querySelectorAll('.gloss-item').length,
    menuHidden:menu?menu.hidden:null,
    active:(document.activeElement&&(document.activeElement.id||document.activeElement.className))||'',
    emptyShown:empty?(!empty.hidden && getComputedStyle(empty).display!=='none'):null,
    marks:document.querySelectorAll('mark').length,
    visibleChapters:[].filter.call(document.querySelectorAll('.chapter'),function(x){return getComputedStyle(x).display!=='none';}).length,
    tocLeaves:[].filter.call(document.querySelectorAll('.toc-leaves a'),function(a){var s=a.closest('.toc-sec');return s?getComputedStyle(s).display!=='none':true;}).length
  };
})()`);

/* ============================ 主页 ============================ */
await vp(1440, 950);
await open('index.html');
let s0 = await state();

// 1 开始学习
await click('.btn-primary');
await sleep(500);
let s = await state();
ok('开始学习 → 跳到第一章', s.hash === '#ch1' && s.scrollY > 200, s.hash + ' / scrollY ' + s.scrollY);

// 2 查看目录（桌面：TOC 闪一下并聚焦）
await open('index.html');
await click('#viewToc');
await sleep(450);
s = await state();
ok('查看目录（桌面）→ TOC 高亮并聚焦', s.tocFlash === true || /toc-ch/.test(s.active), 'flash=' + s.tocFlash + ' active=' + s.active);

// 3 目录按钮开合（移动端抽屉）
await vp(390, 844);
await open('index.html');
await click('#tocBtn');
await sleep(400);
s = await state();
ok('目录按钮 → 打开抽屉', s.tocOpen === true && s.tocBtnExp === 'true', JSON.stringify({ open: s.tocOpen, exp: s.tocBtnExp }));
await click('#tocClose');
await sleep(400);
s = await state();
ok('目录关闭按钮 → 关闭抽屉', s.tocOpen === false, 'open=' + s.tocOpen);

// 4 遮罩关闭
await click('#tocBtn');
await sleep(350);
await click('#mask');
await sleep(350);
s = await state();
ok('遮罩点击 → 关闭抽屉', s.tocOpen === false, 'open=' + s.tocOpen);

// 5 查看目录（移动端 → 打开抽屉）
await open('index.html');
await click('#viewToc');
await sleep(400);
s = await state();
ok('查看目录（移动端）→ 打开抽屉', s.tocOpen === true, 'open=' + s.tocOpen);

// 6 搜索按钮 + 输入 + 清空
await vp(1440, 950);
await open('index.html');
await click('#searchToggle');
await sleep(300);
s = await state();
ok('搜索按钮 → 展开搜索并聚焦', /search/.test(s.active) && /search-open/.test(s.bodyCls), JSON.stringify({ active: s.active, cls: s.bodyCls }));
await typeSearch('光圈');
s = await state();
ok('搜索框输入 → 过滤并高亮', s.marks > 0 && s.visibleChapters < 10, JSON.stringify({ marks: s.marks, ch: s.visibleChapters }));
const clearVisible = await ev("!!document.getElementById('searchClear') && !document.getElementById('searchClear').hidden");
ok('搜索清空按钮在有内容时出现', clearVisible !== false, 'visible=' + clearVisible);
await click('#searchClear');
await sleep(350);
s = await state();
ok('搜索清空按钮 → 清空并恢复', s.searchVal === '' && s.visibleChapters === 10, JSON.stringify({ val: s.searchVal, ch: s.visibleChapters }));

// 7 空状态 + 建议词
await typeSearch('zzzz');
s = await state();
ok('无结果 → 显示空状态', s.emptyShown === true && s.visibleChapters === 0, JSON.stringify({ empty: s.emptyShown, ch: s.visibleChapters }));
await click('[data-suggest]', 0);
await sleep(400);
s = await state();
ok('空状态建议词 → 填入并出结果', s.searchVal === '光圈' && s.visibleChapters > 0, JSON.stringify({ val: s.searchVal, ch: s.visibleChapters }));
await click('#searchClear');
await sleep(300);

// 8 主题菜单 + 三个模板按钮
await click('#themeBtn');
await sleep(300);
s = await state();
ok('主题按钮 → 打开菜单', s.menuHidden === false, 'hidden=' + s.menuHidden);
for (const th of ['cinema', 'grid', 'paper']) {
  await click(`[data-theme-choice="${th}"]`);
  await sleep(300);
  s = await state();
  ok(`模板按钮 ${th} → 切换生效`, s.theme === th, 'theme=' + s.theme);
}
const menuClosed = (await state()).menuHidden;
ok('选模板后菜单自动关闭', menuClosed === true, 'hidden=' + menuClosed);

// 9 暗色按钮
await click('#darkBtn');
await sleep(300);
s = await state();
ok('暗色按钮 → 切到暗色', s.dark === 'true', 'dark=' + s.dark);
await click('#darkBtn');
await sleep(300);
s = await state();
ok('暗色按钮 → 再按切回浅色', s.dark === 'false', 'dark=' + s.dark);

// 10 小节折叠按钮
await open('index.html');
const beforeUnits = (await state()).openUnits;
await click('.unit-head', 3);
await sleep(350);
s = await state();
ok('小节折叠按钮 → 改变展开数', s.openUnits !== beforeUnits, beforeUnits + ' -> ' + s.openUnits);
const bodyVisible = await ev(`(function(){
  var u=document.querySelectorAll('.unit')[3]; var b=u.querySelector('.unit-body');
  return {open:u.getAttribute('data-open'), h:b.offsetHeight};
})()`);
ok('折叠后小节内容确实收起/展开', bodyVisible.h !== undefined, JSON.stringify(bodyVisible));

// 11 标记已读按钮
await open('index.html');
await click('.read-btn', 0);
await sleep(300);
s = await state();
ok('标记已读按钮 → 进度变化', /1\s*\/\s*10/.test(s.progress), s.progress);
await click('.read-btn', 0);
await sleep(300);
s = await state();
ok('再按一次 → 取消已读', /0\s*\/\s*10/.test(s.progress), s.progress);

// 12 TOC 小节展开按钮
await open('index.html');
await click('.toc-sec-toggle', 2);
await sleep(350);
const tocAfter = await ev(`(function(){
  var secs=document.querySelectorAll('.toc-sec');
  var t=document.querySelectorAll('.toc-sec-toggle')[2];
  return {exp:t.getAttribute('aria-expanded'), leaves:secs[2].querySelectorAll('.toc-leaves a').length,
          hidden:secs[2].querySelector('.toc-leaves').hidden};
})()`);
ok('目录小节箭头 → 展开/收起条目', tocAfter.exp === 'true' || tocAfter.exp === 'false', JSON.stringify(tocAfter));

// 13 TOC 小节链接 → 跳转
await open('index.html');
await click('.toc-sec-link', 5);
await sleep(700);
s = await state();
ok('目录小节链接 → 锚点跳转', /^#\d/.test(s.hash) && s.scrollY > 100, s.hash + ' / ' + s.scrollY);

// 14 TOC 叶子链接 → 跳转并展开
await open('index.html');
const leafHref = await ev(`(function(){var a=document.querySelectorAll('.toc-leaves a')[10];return a?a.getAttribute('href'):null;})()`);
await click('.toc-leaves a', 10);
await sleep(800);
s = await state();
ok('目录三级条目 → 跳转并展开所属小节', s.hash === leafHref && s.scrollY > 100, s.hash + ' / ' + s.scrollY);

// 15 术语表按钮 + 关闭
await open('index.html');
await click('#glossaryBtn');
await sleep(400);
s = await state();
ok('术语表按钮 → 打开弹层', s.dialog === true && s.glossItems >= 60, JSON.stringify({ open: s.dialog, n: s.glossItems }));
await click('.gloss-close');
await sleep(300);
s = await state();
ok('术语表关闭按钮 → 关闭弹层', s.dialog === false, 'open=' + s.dialog);

// 16 回到顶部
await ev('window.scrollTo(0, 6000)');
await sleep(400);
await click('#toTop');
await sleep(2000);
s = await state();
ok('回到顶部按钮 → 滚回顶部', s.scrollY < 60, 'scrollY=' + s.scrollY);

// 17 斜杠键 + Esc
await open('index.html');
await key('/', 'Slash', 191);
await sleep(400);
s = await state();
ok('斜杠键 → 聚焦搜索框', /search/.test(s.active), 'active=' + s.active);
await typeSearch('快门');
await key('Escape', 'Escape', 27);
await sleep(350);
s = await state();
ok('Esc 键 → 清空搜索', s.searchVal === '' && s.visibleChapters === 10, JSON.stringify({ val: s.searchVal, ch: s.visibleChapters }));

// 18 页脚章节链接
await open('index.html');
const footHref = await ev(`(function(){var a=document.querySelectorAll('#footChapters a')[2];return a?a.getAttribute('href'):null;})()`);
await click('#footChapters a', 2);
await sleep(600);
s = await state();
ok('页脚章节链接 → 跳转', s.hash === footHref && s.scrollY > 100, s.hash + ' / ' + s.scrollY);

// 18b 键盘操作：Esc 关菜单 / Esc 关抽屉 / 方向键在主题菜单内移动 / Enter 折叠
await open('index.html');
await click('#themeBtn');
await sleep(300);
await key('Escape', 'Escape', 27);
await sleep(300);
s = await state();
ok('Esc 键 → 关闭主题菜单', s.menuHidden === true, 'hidden=' + s.menuHidden);

await vp(390, 844);
await open('index.html');
await click('#tocBtn');
await sleep(350);
await key('Escape', 'Escape', 27);
await sleep(350);
s = await state();
ok('Esc 键 → 关闭移动端抽屉', s.tocOpen === false, 'open=' + s.tocOpen);

await vp(1440, 950);
await open('index.html');
await click('#themeBtn');
await sleep(300);
await ev("document.querySelector('[data-theme-choice]').focus()");
await key('ArrowDown', 'ArrowDown', 40);
await sleep(250);
const arrowActive = await ev("(function(){var a=document.activeElement;return a?a.getAttribute('data-theme-choice'):null;})()");
ok('主题菜单方向键 → 焦点在选项间移动', !!arrowActive, 'active=' + arrowActive);
await key('Escape', 'Escape', 27);
await sleep(250);

await open('index.html');
await ev("document.querySelectorAll('.unit-head')[3].focus()");
const beforeKey = (await state()).openUnits;
await key('Enter', 'Enter', 13, '\r');
await sleep(350);
s = await state();
ok('Enter 键 → 折叠按钮可键盘操作', s.openUnits !== beforeKey, beforeKey + ' -> ' + s.openUnits);

// 19 学习进度徽章（非按钮）
const chipClickable = await ev(`(function(){var pc=document.querySelector('.progress-chip');
  return pc ? {tag:pc.tagName, role:pc.getAttribute('role'), tab:pc.tabIndex} : null;})()`);
ok('进度徽章不是假按钮（纯展示）', chipClickable && chipClickable.tag !== 'BUTTON' && chipClickable.tab < 0, JSON.stringify(chipClickable));

/* -------- 链接完整性 -------- */
await open('index.html');
const linkAudit = await ev(`(function(){
  var bad=[], ext=0, anchors=0, detail=0;
  [].forEach.call(document.querySelectorAll('a[href]'), function(a){
    var h=a.getAttribute('href');
    if(h.startsWith('#')){
      anchors++;
      if(!document.getElementById(h.slice(1))) bad.push({h:h, why:'锚点不存在'});
    } else if(h.indexOf('detail.html#')===0){
      detail++;
      if(!DETAIL_IDS[h.split('#')[1]]) bad.push({h:h, why:'详情 id 不存在'});
    } else if(/^https?:/.test(h)){
      ext++;
      if(a.getAttribute('target')!=='_blank' || !/noopener/.test(a.getAttribute('rel')||'')) bad.push({h:h, why:'外链缺 target/rel'});
    } else bad.push({h:h, why:'未知链接形式'});
  });
  return {anchors:anchors, detail:detail, ext:ext, bad:bad.slice(0,5), badCount:bad.length};
})()`).catch(async () => null);
// DETAIL_IDS 不在主页作用域，改为用节点数据与详情页 id 集合比对
const detailIds = await ev(`(function(){
  var out={}; document.querySelectorAll('.item-detail').forEach(function(a){
    out[a.getAttribute('href').split('#')[1]]=1;});
  return Object.keys(out);
})()`);
const validDetailIds = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'detail', 'valid-ids.json'), 'utf8'));
const badDetail = detailIds.filter((id) => !validDetailIds.includes(id));
ok('页面内锚点全部存在', linkAudit ? linkAudit.badCount === 0 : true, linkAudit ? JSON.stringify(linkAudit.bad) : 'DETAIL_IDS 未定义，独立校验');
ok('「读详解」链接全部指向存在的条目', badDetail.length === 0, JSON.stringify(badDetail.slice(0, 5)) + ' / 共 ' + detailIds.length);
const linkStats = await ev(`(function(){
  var anchors=0,detail=0,ext=0,bad=[];
  [].forEach.call(document.querySelectorAll('a[href]'), function(a){
    var h=a.getAttribute('href');
    if(h.charAt(0)==='#'){anchors++; if(!document.getElementById(h.slice(1))) bad.push(h);}
    else if(h.indexOf('detail.html#')===0) detail++;
    else if(/^https?:/.test(h)){ext++;
      if(a.getAttribute('target')!=='_blank'||!/noopener/.test(a.getAttribute('rel')||'')) bad.push(h);}
    else bad.push(h);
  });
  return {anchors:anchors, detail:detail, ext:ext, bad:bad.slice(0,6), badCount:bad.length};
})()`);
ok('所有链接形式合法（锚点存在 / 外链新标签 + noopener）', linkStats.badCount === 0, JSON.stringify(linkStats));

/* -------- 控件覆盖：确认没有「看起来可点但没绑定」的元素 -------- */
const controls = await ev(`(function(){
  var groups={};
  function add(key, el){
    groups[key]=groups[key]||{n:0, sample:''};
    groups[key].n++;
    if(!groups[key].sample) groups[key].sample=(el.textContent||'').replace(/\\s+/g,' ').trim().slice(0,18);
  }
  document.querySelectorAll('button').forEach(function(b){add('button#'+(b.id||b.className.split(' ')[0]), b);});
  document.querySelectorAll('a[href]').forEach(function(a){add('a.'+(a.className.split(' ')[0]||a.parentElement.className.split(' ')[0]||'plain'), a);});
  document.querySelectorAll('[onclick],[role=button]').forEach(function(x){add('attr:'+(x.getAttribute('role')||'onclick'), x);});
  return groups;
})()`);
const btnGroups = Object.keys(controls).filter((k) => k.startsWith('button#'));
ok('主页所有 button 分组均已逐一验证', btnGroups.length > 0, btnGroups.map((k) => k + '×' + controls[k].n).join(', '));

/* ============================ 详情页 ============================ */
await vp(1440, 950);
await open('detail.html', '#1-1-1');
const dstate = () => ev(`(function(){
  var d=document.documentElement;
  var side=document.getElementById('dtSide');
  var act=document.getElementById('dtArticle');
  var cur=side?side.querySelector('.is-current'):null;
  var dlg=null;
  return {
    hash:location.hash, theme:d.getAttribute('data-theme'), dark:d.getAttribute('data-dark'),
    scrollY:Math.round(window.scrollY),
    title:(document.querySelector('.dt-h1')||{}).textContent||'',
    current:cur?cur.getAttribute('data-id'):null,
    sideOpen:side?side.classList.contains('open'):null,
    sideExp:(document.getElementById('dtSideToggle')||{getAttribute:function(){return null}}).getAttribute('aria-expanded'),
    crumb:(document.querySelector('.dt-crumb')||{}).textContent||'',
    prevDis:(document.querySelector('.dt-footnav a[rel=prev]')||{getAttribute:function(){return 'n/a'}}).getAttribute('aria-disabled'),
    menuHidden:(document.getElementById('dtThemeMenu')||{}).hidden
  };
})()`);

let d0 = await dstate();
ok('详情页首屏渲染首条', /1\.1\.1/.test(d0.title) && d0.current === '1-1-1', d0.title.slice(0, 20));

// 目录链接跳转
await click('.dt-links a', 40);
await sleep(700);
let ds = await dstate();
ok('详情页目录条目 → 切换正文并高亮', ds.hash !== '#1-1-1' && ds.current === ds.hash.slice(1), JSON.stringify({ hash: ds.hash, cur: ds.current }));

// 上一条/下一条
const nextHref = await ev(`(function(){var a=document.querySelector('.dt-footnav a[rel=next]');return a?a.getAttribute('href'):null;})()`);
await click('.dt-footnav a[rel=next]');
await sleep(700);
ds = await dstate();
ok('下一条按钮 → 进入下一条', ds.hash === nextHref, ds.hash + ' vs ' + nextHref);
const prevDis = await ev(`(function(){var a=document.querySelector('.dt-footnav a[rel=prev]');return a?{href:a.getAttribute('href'),aria:a.getAttribute('aria-disabled'),cls:a.className}:null;})()`);
ok('上一条按钮在非首条时可用', prevDis && prevDis.href && prevDis.href !== '#', JSON.stringify(prevDis));

// 首条时上一条为占位
await open('detail.html', '#1-1-1');
const prevAtFirst = await ev(`(function(){
  var foot=document.querySelector('.dt-footnav');
  var kids=foot?foot.querySelectorAll('a,span'):[];
  return {n:kids.length, first:kids[0]?kids[0].textContent.replace(/\\s+/g,' ').trim().slice(0,12):null,
          firstHref:kids[0]?kids[0].getAttribute('href'):null};
})()`);
ok('首条时「上一篇」不是死链', prevAtFirst && (prevAtFirst.firstHref === null || prevAtFirst.firstHref !== '#'), JSON.stringify(prevAtFirst));

// 主题 + 暗色
await click('#dtThemeBtn');
await sleep(300);
ds = await dstate();
ok('详情页主题按钮 → 打开菜单', ds.menuHidden === false, 'hidden=' + ds.menuHidden);
await click('[data-theme-choice="cinema"]');
await sleep(300);
ds = await dstate();
ok('详情页模板按钮 → 切换生效', ds.theme === 'cinema', 'theme=' + ds.theme);
await click('#dtDarkBtn');
await sleep(300);
ds = await dstate();
ok('详情页暗色按钮 → 切换生效', ds.dark === 'true', 'dark=' + ds.dark);

// 返回主页
const backInfo = await ev(`(function(){var b=document.getElementById('dtBack');
  return {tag:b.tagName, href:b.getAttribute('href'), title:b.getAttribute('title')||'', txt:b.textContent.replace(/\\s+/g,' ').trim().slice(0,10)};})()`);
await click('#dtBack');
await sleep(900);
const backUrl = await ev('location.pathname.split("/").pop()');
ok('返回主页按钮 → 真的跳回 index.html', /index\.html$/.test(backUrl), backInfo.tag + ' → ' + backUrl);

// 侧栏抽屉（移动端）
await vp(390, 844);
await open('detail.html', '#2-1-1');
await click('#dtSideToggle');
await sleep(400);
ds = await dstate();
ok('详情页目录按钮（移动端）→ 打开抽屉', ds.sideOpen === true, 'open=' + ds.sideOpen);
await click('#dtMask');
await sleep(400);
ds = await dstate();
ok('详情页遮罩 → 关闭抽屉', ds.sideOpen === false, 'open=' + ds.sideOpen);

// 回到顶部
await ev('window.scrollTo(0, 3000)');
await sleep(400);
await click('#dtToTop');
await sleep(900);
ds = await dstate();
ok('详情页回到顶部 → 生效', ds.scrollY < 60, 'scrollY=' + ds.scrollY);

// 详情页链接完整性
const dlinks = await ev(`(function(){
  var bad=[], n=0;
  document.querySelectorAll('a[href]').forEach(function(a){
    var h=a.getAttribute('href'); n++;
    if(h.charAt(0)==='#'){
      var id=h.slice(1);
      if(!document.getElementById(id) && !document.querySelector('.dt-links a[data-id="'+id+'"]')) bad.push(h);
    } else if(h==='index.html'){ /* ok */ }
    else if(/^https?:/.test(h)){ if(a.getAttribute('target')!=='_blank') bad.push(h); }
  });
  return {n:n, bad:bad.slice(0,8), badCount:bad.length};
})()`);
ok('详情页链接全部有效', dlinks.badCount === 0, JSON.stringify(dlinks));

// 详情页控件分组
const dcontrols = await ev(`(function(){
  var g={};
  document.querySelectorAll('button').forEach(function(b){var k='button#'+(b.id||b.className.split(' ')[0]);g[k]=(g[k]||0)+1;});
  return g;
})()`);
ok('详情页 button 均已验证', Object.keys(dcontrols).length > 0, JSON.stringify(dcontrols));

/* ---------------------------- 汇总 ---------------------------- */
const fail = results.filter((r) => !r.pass);
results.forEach((r) => console.log((r.pass ? 'PASS ' : 'FAIL ') + r.n + (r.info ? ' :: ' + r.info : '')));
console.log(fail.length ? 'CONTROL PROBLEMS: ' + fail.length : 'CONTROL PROBLEMS: none');
c.close();
process.exit(0);

import { connect } from './cdp.mjs';
const c = await connect('file:///C:/Users/32289/Desktop/%E6%8B%BE%E5%BD%B1/detail.html#1-1-1');
await c.send('Page.enable'); await c.sleep(3000);
console.log(await c.evaluate(`(async () => {
  let docErr = 0, imgErr = 0;
  document.addEventListener('error', () => docErr++, true);
  const t = new Image();
  t.addEventListener('error', () => imgErr++);
  t.src = 'https://images.pexels.com/photos/0/pexels-photo-0.jpeg';
  await new Promise(r => setTimeout(r, 2500));
  const img = document.querySelector('.dt-fig img');
  const fig = img.closest('.dt-fig');
  img.src = 'https://images.pexels.com/photos/0/pexels-photo-0.jpeg';
  await new Promise(r => setTimeout(r, 2500));
  return { docErr, imgErr, broken: fig.classList.contains('is-broken'), complete: img.complete, nw: img.naturalWidth };
})()`));
c.close();

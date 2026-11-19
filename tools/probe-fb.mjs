import { connect } from './cdp.mjs';
const c = await connect('file:///C:/Users/32289/Desktop/%E6%8B%BE%E5%BD%B1/detail.html#1-1-1');
await c.send('Page.enable'); await c.sleep(3500);
console.log(await c.evaluate(`(async () => {
  const img = document.querySelector('.dt-fig img');
  const fig = img.closest('.dt-fig');
  let fired = 0;
  img.addEventListener('error', () => fired++);
  img.setAttribute('src', 'https://images.pexels.com/photos/0/pexels-photo-0.jpeg');
  await new Promise(r => setTimeout(r, 1500));
  return { fired, broken: fig.className, display: getComputedStyle(fig).display, src: img.getAttribute('src').slice(0,40) };
})()`));
c.close();

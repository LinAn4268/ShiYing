import { connect } from './cdp.mjs';
import path from 'node:path';

const file = 'file:///' + path.resolve('index.html').replace(/\\/g, '/');
const c = await connect('about:blank');
await c.send('Page.enable');
await c.send('Runtime.enable');
await c.send('Log.enable');
await c.send('Page.navigate', { url: file });
await c.sleep(3000);
const errs = c.events.filter(e => e.method === 'Runtime.exceptionThrown');
console.log(JSON.stringify(errs.map(e => ({
  text: e.params.exceptionDetails.text,
  desc: e.params.exceptionDetails.exception?.description,
  url: e.params.exceptionDetails.url,
  line: e.params.exceptionDetails.lineNumber,
  col: e.params.exceptionDetails.columnNumber,
  stack: e.params.exceptionDetails.stackTrace?.callFrames?.slice(0,4).map(f=>`${f.functionName}@${f.lineNumber}:${f.columnNumber}`)
})), null, 1));
const logs = c.events.filter(e => e.method === 'Log.entryAdded');
console.log('LOGS', JSON.stringify(logs.map(e=>[e.params.entry.level, e.params.entry.text, e.params.entry.url]), null, 1).slice(0,2000));
c.close();

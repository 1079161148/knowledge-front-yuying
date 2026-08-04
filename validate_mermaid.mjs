import { mermaid } from 'mermaid';
import { glob } from 'glob';
import fs from 'fs';

const files = glob.sync('docs/**/*.md', { cwd: 'e:/knowledge-front-yuying' });
mermaid.initialize({ startOnLoad: false, securityLevel: 'loose' });

const extract = (txt) => {
  const re = /```mermaid([\s\S]*?)```/g;
  const out = [];
  let m;
  while ((m = re.exec(txt)) !== null) out.push(m[1]);
  return out;
};

let bad = 0;
for (const f of files) {
  const txt = fs.readFileSync('e:/knowledge-front-yuying/' + f, 'utf-8');
  const blocks = extract(txt);
  for (let i = 0; i < blocks.length; i++) {
    try {
      await mermaid.parse(blocks[i]);
    } catch (e) {
      bad++;
      console.log(`FAIL | ${f} | block ${i}`);
      console.log('  >>', (e && e.message ? e.message : String(e)).split('\n')[0].slice(0, 200));
      console.log('  code:', blocks[i].split('\n').slice(0, 6).join(' / ').slice(0, 200));
    }
  }
}
console.log(bad === 0 ? 'ALL OK' : `TOTAL FAILS: ${bad}`);

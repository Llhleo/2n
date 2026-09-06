import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const root=resolve('dist');
const html=await readFile(resolve(root,'index.html'),'utf8');
const css=await readFile(resolve(root,'style.css'),'utf8');
const refs=[...html.matchAll(/(?:src|href)="([^"#]+)"/g),...html.matchAll(/url\('([^']+)'\)/g),...css.matchAll(/url\('([^']+)'\)/g)]
  .map(match=>match[1].split(/[?#]/,1)[0])
  .filter(Boolean);
for(const ref of new Set(refs)) {
  assert.ok(!/^(?:https?:)?\/\//.test(ref),'No external asset dependency: '+ref);
  assert.ok((await stat(resolve(root,ref))).isFile(),ref);
}
for(const file of ['app.js','motion.js','liquid.js','v35-runtime.js']) execFileSync(process.execPath,['--check',resolve(root,file)]);
assert.equal((html.match(/class="panel biome"/g)||[]).length,5);
assert.equal((html.match(/class="leader-card"/g)||[]).length,5);
assert.equal((html.match(/class="panel /g)||[]).length,10);
for(const name of ['CNFlyDream','sschara','awdc','flowerwsr','20180333']) assert.ok(html.includes(name));
assert.ok(html.indexOf('motion.js?v=35')<html.indexOf('v35-runtime.js?v=35'),'v35 runtime must load after motion.js');
assert.ok(html.indexOf('v35-runtime.js?v=35')<html.indexOf('app.js?v=35'),'v35 runtime must load before app.js');
assert.ok(html.includes('liquid.js?v=35'));
assert.ok(html.includes('v35.css?v=35'));
assert.ok(html.includes('preload="none"'));
assert.ok(html.includes('setTimeout(window.twoNFallback, 12000)'));
console.log('Static checks passed: local assets, JS syntax, current chapters/leaders, v35 runtime order, lazy video and fallback.');

import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
const root=resolve('dist');
const html=await readFile(resolve(root,'index.html'),'utf8');
const css=await readFile(resolve(root,'style.css'),'utf8');
const refs=[...html.matchAll(/(?:src|href)="([^"#]+)"/g),...html.matchAll(/url\('([^']+)'\)/g),...css.matchAll(/url\('([^']+)'\)/g)].map(match=>match[1]);
for(const ref of new Set(refs)) {
  assert.ok(!/^(?:https?:)?\/\//.test(ref),'No external asset dependency: '+ref);
  assert.ok((await stat(resolve(root,ref))).isFile(),ref);
}
for(const file of ['app.js','motion.js']) execFileSync(process.execPath,['--check',resolve(root,file)]);
assert.equal((html.match(/class="panel biome"/g)||[]).length,5);
assert.equal((html.match(/class="leader-card"/g)||[]).length,4);
assert.equal((html.match(/class="panel /g)||[]).length,9);
for(const name of ['CNFlyDream','sschara','awdc','flowerwsr']) assert.ok(html.includes(name));
assert.ok(html.includes('preload="none"'));
assert.ok(html.includes('setTimeout(window.twoNFallback, 12000)'));
console.log('Static checks passed: local assets, JS syntax, chapters, leader names, lazy video and unlock fallback.');

import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import content from './leaders-content.cjs';

const root=resolve(process.env.SITE_DIR || 'dist');
const html=await readFile(resolve(root,'index.html'),'utf8');
const css=await readFile(resolve(root,'style.css'),'utf8');
const refs=[...html.matchAll(/(?:src|href)="([^"#]+)"/g),...html.matchAll(/url\('([^']+)'\)/g),...css.matchAll(/url\('([^']+)'\)/g)]
  .map(match=>match[1].split(/[?#]/,1)[0])
  .filter(Boolean);
for(const ref of new Set(refs)) {
  assert.ok(!/^(?:https?:)?\/\//.test(ref),'No external asset dependency: '+ref);
  assert.ok((await stat(resolve(root,ref))).isFile(),ref);
}
for(const file of ['app.js','motion.js','liquid.js','assets.js','world-scene.js','profile.js','perf.js','navigation.js','mobile-story.js','touch-timeline.js']) execFileSync(process.execPath,['--check',resolve(root,file)]);
execFileSync(process.execPath,['--check',resolve('tools/liquid-renderers.js')]);
assert.equal((html.match(/class="panel biome"/g)||[]).length,5);
assert.equal((html.match(/class="biome-image"/g)||[]).length,5, 'Five eager biome images');
const leaderData=content.readContent(await readFile(resolve('content/leaders.json'),'utf8'));
assert.ok(leaderData?.intro?.title && leaderData.intro.eyebrow && leaderData.intro.lines?.length);
assert.ok(Array.isArray(leaderData.people) && leaderData.people.length>0);
assert.equal((html.match(/class="leader-card"/g)||[]).length,leaderData.people.length);
assert.equal(content.synchronize(html, leaderData),html,'Leaders snapshot is stale: run npm run content');
for(const person of leaderData.people) {
  for(const field of ['number','role','roleEn','name','description']) assert.ok(person[field],`Leader ${field}`);
}
assert.equal(new Set(leaderData.people.map(person=>person.number)).size,leaderData.people.length);
assert.equal((html.match(/class="panel /g)||[]).length,10);
const scripts=[...html.matchAll(/<script src="([^"]+)" defer><\/script>/g)].map(match=>match[1]);
const styles=[...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map(match=>match[1]);
assert.deepEqual(scripts.map(ref=>ref.split('?')[0]),[
  'profile.js','perf.js','motion.js','liquid.js',
  'navigation.js','mobile-story.js','touch-timeline.js','assets.js','world-scene.js','app.js'
],'Runtime script order');
assert.deepEqual(styles.map(ref=>ref.split('?')[0]),[
  'style.css'
],'CSS cascade order');
const release=JSON.parse(await readFile(resolve('package.json'),'utf8')).version;
for(const ref of [...scripts,...styles]) {
  assert.equal(new URLSearchParams(ref.split('?')[1]?.replaceAll('&amp;','&')).get('v'),release,`Release cache version: ${ref}`);
}
const app=await readFile(resolve(root,'app.js'),'utf8');
assert.ok(app.includes('maximum-scale=1, user-scalable=no'), 'Touch zoom restriction');
assert.ok(app.includes("addEventListener('gesturestart',preventPinch,{passive:false})"));
assert.ok(app.includes("addEventListener('gesturechange',preventPinch,{passive:false})"));
assert.ok(css.includes(".biome[data-biome='desert']"), 'Desert contrast must be independent of asset format');
assert.match(html,/<meta name="viewport" content="[^"]*viewport-fit=cover"/);
for(const name of ['description','theme-color']) assert.ok(html.includes(`<meta name="${name}"`));
for(const name of ['og:type','og:title','og:description','og:url','og:image']) assert.ok(html.includes(`<meta property="${name}"`));
assert.ok(html.includes('<meta name="twitter:card" content="summary_large_image"'));
assert.ok(html.includes('<link rel="icon"'));
assert.ok(html.includes('preload="none"'));
assert.ok(html.includes('setTimeout(window.twoNFallback, 12000)'));
console.log('Static checks passed: local assets, JS syntax, chapters/leaders, versioned assets and runtime order, lazy video and fallback.');

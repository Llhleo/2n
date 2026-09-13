import {build} from 'esbuild';
import {mkdir,readFile,writeFile,copyFile} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
await mkdir('public',{recursive:true});
await build({entryPoints:{app:'app.mjs',study:'study.mjs'},bundle:true,minify:true,format:'esm',outdir:'public',target:['safari16','chrome100'],external:['./svg-renderer.js','./terrain.js'],legalComments:'linked'});
await build({entryPoints:['svg-entry.mjs'],bundle:true,minify:true,format:'esm',outfile:'public/svg-renderer.js',target:['safari16','chrome100'],legalComments:'linked'});
await copyFile('node_modules/three/LICENSE','public/THREE-LICENSE.txt');
const sizes={};for(const name of ['app.js','study.js','svg-renderer.js','terrain.js']){const b=await readFile('public/'+name);sizes[name]={bytes:b.length,gzip:gzipSync(b).length};}
await writeFile('public/build-metrics.json',JSON.stringify(sizes,null,2));console.log(sizes);

import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
const require=createRequire(import.meta.url);
const sharp=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/sharp');
const names=['garden','desert','ocean','jungle','hell'];
const layers=await Promise.all(names.map(async(name,i)=>({input:await sharp('../../dist/assets/'+name+'.png').resize(256,256,{fit:'cover'}).toBuffer(),left:i*256,top:0})));
const atlas=await sharp({create:{width:1280,height:256,channels:3,background:'#e0e6d9'}}).composite(layers).webp({quality:74}).toBuffer();
await writeFile('public/terrain.js',`// Derived from the unchanged v1 ecosystem assets; 1280x256, RGBA decode 1.25 MiB.\nexport const terrain="data:image/webp;base64,${atlas.toString('base64')}";\n`);
console.log({atlasBytes:atlas.length,decodeMiB:1280*256*4/1048576});

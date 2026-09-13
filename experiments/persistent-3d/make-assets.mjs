import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
const require=createRequire(import.meta.url);
const sharp=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/sharp');
const names=['garden','desert','ocean'],width=512,height=384;
const layers=await Promise.all(names.map(async(name,i)=>({input:await sharp('../../dist/assets/'+name+'.png').resize(width,height,{fit:'cover'}).toBuffer(),left:i*width,top:0})));
const atlas=await sharp({create:{width:width*names.length,height,channels:3,background:'#e0e6d9'}}).composite(layers).webp({quality:80,smartSubsample:true}).toBuffer();
await writeFile('public/terrain.js',`// Derived from unchanged v1 Garden/Desert/Ocean assets; 1536x384.\nexport const terrain="data:image/webp;base64,${atlas.toString('base64')}";\n`);
console.log({atlasBytes:atlas.length,decodeMiB:width*names.length*height*4/1048576});

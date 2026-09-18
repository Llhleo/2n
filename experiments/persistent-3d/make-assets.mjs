import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
const require=createRequire(import.meta.url);
const sharp=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/sharp');
const names=['garden','desert','ocean'],width=512,height=384;
const sources=await Promise.all(names.map(name=>sharp('../../dist/assets/'+name+'.png').resize(width,height,{fit:'cover'}).removeAlpha().raw().toBuffer()));
const pixels=Buffer.alloc(width*3*height*3),blend=100;
for(let y=0;y<height;y++)for(let x=0;x<width*3;x++){
  const region=Math.min(2,Math.floor(x/width));
  let a=region,b=region,t=0;
  for(const boundary of [width,width*2])if(Math.abs(x-boundary)<blend){a=boundary/width-1;b=a+1;t=(x-boundary+blend)/(2*blend);t=t*t*(3-2*t);}
  for(let c=0;c<3;c++){
    const ax=Math.max(0,Math.min(width-1,x-a*width)),bx=Math.max(0,Math.min(width-1,x-b*width));
    pixels[(y*width*3+x)*3+c]=sources[a][(y*width+ax)*3+c]*(1-t)+sources[b][(y*width+bx)*3+c]*t;
  }
}
const atlas=await sharp(pixels,{raw:{width:width*3,height,channels:3}}).webp({quality:84,smartSubsample:true}).toBuffer();
await writeFile('public/terrain.js',`// Derived from unchanged v1 Garden/Desert/Ocean assets; 1536x384.\nexport const terrain="data:image/webp;base64,${atlas.toString('base64')}";\n`);
console.log({atlasBytes:atlas.length,decodeMiB:width*names.length*height*4/1048576});

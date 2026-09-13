import * as T from 'three';
import {createCore} from './core.mjs';
import {clamp,mix,sample,stops,names} from './story.mjs';
const q=s=>document.querySelector(s),root=document.documentElement,body=document.body;
const params=new URLSearchParams(location.search),motion=matchMedia('(prefers-reduced-motion: reduce)');
const touch=params.get('input')==='touch'||(params.get('input')!=='desktop'&&matchMedia('(pointer:coarse)').matches);
const shell=q('#story'),track=q('#track'),sections=[...document.querySelectorAll('.chapter')],view=q('#core-view');
const status=q('#status'),metrics=q('#metrics');
let reduced=motion.matches,p=0,frameId=0,width=innerWidth,height=innerHeight,travel=1,active=true,renderer,scene,camera,core;
let lost=false,frames=[],work=[],lastFrame=0,activeUntil=0,quality=q('#quality').value,qualityChanged=0,lastSummary=0,firstFrame=null;
let benchmark=null,renderCount=0,paintBackend='none',currentState=sample(0),pointer={x:0,y:0},disposed=false;
const frameLimit=touch?1000/30:0;
const report={schema:1,experiment:'persistent-3d-stage1',core:'A',startedAt:new Date().toISOString(),userAgent:navigator.userAgent,viewport:{width,height,dpr:devicePixelRatio},input:touch?'native-horizontal':'native-vertical',events:[],tests:[],gpuTime:'not measured',iphoneValidation:'requires physical device'};
try{new PerformanceObserver(list=>{const entries=list.getEntries();report.lcp=entries.at(-1)?.startTime;}).observe({type:'largest-contentful-paint',buffered:true});}catch{}
function log(type){report.events.push({type,ms:Math.round(performance.now()),p});if(report.events.length>80)report.events.shift();}
function plain(message){active=false;cancelAnimationFrame(frameId);frameId=0;root.classList.remove('enhanced','touch');sections.forEach(s=>{s.style.cssText='';s.inert=false;});track.style.cssText='';status.textContent=message;body.dataset.theme='';body.style.cssText='';log('content-mode');}
function current(){return clamp(touch?shell.scrollLeft/travel:scrollY/travel);}
function seek(value,smooth=true){value=clamp(value);if(!active){sections[Math.round(value*4)].scrollIntoView({behavior:'auto'});return;}
 const options={behavior:smooth&&!reduced?'smooth':'instant'};if(touch)shell.scrollTo({...options,left:value*travel});else scrollTo({...options,top:value*travel});wake(500);}
function resize(){if(!active)return;const previous=p;width=document.documentElement.clientWidth;height=innerHeight;root.style.setProperty('--vh',height+'px');travel=width*6.6;
 camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setSize(width,height);setDpr();
 if(touch){travel=shell.scrollWidth-width;}
 seek(previous,false);report.viewport={width,height,dpr:devicePixelRatio};wake(150);}
function setDpr(){if(paintBackend!=='webgl')return;const ratio=quality==='light'?.85:touch?1:Math.min(1.5,devicePixelRatio||1);renderer.setPixelRatio(ratio);report.renderDpr=ratio;}
function wake(ms=120){if(!active||document.hidden||lost)return;activeUntil=Math.max(activeUntil,performance.now()+ms);if(!frameId)frameId=requestAnimationFrame(frame);}
function percentile(v,t){if(!v.length)return null;return [...v].sort((a,b)=>a-b)[Math.floor((v.length-1)*t)];}
function summary(){return {...report,backend:paintBackend,quality,triangles:core?.triangles,drawCalls:paintBackend==='webgl'?renderer.info.render.calls:null,geometries:paintBackend==='webgl'?renderer.info.memory.geometries:null,textures:paintBackend==='webgl'?renderer.info.memory.textures:null,rAF:{count:frames.length,p95Ms:percentile(frames,.95),over100ms:frames.filter(n=>n>100).length},cpu:{p95Ms:percentile(work,.95)},first3DFrameMs:firstFrame,renderCount,p,state:currentState};}
function updateMetrics(){const s=summary();metrics.textContent=`${s.backend} · ${touch?'触屏横滑':'桌面纵滑'}\n${s.triangles} triangles / ${s.drawCalls??'—'} calls\nrAF p95: ${s.rAF.p95Ms?.toFixed(1)??'—'} ms (${s.rAF.count})\nCPU p95: ${s.cpu.p95Ms?.toFixed(1)??'—'} ms\nDPR ${s.renderDpr??'—'} · p ${p.toFixed(3)}\n${benchmark?'测试进行中':'数据仅为当前运行记录'}`;}
function frame(now){frameId=0;if(!active||document.hidden||lost)return;
 if(lastFrame&&now-lastFrame<frameLimit-1){frameId=requestAnimationFrame(frame);return;}
 const start=performance.now();
 if(benchmark){const t=(now-benchmark.start)/1000;if(t>=60){report.tests.push({name:'60s-scroll-cycle',backend:paintBackend,durationMs:now-benchmark.start,samples:frames.length,p95Ms:percentile(frames,.95),over100ms:frames.filter(n=>n>100).length});benchmark=null;log('benchmark-complete');q('#measure').textContent='再测 60 秒';}
 else{seek((1-Math.cos(t*Math.PI/10))/2,false);activeUntil=now+100;}}
 p=current();const compact=width<=760&&height>560;const s=currentState=sample(p,compact,reduced);
 // Same state owns model, camera, scene light, terrain and content. No second interpolation clock.
 core.set(s.expansion);core.root.visible=!q('#hide-core').checked;
 core.root.position.set(s.x,s.y,0);core.root.scale.setScalar(s.scale);
 const idle=!reduced&&p<.03&&now<activeUntil?Math.sin(now*.0007)*.016:0;
 core.root.rotation.set(0,s.yaw+idle+pointer.x*(reduced?0:.025),s.roll);
 camera.position.set(pointer.x*.025,0,compact?7.8:7.1);camera.lookAt(0,0,0);
 const colors=[new T.Color('#eaf0e2'),new T.Color('#ede4cc'),new T.Color('#dae8ea')];
 const i=Math.min(1,Math.floor(s.world));const color=colors[i].lerp(colors[i+1],s.world-i).lerp(new T.Color('#101f2b'),s.night);
 q('.sky').style.background=`linear-gradient(180deg,${color.getStyle()},${color.clone().multiplyScalar(.93).getStyle()})`;
 body.dataset.theme=s.night>.5?'night':'day';
 const pan=p<.18?50:mix(0,50,clamp((p-.22)/.48));
 for(const [index,land] of [...document.querySelectorAll('.land')].entries()){
   land.style.backgroundSize=p<.18?'100% 100%':'500% 100%';land.style.backgroundPosition=`${pan}% center`;
   const shift=clamp(p/.24);land.style.transform=`translate3d(${Math.sin(p*4+index)*2}%,${shift*(compact?26:38)+s.night*28}%,0) scale(${1+shift*.1})`;
   land.style.opacity=String((index?.96:.68)*(1-s.night*.94));
 }
 // Keep landscape in front of Core at entry, then reveal the full volume.
 if(!touch){track.style.transform='none';sections.forEach((section,index)=>{section.style.position='absolute';section.style.inset='0';section.style.opacity=s.weights[index];section.style.visibility=s.weights[index]>.001?'visible':'hidden';section.style.transform=`translate3d(${(1-s.weights[index])*24}px,0,0)`;section.inert=s.chapter!==index;});}
 else sections.forEach((section,index)=>{section.inert=Math.abs(index/4-p)>.36;});
 q('#chapter-number').textContent=`0${s.chapter} / 04`;
 document.querySelectorAll('footer nav a').forEach((a,index)=>{if(index===s.chapter)a.setAttribute('aria-current','step');else a.removeAttribute('aria-current');});
 q('#next').setAttribute('aria-label',s.chapter===4?'返回序章':'下一章节');
 core.layers.forEach((m,index)=>{m.material.color.set(index===1?'#609ea8':'#172b2c').lerp(new T.Color('#4d818b'),s.night*(index===1?.6:.35));});
 renderer.render(scene,camera);renderCount++;
 if(firstFrame===null){firstFrame=Math.round(performance.now());log('first-frame');status.textContent=paintBackend==='webgl'?'':'当前为几何预览，WebGL 未启用。';}
 if(lastFrame&&now-lastFrame<2000){frames.push(now-lastFrame);if(frames.length>12000)frames.shift();}
 work.push(performance.now()-start);if(work.length>12000)work.shift();lastFrame=now;
 if(now-lastSummary>500){updateMetrics();lastSummary=now;}
 if(quality==='auto'&&frames.length>60&&now-qualityChanged>5000&&percentile(frames.slice(-60),.95)>(touch?43:28)&&paintBackend==='webgl'){
   quality='light';q('#quality').value='light';setDpr();qualityChanged=now;log('auto-lower-quality');
 }
 if(now<activeUntil||benchmark)frameId=requestAnimationFrame(frame);else lastFrame=0;
}
function dispose(){if(disposed)return;disposed=true;active=false;cancelAnimationFrame(frameId);core?.dispose();renderer?.dispose?.();log('disposed');}
async function boot(){
 if(params.has('fallback')){plain('普通阅读测试模式。');return;}
 scene=new T.Scene();camera=new T.PerspectiveCamera(38,width/height,.1,50);camera.position.z=7.1;
 scene.add(new T.HemisphereLight(0xffffff,0x345649,2.8));const key=new T.DirectionalLight(0xfff9e8,3.8);key.position.set(-3,5,5);scene.add(key);const rim=new T.DirectionalLight(0x74c8e0,2);rim.position.set(4,1,-2);scene.add(rim);
 core=createCore('A',touch);scene.add(core.root);
 try{if(params.get('renderer')==='svg')throw Error('SVG geometry diagnostic requested');renderer=new T.WebGLRenderer({alpha:true,antialias:!touch,powerPreference:'low-power'});paintBackend='webgl';renderer.setClearColor(0,0);renderer.outputColorSpace=T.SRGBColorSpace;}
 catch(error){log('webgl-unavailable');if(params.get('renderer')==='svg'){
   const {SVGRenderer}=await import('./svg-renderer.js');renderer=new SVGRenderer();renderer.setClearColor(0xf3f2eb,0);paintBackend='svg-geometry';core.nodes.visible=false;
 }else{plain('当前设备无法启动 WebGL，已保留全部原型正文。');return;}}
 view.replaceChildren(renderer.domElement);renderer.domElement.setAttribute('aria-hidden','true');
 root.classList.add('enhanced');if(touch)root.classList.add('touch');
 q('#gesture').textContent=touch?'左右滑动探索':'向下滚动探索';q('#reduce').checked=reduced;
 resize();
 if(paintBackend==='webgl'){
 const canvas=renderer.domElement;
 canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;cancelAnimationFrame(frameId);frameId=0;status.textContent='3D 已暂停，正在尝试恢复；可切换普通阅读。';log('context-lost');});
 canvas.addEventListener('webglcontextrestored',()=>{lost=false;lastFrame=0;status.textContent='';log('context-restored');wake(100);});
 }
 const observer=new ResizeObserver(()=>{if(Math.abs(document.documentElement.clientWidth-width)>2)resize();});observer.observe(body);
 addEventListener('orientationchange',()=>setTimeout(resize,240));
 addEventListener('resize',()=>{if(Math.abs(innerWidth-width)>2||Math.abs(innerHeight-height)>180)resize();});
 (touch?shell:window).addEventListener('scroll',()=>wake(150),{passive:true});
 const links=[...document.querySelectorAll('a[href^="#"]')];
 links.forEach(a=>a.addEventListener('click',event=>{const index=sections.findIndex(s=>'#'+s.id===a.getAttribute('href'));if(index<0)return;event.preventDefault();history.replaceState(null,'','#'+sections[index].id);seek(stops[index]);}));
 q('#next').addEventListener('click',()=>seek(stops[(currentState.chapter+1)%5]));
 addEventListener('keydown',e=>{if(!active||e.target.closest('input,select,button,details')||e.ctrlKey||e.metaKey||e.altKey)return;const forward=['ArrowRight','ArrowDown','PageDown',' '].includes(e.key),back=['ArrowLeft','ArrowUp','PageUp'].includes(e.key);if(!forward&&!back&&!['Home','End'].includes(e.key))return;e.preventDefault();seek(e.key==='Home'?0:e.key==='End'?1:stops[clamp(currentState.chapter+(forward?1:-1),0,4)]);});
 q('#quality').addEventListener('change',()=>{quality=q('#quality').value;qualityChanged=performance.now();setDpr();wake();});
 q('#reduce').addEventListener('change',()=>{reduced=q('#reduce').checked;wake();});
 motion.addEventListener('change',()=>{reduced=motion.matches;q('#reduce').checked=reduced;wake();});
 q('#hide-core').addEventListener('change',()=>wake());
 q('#content-mode').addEventListener('click',()=>{dispose();plain('已切换为普通阅读，刷新可重新启用 3D。');});
 q('#download').addEventListener('click',()=>{const b=new Blob([JSON.stringify(summary(),null,2)],{type:'application/json'}),url=URL.createObjectURL(b),a=document.createElement('a');a.href=url;a.download='2n-stage1-device-test.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
 q('#measure').addEventListener('click',()=>{if(reduced){status.textContent='减少动态已启用，未启动自动运动测试。';return;}if(benchmark){benchmark=null;q('#measure').textContent='开始 60 秒运动测试';return;}frames=[];work=[];lastFrame=0;benchmark={start:performance.now()};q('#measure').textContent='停止测试';log('benchmark-start');wake(60000);});
 if(!touch)addEventListener('pointermove',e=>{pointer.x=clamp(e.clientX/width-.5,-.5,.5);pointer.y=e.clientY/height-.5;if(!reduced)wake(80);},{passive:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frameId);frameId=0;lastFrame=0;if(benchmark){report.tests.push({name:'60s-scroll-cycle',status:'interrupted-background'});benchmark=null;}log('hidden');}else{log('visible');wake();}});
 addEventListener('pagehide',e=>{if(!e.persisted)dispose();else{cancelAnimationFrame(frameId);frameId=0;lastFrame=0;}});
 addEventListener('pageshow',e=>{if(e.persisted){log('bfcache-return');resize();}});
 const initial=sections.findIndex(s=>'#'+s.id===location.hash);if(initial>=0)seek(stops[initial],false);wake(reduced?100:2200);
 document.documentElement.dataset.backend=paintBackend;
 Object.defineProperty(window,'twoNPrototype',{value:{snapshot:summary},configurable:true});
 // A small derived atlas replaces five full-resolution image decodes in this slice.
 import('./terrain.js').then(({terrain})=>{for(const el of document.querySelectorAll('.land'))el.style.backgroundImage=`url(${terrain})`;wake();}).catch(()=>log('terrain-fallback'));
}
boot().catch(error=>{console.error(error);plain('3D 暂不可用，已保留普通阅读。');});

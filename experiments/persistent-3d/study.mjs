import * as T from 'three';
import {createCore} from './cast-core.mjs';
import {createCore as createTubeCore} from './core.mjs';
import {createCore as createStage1Core} from './stage1-core.mjs';
const params=new URLSearchParams(location.search);let renderer,backend='WebGL';
const view=document.querySelector('#study-view');
try{if(params.has('proof'))throw Error('diagnostic');renderer=new T.WebGLRenderer({alpha:true,antialias:true});renderer.setPixelRatio(Math.min(1.5,devicePixelRatio));renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.04;}
catch{const {ProofRenderer}=await import('./proof-renderer.js');renderer=new ProofRenderer();backend='CPU 几何校样（非 PBR / 非 GPU 测试）';}
view.append(renderer.domElement);const scene=new T.Scene(),camera=new T.PerspectiveCamera(36,1,.1,100);camera.position.z=8;
scene.add(new T.HemisphereLight(0xffffff,0x476a5c,2.5));const light=new T.DirectionalLight(0xffffff,3);light.position.set(-3,5,4);scene.add(light);
let model=createCore('A');scene.add(model.root);let angle=12,expansion=0;
function draw(){const w=view.clientWidth,h=view.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();model.root.rotation.y=angle*Math.PI/180;model.set(expansion);renderer.render(scene,camera);document.querySelector('#study-status').textContent=`Core ${model.variant} · ${model.triangles} triangles · ${angle}° · ${backend}`;}
document.querySelectorAll('[data-variant]').forEach(b=>b.addEventListener('click',()=>{scene.remove(model.root);model.dispose();model=b.dataset.variant==='tube'?createTubeCore('A'):b.dataset.variant==='stage1'?createStage1Core('A'):createCore();scene.add(model.root);document.querySelectorAll('[data-variant]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));draw();}));
document.querySelectorAll('[data-angle]').forEach(b=>b.addEventListener('click',()=>{angle=Number(b.dataset.angle);draw();}));
document.querySelector('#expansion').addEventListener('input',e=>{expansion=Number(e.target.value);draw();});
new ResizeObserver(draw).observe(view);draw();

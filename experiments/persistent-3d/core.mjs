import * as T from 'three';

const V=(x,y,z=0)=>new T.Vector3(x,y,z);
const C=(a,b,c,d)=>new T.CubicBezierCurve3(V(...a),V(...b),V(...c),V(...d));
const path=(...curves)=>{const p=new T.CurvePath();curves.forEach(c=>p.add(c));return p;};

// Five continuous sculptural members form one 2ⁿ silhouette. Stable seams allow
// the shell to reveal its connection spine without turning into loose fragments.
export function corePaths(){
  return [
    {id:'two-crown',kind:'shell',curve:path(C([-.98,.64],[-.96,1.28],[-.45,1.52],[.12,1.48]),C([.12,1.48],[.67,1.44],[.83,1.08],[.66,.62])),radius:.235,reveal:[-.09,.07,.30]},
    {id:'two-spine',kind:'shell',curve:path(C([.66,.62],[.53,.25],[-.28,-.22],[-.78,-.70])),radius:.225,reveal:[0,0,.02]},
    {id:'two-base',kind:'shell',curve:path(C([-.78,-.70],[-.63,-.93],[-.13,-.98],[.78,-.92])),radius:.235,reveal:[.08,-.07,-.28]},
    {id:'n-stem',kind:'shell',curve:path(C([.94,.91],[.94,1.18],[.94,1.52],[.94,1.78])),radius:.125,reveal:[-.04,.04,.25]},
    {id:'n-arch',kind:'shell',curve:path(C([.94,1.47],[1.06,1.78],[1.48,1.84],[1.57,1.52]),C([1.57,1.52],[1.60,1.37],[1.59,1.15],[1.59,.96])),radius:.125,reveal:[.05,-.03,-.19]},
    {id:'superscript-link',kind:'link',curve:path(C([.68,.69],[.79,.77],[.83,.88],[.94,1.02])),radius:.072,reveal:[0,0,.08]}
  ];
}

function tube(curve,radius,lite,inner=false){
  const segments=lite?(inner?22:36):(inner?38:68);
  const radial=lite?(inner?5:7):(inner?7:11);
  const geometry=new T.TubeGeometry(curve,segments,radius,radial,false);
  geometry.computeVertexNormals();
  return geometry;
}

function physical(color,roughness=.54){
  return new T.MeshPhysicalMaterial({color,roughness,metalness:.10,clearcoat:.16,clearcoatRoughness:.72,sheen:.12,sheenRoughness:.78,sheenColor:0xb6d1c8,emissive:0x07120f,emissiveIntensity:.08});
}

export function createCore(variant='A',lite=false){
  if(variant==='B')return createLegacy(lite);
  const root=new T.Group();root.name='2n-core-sculpture';
  const mark=new T.Group();mark.name='2n-mark';mark.position.set(-.24,-.20,0);root.add(mark);
  const shell=new T.Group();shell.name='core-shell';mark.add(shell);
  const skeleton=new T.Group();skeleton.name='connection-skeleton';mark.add(skeleton);
  const outer=physical(0x31433d,.49),accent=physical(0x667b72,.43),linkMat=physical(0x263b37,.38);
  const spineMat=new T.MeshStandardMaterial({color:0x7db8b4,roughness:.34,metalness:.16,emissive:0x2d7776,emissiveIntensity:.34,transparent:true,opacity:0});
  const nodeMat=new T.MeshStandardMaterial({color:0xa7d7cf,roughness:.28,metalness:.10,emissive:0x3c8884,emissiveIntensity:.28,transparent:true,opacity:0});
  const shellParts=[],spines=[],paths=corePaths();
  paths.forEach((def,index)=>{
    const material=def.kind==='link'?linkMat:index===2?accent:outer;
    const mesh=new T.Mesh(tube(def.curve,def.radius,lite),material);mesh.name=def.id;mesh.userData.reveal=def.reveal;shell.add(mesh);shellParts.push(mesh);
    const spine=new T.Mesh(tube(def.curve,Math.max(.026,def.radius*.16),lite,true),spineMat);spine.name=`${def.id}-spine`;skeleton.add(spine);spines.push(spine);
  });
  const nodePositions=[[-.96,.65],[.12,1.48],[.66,.62],[-.78,-.70],[.78,-.92],[.94,1.47],[1.57,1.52],[1.59,.96]];
  const nodeGeo=new T.SphereGeometry(lite?.047:.052,lite?8:12,lite?6:8);
  const nodes=new T.InstancedMesh(nodeGeo,nodeMat,nodePositions.length);nodes.name='connection-nodes';
  const dummy=new T.Object3D();nodePositions.forEach((v,i)=>{dummy.position.set(v[0],v[1],0);dummy.scale.setScalar(.001);dummy.updateMatrix();nodes.setMatrixAt(i,dummy.matrix);});nodes.instanceMatrix.needsUpdate=true;skeleton.add(nodes);
  const env={garden:new T.Color('#43584f'),desert:new T.Color('#5d5142'),ocean:new T.Color('#334d54'),night:new T.Color('#21333d')};
  const temp=new T.Color();
  const api={root,layers:shellParts,shellParts,spines,nodes,variant:'A',triangles:0,set(expansion=0){
    const e=T.MathUtils.smootherstep(expansion,0,1);
    shellParts.forEach(mesh=>{const [x,y,z]=mesh.userData.reveal;mesh.position.set(x*e,y*e,z*e);});
    spineMat.opacity=.86*T.MathUtils.smoothstep(e,.10,.72);nodeMat.opacity=.95*T.MathUtils.smoothstep(e,.20,.82);
    const scale=.001+(1-.001)*T.MathUtils.smootherstep(e,.18,.82);nodePositions.forEach((v,i)=>{dummy.position.set(v[0],v[1],0);dummy.scale.setScalar(scale);dummy.updateMatrix();nodes.setMatrixAt(i,dummy.matrix);});nodes.instanceMatrix.needsUpdate=true;
    skeleton.visible=e>.04;nodes.visible=e>.04;
  },setEnvironment(world=0,night=0){
    const t=Math.max(0,Math.min(2,world)),a=t<1?env.garden:env.desert,b=t<1?env.desert:env.ocean;
    temp.copy(a).lerp(b,t%1).lerp(env.night,night*.55);outer.color.copy(temp);accent.color.copy(temp).offsetHSL(.015,.035,.10);linkMat.color.copy(temp).multiplyScalar(.76);
    outer.emissiveIntensity=.07+night*.07;accent.emissiveIntensity=.08+night*.10;spineMat.emissiveIntensity=.28+night*.30;
  },dispose(){const geometries=new Set(),materials=new Set();root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}};
  root.traverse(o=>{if(o.geometry)api.triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);});api.set(0);api.setEnvironment(0,0);return api;
}

// Prototype 01 is retained only as a comparison on the geometry study page.
function createLegacy(lite){
  const root=new T.Group();root.name='legacy-ribbon-core';const layers=[];
  const defs=corePaths().filter(d=>d.kind==='shell');
  for(let i=0;i<3;i++){const group=new T.Group();group.name=`legacy-layer-${i}`;for(const d of defs){const mesh=new T.Mesh(tube(d.curve,d.radius*.82,true),new T.MeshPhongMaterial({color:i===1?0x69b4bb:0x163945,shininess:44}));group.add(mesh);}group.position.z=(i-1)*.19;root.add(group);layers.push(group);}
  let triangles=0;root.traverse(o=>{if(o.geometry)triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;});
  return {root,layers,shellParts:layers,nodes:{visible:false},variant:'B',triangles,set(e=0){layers.forEach((g,i)=>{const k=i-1;g.position.z=k*(.19+e*.62);g.position.x=k*e*.28;});},setEnvironment(){},dispose(){root.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});}};
}

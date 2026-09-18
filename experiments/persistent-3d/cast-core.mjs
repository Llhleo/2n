import * as T from 'three';
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';

// Authored silhouette, not font data. Broad faces carry identity; the narrow
// equatorial seam is subordinate until the two cast halves open in depth.
export function outlines(){
  const two=new T.Shape();
  two.moveTo(-1.12,.64);
  two.bezierCurveTo(-1.12,1.27,-.72,1.61,-.16,1.61);
  two.bezierCurveTo(.49,1.61,.89,1.27,.89,.78);
  two.bezierCurveTo(.89,.28,.47,.02,.06,-.29);
  two.lineTo(-.48,-.74);two.lineTo(.84,-.74);
  two.quadraticCurveTo(.89,-.74,.89,-.80);two.lineTo(.89,-1.11);
  two.quadraticCurveTo(.89,-1.17,.83,-1.17);two.lineTo(-1.10,-1.17);
  two.quadraticCurveTo(-1.17,-1.17,-1.17,-1.10);two.lineTo(-1.17,-.88);
  two.bezierCurveTo(-1.17,-.65,-.87,-.42,-.62,-.20);
  two.lineTo(.03,.34);two.bezierCurveTo(.26,.53,.39,.65,.39,.84);
  two.bezierCurveTo(.39,1.05,.19,1.18,-.12,1.18);
  two.bezierCurveTo(-.42,1.18,-.61,1.00,-.63,.68);
  two.quadraticCurveTo(-.63,.62,-.69,.62);two.lineTo(-1.06,.62);
  two.quadraticCurveTo(-1.12,.62,-1.12,.64);two.closePath();
  const n=new T.Shape();
  n.moveTo(1.02,1.01);n.lineTo(1.02,1.98);n.lineTo(1.27,1.98);n.lineTo(1.27,1.87);
  n.bezierCurveTo(1.40,2.03,1.64,2.07,1.81,1.94);
  n.bezierCurveTo(1.95,1.83,1.96,1.67,1.96,1.46);
  n.lineTo(1.96,1.01);n.lineTo(1.68,1.01);n.lineTo(1.68,1.54);
  n.bezierCurveTo(1.68,1.73,1.61,1.79,1.49,1.79);
  n.bezierCurveTo(1.35,1.79,1.30,1.68,1.30,1.54);
  n.lineTo(1.30,1.01);n.closePath();return [two,n];
}
function cast(shape,depth,bevel){
  const raw=new T.ExtrudeGeometry(shape,{depth,steps:1,curveSegments:28,bevelEnabled:true,bevelSegments:6,bevelSize:bevel,bevelThickness:bevel});
  raw.deleteAttribute('normal');raw.deleteAttribute('uv');
  const g=mergeVertices(raw,1e-5);raw.dispose();g.computeVertexNormals();return g;
}
export function createCore(variant='A',lite=false){
  const root=new T.Group();root.name='2n-cast-monolith';
  const mark=new T.Group();mark.position.set(-.38,-.36,0);root.add(mark);
  const material=new T.MeshStandardMaterial({color:0x303735,roughness:.36,metalness:.23});
  const innerMaterial=new T.MeshStandardMaterial({color:0x71958c,roughness:.48,metalness:.28});
  const front=new T.Group(),back=new T.Group();front.name='cast-front';back.name='cast-back';mark.add(front,back);
  outlines().forEach((shape,i)=>{
    const bevel=i?.025:.055,geometry=cast(shape,.19,bevel);
    // Mobile shares identical outline, bevel and normals. No faceted mobile LOD.
    const a=new T.Mesh(geometry,material),b=new T.Mesh(geometry,material);
    a.name=i?'n-front':'two-front';b.name=i?'n-back':'two-back';
    a.position.z=.012+bevel;b.rotation.y=Math.PI;b.scale.x=-1;b.position.z=-.012-bevel;
    front.add(a);back.add(b);
  });
  const structure=new T.Group();structure.name='internal-web';mark.add(structure);
  const bridge=new T.Mesh(new T.BoxGeometry(.43,.16,.23),material);
  bridge.name='superscript-mount';bridge.position.set(.96,1.22,-.08);bridge.rotation.z=.32;mark.add(bridge);
  const nodePositions=[[-.79,.79],[-.16,1.37],[.61,.79],[-.19,-.23],[-.82,-.94],[.62,-.94],[1.15,1.61],[1.82,1.53]];
  const struts=[];
  for(const [x,y] of nodePositions){
    const strut=new T.Mesh(new T.CylinderGeometry(.025,.025,1,12),innerMaterial);
    strut.rotation.x=Math.PI/2;strut.position.set(x,y,0);structure.add(strut);struts.push(strut);
    for(const z of [-1,1]){const socket=new T.Mesh(new T.SphereGeometry(.045,12,8),innerMaterial);socket.position.set(x,y,z*.01);socket.userData.end=z;structure.add(socket);}
  }
  const api={root,layers:[front,back],shellParts:[front,back],nodes:structure,variant:'cast',triangles:0,set(expansion=0){
    const e=T.MathUtils.smootherstep(expansion,0,1),gap=e*.34;
    front.position.z=gap;back.position.z=-gap;structure.visible=e>.025;
    struts.forEach(s=>s.scale.y=.024+2*gap);
    structure.children.forEach(s=>{if(s.userData.end)s.position.z=s.userData.end*(gap+.012);});
    bridge.scale.z=1+gap*4;
  },setEnvironment(world=0,night=0){
    const t=T.MathUtils.clamp(world,0,2),colors=[0x303735,0x38352f,0x2b363b].map(c=>new T.Color(c));
    const i=Math.min(1,Math.floor(t));material.color.copy(colors[i]).lerp(colors[i+1],t-i);
    innerMaterial.emissive.set(0x142b28);innerMaterial.emissiveIntensity=night*.12;
  },dispose(){const gs=new Set(),ms=new Set();root.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material)ms.add(o.material);});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());}};
  root.traverse(o=>{if(o.geometry)api.triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;});
  api.set(0);return api;
}

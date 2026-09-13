import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Original authored outlines. No font, TextGeometry, text atlas or downloaded model.
export function outlines(){
  const two=new T.Shape();
  two.moveTo(-1.18,.69);two.bezierCurveTo(-1.19,1.43,-.72,1.67,-.16,1.62);
  two.bezierCurveTo(.62,1.59,.95,1.14,.77,.58);
  two.bezierCurveTo(.62,.12,.04,-.27,-.60,-.83);
  two.lineTo(.88,-.83);two.lineTo(.77,-1.27);two.lineTo(-1.25,-1.27);
  two.lineTo(-1.23,-.90);two.bezierCurveTo(-.75,-.32,.12,.30,.27,.68);
  two.bezierCurveTo(.46,1.16,-.36,1.43,-.65,.90);two.lineTo(-.75,.65);two.closePath();
  const n=new T.Shape();
  n.moveTo(.93,.96);n.lineTo(.93,1.87);n.lineTo(1.14,1.87);n.lineTo(1.14,1.75);
  n.bezierCurveTo(1.52,2.06,1.79,1.89,1.79,1.52);
  n.lineTo(1.79,.96);n.lineTo(1.56,.96);n.lineTo(1.56,1.48);
  n.bezierCurveTo(1.57,1.77,1.17,1.79,1.17,1.48);n.lineTo(1.17,.96);n.closePath();
  return [two,n];
}
export function createCore(variant='A',lite=false){
  const root=new T.Group();root.name='2n-core';
  const layers=[];
  const palette=[0x163945,0x69b4bb,0x15232b];
  for(let i=0;i<3;i++){
    let geo;
    if(variant==='A'){
      const geometries=outlines().map(s=>new T.ExtrudeGeometry(s,{depth:.105,bevelEnabled:true,bevelSegments:lite?1:2,steps:1,bevelSize:.035,bevelThickness:.028,curveSegments:lite?5:10}));
      geo=mergeGeometries(geometries);geometries.forEach(g=>g.dispose());
      geo.translate(-.27,-.20,-.0525);
    }else{
      // Actual second candidate: paired round ribbons, not a placeholder box.
      const paths=[
        [[-1.04,.78,0],[-.75,1.34,.06],[-.03,1.39,.12],[.55,.94,0],[.23,.36,-.08],[-.52,-.37,0],[-1.02,-1.03,.06],[.65,-1.03,0]],
        [[1.00,1.01,0],[1.00,1.82,.06],[1.10,1.50,.12],[1.43,1.82,0],[1.65,1.58,-.06],[1.65,1.01,0]]
      ];
      const gs=paths.map((points,j)=>new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),lite?28:56,j?.10:.16,lite?4:6,false));
      geo=mergeGeometries(gs);gs.forEach(g=>g.dispose());geo.translate(-.27,-.20,0);
    }
    const mat=new T.MeshPhongMaterial({color:palette[i],specular:0x97c4c8,shininess:44});
    const mesh=new T.Mesh(geo,mat);mesh.name=`core-layer-${i}`;root.add(mesh);layers.push(mesh);
  }
  const nodes=new T.InstancedMesh(new T.SphereGeometry(.048,lite?6:10,lite?4:6),new T.MeshBasicMaterial({color:0x8de4e6}),9);
  nodes.name='connection-nodes';root.add(nodes);
  const d=new T.Object3D();
  for(let i=0;i<9;i++){d.position.set(-.7+(i%3)*.48,.85-Math.floor(i/3)*.72,0);d.updateMatrix();nodes.setMatrixAt(i,d.matrix);}
  nodes.instanceMatrix.needsUpdate=true;
  const api={root,layers,nodes,variant,triangles:0,set(expansion=0){
    layers.forEach((m,i)=>{const k=i-1;m.position.set(k*expansion*.36,k*expansion*.12,k*(.19+expansion*.62));m.rotation.y=k*expansion*.10;});
    nodes.visible=expansion>.12;
  },dispose(){root.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material)o.material.dispose();});}};
  layers.forEach(m=>api.triangles+=(m.geometry.index?.count||m.geometry.attributes.position.count)/3);
  api.triangles+=nodes.geometry.index.count/3*9;api.set();return api;
}

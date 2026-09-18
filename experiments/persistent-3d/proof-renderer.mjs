// CPU geometry proof only. Same mesh, normals, camera and depth ordering as the
// live scene; simplified studio shading is NOT WebGL/PBR or performance evidence.
import * as T from 'three';
const key=new T.Vector3(-.5,.75,.8).normalize(),fill=new T.Vector3(.8,.2,.6).normalize();
const half=key.clone().add(new T.Vector3(0,0,1)).normalize();
const aces=x=>Math.min(1,Math.max(0,x*(2.51*x+.03)/(x*(2.43*x+.59)+.14)));
const srgb=x=>x<=.0031308?12.92*x:1.055*x**(1/2.4)-.055;
export function rasterize(scene,camera,width,height){
  const pixels=new Uint8ClampedArray(width*height*4),depth=new Float32Array(width*height).fill(Infinity);
  scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);
  const normal=new T.Vector3(),point=new T.Vector3(),normalMatrix=new T.Matrix3();
  scene.traverseVisible(mesh=>{
    if(!mesh.isMesh||mesh.isInstancedMesh||mesh.material.opacity===0)return;
    const geo=mesh.geometry,pos=geo.attributes.position,norm=geo.attributes.normal,index=geo.index;
    const material=Array.isArray(mesh.material)?mesh.material[0]:mesh.material;
    const color=material.color||new T.Color(.15,.18,.17),verts=[];
    normalMatrix.getNormalMatrix(mesh.matrixWorld);
    for(let i=0;i<pos.count;i++){
      point.fromBufferAttribute(pos,i).applyMatrix4(mesh.matrixWorld).project(camera);
      normal.fromBufferAttribute(norm,i).applyNormalMatrix(normalMatrix);
      verts.push([(point.x*.5+.5)*width,(.5-point.y*.5)*height,point.z,normal.x,normal.y,normal.z]);
    }
    const count=index?index.count:pos.count;
    for(let k=0;k<count;k+=3){
      const a=verts[index?index.getX(k):k],b=verts[index?index.getX(k+1):k+1],c=verts[index?index.getX(k+2):k+2];
      if([a,b,c].some(v=>v[2]<-1||v[2]>1))continue;
      const den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(den)<1e-8)continue;
      const left=Math.max(0,Math.floor(Math.min(a[0],b[0],c[0]))),right=Math.min(width-1,Math.ceil(Math.max(a[0],b[0],c[0])));
      const top=Math.max(0,Math.floor(Math.min(a[1],b[1],c[1]))),bottom=Math.min(height-1,Math.ceil(Math.max(a[1],b[1],c[1])));
      for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++){
        const u=((b[1]-c[1])*(x+.5-c[0])+(c[0]-b[0])*(y+.5-c[1]))/den;
        const v=((c[1]-a[1])*(x+.5-c[0])+(a[0]-c[0])*(y+.5-c[1]))/den,w=1-u-v;
        if(u<0||v<0||w<0)continue;const z=u*a[2]+v*b[2]+w*c[2],at=y*width+x;if(z>=depth[at])continue;depth[at]=z;
        normal.set(u*a[3]+v*b[3]+w*c[3],u*a[4]+v*b[4]+w*c[4],u*a[5]+v*b[5]+w*c[5]).normalize();
        const diffuse=.48+.24*(normal.y*.5+.5)+1.45*Math.max(0,normal.dot(key))+.25*Math.max(0,normal.dot(fill));
        const spec=.16*Math.max(0,normal.dot(half))**32;
        pixels[at*4]=255*srgb(aces(color.r*diffuse+spec));pixels[at*4+1]=255*srgb(aces(color.g*diffuse+spec));pixels[at*4+2]=255*srgb(aces(color.b*diffuse+spec));pixels[at*4+3]=255;
      }
    }
  });return pixels;
}
export class ProofRenderer{
  constructor(){this.domElement=document.createElement('canvas');this.context=this.domElement.getContext('2d');}
  setSize(w,h){const scale=Math.min(1,900/w,900/h);this.domElement.width=Math.round(w*scale);this.domElement.height=Math.round(h*scale);this.domElement.style.width=w+'px';this.domElement.style.height=h+'px';}
  render(scene,camera){const {width,height}=this.domElement;this.context.putImageData(new ImageData(rasterize(scene,camera,width,height),width,height),0,0);}
  dispose(){}
}

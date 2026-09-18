export const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export const mix=(a,b,t)=>a+(b-a)*t;
export const smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
export const ramp=(p,a,b)=>smooth((p-a)/(b-a));
export const stops=[0,.27,.49,.72,1];
export const names=['序章','花园','沙漠','海洋','连接'];

// p, core xyz, scale, pitch/yaw/roll, camera xyz, look xy, expansion.
const desktop=[
 [0,.75,.42,0,.94,.06,.18,-.018,0,.08,7.8,.05,.16,0],
 [.15,.95,.24,0,.92,.04,.16,-.012,.08,.08,7.65,.08,.16,0],
 [.30,1.35,.10,0,.90,.03,.12,0,.18,.08,7.50,.10,.15,0],
 [.50,1.43,.30,0,.94,.035,-.04,0,.28,.10,7.24,.12,.18,0],
 [.72,1.25,.28,0,.95,.04,-.24,0,.36,.12,7.35,.14,.20,0],
 [.84,1.25,.28,0,.96,.05,-.36,0,.38,.14,7.3,.14,.20,.12],
 [1,1.25,.28,0,.90,.06,-.48,0,.35,.14,7.35,.14,.20,1]
];
const mobile=[
 [0,0,1.12,0,.57,.05,.16,0,0,.12,7.9,0,.50,0],
 [.15,.03,1.02,0,.56,.035,.13,0,0,.12,7.8,0,.50,0],
 [.30,.08,.94,0,.55,.03,.10,0,.02,.12,7.7,0,.50,0],
 [.50,.05,1.04,0,.56,.035,-.04,0,.03,.12,7.6,0,.50,0],
 [.72,.04,1.12,0,.58,.04,-.22,0,.04,.12,7.5,0,.50,0],
 [.84,.04,1.12,0,.58,.045,-.32,0,.04,.12,7.5,0,.50,.12],
 [1,.04,1.10,0,.56,.05,-.44,0,.04,.12,7.6,0,.50,.85]
];

export function sample(p,compact=false,reduced=false){
 p=clamp(Number.isFinite(p)?p:0);const keys=compact?mobile:desktop;let a=keys[0],b=keys.at(-1);
 for(let i=1;i<keys.length;i++)if(p<=keys[i][0]){a=keys[i-1];b=keys[i];break;}
 const t=smooth((p-a[0])/(b[0]-a[0])),v=a.map((n,i)=>mix(n,b[i],t));
 const weights=[1-ramp(p,.10,.22),ramp(p,.10,.22)*(1-ramp(p,.33,.43)),ramp(p,.33,.43)*(1-ramp(p,.57,.67)),ramp(p,.57,.67)*(1-ramp(p,.82,.92)),ramp(p,.82,.92)];
 const chapter=weights.indexOf(Math.max(...weights)),world=mix(0,2,ramp(p,.20,.72)),night=ramp(p,.79,.99);
 if(reduced){const r=compact?mobile[0]:desktop[0];return {p,chapter,weights,x:r[1],y:r[2],z:r[3],scale:r[4],pitch:r[5],yaw:r[6],roll:r[7],cameraX:r[8],cameraY:r[9],cameraZ:r[10],lookX:r[11],lookY:r[12],expansion:0,world,night};}
 return {p,chapter,weights,x:v[1],y:v[2],z:v[3],scale:v[4],pitch:v[5],yaw:v[6],roll:v[7],cameraX:v[8],cameraY:v[9],cameraZ:v[10],lookX:v[11],lookY:v[12],expansion:v[13],world,night};
}

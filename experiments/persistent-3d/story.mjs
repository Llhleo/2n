export const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export const mix=(a,b,t)=>a+(b-a)*t;
export const smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
export const ramp=(p,a,b)=>smooth((p-a)/(b-a));
export const stops=[0,.27,.49,.72,1];
export const names=['序章','花园','沙漠','海洋','连接'];

// p, core xyz, scale, pitch/yaw/roll, camera xyz, look xy, expansion.
const desktop=[
 [0,.34,.34,0,1.25,-.025,.10,-.025,0,.02,7.35,.08,.16,0],
 [.15,.46,.31,0,1.21,-.018,-.06,.018,-.08,.02,7.12,.12,.15,0],
 [.30,1.28,.20,0,1.01,0,-.18,.015,-.28,.04,6.88,.22,.12,0],
 [.50,1.08,.16,0,.96,.018,.22,-.012,.12,.02,6.45,.28,.10,0],
 [.72,.72,.20,0,1.08,-.01,-.12,.012,.25,.08,5.86,.22,.20,.03],
 [.84,.34,.26,0,1.22,-.025,-.17,.015,.34,.12,5.46,.18,.24,.14],
 [1,.72,.16,0,1.02,-.015,-.28,.025,.10,.03,6.18,.15,.18,1]
];
const mobile=[
 [0,0,1.10,0,.68,-.015,.08,-.015,0,.12,7.85,0,.62,0],
 [.15,0,1.08,0,.66,-.01,-.04,.01,0,.10,7.72,0,.60,0],
 [.30,.04,1.12,0,.61,0,-.13,.008,-.04,.12,7.55,0,.61,0],
 [.50,-.02,1.08,0,.59,.008,.14,-.006,.03,.10,7.38,0,.60,0],
 [.72,0,1.04,0,.63,-.006,-.10,.008,.04,.14,7.10,0,.58,.03],
 [.84,.02,.98,0,.67,-.01,-.14,.01,.06,.16,6.92,0,.56,.14],
 [1,.02,.91,0,.61,-.008,-.20,.015,.02,.11,7.28,0,.53,.82]
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

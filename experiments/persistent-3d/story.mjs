export const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export const mix=(a,b,t)=>a+(b-a)*t;
export const smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
export const ramp=(p,a,b)=>smooth((p-a)/(b-a));
export const stops=[0,.27,.49,.72,1];
export const names=['序章','花园','沙漠','海洋','连接'];
const desktop=[
 [0,0,.25,1.20,.14,-.035,0],
 [.16,.10,.42,1.13,-.12,.025,0],
 [.30,1.13,.45,.93,-.30,.02,0],
 [.50,1.24,.55,.92,.30,-.015,0],
 [.72,1.18,.57,.99,-.25,.01,.06],
 [.84,.84,.52,1.04,-.35,.02,.18],
 [1,.86,.43,.93,-.52,.05,1]
];
const mobile=[
 [0,0,.45,.91,.14,-.035,0],
 [.16,0,.85,.85,-.10,.025,0],
 [.30,0,1.1,.68,-.24,.02,0],
 [.50,0,1.10,.68,.24,-.015,0],
 [.72,0,1.12,.72,-.22,.01,.06],
 [.84,0,1.1,.71,-.30,.02,.18],
 [1,0,1.04,.63,-.48,.04,1]
];
export function sample(p,compact=false,reduced=false){
 p=clamp(Number.isFinite(p)?p:0);
 const keys=compact?mobile:desktop;
 let a=keys[0],b=keys.at(-1);
 for(let i=1;i<keys.length;i++)if(p<=keys[i][0]){a=keys[i-1];b=keys[i];break;}
 const t=smooth((p-a[0])/(b[0]-a[0]));
 const v=a.map((n,i)=>mix(n,b[i],t));
 const weights=[1-ramp(p,.10,.22),ramp(p,.10,.22)*(1-ramp(p,.33,.43)),ramp(p,.33,.43)*(1-ramp(p,.57,.67)),ramp(p,.57,.67)*(1-ramp(p,.82,.92)),ramp(p,.82,.92)];
 const chapter=weights.indexOf(Math.max(...weights));
 return {p,chapter,weights,x:v[1],y:v[2],scale:v[3],yaw:reduced?.14:v[4],roll:reduced?0:v[5],expansion:reduced?0:v[6],world:mix(0,2,ramp(p,.22,.70)),horizon:mix(.04,-1.65,ramp(p,.06,.28)),night:ramp(p,.81,.99)};
}

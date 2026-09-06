/* Deterministic, filter-free droplet geometry. All input is scroll progress. */
(function(target) {
  'use strict';
  const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
  const mix=(a,b,t)=>a+(b-a)*t;
  const smooth=t=>t*t*(3-2*t);
  const ramp=(x,a,b)=>smooth(clamp((x-a)/(b-a)));
  const point=(x,y,r,a)=>[x+Math.cos(a)*r,y+Math.sin(a)*r];
  const fmt=p=>p.map(v=>Number(v.toFixed(3))).join(' ');
  function circle(x,y,r) {
    if(r<.05) return '';
    // Negative winding, matching the tangent bridge's outline.
    return `M ${fmt([x+r,y])} A ${r} ${r} 0 1 0 ${fmt([x-r,y])} A ${r} ${r} 0 1 0 ${fmt([x+r,y])} Z `;
  }
  function neck(x,y,R,bx,by,r) {
    const d=Math.hypot(bx-x,by-y);
    const gap=Math.min(25,r*.9);
    if(R<1 || r<1 || d<=Math.abs(R-r)+.01 || d>=R+r+gap) return '';
    // Attach cubic curves along circle tangents, not a triangle through centers.
    const theta=Math.atan2(by-y,bx-x);
    const intersect=d<R+r;
    const u=intersect?Math.acos(clamp((R*R+d*d-r*r)/(2*R*d),-1,1)):0;
    const v=intersect?Math.acos(clamp((r*r+d*d-R*R)/(2*r*d),-1,1)):0;
    const outer=Math.acos(clamp((R-r)/d,-1,1));
    const strength=.52*(1-ramp(d,R+r,R+r+gap));
    if(strength<.002) return '';
    const a1=theta+u+(outer-u)*strength;
    const a2=theta-u-(outer-u)*strength;
    const a3=theta+Math.PI-v-(Math.PI-v-outer)*strength;
    const a4=theta-Math.PI+v+(Math.PI-v-outer)*strength;
    const p1=point(x,y,R,a1),p2=point(x,y,R,a2);
    const p3=point(bx,by,r,a3),p4=point(bx,by,r,a4);
    const h=Math.min(strength*2.1,Math.hypot(p1[0]-p3[0],p1[1]-p3[1])/(R+r))*Math.min(1,2*d/(R+r));
    const h1=point(...p1,R*h,a1-Math.PI/2),h3=point(...p3,r*h,a3+Math.PI/2);
    const h4=point(...p4,r*h,a4-Math.PI/2),h2=point(...p2,R*h,a2+Math.PI/2);
    return `M ${fmt(p1)} C ${fmt(h1)} ${fmt(h3)} ${fmt(p3)} L ${fmt(p4)} C ${fmt(h4)} ${fmt(h2)} ${fmt(p2)} Z `;
  }
  function buildGather(M,count,width,height,steps=720) {
    const seed=Math.min(width*.06,height*.045,28);
    const finalRadius=Math.min(width*.72,height*.65)*.6;
    const area=(finalRadius*finalRadius-seed*seed)/count;
    const rows=[];
    let radius=seed;
    const absorbed=Array(count).fill(0);
    for(let k=0;k<=steps;k++) {
      const phase=k/steps;
      const paths=Array.from({length:count},(_,i)=>M.memberPath(i,count,phase,width,height));
      for(let i=0;i<count;i++) {
        const p=paths[i],r=58*p.scale;
        const target=Math.max(0,radius-r*.95);
        const x=p.x+Math.cos(p.heading)*target*p.approach;
        const y=p.y+Math.sin(p.heading)*target*p.approach;
        // No contribution before contact. Full contribution only after entry.
        const overlap=radius+r-Math.hypot(x,y);
        const entered=ramp(overlap,0,1.8*r);
        absorbed[i]=Math.max(absorbed[i],entered);
      }
      radius=Math.sqrt(seed*seed+area*absorbed.reduce((a,b)=>a+b,0));
      rows.push({radius,absorbed:absorbed.slice()});
    }
    return {rows,steps,seed,finalRadius,count,width,height};
  }
  function gatherAt(M,plan,phase) {
    const sample=clamp(phase)*plan.steps,k=Math.floor(sample),t=sample-k;
    const a=plan.rows[k],b=plan.rows[Math.min(k+1,plan.steps)];
    const radius=mix(a.radius,b.radius,t);
    let rx=0,ry=0;
    const drops=Array.from({length:plan.count},(_,i)=> {
      const p=M.memberPath(i,plan.count,phase,plan.width,plan.height);
      const absorbed=mix(a.absorbed[i],b.absorbed[i],t);
      const original=58*p.scale;
      const target=Math.max(0,radius-original*.95);
      const impulse=4*Math.sin(absorbed*Math.PI);
      rx-=Math.cos(p.heading)*impulse; ry-=Math.sin(p.heading)*impulse;
      return {x:p.x+Math.cos(p.heading)*target*p.approach,y:p.y+Math.sin(p.heading)*target*p.approach,
        r:original*Math.sqrt(1-absorbed)*Math.sqrt(ramp(p.mix,0,.09)),
        label:ramp(p.mix,0,.10)*(1-ramp(absorbed,.03,.45)),scale:p.scale,absorbed};
    });
    const x=clamp(rx,-6,6),y=clamp(ry,-6,6);
    for(const drop of drops) {drop.x+=x*drop.absorbed;drop.y+=y*drop.absorbed;}
    return {radius,x,y,drops};
  }
  function buildSplit(M,count,width,height,radius) {
    const plan=Array.from({length:count},(_,i)=>({
      start:((i*7)%count)/count*.46, duration:.54, orbit:M.anniversaryParticle(i,count,.43,width,height),
      orbitRadius:(16+(i%5)*3)/2
    }));
    const mother=s=>radius*Math.sqrt(Math.max(0,1-plan.reduce((sum,p)=>sum+ramp(s,p.start+.10,p.start+p.duration),0)/count));
    for(const p of plan) {
      p.birthRadius=mother(p.start+.11)*.94;
      p.volumeRadius=Math.max(p.orbitRadius,radius/Math.sqrt(count)*.92);
    }
    return {plan,mother};
  }
  function splitAt(plan,s) {
    const drops=plan.plan.map(p=> {
      const local=clamp((s-p.start)/p.duration);
      const flight=ramp(local,.18,1);
      const angle=p.orbit.angle+Math.sin(flight*Math.PI)*.16;
      const distance=mix(p.birthRadius,p.orbit.radius,flight);
      const r=mix(p.volumeRadius,p.orbitRadius,ramp(local,.3,1))*ramp(local,0,.20);
      return {x:Math.cos(angle)*distance,y:Math.sin(angle)*distance,r,
        handoff:ramp(local,.66,1),color:ramp(local,.5,1),scale:r/p.orbitRadius};
    });
    return {radius:plan.mother(clamp(s)),drops};
  }
  const api={circle,neck,buildGather,gatherAt,buildSplit,splitAt};
  if(typeof module==='object' && module.exports) module.exports=api;
  else target.TwoNLiquid=api;
})(typeof window==='object'?window:this);

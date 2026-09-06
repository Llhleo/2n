(() => {
  'use strict';

  // v35.6 compatibility layer for the existing app shell.
  // Keep the complete member roster for gathering, but use stable one-way
  // trajectories for dense rosters and restore the original 23-particle split.
  const root=document.documentElement;
  const source=window.TwoNMotion;
  if(!source) return;
  const clamp=(value,min=0,max=1)=>Math.min(max,Math.max(min,value));
  const lerp=(a,b,t)=>a+(b-a)*t;
  const smooth=t=>t*t*(3-2*t);
  const progress=(value,from,to)=>clamp((value-from)/(to-from));
  const noise=seed=>{const n=Math.sin(seed*127.1+311.7)*43758.5453;return n-Math.floor(n);};
  const nativeBridgeScroll=source.bridgeScroll;
  const nativeMemberPath=source.memberPath;
  const nativeAnniversaryParticle=source.anniversaryParticle;
  const touchFirst=matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0;
  const SPLIT_COUNT=23;
  const motion={...source};

  motion.memberPath=function(index,count,phase,width,height){
    if(count<=48) return nativeMemberPath(index,count,phase,width,height);

    // Consecutive arrivals use golden-angle lanes, so droplets that are active
    // at the same time approach from widely separated directions instead of
    // colliding and being pushed around each other by a frame-to-frame solver.
    const start=.012+index/Math.max(1,count-1)*.72;
    const duration=.052+noise(index+15)*.012;
    const local=progress(phase,start,start+duration);
    const t=smooth(progress(local,.08,1));
    const angle=index*2.399963+noise(index+9)*.16;
    const radius=.955+noise(index+21)*.045;
    const rx=Math.max(68,width*.5-46),ry=Math.max(90,height*.5-92);
    const edge=Math.max(Math.abs(Math.cos(angle)),Math.abs(Math.sin(angle)));
    const sx=Math.cos(angle)/edge*rx*radius,sy=Math.sin(angle)/edge*ry*radius;
    // One shallow bend gives liquid-like inertia while remaining monotonic;
    // there is no sign change or loop in the path.
    const bend=(noise(index+2)-.5)*.12;
    const cx=sx*.54-Math.sin(angle)*Math.min(rx,ry)*bend;
    const cy=sy*.54+Math.cos(angle)*Math.min(rx,ry)*bend;
    const u=1-t;
    return {
      x:u*u*sx+2*u*t*cx,
      y:u*u*sy+2*u*t*cy,
      scale:lerp(.94+noise(index+7)*.08,.35,t),
      opacity:smooth(progress(local,0,.13))*(1-smooth(progress(local,.76,1))),
      mix:smooth(local),
      absorbed:smooth(progress(local,.66,1)),
      approach:t,
      heading:Math.atan2(sy,sx)
    };
  };

  motion.anniversaryParticle=function(index,count,phase,width,height){
    if(count<=48) return nativeAnniversaryParticle(index,count,phase,width,height);
    // The old chapter used 23 orbit particles. Keep all 95 names during gather,
    // but only the first 23 anonymous color particles exist after separation.
    if(index>=SPLIT_COUNT){
      const p=nativeAnniversaryParticle(index,Math.max(1,count),phase,width,height);
      return {...p,opacity:0,scale:0};
    }
    return nativeAnniversaryParticle(index,SPLIT_COUNT,phase,width,height);
  };

  motion.bridgeScroll=function(distance,start,duration){
    const state=nativeBridgeScroll(distance,start,duration);
    if(duration>=4800&&state.phase>0&&state.phase<1){
      const steps=touchFirst?720:1080;
      const raw=clamp((distance-start)/duration);
      state.phase=Math.round(raw*steps)/steps;
    }
    return state;
  };
  window.TwoNMotion=Object.freeze(motion);

  // Let iOS Safari keep native momentum; suppress the old custom horizontal
  // touch interception while app.js registers its bootstrap handlers.
  const nativeAdd=window.addEventListener;
  const blocked=new Set(['touchstart','touchmove','touchend']);
  let booting=true;
  window.addEventListener=function(type,listener,options){
    if(booting&&blocked.has(type)) return;
    return nativeAdd.call(this,type,listener,options);
  };

  nativeAdd.call(window,'DOMContentLoaded',()=>{
    booting=false;
    window.addEventListener=nativeAdd;
    root.dataset.version='35.6';
    document.querySelectorAll('.anniversary-particle').forEach((dot,i)=>{
      if(i>=SPLIT_COUNT){
        dot.style.display='none';
        return;
      }
      // Restore the original pre-dense-roster particle size.
      const size=16+(i%5)*3;
      dot.style.width=size+'px';
      dot.style.height=size+'px';
    });
  },{once:true});
})();

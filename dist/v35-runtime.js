(() => {
  'use strict';

  // v35.5 compatibility layer for the existing v34 app shell.
  // motion.js exports a frozen object, so do not mutate it in strict mode.
  // Clone it once, replace only bridgeScroll, then expose the clone before
  // liquid.js/app.js execute.
  const root=document.documentElement;
  const source=window.TwoNMotion;
  if(!source) return;
  const clamp=value=>Math.max(0,Math.min(1,value));
  const nativeBridgeScroll=source.bridgeScroll;
  const touchFirst=matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0;
  const motion={...source};
  const nativeAnniversaryParticle=source.anniversaryParticle;
  motion.anniversaryParticle=function(index,count,phase,width,height){
    const p=nativeAnniversaryParticle(index,count,phase,width,height);
    if(count<=48) return p;
    // The original per-particle angular jitter is wider than the angular slot
    // when the roster approaches 100 members, so neighbours can cross and pile
    // up. Preserve the original radius/opacity/scale timing but use a monotonic
    // dense-ring angle.
    const s=source.anniversary(phase);
    const fraction=index/Math.max(1,count);
    const angle=fraction*Math.PI*2+s.turns+s.spiral*fraction*Math.PI*3;
    return {...p,x:Math.cos(angle)*p.radius,y:Math.sin(angle)*p.radius,angle};
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

  // Let iOS Safari own native touch momentum. app.js v34 registers three
  // window-level handlers that preventDefault/scrollBy for horizontal gestures;
  // suppress only those registrations during bootstrap.
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
    root.dataset.version='35.5';

    // Match the anniversary particles to the same dense-roster area scaling
    // used by liquid.js. 95 members therefore remain separate on the orbit.
    const count=document.querySelectorAll('.member-cloud span').length;
    const particleScale=Math.min(1,32/Math.max(1,count));
    document.querySelectorAll('.anniversary-particle').forEach((dot,i)=>{
      const size=Math.max(7,(16+(i%5)*3)*particleScale);
      dot.style.width=size.toFixed(2)+'px';
      dot.style.height=size.toFixed(2)+'px';
    });
  },{once:true});
})();

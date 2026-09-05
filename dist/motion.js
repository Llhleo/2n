/* Pure timing and scroll geometry; no DOM and no network dependencies. */
(function (target) {
  'use strict';
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const lerp = (from, to, t) => from + (to - from) * t;
  const progress = (value, from, to) => clamp((value - from) / (to - from));
  const smooth = t => t * t * (3 - 2 * t);
  const easeOut = t => 1 - Math.pow(1 - clamp(t), 4);
  const DURATION = 5600;
  function intro(time) {
    return {
      lineOne: easeOut(progress(time, 100, 880)),
      lineTwo: easeOut(progress(time, 680, 1530)),
      statementExit: smooth(progress(time, 1880, 2680)),
      curtain: smooth(progress(time, 2040, 3450)),
      world: easeOut(progress(time, 2200, 4140)),
      logo: easeOut(progress(time, 2990, 4570)),
      eyebrow: easeOut(progress(time, 3780, 4370)),
      copyOne: easeOut(progress(time, 4250, 4930)),
      copyTwo: easeOut(progress(time, 4500, 5240)),
      controls: smooth(progress(time, 4920, 5500)),
      complete: time >= DURATION
    };
  }
  function scroll(position, lead, travel) {
    return {
      entry: clamp(position / lead),
      x: clamp(position - lead, 0, travel),
      progress: clamp(position / Math.max(1, lead + travel))
    };
  }
  function bridgeScroll(distance, start, duration) {
    return { x: distance - clamp(distance - start, 0, duration), phase: progress(distance, start, start + duration) };
  }
  // Stable per-member variation keeps reverse scrolling identical to forward scrolling.
  const noise = seed => { const n = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };
  function memberPath(index, count, phase, width, height) {
    const start = .015 + index / Math.max(1,count-1) * .61 + noise(index+4)*.025;
    const duration = .23 + noise(index+15)*.10;
    const local = progress(phase,start,start+duration);
    const t = smooth(progress(local,.13,1));
    const angle = index*2.399963 + noise(index+9)*.7;
    const radius = .76 + noise(index+21)*.24;
    const rx = Math.max(68,width*.5-62), ry = Math.max(90,height*.35-35);
    const sx = Math.cos(angle)*rx*radius, sy = Math.sin(angle)*ry*radius;
    const bend = (noise(index+2)>.5 ? 1 : -1)*(.3+noise(index+18)*.5);
    const cx = clamp(sx*.6-Math.sin(angle)*rx*bend,-rx,rx);
    const cy = clamp(sy*.6+Math.cos(angle)*ry*bend,-ry,ry);
    const u = 1-t;
    return {
      x:u*u*sx+2*u*t*cx, y:u*u*sy+2*u*t*cy,
      scale:lerp(.92+noise(index+7)*.12,.35,t),
      opacity:smooth(progress(local,0,.16))*(1-smooth(progress(local,.74,1))),
      mix:smooth(local), absorbed:smooth(progress(local,.64,1))
    };
  }
  function anniversary(phase) {
    return {
      gather:progress(phase,0,.30),
      resultFade:1-smooth(progress(phase,.315,.355)),
      split:smooth(progress(phase,.355,.43)),
      title:smooth(progress(phase,.43,.48))*(1-smooth(progress(phase,.85,.96))),
      order:smooth(progress(phase,.66,.76)),
      turns:progress(phase,.43,.78)*Math.PI*6,
      spiral:smooth(progress(phase,.78,1))
    };
  }
  function anniversaryParticle(index,count,phase,width,height) {
    const s=anniversary(phase), fraction=index/count;
    const base=fraction*Math.PI*2;
    const jitter=(noise(index+50)-.5)*.30*(1-s.order);
    const radius=Math.min(width*.42,height*.32);
    const irregular=lerp(.69+noise(index+80)*.29,1,s.order);
    const coil=s.spiral;
    const angle=base+jitter+s.turns+coil*(Math.PI*4+fraction*Math.PI*4);
    const r=radius*s.split*irregular*(1-coil)*(1-coil*fraction*.8);
    return {
      x:Math.cos(angle)*r,y:Math.sin(angle)*r,
      opacity:smooth(progress(phase,.355,.375))*(1-smooth(progress(coil,.78,1))),
      scale:lerp(.45,1,s.split)*(1-coil*.8), angle,radius:r
    };
  }
  const api = Object.freeze({ clamp, lerp, progress, smooth, easeOut, DURATION, intro, scroll, bridgeScroll, memberPath, anniversary, anniversaryParticle });
  if (typeof module === 'object' && module.exports) module.exports = api;
  else target.TwoNMotion = api;
})(typeof window === 'object' ? window : this);

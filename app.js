(() => {
  const video = document.querySelector('.film-video');
  const playBtn = document.querySelector('#playFilm');
  const hero = document.querySelector('.hero');
  const heroMark = document.querySelector('#heroMark');
  const heroCopy = document.querySelector('.hero-copy');
  const logoRise = document.querySelector('.logo-rise');
  const orbA = document.querySelector('.orb-a');
  const orbB = document.querySelector('.orb-b');
  const sheen = document.querySelector('.mark-sheen');
  const ridges = document.querySelectorAll('.ridge');
  const canvas = document.querySelector('.hero-particles');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.matchMedia('(max-width: 800px)').matches;
  let openingScrollLocked = false;

  const stopOpeningScroll = (event) => {
    if (!openingScrollLocked) return;
    event.preventDefault();
  };
  const stopOpeningKeys = (event) => {
    if (!openingScrollLocked) return;
    if (['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(event.key)) event.preventDefault();
  };
  function lockOpeningScroll(){
    if (openingScrollLocked) return;
    openingScrollLocked = true;
    window.scrollTo(0,0);
    document.documentElement.classList.add('scroll-locked');
    document.body.classList.add('scroll-locked','is-opening');
    window.addEventListener('wheel',stopOpeningScroll,{passive:false});
    window.addEventListener('touchmove',stopOpeningScroll,{passive:false});
    document.addEventListener('keydown',stopOpeningKeys,{passive:false});
  }
  function unlockOpeningScroll(){
    if (!openingScrollLocked) return;
    openingScrollLocked = false;
    document.documentElement.classList.remove('scroll-locked');
    document.body.classList.remove('scroll-locked','is-opening');
    window.removeEventListener('wheel',stopOpeningScroll);
    window.removeEventListener('touchmove',stopOpeningScroll);
    document.removeEventListener('keydown',stopOpeningKeys);
    window.scrollTo(0,0);
    window.ScrollTrigger?.refresh();
  }

  function initParticles(){
    if (!canvas || reduceMotion) return;
    const ctx = canvas.getContext('2d');
    let w=0,h=0,dpr=1;
    const particles=[];
    function spawn(p, randomY=true){
      p.x=Math.random()*w; p.y=randomY?Math.random()*h:h+20;
      p.zone=Math.min(4,Math.floor((p.x/Math.max(w,1))*5));
      p.r=.7+Math.random()*2.1; p.rot=Math.random()*Math.PI; p.vr=(Math.random()-.5)*.025;
      p.vx=(Math.random()-.5)*.16; p.vy=-.08-Math.random()*.24; p.a=.08+Math.random()*.30;
      if(p.zone===0){p.vx=.08+Math.random()*.18;p.vy=.02+Math.random()*.11;p.r=1.4+Math.random()*2.5}
      if(p.zone===1){p.vx=.02+Math.random()*.13;p.vy=-.015-Math.random()*.07;p.r=.5+Math.random()*1.4}
      if(p.zone===2){p.vx=(Math.random()-.5)*.05;p.vy=-.07-Math.random()*.16;p.r=1.6+Math.random()*3.2}
      if(p.zone===3){p.vx=-.05+Math.random()*.12;p.vy=.015+Math.random()*.08;p.r=1.2+Math.random()*2.2}
      if(p.zone===4){p.vx=-.03+Math.random()*.08;p.vy=-.16-Math.random()*.32;p.r=.8+Math.random()*1.5}
    }
    function resize(){
      const r=canvas.getBoundingClientRect(); dpr=Math.min(window.devicePixelRatio||1,2); w=r.width; h=r.height;
      canvas.width=Math.max(1,Math.floor(w*dpr)); canvas.height=Math.max(1,Math.floor(h*dpr)); ctx.setTransform(dpr,0,0,dpr,0,0);
      particles.length=0;
      const count=isMobile ? Math.max(30,Math.min(52,Math.round(w/10))) : Math.max(40,Math.min(100,Math.round(w/15)));
      for(let i=0;i<count;i++){const p={};spawn(p,true);particles.push(p)}
    }
    function tick(){
      ctx.clearRect(0,0,w,h);
      for(const p of particles){
        p.x+=p.vx;p.y+=p.vy;p.rot+=p.vr;
        if(p.y<-25||p.y>h+25||p.x<-30||p.x>w+30) spawn(p,false);
        ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);
        if(p.zone===0){ctx.fillStyle=`rgba(238,177,192,${p.a})`;ctx.beginPath();ctx.ellipse(0,0,p.r*1.8,p.r*.72,0,0,Math.PI*2);ctx.fill()}
        else if(p.zone===1){ctx.fillStyle=`rgba(231,196,128,${p.a})`;ctx.beginPath();ctx.arc(0,0,p.r,0,Math.PI*2);ctx.fill()}
        else if(p.zone===2){ctx.strokeStyle=`rgba(196,240,246,${p.a})`;ctx.lineWidth=.8;ctx.beginPath();ctx.arc(0,0,p.r,0,Math.PI*2);ctx.stroke()}
        else if(p.zone===3){ctx.fillStyle=`rgba(122,177,112,${p.a})`;ctx.beginPath();ctx.ellipse(0,0,p.r*1.7,p.r*.7,0,0,Math.PI*2);ctx.fill()}
        else {ctx.fillStyle=`rgba(255,116,53,${p.a})`;ctx.shadowBlur=8;ctx.shadowColor='rgba(255,90,35,.45)';ctx.beginPath();ctx.arc(0,0,p.r,0,Math.PI*2);ctx.fill()}
        ctx.restore();
      }
      requestAnimationFrame(tick);
    }
    resize();tick();window.addEventListener('resize',resize,{passive:true});
  }

  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    if (reduceMotion) {
      document.body.classList.remove('is-opening');
      gsap.set('.hero-prelude',{display:'none'});
      gsap.set(['.nav','.eyebrow','.tagline','.hero-sub','.scroll-hint'],{opacity:1});
      gsap.set(logoRise,{xPercent:-50,y:0,scale:1,opacity:1,filter:'blur(0px)'});
      gsap.set(heroMark,{y:0,scale:1});
      gsap.set('.hero-bg',{filter:'saturate(1.06) contrast(1.02) brightness(1) blur(0px)',opacity:1});
      gsap.set('.hero-color-wash',{opacity:.72});
      gsap.set('.hero-world-front',{y:'0%',opacity:1});
    } else {
      lockOpeningScroll();
      const opening = gsap.timeline({defaults:{ease:'power3.out'}});

      // 0–3.3 s: atmosphere only. No 2n anywhere.
      opening
        .to('.prelude-caption',{opacity:.72,duration:.6},.35)
        .to('.prelude-beacons i',{opacity:1,duration:.08,stagger:{each:.22,from:'random'},repeat:1,yoyo:true},.65)
        .to('.ring-a',{opacity:.55,scale:3.6,duration:1.65,ease:'power2.out'},1.05)
        .to('.ring-b',{opacity:.24,scale:2.5,duration:1.9,ease:'power2.out'},1.22)
        .to('.prelude-horizon',{opacity:1,scaleX:1,duration:1.25,ease:'power4.inOut'},1.55)
        .to('.prelude-caption',{opacity:0,duration:.45},2.35)
        .to('.prelude-flash',{opacity:.9,duration:.18,ease:'power4.in'},2.92)
        .to('.prelude-flash',{opacity:0,duration:.58,ease:'power2.out'},3.10)
        .to('.hero-prelude',{opacity:0,duration:.85,ease:'power2.inOut'},3.15)
        .set('.hero-prelude',{display:'none'},4.0);

      // World wakes up first, then 2n rises through the horizon.
      opening
        .to('.hero-bg',{filter:'saturate(1.06) contrast(1.02) brightness(1) blur(0px)',opacity:1,scale:1.08,duration:1.65,ease:'power2.out'},3.10)
        .to('.hero-color-wash',{opacity:.72,duration:1.35,ease:'power2.out'},3.18)
        .to('.hero-flare',{opacity:.72,scale:1.12,duration:.72,ease:'power3.out'},3.05)
        .to('.hero-flare',{opacity:.08,scale:1.55,duration:1.45,ease:'power2.out'},3.42)
        .to('.hero-world-front',{y:'0%',opacity:1,duration:1.35,ease:'power4.out'},3.22)
        .to('.world-fog-a',{opacity:.66,x:'20vw',duration:1.9,ease:'power2.out'},3.18)
        .to('.world-fog-b',{opacity:.52,x:'-16vw',duration:2.15,ease:'power2.out'},3.32)
        .to('.hero-horizon-glow',{opacity:1,duration:.55},3.30)
        .to('.hero-beam',{opacity:.75,duration:.75},3.35)
        .fromTo('.ridge',{yPercent:112},{yPercent:0,stagger:.08,duration:1.25,ease:'power4.out'},3.38)
        .set(logoRise,{xPercent:-50,y:isMobile ? window.innerHeight*.50 : window.innerHeight*.46,scale:.93,opacity:1,filter:'blur(7px)'},3.86)
        .to(logoRise,{y:0,scale:1,filter:'blur(0px)',duration:2.05,ease:'power4.inOut'},4.05)
        .to('.hero-horizon-glow',{scaleX:1.12,filter:'brightness(1.7)',duration:.42,yoyo:true,repeat:1,ease:'power2.inOut'},4.62)
        .to('.mark-echo-a',{opacity:.65,x:-10,y:8,duration:.8},4.76)
        .to('.mark-echo-b',{opacity:.5,x:10,y:-8,duration:.8},4.82)
        .to(sheen,{opacity:.95,left:'120%',duration:1.05,ease:'power2.inOut'},5.30)
        .to('.hero-horizon-glow',{opacity:.22,duration:1.0},5.30)
        .to('.hero-beam',{opacity:.12,duration:1.0},5.30)
        .to('.world-fog-a',{opacity:.24,duration:1.35},5.35)
        .to('.world-fog-b',{opacity:.18,duration:1.35},5.42)
        .to('.eyebrow',{opacity:1,y:0,duration:.55},5.50)
        .fromTo('.tagline',{opacity:0,y:32},{opacity:1,y:0,duration:.85},5.72)
        .fromTo('.hero-sub',{opacity:0,y:16},{opacity:1,y:0,duration:.65},5.98)
        .to('.nav',{opacity:1,y:0,duration:.65},6.05)
        .to('.scroll-hint',{opacity:1,y:0,duration:.55},6.18)
        .call(unlockOpeningScroll,[],6.42);

      gsap.to('.mark-echo-a',{y:12,x:-12,duration:4.2,repeat:-1,yoyo:true,ease:'sine.inOut',delay:6.2});
      gsap.to('.mark-echo-b',{y:-12,x:12,duration:4.8,repeat:-1,yoyo:true,ease:'sine.inOut',delay:6.2});
      gsap.to('.mark-two',{y:-5,duration:3.2,repeat:-1,yoyo:true,ease:'sine.inOut',delay:6.2});
      gsap.to('.mark-exp',{y:5,rotation:3,duration:2.8,repeat:-1,yoyo:true,ease:'sine.inOut',delay:6.2});
      gsap.to('.hero-haze',{opacity:.55,duration:4.8,repeat:-1,yoyo:true,ease:'sine.inOut'});
      gsap.to('.world-fog-a',{x:'+=5vw',y:'-=1.5vh',duration:8.5,repeat:-1,yoyo:true,ease:'sine.inOut',delay:6.3});
      gsap.to('.world-fog-b',{x:'-=4vw',y:'+=1.2vh',duration:10,repeat:-1,yoyo:true,ease:'sine.inOut',delay:6.3});
    }

    // Scroll transition after the opening.
    gsap.to('.hero-bg',{scale:1.32,yPercent:8,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});
    gsap.to(heroCopy,{yPercent:-34,opacity:.12,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});
    gsap.to(logoRise,{scale:1.24,yPercent:-6,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});
    gsap.to(heroMark,{rotation:-3,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});
    gsap.to(ridges,{yPercent:-16,stagger:.05,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});
    gsap.to('.hero-world-front',{yPercent:-8,scale:1.025,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});
    gsap.to('.hero-color-wash',{opacity:.35,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});

    const track=document.querySelector('.world-track');
    const wrap=document.querySelector('.world-wrap');
    const worldProgress=document.querySelector('#worldProgress');
    const worldIndex=document.querySelector('#worldIndex');
    const worldTween=gsap.to(track,{
      xPercent:-80,ease:'none',
      scrollTrigger:{
        trigger:wrap,start:'top top',end:'bottom bottom',scrub:1,pin:'.world-pin',
        onUpdate:self=>{
          if(worldProgress) worldProgress.style.transform=`scaleX(${Math.max(.02,self.progress)})`;
          if(worldIndex) worldIndex.textContent=String(Math.min(5,Math.floor(self.progress*5)+1)).padStart(2,'0');
        }
      }
    });
    gsap.utils.toArray('.biome-copy').forEach((copy)=>{
      gsap.fromTo(copy,{y:44,opacity:.16},{y:0,opacity:1,duration:.7,ease:'power3.out',scrollTrigger:{trigger:copy,containerAnimation:worldTween,start:'left 82%',toggleActions:'play none none reverse'}});
    });
    gsap.utils.toArray('.biome-media').forEach((media)=>{
      gsap.fromTo(media,{scale:.92,opacity:0,x:-30},{scale:1,opacity:1,x:0,duration:.85,ease:'power3.out',scrollTrigger:{trigger:media,containerAnimation:worldTween,start:'left 80%',toggleActions:'play none none reverse'}});
      const img=media.querySelector('img');
      if(img){ gsap.to(img,{scale:1.08,ease:'none',scrollTrigger:{trigger:media,containerAnimation:worldTween,start:'left right',end:'right left',scrub:true}}); }
    });
    const leadersTrack=document.querySelector('.leaders-track');
    const leadersWrap=document.querySelector('.leaders-wrap');
    const leadersProgress=document.querySelector('#leadersProgress');
    const leadersIndex=document.querySelector('#leadersIndex');
    const leadersTween=gsap.to(leadersTrack,{xPercent:-75,ease:'none',scrollTrigger:{trigger:leadersWrap,start:'top top',end:'bottom bottom',scrub:1,pin:'.leaders-pin',onUpdate:self=>{if(leadersProgress) leadersProgress.style.transform=`scaleX(${Math.max(.02,self.progress)})`; if(leadersIndex) leadersIndex.textContent=String(Math.min(4,Math.floor(self.progress*4)+1)).padStart(2,'0');}}});
    gsap.utils.toArray('.leader-copy').forEach((copy)=>{gsap.fromTo(copy,{y:42,opacity:.12},{y:0,opacity:1,duration:.75,ease:'power3.out',scrollTrigger:{trigger:copy,containerAnimation:leadersTween,start:'left 82%',toggleActions:'play none none reverse'}});});
    gsap.utils.toArray('.leader-side').forEach((side)=>{gsap.fromTo(side,{x:34,opacity:0},{x:0,opacity:1,duration:.72,ease:'power3.out',scrollTrigger:{trigger:side,containerAnimation:leadersTween,start:'left 78%',toggleActions:'play none none reverse'}});});
    gsap.utils.toArray('.leader-card').forEach((card,i)=>gsap.from(card,{y:60,opacity:0,duration:.8,delay:i*.04,scrollTrigger:{trigger:card,start:'top 88%'}}));
    gsap.from('.member-total',{y:38,opacity:0,duration:.85,scrollTrigger:{trigger:'.members',start:'top 82%'}});
    gsap.from('.member-overview p',{y:24,opacity:0,duration:.75,scrollTrigger:{trigger:'.member-overview',start:'top 84%'}});
    gsap.from('.member-wall span',{y:22,opacity:0,stagger:.03,duration:.45,scrollTrigger:{trigger:'.member-wall',start:'top 86%'}});
    gsap.from('.timeline-list article',{y:40,opacity:0,stagger:.12,scrollTrigger:{trigger:'.timeline-list',start:'top 80%'}});

    // The second screen should feel like the same film, not a separate template.
    gsap.from('.statement-ghost',{scale:.72,rotation:8,opacity:0,duration:1.5,ease:'power3.out',scrollTrigger:{trigger:'.statement',start:'top 82%'}});
    gsap.from('.statement-line',{yPercent:105,opacity:0,stagger:.14,duration:1.0,ease:'power4.out',scrollTrigger:{trigger:'.statement h2',start:'top 84%'}});
    gsap.from('.statement-lead',{y:24,opacity:0,duration:.85,ease:'power3.out',scrollTrigger:{trigger:'.statement-lead',start:'top 90%'}});
    gsap.from('.stats article',{y:35,opacity:0,stagger:.10,duration:.8,ease:'power3.out',scrollTrigger:{trigger:'.stats',start:'top 88%'}});

    ScrollTrigger.create({trigger:'.film',start:'top 65%',end:'bottom 35%',onEnter:()=>video?.play().catch(()=>{}),onEnterBack:()=>video?.play().catch(()=>{}),onLeave:()=>video?.pause(),onLeaveBack:()=>video?.pause()});
  }

  if (hero && !reduceMotion && window.gsap) {
    hero.addEventListener('mousemove', (e) => {
      if (document.querySelector('.hero-prelude')?.style.display !== 'none') return;
      const rect=hero.getBoundingClientRect(); const x=(e.clientX-rect.left)/rect.width-.5; const y=(e.clientY-rect.top)/rect.height-.5;
      gsap.to(heroMark,{x:x*30,y:y*18,rotate:x*4,duration:.9,overwrite:'auto',ease:'power3.out'});
      gsap.to(orbA,{x:x*38,y:y*28,duration:1.2,overwrite:'auto',ease:'power3.out'});
      gsap.to(orbB,{x:x*-30,y:y*-20,duration:1.2,overwrite:'auto',ease:'power3.out'});
      gsap.to('.hero-haze',{x:x*10,y:y*6,duration:1.4,overwrite:'auto',ease:'power3.out'});
      gsap.to('.hero-world-front',{x:x*-10,y:y*-3,duration:1.3,overwrite:'auto',ease:'power3.out'});
      gsap.to('.ridge-a',{x:x*-24,duration:1,overwrite:'auto',ease:'power3.out'});
      gsap.to('.ridge-b',{x:x*-10,duration:1,overwrite:'auto',ease:'power3.out'});
      gsap.to('.ridge-c',{x:x*18,duration:1,overwrite:'auto',ease:'power3.out'});
    });
    hero.addEventListener('mouseleave',()=>gsap.to([heroMark,orbA,orbB,'.hero-haze','.hero-world-front','.ridge-a','.ridge-b','.ridge-c'],{x:0,y:0,rotate:0,duration:1.1,ease:'power3.out',overwrite:'auto'}));
  }

  playBtn?.addEventListener('click',async()=>{if(!video)return;video.muted=false;if(video.paused)await video.play().catch(()=>{});playBtn.textContent='SOUND ON'});
  // Never leave the page locked if the tab is restored or the animation is interrupted.
  window.addEventListener('pageshow',(event)=>{ if(event.persisted && openingScrollLocked) unlockOpeningScroll(); });
  setTimeout(()=>{ if(openingScrollLocked) unlockOpeningScroll(); },9000);
  initParticles();
})();

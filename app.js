(() => {
  const video = document.querySelector('.film-video');
  const playBtn = document.querySelector('#playFilm');
  const hero = document.querySelector('.hero');
  const heroMark = document.querySelector('#heroMark');
  const heroCopy = document.querySelector('.hero-copy');
  const orbA = document.querySelector('.orb-a');
  const orbB = document.querySelector('.orb-b');
  const sheen = document.querySelector('.mark-sheen');
  const ridges = document.querySelectorAll('.ridge');
  const canvas = document.querySelector('.hero-particles');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initParticles(){
    if (!canvas || reduceMotion) return;
    const ctx = canvas.getContext('2d');
    let w=0,h=0,dpr=1;
    const particles=[];
    function resize(){
      const r=canvas.getBoundingClientRect(); dpr=Math.min(window.devicePixelRatio||1,2); w=r.width; h=r.height;
      canvas.width=Math.max(1,Math.floor(w*dpr)); canvas.height=Math.max(1,Math.floor(h*dpr)); ctx.setTransform(dpr,0,0,dpr,0,0);
      particles.length=0;
      const count=Math.max(30,Math.min(72,Math.round(w/22)));
      for(let i=0;i<count;i++) particles.push({x:Math.random()*w,y:Math.random()*h,r:.5+Math.random()*1.7,vx:(Math.random()-.5)*.11,vy:-.06-Math.random()*.18,a:.05+Math.random()*.18});
    }
    function tick(){
      ctx.clearRect(0,0,w,h);
      for(const p of particles){
        p.x+=p.vx;p.y+=p.vy;
        if(p.y<-10){p.y=h+10;p.x=Math.random()*w} if(p.x<-10)p.x=w+10;if(p.x>w+10)p.x=-10;
        ctx.beginPath();ctx.fillStyle=`rgba(18,25,18,${p.a})`;ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();
      }
      requestAnimationFrame(tick);
    }
    resize();tick();window.addEventListener('resize',resize,{passive:true});
  }

  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    if (reduceMotion) {
      gsap.set('.hero-prelude',{display:'none'});
      gsap.set(['.nav','.eyebrow','.tagline','.hero-sub','.scroll-hint'],{opacity:1});
      gsap.set('.mark-horizon-mask',{clipPath:'inset(0% 0 0 0)'});
      gsap.set(heroMark,{y:0,scale:1});
      gsap.set('.hero-bg',{filter:'saturate(1) contrast(1) brightness(1)'});
    } else {
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
        .to('.hero-bg',{filter:'saturate(1) contrast(1) brightness(1)',scale:1.1,duration:1.45,ease:'power2.out'},3.18)
        .to('.hero-horizon-glow',{opacity:1,duration:.55},3.30)
        .to('.hero-beam',{opacity:.75,duration:.75},3.35)
        .fromTo('.ridge',{yPercent:112},{yPercent:0,stagger:.08,duration:1.25,ease:'power4.out'},3.38)
        .to('.mark-horizon-mask',{clipPath:'inset(0% 0 0 0)',duration:1.7,ease:'power4.inOut'},4.05)
        .to(heroMark,{y:0,scale:1,duration:1.65,ease:'power4.out'},4.08)
        .to('.mark-echo-a',{opacity:.65,x:-10,y:8,duration:.8},4.62)
        .to('.mark-echo-b',{opacity:.5,x:10,y:-8,duration:.8},4.68)
        .to(sheen,{opacity:.95,left:'120%',duration:1.05,ease:'power2.inOut'},5.18)
        .to('.hero-horizon-glow',{opacity:.22,duration:1.0},5.30)
        .to('.hero-beam',{opacity:.12,duration:1.0},5.30)
        .to('.eyebrow',{opacity:1,y:0,duration:.55},5.50)
        .fromTo('.tagline',{opacity:0,y:32},{opacity:1,y:0,duration:.85},5.72)
        .fromTo('.hero-sub',{opacity:0,y:16},{opacity:1,y:0,duration:.65},5.98)
        .to('.nav',{opacity:1,y:0,duration:.65},6.05)
        .to('.scroll-hint',{opacity:1,y:0,duration:.55},6.18);

      gsap.to('.mark-echo-a',{y:12,x:-12,duration:4.2,repeat:-1,yoyo:true,ease:'sine.inOut',delay:6.2});
      gsap.to('.mark-echo-b',{y:-12,x:12,duration:4.8,repeat:-1,yoyo:true,ease:'sine.inOut',delay:6.2});
      gsap.to('.mark-two',{y:-5,duration:3.2,repeat:-1,yoyo:true,ease:'sine.inOut',delay:6.2});
      gsap.to('.mark-exp',{y:5,rotation:3,duration:2.8,repeat:-1,yoyo:true,ease:'sine.inOut',delay:6.2});
      gsap.to('.hero-haze',{opacity:.55,duration:4.8,repeat:-1,yoyo:true,ease:'sine.inOut'});
    }

    // Scroll transition after the opening.
    gsap.to('.hero-bg',{scale:1.32,yPercent:8,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});
    gsap.to(heroCopy,{yPercent:-34,opacity:.12,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});
    gsap.to(heroMark,{scale:1.30,rotation:-3,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});
    gsap.to(ridges,{yPercent:-16,stagger:.05,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});

    const track=document.querySelector('.world-track');
    const wrap=document.querySelector('.world-wrap');
    gsap.to(track,{xPercent:-80,ease:'none',scrollTrigger:{trigger:wrap,start:'top top',end:'bottom bottom',scrub:1,pin:'.world-pin'}});
    gsap.utils.toArray('.leader-card').forEach((card,i)=>gsap.from(card,{y:60,opacity:0,duration:.8,delay:i*.04,scrollTrigger:{trigger:card,start:'top 88%'}}));
    gsap.from('.timeline-list article',{y:40,opacity:0,stagger:.12,scrollTrigger:{trigger:'.timeline-list',start:'top 80%'}});
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
      gsap.to('.ridge-a',{x:x*-24,duration:1,overwrite:'auto',ease:'power3.out'});
      gsap.to('.ridge-b',{x:x*-10,duration:1,overwrite:'auto',ease:'power3.out'});
      gsap.to('.ridge-c',{x:x*18,duration:1,overwrite:'auto',ease:'power3.out'});
    });
    hero.addEventListener('mouseleave',()=>gsap.to([heroMark,orbA,orbB,'.hero-haze','.ridge-a','.ridge-b','.ridge-c'],{x:0,y:0,rotate:0,duration:1.1,ease:'power3.out',overwrite:'auto'}));
  }

  playBtn?.addEventListener('click',async()=>{if(!video)return;video.muted=false;if(video.paused)await video.play().catch(()=>{});playBtn.textContent='SOUND ON'});
  initParticles();
})();

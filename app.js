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
    let w=0,h=0,dpr=1,raf=0;
    const particles=[];
    function resize(){
      const r=canvas.getBoundingClientRect(); dpr=Math.min(window.devicePixelRatio||1,2); w=r.width; h=r.height;
      canvas.width=Math.max(1,Math.floor(w*dpr)); canvas.height=Math.max(1,Math.floor(h*dpr)); ctx.setTransform(dpr,0,0,dpr,0,0);
      particles.length=0;
      const count=Math.max(28,Math.min(72,Math.round(w/22)));
      for(let i=0;i<count;i++) particles.push({x:Math.random()*w,y:Math.random()*h,r:.6+Math.random()*1.8,vx:(Math.random()-.5)*.12,vy:-.08-Math.random()*.22,a:.08+Math.random()*.22});
    }
    function tick(){
      ctx.clearRect(0,0,w,h);
      for(const p of particles){p.x+=p.vx;p.y+=p.vy;if(p.y<-10){p.y=h+10;p.x=Math.random()*w}if(p.x<-10)p.x=w+10;if(p.x>w+10)p.x=-10;ctx.beginPath();ctx.fillStyle=`rgba(18,25,18,${p.a})`;ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill()}
      raf=requestAnimationFrame(tick);
    }
    resize();tick();window.addEventListener('resize',resize,{passive:true});
  }

  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    if (!reduceMotion) {
      gsap.to('.pulse-1', { scale: 1.4, opacity: 0, duration: 2.6, repeat: -1, ease: 'sine.out' });
      gsap.to('.pulse-2', { scale: 1.28, opacity: 0, duration: 2.3, repeat: -1, delay: .4, ease: 'sine.out' });
      gsap.to('.pulse-3', { scale: 1.18, opacity: 0, duration: 2.1, repeat: -1, delay: .8, ease: 'sine.out' });
    }

    const intro = gsap.timeline({ defaults:{ease:'power3.out'} });
    intro
      .fromTo('.intro-caption',{opacity:0,y:8},{opacity:.9,y:0,duration:.6},.25)
      .fromTo('.intro-outline',{opacity:0,filter:'blur(16px)',scale:.98},{opacity:.24,filter:'blur(4px)',scale:1,duration:.85,ease:'power2.out'},1.25)
      .to('.intro-scan',{opacity:.9,left:'112%',duration:1.15,ease:'power2.inOut'},1.5)
      .to('.intro-outline',{opacity:.85,filter:'blur(0px)',duration:.65},1.85)
      .to('.intro-caption',{opacity:0,duration:.35},2.0)
      .to('.intro-screen',{opacity:0,duration:.9,ease:'power2.inOut'},2.65)
      .set('.intro-screen',{display:'none'});

    const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: 2.4 });
    heroTl.from('.nav', { y: -22, opacity: 0, duration: .7 }, 0)
      .from('.eyebrow', { y: 18, opacity: 0, duration: .55 }, .1)
      .from('.ridge', { yPercent: 112, stagger: .08, duration: 1.2 }, .25)
      .from('.hero-haze', { opacity: 0, duration: 1.1 }, .25)
      .from('.mark-two', { yPercent: 95, scale: .86, rotationX: 20, rotationZ: -6, opacity: 0, filter: 'blur(16px)', duration: 1.45, ease:'power4.out' }, .68)
      .from('.mark-exp', { yPercent: -95, xPercent: -20, scale: .1, opacity: 0, rotation: 18, filter: 'blur(12px)', duration: 1.05 }, 1.12)
      .from('.mark-echo-a', { opacity: 0, x: -32, y: 28, duration: .95 }, .98)
      .from('.mark-echo-b', { opacity: 0, x: 32, y: -22, duration: .95 }, 1.02)
      .to(sheen, { opacity: .95, left: '118%', duration: 1.0, ease: 'power2.inOut' }, 1.54)
      .from('.tagline', { y: 34, opacity: 0, duration: .9 }, 1.6)
      .from('.hero-sub', { y: 18, opacity: 0, duration: .65 }, 1.84)
      .from('.scroll-hint', { y: 16, opacity: 0, duration: .6 }, 1.98);

    gsap.to('.hero-bg', {scale:1.34,yPercent:8,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});
    gsap.to(heroCopy, {yPercent:-34,opacity:.12,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});
    gsap.to(heroMark, {scale:1.32,rotation:-4,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});
    gsap.to(ridges, {yPercent:-15,stagger:.06,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});
    gsap.to('.tagline',{letterSpacing:'.05em',opacity:0,ease:'none',scrollTrigger:{trigger:'.hero',start:'25% top',end:'85% top',scrub:true}});

    if(!reduceMotion){
      gsap.to('.mark-echo-a',{y:10,x:-10,duration:4.2,repeat:-1,yoyo:true,ease:'sine.inOut'});
      gsap.to('.mark-echo-b',{y:-12,x:12,duration:4.8,repeat:-1,yoyo:true,ease:'sine.inOut'});
      gsap.to('.mark-two',{y:-5,duration:3.2,repeat:-1,yoyo:true,ease:'sine.inOut'});
      gsap.to('.mark-exp',{y:5,rotation:3,duration:2.8,repeat:-1,yoyo:true,ease:'sine.inOut'});
      gsap.to('.hero-haze',{opacity:.55,duration:4.8,repeat:-1,yoyo:true,ease:'sine.inOut'});
    }

    const track=document.querySelector('.world-track'); const wrap=document.querySelector('.world-wrap');
    gsap.to(track,{xPercent:-80,ease:'none',scrollTrigger:{trigger:wrap,start:'top top',end:'bottom bottom',scrub:1,pin:'.world-pin'}});
    gsap.utils.toArray('.leader-card').forEach((card,i)=>gsap.from(card,{y:60,opacity:0,duration:.8,delay:i*.04,scrollTrigger:{trigger:card,start:'top 88%'}}));
    gsap.from('.timeline-list article',{y:40,opacity:0,stagger:.12,scrollTrigger:{trigger:'.timeline-list',start:'top 80%'}});
    ScrollTrigger.create({trigger:'.film',start:'top 65%',end:'bottom 35%',onEnter:()=>video?.play().catch(()=>{}),onEnterBack:()=>video?.play().catch(()=>{}),onLeave:()=>video?.pause(),onLeaveBack:()=>video?.pause()});
  }

  if (hero && !reduceMotion && window.gsap) {
    hero.addEventListener('mousemove', (e) => {
      const rect=hero.getBoundingClientRect(); const x=(e.clientX-rect.left)/rect.width-.5; const y=(e.clientY-rect.top)/rect.height-.5;
      gsap.to(heroMark,{x:x*30,y:y*20,rotate:x*4.5,duration:.95,overwrite:true,ease:'power3.out'});
      gsap.to(orbA,{x:x*38,y:y*28,duration:1.2,overwrite:true,ease:'power3.out'});
      gsap.to(orbB,{x:x*-30,y:y*-20,duration:1.2,overwrite:true,ease:'power3.out'});
      gsap.to('.hero-bg',{x:x*20,y:y*12,duration:1.4,overwrite:true,ease:'power3.out'});
      gsap.to('.hero-haze',{x:x*10,y:y*6,duration:1.4,overwrite:true,ease:'power3.out'});
      gsap.to('.ridge-a',{x:x*-24,duration:1,overwrite:true,ease:'power3.out'}); gsap.to('.ridge-b',{x:x*-10,duration:1,overwrite:true,ease:'power3.out'}); gsap.to('.ridge-c',{x:x*18,duration:1,overwrite:true,ease:'power3.out'});
    });
    hero.addEventListener('mouseleave',()=>gsap.to([heroMark,orbA,orbB,'.hero-bg','.hero-haze','.ridge-a','.ridge-b','.ridge-c'],{x:0,y:0,rotate:0,duration:1.1,ease:'power3.out',overwrite:true}));
  }

  playBtn?.addEventListener('click',async()=>{if(!video)return;video.muted=false;if(video.paused)await video.play().catch(()=>{});playBtn.textContent='SOUND ON'});
  initParticles();
})();

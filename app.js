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

    const intro = gsap.timeline({ defaults:{ease:'power3.out'} });
    intro.to('.intro-mark',{opacity:1,scale:1,filter:'blur(0px)',duration:.9})
      .to('.intro-line',{scaleX:1,duration:.65,ease:'power2.inOut'},.18)
      .to('.intro-mark',{scale:1.06,opacity:.18,duration:.55,ease:'power2.in'},1.0)
      .to('.intro-screen',{yPercent:-100,duration:1.05,ease:'power4.inOut'},1.05)
      .set('.intro-screen',{display:'none'});

    const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' }, delay:1.0 });
    heroTl.from('.nav', { y: -22, opacity: 0, duration: .7 }, 0)
      .from('.eyebrow', { y: 26, opacity: 0, duration: .65 }, .08)
      .from('.ridge', { yPercent: 112, stagger: .08, duration: 1.15 }, .12)
      .from('.mark-two', { yPercent: 56, scale: .82, rotationX: 18, rotationZ: -5, opacity: 0, filter: 'blur(12px)', duration: 1.35 }, .24)
      .from('.mark-exp', { yPercent: -75, xPercent: -18, scale: .15, opacity: 0, rotation: 16, filter: 'blur(9px)', duration: 1.0 }, .72)
      .from('.mark-echo-a', { opacity: 0, x: -28, y: 24, duration: .9 }, .48)
      .from('.mark-echo-b', { opacity: 0, x: 28, y: -22, duration: .9 }, .52)
      .to(sheen, { opacity: .95, left: '118%', duration: 1.05, ease: 'power2.inOut' }, 1.18)
      .from('.tagline', { y: 34, opacity: 0, duration: .82 }, 1.25)
      .from('.hero-sub', { y: 18, opacity: 0, duration: .65 }, 1.48)
      .from('.scroll-hint', { y: 16, opacity: 0, duration: .6 }, 1.68);

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
      gsap.to('.ridge-a',{x:x*-24,duration:1,overwrite:true,ease:'power3.out'}); gsap.to('.ridge-b',{x:x*-10,duration:1,overwrite:true,ease:'power3.out'}); gsap.to('.ridge-c',{x:x*18,duration:1,overwrite:true,ease:'power3.out'});
    });
    hero.addEventListener('mouseleave',()=>gsap.to([heroMark,orbA,orbB,'.hero-bg','.ridge-a','.ridge-b','.ridge-c'],{x:0,y:0,rotate:0,duration:1.1,ease:'power3.out',overwrite:true}));
  }

  playBtn?.addEventListener('click',async()=>{if(!video)return;video.muted=false;if(video.paused)await video.play().catch(()=>{});playBtn.textContent='SOUND ON'});
  initParticles();
})();

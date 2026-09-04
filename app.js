
(() => {
  const hero = document.querySelector('.hero');
  const heroMark = document.querySelector('#heroMark');
  const heroCopy = document.querySelector('.hero-copy');
  const logoRise = document.querySelector('.logo-rise');
  const video = document.querySelector('.film-video');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let openingScrollLocked = false;
  let touchBlocker = null;

  const lockOpeningScroll = () => {
    openingScrollLocked = true;
    document.documentElement.classList.add('scroll-locked');
    document.body.classList.add('scroll-locked');
    if (!touchBlocker) {
      touchBlocker = (e) => { if (openingScrollLocked) e.preventDefault(); };
      window.addEventListener('touchmove', touchBlocker, { passive:false });
      window.addEventListener('wheel', touchBlocker, { passive:false });
    }
  };

  const unlockOpeningScroll = () => {
    openingScrollLocked = false;
    document.documentElement.classList.remove('scroll-locked');
    document.body.classList.remove('scroll-locked');
  };

  function initGSAP(){
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);

    gsap.set(['.nav','.scroll-hint','.eyebrow','.tagline','.hero-sub'], { autoAlpha:0, y:18 });
    gsap.set('.hero-bg-color', { autoAlpha:0 });
    gsap.set('.hero-world-strip', { yPercent:18 });
    gsap.set('.logo-rise', { y:220, autoAlpha:0, filter:'blur(8px)' });

    if (!reduceMotion) {
      lockOpeningScroll();
      const tl = gsap.timeline({ defaults:{ ease:'power2.out' } });
      tl.to('.prelude-pulse',{scale:1.35,stagger:.08,duration:.8,opacity:.15},0)
        .to('.prelude-fog',{xPercent:i=>i? -14:14,opacity:.7,duration:1.2},0.2)
        .to('.prelude-line',{opacity:1,duration:.35},1.55)
        .to('.hero-glow',{autoAlpha:1,duration:.35},1.85)
        .to('.hero-beam',{autoAlpha:.8,duration:.6},1.9)
        .to('.hero-bg-color',{autoAlpha:1,duration:1.6},2.0)
        .to('.hero-world-strip',{yPercent:0,duration:1.2,ease:'power3.out'},2.15)
        .to('.world-fog-a',{x:'18vw',autoAlpha:.65,duration:1.8},2.0)
        .to('.world-fog-b',{x:'-15vw',autoAlpha:.5,duration:2.1},2.1)
        .to('.hero-prelude',{autoAlpha:0,duration:.9,ease:'power2.inOut'},2.4)
        .to('.logo-rise',{y:0,autoAlpha:1,filter:'blur(0px)',duration:1.9,ease:'power4.out'},3.1)
        .to('.mark-echo-a',{autoAlpha:.65,duration:.45},3.65)
        .to('.mark-echo-b',{autoAlpha:.55,duration:.45},3.75)
        .to('.mark-sheen',{autoAlpha:.95,left:'120%',duration:1.0,ease:'power2.inOut'},4.35)
        .to('.eyebrow',{autoAlpha:1,y:0,duration:.45},4.75)
        .to('.tagline',{autoAlpha:1,y:0,duration:.75},4.95)
        .to('.hero-sub',{autoAlpha:1,y:0,duration:.55},5.1)
        .to('.nav',{autoAlpha:1,y:0,duration:.6},5.25)
        .to('.scroll-hint',{autoAlpha:1,y:0,duration:.5},5.4)
        .call(unlockOpeningScroll, [], 5.45);

      gsap.to('.world-fog-a',{x:'+=4vw',y:'-=1vh',repeat:-1,yoyo:true,duration:8.5,ease:'sine.inOut',delay:5.4});
      gsap.to('.world-fog-b',{x:'-=3vw',y:'+=1.2vh',repeat:-1,yoyo:true,duration:9.5,ease:'sine.inOut',delay:5.4});
      gsap.to('.mark-echo-a',{x:-12,y:10,repeat:-1,yoyo:true,duration:4.3,ease:'sine.inOut',delay:5.5});
      gsap.to('.mark-echo-b',{x:12,y:-8,repeat:-1,yoyo:true,duration:4.8,ease:'sine.inOut',delay:5.5});
    } else {
      gsap.set(['.hero-prelude'], { display:'none' });
      gsap.set(['.hero-bg-color','.logo-rise','.nav','.scroll-hint','.eyebrow','.tagline','.hero-sub'], { clearProps:'all' });
      unlockOpeningScroll();
    }

    gsap.to('.hero-bg-gray',{scale:1.22,yPercent:6,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});
    gsap.to(heroCopy,{yPercent:-24,opacity:.15,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});
    gsap.to('.hero-world-strip',{yPercent:-8,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});
    gsap.to(logoRise,{scale:1.16,yPercent:-6,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});

    const worldTween = gsap.to('.world-track',{
      xPercent:-80,ease:'none',
      scrollTrigger:{
        trigger:'.world-wrap',start:'top top',end:'bottom bottom',scrub:1,pin:'.world-pin',
        onUpdate:self=>{
          const wp=document.querySelector('#worldProgress'); const wi=document.querySelector('#worldIndex');
          if(wp) wp.style.transform = `scaleX(${Math.max(.02,self.progress)})`;
          if(wi) wi.textContent = String(Math.min(5, Math.floor(self.progress*5)+1)).padStart(2,'0');
        }
      }
    });
    gsap.utils.toArray('.biome-copy').forEach((copy)=>{
      gsap.from(copy,{y:44,opacity:0,duration:.7,ease:'power3.out',scrollTrigger:{trigger:copy,containerAnimation:worldTween,start:'left 82%',toggleActions:'play none none reverse'}});
    });

    const leadersTween = gsap.to('.leaders-track',{
      xPercent:-75,ease:'none',
      scrollTrigger:{
        trigger:'.leaders-wrap',start:'top top',end:'bottom bottom',scrub:1,pin:'.leaders-pin',
        onUpdate:self=>{
          const lp=document.querySelector('#leadersProgress'); const li=document.querySelector('#leadersIndex');
          if(lp) lp.style.transform = `scaleX(${Math.max(.02,self.progress)})`;
          if(li) li.textContent = String(Math.min(4, Math.floor(self.progress*4)+1)).padStart(2,'0');
        }
      }
    });
    gsap.utils.toArray('.leader-copy').forEach((copy)=>{
      gsap.from(copy,{y:42,opacity:0,duration:.7,ease:'power3.out',scrollTrigger:{trigger:copy,containerAnimation:leadersTween,start:'left 82%',toggleActions:'play none none reverse'}});
    });
    gsap.utils.toArray('.leader-side').forEach((side)=>{
      gsap.from(side,{x:34,opacity:0,duration:.7,ease:'power3.out',scrollTrigger:{trigger:side,containerAnimation:leadersTween,start:'left 76%',toggleActions:'play none none reverse'}});
    });

    gsap.from('.statement-ghost',{scale:.74,rotation:8,opacity:0,duration:1.4,ease:'power3.out',scrollTrigger:{trigger:'.statement',start:'top 82%'}});
    gsap.from('.statement-line',{yPercent:105,opacity:0,stagger:.14,duration:.95,ease:'power4.out',scrollTrigger:{trigger:'.statement h2',start:'top 84%'}});
    gsap.from('.statement-lead',{y:24,opacity:0,duration:.8,scrollTrigger:{trigger:'.statement-lead',start:'top 90%'}});
    gsap.from('.stats article',{y:35,opacity:0,stagger:.1,duration:.75,scrollTrigger:{trigger:'.stats',start:'top 88%'}});
    gsap.from('.member-total',{y:32,opacity:0,duration:.8,scrollTrigger:{trigger:'.members',start:'top 82%'}});
    gsap.from('.member-overview p',{y:24,opacity:0,duration:.7,scrollTrigger:{trigger:'.member-overview',start:'top 84%'}});
    gsap.from('.member-wall span',{y:18,opacity:0,stagger:.03,duration:.4,scrollTrigger:{trigger:'.member-wall',start:'top 88%'}});
    gsap.from('.timeline-list article',{y:28,opacity:0,stagger:.12,duration:.7,scrollTrigger:{trigger:'.timeline-list',start:'top 84%'}});

    ScrollTrigger.create({trigger:'.film',start:'top 65%',end:'bottom 35%',onEnter:()=>video?.play().catch(()=>{}),onEnterBack:()=>video?.play().catch(()=>{}),onLeave:()=>video?.pause(),onLeaveBack:()=>video?.pause()});
  }

  if (hero && !reduceMotion && window.gsap) {
    const resetTargets = [heroMark, '.hero-world-strip', '.world-fog-a', '.world-fog-b'];
    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - .5;
      const y = (e.clientY - rect.top) / rect.height - .5;
      gsap.to(heroMark,{x:x*24,y:y*14,rotate:x*4,duration:.8,overwrite:'auto',ease:'power3.out'});
      gsap.to('.hero-world-strip',{x:x*-10,y:y*-2,duration:1.0,overwrite:'auto',ease:'power3.out'});
      gsap.to('.world-fog-a',{x:x*18,duration:1.0,overwrite:'auto',ease:'power3.out'});
      gsap.to('.world-fog-b',{x:x*-14,duration:1.0,overwrite:'auto',ease:'power3.out'});
    });
    hero.addEventListener('mouseleave',()=>gsap.to(resetTargets,{x:0,y:0,rotate:0,duration:1.0,ease:'power3.out',overwrite:'auto'}));
  }

  window.addEventListener('pageshow',(event)=>{ if(event.persisted && openingScrollLocked) unlockOpeningScroll(); });
  setTimeout(()=>{ if(openingScrollLocked) unlockOpeningScroll(); }, 9000);
  initGSAP();
})();

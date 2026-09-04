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

  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from('.nav', { y: -22, opacity: 0, duration: .7 }, 0)
      .from('.eyebrow', { y: 28, opacity: 0, duration: .7 }, .08)
      .from('.mark-two', { yPercent: 22, scale: .88, rotation: -4, opacity: 0, filter: 'blur(10px)', duration: 1.1 }, .12)
      .from('.mark-exp', { yPercent: -60, xPercent: -12, scale: .2, opacity: 0, rotation: 10, filter: 'blur(8px)', duration: .95 }, .38)
      .from('.mark-echo-a', { opacity: 0, x: -20, y: 20, duration: .8 }, .2)
      .from('.mark-echo-b', { opacity: 0, x: 20, y: -20, duration: .8 }, .24)
      .from('.tagline', { y: 24, opacity: 0, duration: .7 }, .62)
      .from('.scroll-hint', { y: 12, opacity: 0, duration: .6 }, .84)
      .from('.ridge', { yPercent: 100, stagger: .08, duration: 1 }, .35)
      .to(sheen, { opacity: .95, left: '118%', duration: 1.1, ease: 'power2.inOut' }, .84);

    gsap.to('.hero-bg', {
      scale: 1.32,
      yPercent: 8,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });

    gsap.to(heroCopy, {
      yPercent: -30,
      opacity: .15,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });

    gsap.to(heroMark, {
      scale: 1.18,
      rotation: -3,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });

    gsap.to(ridges, {
      yPercent: -10,
      stagger: .06,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });

    gsap.to('.mark-echo-a', { y: 10, x: -10, duration: 4.2, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    gsap.to('.mark-echo-b', { y: -12, x: 12, duration: 4.8, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    gsap.to('.mark-two', { y: -5, duration: 3.2, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    gsap.to('.mark-exp', { y: 5, rotation: 3, duration: 2.8, repeat: -1, yoyo: true, ease: 'sine.inOut' });

    const track = document.querySelector('.world-track');
    const wrap = document.querySelector('.world-wrap');
    gsap.to(track, {
      xPercent: -80,
      ease: 'none',
      scrollTrigger: { trigger: wrap, start: 'top top', end: 'bottom bottom', scrub: 1, pin: '.world-pin' }
    });

    gsap.utils.toArray('.leader-card').forEach((card, i) => {
      gsap.from(card, { y: 60, opacity: 0, duration: .8, delay: i * .04,
        scrollTrigger: { trigger: card, start: 'top 88%' }});
    });

    gsap.from('.timeline-list article', {
      y: 40, opacity: 0, stagger: .12,
      scrollTrigger: { trigger: '.timeline-list', start: 'top 80%' }
    });

    ScrollTrigger.create({
      trigger: '.film', start: 'top 65%', end: 'bottom 35%',
      onEnter: () => video?.play().catch(()=>{}),
      onEnterBack: () => video?.play().catch(()=>{}),
      onLeave: () => video?.pause(), onLeaveBack: () => video?.pause()
    });
  }

  if (hero && window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      gsap.to(heroMark, { x: x * 26, y: y * 18, rotate: x * 4, duration: .9, overwrite: true, ease: 'power3.out' });
      gsap.to(orbA, { x: x * 34, y: y * 24, duration: 1.2, overwrite: true, ease: 'power3.out' });
      gsap.to(orbB, { x: x * -28, y: y * -18, duration: 1.2, overwrite: true, ease: 'power3.out' });
      gsap.to('.hero-bg', { x: x * 18, y: y * 10, duration: 1.4, overwrite: true, ease: 'power3.out' });
      gsap.to('.ridge-a', { x: x * -20, duration: 1, overwrite: true, ease: 'power3.out' });
      gsap.to('.ridge-b', { x: x * -8, duration: 1, overwrite: true, ease: 'power3.out' });
      gsap.to('.ridge-c', { x: x * 15, duration: 1, overwrite: true, ease: 'power3.out' });
    });

    hero.addEventListener('mouseleave', () => {
      gsap.to([heroMark, orbA, orbB, '.hero-bg', '.ridge-a', '.ridge-b', '.ridge-c'], {
        x: 0, y: 0, rotate: 0, duration: 1.1, ease: 'power3.out', overwrite: true
      });
    });
  }

  playBtn?.addEventListener('click', async () => {
    if (!video) return;
    video.muted = false;
    if (video.paused) await video.play().catch(()=>{});
    playBtn.textContent = 'SOUND ON';
  });
})();

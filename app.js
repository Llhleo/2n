(() => {
  const video = document.querySelector('.film-video');
  const playBtn = document.querySelector('#playFilm');

  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    gsap.to('.hero-bg', {
      scale: 1.32,
      yPercent: 8,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });
    gsap.to('.hero-copy', {
      yPercent: -30,
      opacity: .15,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });

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

  playBtn?.addEventListener('click', async () => {
    if (!video) return;
    video.muted = false;
    if (video.paused) await video.play().catch(()=>{});
    playBtn.textContent = 'SOUND ON';
  });
})();

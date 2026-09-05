(() => {
  'use strict';
  const BRAND_MODE = 'wordmark'; // 'image' keeps the supplied candidate emblem available.
  const M = window.TwoNMotion;
  if (!M) { window.twoNFallback(); return; }
  const { clamp, lerp, smooth, progress, easeOut } = M;
  const root = document.documentElement;
  const one = selector => document.querySelector(selector);
  const all = selector => [...document.querySelectorAll(selector)];
  const shell = one('.story-shell');
  const track = one('.story-track');
  const hero = one('.hero');
  const mark = one('.hero-mark');
  const header = one('.site-header');
  const controls = one('.story-controls');
  const introScreen = one('.intro-screen');
  const introLines = all('.intro-line');
  const heroLines = all('.hero-line');
  const heroCopy = one('.hero-copy');
  const eyebrow = one('.hero-eyebrow');
  const cue = one('.scroll-cue');
  const worldIndex = one('.world-index');
  const loadStatus = one('.load-status');
  const meter = one('.progress i');
  const counter = one('.chapter-count b');
  const chapterName = one('.chapter-name');
  const motionButton = one('.motion-toggle');
  const panels = all('.panel');
  const mediaQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const qaTouch = location.hostname === 'terminal.local' && new URLSearchParams(location.search).has('qa-touch');
  const touchFirst = qaTouch || matchMedia('(pointer:coarse)').matches || navigator.maxTouchPoints > 0;
  const imagePaths = ['garden', 'desert', 'ocean', 'jungle', 'hell'].map(name => 'assets/' + name + '.png');
  const tones = ['#239450', '#dfca91', '#4c8fb9', '#339a48', '#b53d3b'];
  // Content lives in HTML, so members and contributions survive script failure.
  all('.biome').forEach(panel => {
    const visual = document.createElement('div');
    visual.className = 'biome-visual'; visual.setAttribute('aria-hidden', 'true');
    panel.prepend(visual);
  });
  root.dataset.brand = BRAND_MODE;
  root.dataset.version = '25';
  root.dataset.input = touchFirst ? 'touch' : 'pointer';

  let userReduced = false;
  try { userReduced = localStorage.getItem('2n-reduced-motion') === 'true'; } catch {}
  let reduced = mediaQuery.matches || userReduced;
  let width = innerWidth, height = innerHeight, lead = 1, travel = 0;
  let geometry = [], stops = [], cardGeometry = [];
  let scene = null, active = true, initialized = false, ready = false;
  let playing = false, startedAt = 0, time = 0, hiddenAt = 0;
  let frameId = 0, lastFrame = 0, renderedScroll = 0, activeChapter = -1;
  let cursorX = 0, cursorY = 0, wantedX = 0, wantedY = 0;
  let logoTop = 0, logoHeight = 0, focusAfterIntro = false;
  let touch = null;
  const bridge = one('.bridge');
  const orb = one('.bridge-orb');
  const bridgeFirst = one('.bridge-first');
  const bridgeSecond = one('.bridge-second');
  let bridgeStart = 0, bridgeDuration = 1;
  const members = one('.members');
  const memberCore = one('.member-core');
  const memberMessage = one('.member-message');
  const memberResult = one('.member-result');
  const memberCaption = one('.member-caption');
  const memberBubbles = all('.member-cloud span');
  let memberStart = 0, memberDuration = 1;
  const scrollForX = x => lead + x + (x > bridgeStart ? bridgeDuration : 0) + (x > memberStart ? memberDuration : 0);

  function setMotionPreference() {
    reduced = mediaQuery.matches || userReduced;
    root.classList.toggle('is-reduced-motion', reduced);
    motionButton.setAttribute('aria-pressed', String(reduced));
    motionButton.textContent = reduced ? '动态已减少' : '减少动态';
  }

  // Two canvas layers composite the exact supplied PNGs. No generated scenery assets.
  class WorldScene {
    constructor(images) {
      this.images = images;
      this.back = one('.world-back');
      this.front = one('.world-front');
      this.bg = this.back.getContext('2d');
      this.fg = this.front.getContext('2d');
      if (!this.bg || !this.fg) throw new Error('Canvas unavailable');
      this.atlas = document.createElement('canvas');
    }
    makeAtlas() {
      // Match the painted aspect ratio; retain game-texture proportions on phones.
      this.atlas.width = Math.min(2200, Math.max(780, Math.round(width * 1.6)));
      this.atlas.height = Math.ceil(this.atlas.width * height * 1.25 / (width * 1.16));
      const ctx = this.atlas.getContext('2d');
      const positions = [0, .22, .40, .64, .82, 1];
      this.images.forEach((img, i) => {
        const start = positions[i] * this.atlas.width;
        const end = positions[i + 1] * this.atlas.width;
        const blend = i === 0 ? 0 : 130;
        const tile = document.createElement('canvas');
        tile.width = Math.ceil(end - start + blend);
        tile.height = this.atlas.height;
        const t = tile.getContext('2d');
        t.fillStyle = tones[i]; t.fillRect(0, 0, tile.width, tile.height);
        if (img) {
          const tileHeight = img.naturalHeight * tile.width / img.naturalWidth;
          for (let y=0; y<tile.height; y+=tileHeight) t.drawImage(img, 0, y, tile.width, tileHeight);
        }
        if (blend) {
          t.globalCompositeOperation = 'destination-in';
          const fade = t.createLinearGradient(0, 0, blend, 0);
          fade.addColorStop(0, 'transparent'); fade.addColorStop(1, '#000');
          t.fillStyle = fade; t.fillRect(0, 0, tile.width, tile.height);
        }
        ctx.drawImage(tile, start - blend, 0);
      });
    }
    resize() {
      this.makeAtlas();
      // A 1x canvas is enough beneath the textured artwork on touch screens and
      // avoids pushing two retina-sized canvases through every scroll frame.
      this.dpr = touchFirst ? 1 : Math.min(devicePixelRatio || 1, 1.5);
      for (const canvas of [this.back, this.front]) {
        canvas.width = Math.round(width * this.dpr);
        canvas.height = Math.round(height * this.dpr);
      }
    }
    ridge(x, base, amplitude, phase) {
      return base + height * amplitude * (
        Math.sin(x / width * Math.PI * 2.35 + phase) * .72 +
        Math.cos(x / width * Math.PI * 4.7 + phase * .7) * .28
      );
    }
    sheet(ctx, base, amplitude, phase, offsetX, offsetY, wash, entry) {
      ctx.save();
      const zoom = 1 + easeOut(entry) * 1.35;
      ctx.translate(width * .5, height * .5);
      ctx.scale(zoom, zoom);
      ctx.translate(-width * .5 + width * .30 * entry, -height * .5 + height * .035 * entry);
      ctx.beginPath();
      const sample = Math.max(touchFirst ? 9 : 5, width / (touchFirst ? 54 : 100));
      for (let x = -width; x <= width * 2; x += sample) {
        const y = this.ridge(x, base + offsetY, amplitude, phase);
        if (x === -width) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.lineTo(width * 2, height * 3); ctx.lineTo(-width, height * 3); ctx.closePath();
      ctx.clip();
      ctx.drawImage(this.atlas, -width * .08 + offsetX, base - height * .19 + offsetY, width * 1.16, height * 1.25);
      if (wash) {
        ctx.fillStyle = wash; ctx.fillRect(-width, -height, width * 3, height * 4);
      }
      ctx.restore();
    }
    transform(entry) {
      const amount = smooth(entry);
      this.back.style.transform = 'translate3d(' + (amount*width*.07) + 'px,' + (amount*height*.015) + 'px,0) scale(' + (1+amount*.32) + ')';
      this.front.style.transform = 'translate3d(' + (amount*width*.12) + 'px,' + (-amount*height*.025) + 'px,0) scale(' + (1+amount*.42) + ')';
    }
    draw(state, entry, now) {
      const { bg, fg } = this;
      this.back.style.transform='none';
      this.front.style.transform='none';
      for (const ctx of [bg, fg]) {
        ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        ctx.clearRect(0, 0, width, height);
      }
      const sky = bg.createLinearGradient(0, 0, 0, height);
      sky.addColorStop(0, '#f3f2ec'); sky.addColorStop(.53, '#e9ece1'); sky.addColorStop(1, '#c3d2bc');
      bg.fillStyle = sky; bg.fillRect(0, 0, width, height);
      const drift = reduced || touchFirst ? 0 : Math.sin(now / 7800) * 2;
      const base = logoTop + logoHeight * .67;
      const rise = (1 - state.world) * height * .24;
      const pointerX = reduced ? 0 : cursorX;
      const pointerY = reduced ? 0 : cursorY;
      this.sheet(bg, base - height * .12, .047, .2, -pointerX * .35, rise - pointerY * .3, '#f3f2ec66', entry);
      this.sheet(bg, base - height * .047, .041, 1.4, pointerX * .32, rise * .7 + drift, '#151d1510', entry);
      // Solve the front contour against the measured logo, including the center wave.
      const centralWave = this.ridge(width * .5, 0, .035, 2.5);
      const frontBase = base - centralWave;
      this.sheet(fg, frontBase, .035, 2.5, pointerX * .85, rise * .5 + pointerY * .42 + drift * .6 - entry * height * .04, '#09180915', entry);
      const shade = fg.createLinearGradient(0, height * .60, 0, height);
      shade.addColorStop(0, 'transparent'); shade.addColorStop(1, '#0a100950');
      fg.fillStyle = shade; fg.fillRect(0, height * .62, width, height * .38);
    }
  }

  function measure(preserve = true) {
    const oldLead = lead, oldTravel = travel, oldY = scrollY;
    const previousEntry = oldLead ? oldY / oldLead : 0;
    const previousTrackRatio = oldTravel ? (oldY - oldLead) / oldTravel : 0;
    width = document.documentElement.clientWidth;
    height = innerHeight;
    root.style.setProperty('--view-height', height + 'px');
    lead = Math.round(Math.max(width * .94, height * .78));
    geometry = panels.map(panel => ({
      panel,
      x:panel.offsetLeft,
      width:panel.offsetWidth,
      copy:panel.querySelector('.biome-copy'),
      visual:panel.querySelector('.biome-visual')
    }));
    bridgeStart = bridge.offsetLeft;
    bridgeDuration = Math.round(Math.max(width * 1.8, height * 2.2));
    memberStart = members.offsetLeft;
    memberDuration = Math.round(Math.max(width*3, height*4.8));
    travel = Math.max(0, track.scrollWidth - width) + bridgeDuration + memberDuration;
    shell.style.height = (lead + travel + height) + 'px';
    logoTop = mark.offsetTop;
    logoHeight = mark.offsetHeight;
    const trackLeft = track.getBoundingClientRect().left;
    cardGeometry = all('.leader-card').map(card => ({
      card, x:card.getBoundingClientRect().left - trackLeft, width:card.offsetWidth, content:card.lastElementChild
    }));
    stops = [0, ...geometry.map(g => scrollForX(g.x)), lead+bridgeStart+bridgeDuration, ...cardGeometry.map(g => scrollForX(g.x))];
    stops.push(scrollForX(memberStart)+memberDuration*.5, scrollForX(memberStart)+memberDuration);
    stops = [...new Set(stops.map(value => Math.min(lead + travel, Math.round(value))))].sort((a,b) => a-b);
    if (scene) scene.resize();
    if (preserve && initialized && ready) {
      const next = oldY <= oldLead ? previousEntry * lead : lead + previousTrackRatio * travel;
      scrollTo({ top:clamp(next, 0, lead + travel), behavior:'instant' });
      renderedScroll = scrollY;
    }
    schedule();
  }

  function applyIntro(state) {
    introLines[0].style.transform = 'translateY(' + ((1-state.lineOne)*120 - state.statementExit*125) + '%)';
    introLines[1].style.transform = 'translateY(' + ((1-state.lineTwo)*120 - state.statementExit*125) + '%)';
    introScreen.style.clipPath = 'inset(0 0 ' + state.curtain*100 + '% 0)';
    introScreen.style.pointerEvents = ready ? 'none' : 'auto';
    for (const element of [header, controls]) {
      element.style.opacity = state.controls;
      element.style.transform = 'translateY(' + ((1-state.controls)*12) + 'px)';
    }
    heroLines[0].style.transform = 'translateY(' + (1-state.copyOne)*115 + '%)';
    heroLines[1].style.transform = 'translateY(' + (1-state.copyTwo)*115 + '%)';
    eyebrow.style.opacity = state.eyebrow;
    cue.style.opacity = state.controls;
    worldIndex.style.opacity = state.controls;
  }

  function updateChapter(index) {
    if (index === activeChapter) return;
    activeChapter = index;
    counter.textContent = String(index + 1).padStart(2, '0');
    chapterName.textContent = index === 0 ? '序章' : panels[index-1].dataset.chapter;
    root.classList.toggle('is-light-chrome', index > 0 && index <= 6 || index === 8);
    root.classList.toggle('is-ink-footer', index === 7 || index === 9 || index === 10);
    const group = index >= 1 && index <= 5 ? 'biomes' : index === 7 ? 'leaders' : index === 9 ? 'film' : '';
    all('.chapter-nav button').forEach(button => {
      if (button.dataset.section === group) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    });
  }

  function renderMembers(phase, x) {
    const arriving = smooth(progress(x,memberStart-width,memberStart));
    // The member scene occupies the viewport during the chapter dissolve.
    members.style.transform = x < memberStart ? 'translate3d(' + (x-memberStart) + 'px,0,0)' : 'none';
    members.style.opacity = String(arriving);
    members.style.zIndex = '2';
    one('.leaders').style.opacity = String(1-arriving);
    if(x < memberStart-width || x > memberStart+width) return;
    const paths = memberBubbles.map((_,i)=>M.memberPath(i,memberBubbles.length,phase,width,height));
    const growth = paths.reduce((sum,path)=>sum+path.absorbed,0)/Math.max(1,paths.length);
    memberCore.style.transform = 'scale(' + Math.sqrt(lerp(.12*.12,1.2*1.2,growth)) + ')';
    memberCore.style.setProperty('--color-mix',String(smooth(phase)));
    memberCore.style.setProperty('--color-turn',(phase*155)+'deg');
    memberCore.style.opacity = String(lerp(.65,1,smooth(phase)));
    memberMessage.style.opacity = reduced ? '0' : String(1-smooth(progress(phase,.52,.73)));
    memberResult.style.opacity = reduced ? '1' : String(smooth(progress(phase,.67,.9)));
    memberCaption.style.opacity = reduced ? '1' : String(smooth(progress(phase,.84,1)));
    memberBubbles.forEach((bubble,i) => {
      const path = paths[i];
      bubble.style.transform = 'translate(-50%,-50%) translate3d('+path.x+'px,'+path.y+'px,0) scale('+path.scale+')';
      bubble.style.opacity = String(path.opacity);
      bubble.style.setProperty('--color-mix',String(path.mix));
      bubble.style.setProperty('--color-turn',(path.mix*110+i*37)+'deg');
    });
  }

  function frame(now) {
    frameId = 0;
    if (!active || document.hidden) return;
    const dt = Math.min(60, Math.max(1, now - (lastFrame || now-16)));
    lastFrame = now;
    if (playing) time = Math.min(M.DURATION, now - startedAt);
    const state = M.intro(ready ? M.DURATION : time);
    const desired = ready ? clamp(scrollY, 0, lead + travel) : 0;
    // Native touch scrolling already carries momentum. A second interpolation
    // layer makes the fixed horizontal track feel as though it catches up late.
    renderedScroll = reduced || touchFirst ? desired : lerp(renderedScroll, desired, 1-Math.exp(-dt/78));
    if (Math.abs(renderedScroll-desired) < .1) renderedScroll = desired;
    cursorX = lerp(cursorX, wantedX, .07); cursorY = lerp(cursorY, wantedY, .07);
    const scrolling = M.scroll(renderedScroll, lead, travel);
    const bridgeState = M.bridgeScroll(scrolling.x, bridgeStart, bridgeDuration);
    scrolling.x = bridgeState.x;
    const memberState = M.bridgeScroll(scrolling.x, memberStart, memberDuration);
    scrolling.x = memberState.x;
    renderMembers(memberState.phase, scrolling.x);
    const shift = smooth(progress(bridgeState.phase,.12,.76));
    const fade = smooth(progress(bridgeState.phase,.76,1));
    orb.style.transform = reduced ? 'none' : 'translate3d(' + (-shift*width*.95) + 'px,0,0) scale(' + lerp(1.1,.26,shift) + ')';
    orb.style.opacity = reduced ? '.15' : String(1-smooth(progress(bridgeState.phase,.62,.82)));
    bridgeFirst.style.opacity = reduced ? '0' : String(1-smooth(progress(bridgeState.phase,.24,.52)));
    bridgeFirst.style.transform = reduced ? 'none' : 'translate3d(' + (-shift*width*.28) + 'px,0,0)';
    bridgeSecond.style.opacity = reduced ? '1' : String(smooth(progress(bridgeState.phase,.32,.65))*(1-fade*.6));
    bridgeSecond.style.transform = reduced ? 'none' : 'translate3d(' + ((1-shift)*width*.14) + 'px,0,0) scale(' + (1+fade*.06) + ')';
    const entry = reduced ? scrolling.entry : smooth(scrolling.entry);
    applyIntro(state);
    track.style.transform = 'translate3d(' + (-scrolling.x) + 'px,0,0)';
    meter.style.transform = 'scaleX(' + scrolling.progress + ')';
    hero.style.opacity = 1 - smooth(progress(entry, .68, 1));
    hero.style.visibility = entry >= 1 ? 'hidden' : 'visible';
    hero.style.pointerEvents = ready && entry < .65 ? 'auto' : 'none';
    hero.inert = entry >= .65;
    const logoRise = (1-state.logo) * logoHeight * 1.12;
    const logoScroll = reduced ? 0 : entry * height * -.12;
    mark.style.transform = 'translateX(-50%) translate3d(' + (reduced ? 0 : -cursorX*.4) + 'px,' + (logoRise+logoScroll) + 'px,0) scale(' + (1+(reduced ? 0 : entry*.25)) + ')';
    mark.style.opacity = 1 - smooth(progress(entry, .30, .72));
    heroCopy.style.transform = 'translateY(' + (reduced ? 0 : -entry*height*.14) + 'px)';
    heroCopy.style.opacity = 1-smooth(progress(entry, .06, .48));
    eyebrow.style.opacity = state.eyebrow*(1-smooth(progress(entry, .10, .5)));
    cue.style.opacity = state.controls*(1-progress(entry, 0, .22));
    worldIndex.style.opacity = state.controls*(1-progress(entry, .06, .5));
    if (scene && entry < 1) {
      // After the intro, mobile moves the finished layers on the compositor.
      // Desktop keeps the richer per-frame canvas camera.
      if (touchFirst && ready && !reduced) scene.transform(entry);
      else scene.draw(state, reduced ? 0 : entry, now);
    }
    let chapter = 0;
    for (let i=0; i<geometry.length; i++) {
      const g = geometry[i];
      const relative = g.x - scrolling.x;
      const visible = relative < width && relative + g.width > 0 && entry > .7;
      g.panel.inert = !ready || !visible;
      if (entry >= .86 && relative <= width*.5) chapter = i+1;
      const copy = g.copy;
      if (copy) {
        // Only the current and neighbouring ecosystem need per-frame styling.
        // The track transform moves every other panel without waking its layer.
        if (relative > width*1.35 || relative+g.width < -width*.35) continue;
        const entering = i===0 && entry<1 ? progress(entry,.70,1) : clamp(1-relative/width);
        const reveal = reduced ? 1 : easeOut(progress(entering,.12,.80));
        copy.style.opacity = i===0 && entry<1 ? entering : reveal;
        copy.style.transform = reduced ? 'none' : 'translate3d(' + (1-reveal)*65 + 'px,' + (1-reveal)*35 + 'px,0)';
        if (g.visual) {
          const pan = reduced || touchFirst ? 0 : clamp(relative/width,-1,1)*width*.075;
          g.visual.style.transform = reduced || touchFirst ? 'none' : 'translate3d(' + pan + 'px,0,0) scale(1.09)';
        }
      }
    }
    cardGeometry.forEach(g => {
      if (g.x-scrolling.x > width*1.15 || g.x+g.width-scrolling.x < -width*.15) return;
      const reveal = reduced ? 1 : easeOut(progress(1-(g.x-scrolling.x)/width,.04,.85));
      g.content.style.opacity = reveal;
      g.content.style.transform = reduced ? 'none' : 'translateY(' + (1-reveal)*65 + 'px)';
    });
    updateChapter(chapter);
    one('.previous-chapter').disabled = renderedScroll < 2;
    one('.next-chapter').disabled = renderedScroll >= lead+travel-2;
    root.dataset.introTime = String(Math.round(ready ? M.DURATION : time));
    if (playing && state.complete) finishIntro();
    const unsettled = Math.abs(desired-renderedScroll)>.1;
    const pointerUnsettled = !touchFirst && (Math.abs(cursorX-wantedX)>.1 || Math.abs(cursorY-wantedY)>.1);
    if (playing || unsettled || pointerUnsettled) schedule();
  }

  function schedule() {
    if (!frameId && active && !document.hidden) frameId = requestAnimationFrame(frame);
  }
  function finishIntro() {
    if (!active) return;
    playing = false; ready = true; time = M.DURATION;
    root.dataset.state = 'ready';
    root.classList.remove('is-booting','is-intro-locked');
    introScreen.classList.add('is-finished'); introScreen.inert = true;
    header.inert = false; controls.inert = false;
    clearTimeout(window.twoNBootTimer);
    if (focusAfterIntro || introScreen.contains(document.activeElement)) {
      one('.replay-intro').focus({ preventScroll:true }); focusAfterIntro=false;
    }
    schedule();
  }
  function replay() {
    if (!initialized || !active) return;
    one('.film video').pause();
    ready = false; playing = !reduced; time = 0; startedAt = performance.now();
    scrollTo({ top:0, behavior:'instant' }); renderedScroll=0;
    root.dataset.state = 'intro'; root.classList.add('is-intro-locked');
    introScreen.classList.remove('is-finished'); introScreen.inert=false;
    header.inert=true; controls.inert=true;
    if (reduced) finishIntro(); else schedule();
  }
  function fallback() {
    active=false; ready=true; playing=false;
    clearTimeout(window.twoNBootTimer);
    if (frameId) cancelAnimationFrame(frameId);
    root.classList.remove('is-booting','is-enhanced','is-intro-locked');
    root.classList.add('motion-fallback');
    shell.style.height='auto'; hero.style.cssText=''; mark.style.cssText='';
    introScreen.classList.add('is-finished'); introScreen.inert=true;
    for (const element of [header,controls,hero,...panels]) { element.inert=false; element.style.opacity=''; }
    for (const element of [...heroLines,...introLines,heroCopy,eyebrow,cue,worldIndex]) element.style.cssText='';
    all('.biome-copy,.biome-visual,.leader-card>div').forEach(element => { element.style.transform=''; element.style.opacity=''; });
    [orb,bridgeFirst,bridgeSecond].forEach(element => { element.style.transform=''; element.style.opacity=''; });
    [members,one('.leaders'),memberCore,memberMessage,memberResult,memberCaption,...memberBubbles].forEach(element => { element.style.transform=''; element.style.opacity=''; });
  }

  function goTo(value) {
    if (!active) {
      if (typeof value === 'string') document.getElementById(value)?.scrollIntoView();
      else scrollTo({top:0,behavior:'auto'});
      return;
    }
    if (!ready) return;
    const g = typeof value === 'string' ? geometry.find(g => g.panel.id===value) : null;
    const destination = g ? scrollForX(g.x) : typeof value==='number' ? value : 0;
    scrollTo({top:clamp(destination,0,lead+travel),behavior:reduced?'instant':'smooth'});
    schedule();
  }
  function nextStop(direction) {
    const current = scrollY;
    const candidates = direction>0 ? stops.filter(x=>x>current+4) : stops.filter(x=>x<current-4).reverse();
    if (candidates.length) goTo(candidates[0]);
  }
  const isControl = target => target instanceof Element && !!target.closest('button,a,input,textarea,select,video,[contenteditable=true]');

  one('.skip-intro').addEventListener('click', () => {
    focusAfterIntro=true;
    if (initialized) finishIntro(); else { fallback(); root.dataset.state='fallback'; }
  });
  one('.replay-intro').addEventListener('click', () => { focusAfterIntro=true; replay(); });
  one('.previous-chapter').addEventListener('click', () => nextStop(-1));
  one('.next-chapter').addEventListener('click', () => nextStop(1));
  all('[data-section]').forEach(button=>button.addEventListener('click',()=>goTo(button.dataset.section)));
  all('[data-go="0"]').forEach(button=>button.addEventListener('click',()=>goTo(0)));
  one('.skip-link').addEventListener('click', event => { if (!active) return; event.preventDefault(); finishIntro(); goTo('biomes'); });
  motionButton.addEventListener('click', () => {
    userReduced=!userReduced;
    try { localStorage.setItem('2n-reduced-motion',String(userReduced)); } catch {}
    setMotionPreference(); if (reduced && playing) finishIntro(); schedule();
  });
  mediaQuery.addEventListener('change', () => { setMotionPreference(); if(reduced && playing) finishIntro(); schedule(); });
  addEventListener('2n:fallback', fallback);
  addEventListener('error', () => { if (!ready && active) window.twoNFallback(); });
  addEventListener('scroll', schedule, {passive:true});
  addEventListener('wheel', event => {
    if (!active || event.ctrlKey) return;
    if (!ready) { event.preventDefault(); return; }
    if (!isControl(event.target) && Math.abs(event.deltaX)>Math.abs(event.deltaY)) {
      event.preventDefault();
      scrollBy({top:event.deltaX*(event.deltaMode===1?16:event.deltaMode===2?height:1),behavior:'instant'});
    }
  },{passive:false});
  addEventListener('keydown', event => {
    const scrollKeys=['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '];
    if (!active) return;
    if (!ready) {
      if (event.key==='Escape') { focusAfterIntro=true; finishIntro(); }
      else if(scrollKeys.includes(event.key) && !isControl(event.target)) event.preventDefault();
      return;
    }
    if(isControl(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;
    if(!scrollKeys.includes(event.key)) return;
    event.preventDefault();
    if(event.key==='Home') goTo(0);
    else if(event.key==='End') goTo(lead+travel);
    else if(event.key==='PageDown' || (event.key===' '&&!event.shiftKey)) nextStop(1);
    else if(event.key==='PageUp' || (event.key===' '&&event.shiftKey)) nextStop(-1);
    else goTo(scrollY+(['ArrowRight','ArrowDown'].includes(event.key)?1:-1)*width*.55);
  });
  addEventListener('touchstart', event=>{
    if(!active || event.touches.length!==1 || isControl(event.target)) {touch=null;return;}
    touch={x:event.touches[0].clientX,y:event.touches[0].clientY,lastX:event.touches[0].clientX,mode:null};
  },{passive:true});
  addEventListener('touchmove', event=>{
    if(!active || event.touches.length!==1) return;
    if(!ready) {event.preventDefault();return;}
    if(!touch) return;
    const x=event.touches[0].clientX,y=event.touches[0].clientY;
    if(!touch.mode && Math.hypot(x-touch.x,y-touch.y)>8) touch.mode=Math.abs(x-touch.x)>Math.abs(y-touch.y)?'x':'y';
    if(touch.mode==='x') {event.preventDefault(); scrollBy({top:(touch.lastX-x)*1.45,behavior:'instant'});}
    touch.lastX=x;
  },{passive:false});
  addEventListener('touchend',()=>{touch=null;},{passive:true});
  addEventListener('pointermove', event=>{
    if(event.pointerType!=='mouse' || !active || reduced) return;
    wantedX=(event.clientX/width-.5)*24; wantedY=(event.clientY/height-.5)*14; schedule();
  },{passive:true});
  addEventListener('blur',()=>{wantedX=0;wantedY=0;});
  let resizeTimer;
  addEventListener('resize',()=>{
    // Safari changes only innerHeight while its address bar retracts. Rebuilding
    // the atlas during that gesture is the most visible source of scroll jank.
    if (touchFirst && Math.abs(document.documentElement.clientWidth-width)<2) return;
    clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>measure(),160);
  },{passive:true});
  addEventListener('pageshow',event=>{
    if(event.persisted && initialized) {finishIntro();measure();}
  });
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden) {
      hiddenAt=performance.now();
      if(frameId) {cancelAnimationFrame(frameId);frameId=0;}
    } else {
      if(playing && hiddenAt) startedAt+=performance.now()-hiddenAt;
      hiddenAt=0;lastFrame=0;schedule();
    }
  });

  async function loadImage(path) {
    return new Promise(resolve=>{
      const image=new Image();
      let completed=false;
      const finish=value=>{if(completed)return;completed=true;clearTimeout(timer);resolve(value);};
      const timer=setTimeout(()=>finish(null),4500);
      image.decoding='async';
      image.onload=async()=>{
        clearTimeout(timer);
        try { await image.decode(); } catch {}
        finish(image);
      };
      image.onerror=()=>finish(null);image.src=path;
    });
  }
  async function boot() {
    try {
      header.inert=true;controls.inert=true;
      setMotionPreference();
      let loaded=0;
      const images=await Promise.all(imagePaths.map(async path=>{
        const image=await loadImage(path);
        loaded++;one('.load-rule i').style.transform='scaleX('+(loaded/5)+')';
        loadStatus.textContent='准备场景 '+loaded+' / 5';
        return image;
      }));
      if(!active) return;
      scene=new WorldScene(images);
      root.classList.add('is-enhanced');
      root.classList.remove('is-booting');
      measure(false); initialized=true;
      loadStatus.textContent=images.every(Boolean)?'五境就绪':'部分背景暂不可用';
      root.dataset.assets=images.every(Boolean)?'complete':'partial';
      // Honor deep anchors without forcing users through an unrelated intro.
      if(location.hash && geometry.some(g=>'#'+g.panel.id===location.hash)) {
        finishIntro();goTo(location.hash.slice(1));return;
      }
      replay();
    } catch(error) {
      console.warn('2n uses the readable fallback:',error);
      window.twoNFallback();
    }
  }
  boot();
})();

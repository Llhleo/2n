(() => {
  'use strict';
  const BRAND_MODE = 'wordmark'; // 'image' keeps the supplied candidate emblem available.
  if (BRAND_MODE === 'image') {
    document.querySelectorAll('[data-src]').forEach(image => { image.src = image.dataset.src; });
  }
  const M = window.TwoNMotion;
  const L = window.TwoNLiquid;
  const P=window.TwoNPerf;
  if (!M || !L || !window.TwoNAssets || !window.TwoNWorldScene || !window.TwoNNavigation) { window.twoNFallback(); return; }
  const { clamp, lerp, smooth, progress, easeOut } = M;
  const root = document.documentElement;
  const one = selector => document.querySelector(selector);
  const all = selector => [...document.querySelectorAll(selector)];
  const shell = one('.story-shell');
  const track = one('.story-track');
  const hero = one('.hero');
  const mark = one('.hero-mark');
  // Keep a layout-only anchor for the opening terrain's logo measurement.
  // Desktop uses a fixed mark; Touch moves this same node across a safe dock boundary.
  const markAnchor=mark.cloneNode(true);
  markAnchor.classList.add('brand-anchor');
  markAnchor.removeAttribute('aria-label');markAnchor.setAttribute('aria-hidden','true');
  mark.before(markAnchor);
  mark.classList.add('brand-visual');document.body.append(mark);
  const header = one('.site-header');
  const brandVisual=one(BRAND_MODE==='image'?'.brand-image':'.brand-wordmark');
  const controls = one('.story-controls');
  const introScreen = one('.intro-screen');
  const introLines = all('.intro-line');
  const eyebrow = one('.hero-eyebrow');
  const cue = one('.scroll-cue');
  const loadStatus = one('.load-status');
  const meter = one('.progress i');
  const counter = one('.chapter-count b');
  const chapterName = one('.chapter-name');
  const previousButton=one('.previous-chapter'),nextButton=one('.next-chapter');
  const themeMeta=one('meta[name="theme-color"]');
  const panels = all('.panel');
  const mediaQuery = matchMedia('(prefers-reduced-motion: reduce)');
  let touchFirst=window.TwoNProfile.input==='touch';
  if(touchFirst) {
    const viewportMeta=one('meta[name="viewport"]');
    viewportMeta.content='width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover';
    const preventPinch=event=>event.preventDefault();
    addEventListener('gesturestart',preventPinch,{passive:false});
    addEventListener('gesturechange',preventPinch,{passive:false});
  }
  const imagePaths = ['garden', 'desert', 'ocean', 'jungle', 'hell'].map(name => 'assets/' + name + '.png');
  const tones = ['#239450', '#dfca91', '#4c8fb9', '#339a48', '#b53d3b'];
  // Content lives in HTML, so members and contributions survive script failure.
  // Eager DOM images also remain available when initialization falls back.
  const biomeImages = all('.biome-image');
  root.dataset.brand = BRAND_MODE;
  root.dataset.version = '1.0.5';
  root.dataset.input = touchFirst ? 'touch' : 'desktop';

  let reduced = mediaQuery.matches;
  let width = innerWidth, height = innerHeight, lead = 1, travel = 0;
  let geometry = [], stops = [], cardGeometry = [];
  let scene = null, active = true, initialized = false, ready = false;
  let playing = false, startedAt = 0, time = 0, hiddenAt = 0;
  let frameId = 0, lastFrame = 0, renderedScroll = 0, activeChapter = -1;
  let cursorX = 0, cursorY = 0, wantedX = 0, wantedY = 0;
  let logoTop = 0, logoHeight = 0, focusAfterIntro = false;
  let brandStartX=0,brandStartY=0,brandX=0,brandY=0,brandScale=1;
  function measureBrand() {
    // One layout pass at init/resize; the fixed visual never inherits scroll,
    // opacity, or transforms from the Hero and story track.
    const target=brandVisual.getBoundingClientRect();
    const wasDocked=mark.classList.contains('is-docked');
    if(wasDocked) mark.classList.remove('is-docked');
    const wide=mark.offsetWidth;
    brandStartX=markAnchor.offsetLeft-wide/2;
    brandStartY=markAnchor.offsetTop;
    brandX=target.left;
    brandY=target.top;
    brandScale=target.width/Math.max(1,wide);
    if(wasDocked) mark.classList.add('is-docked');
  }
  function positionBrand(entry,state) {
    const move=smooth(progress(entry,0,reduced?.38:.94));
    const rise=(1-state.logo)*logoHeight*1.12;
    const docked=move>=1;
    mark.classList.toggle('is-docked',docked);
    const inScene=touchFirst && entry<(reduced?.28:.55);
    if(touchFirst && mark.classList.contains('brand-in-scene')!==inScene) {
      // One node, reparented only across a boundary above the terrain and before
      // Hero's exit fade. Cached coordinates preserve its viewport rectangle.
      if(inScene) markAnchor.after(mark);else document.body.append(mark);
      mark.classList.toggle('brand-in-scene',inScene);
    }
    const nativeOffset=inScene&&mobile?mobile.latest-mobile.bounds.get(hero).x:0;
    const x=lerp(brandStartX,brandX,move)+nativeOffset;
    const y=lerp(brandStartY+rise,brandY,move);
    mark.style.transform='translate3d('+x+'px,'+y+'px,0) scale('+(docked?1:lerp(1,brandScale,move))+')';
    mark.style.setProperty('--logo-depth',String(.22*(1-move)));
    if(scene) scene.placeForeground(entry);
  }
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
  const memberBubbles = all('.member-cloud span');
  const memberCloud=one('.member-cloud');
  const memberHeading=one('.member-heading');
  const leaders=one('.leaders');
  const viewport=one('.story-viewport');
  let gatherPlan,splitPlan,lastLiquidPhase=-1;
  let messageWidth=0;
  const activeLabels=new Set();
  function measureMessage() {
    const range=document.createRange();
    const walker=document.createTreeWalker(memberMessage,NodeFilter.SHOW_TEXT);
    let node;messageWidth=0;
    while((node=walker.nextNode())) {
      range.selectNodeContents(node);
      for(const rect of range.getClientRects()) messageWidth=Math.max(messageWidth,rect.width);
    }
  }
  let visualLiquid=0, liquidTarget=0;
  let touchTimeline=null;
  const svgNS='http://www.w3.org/2000/svg';
  const fusion=document.createElementNS(svgNS,'svg');
  fusion.classList.add('member-fusion'); fusion.setAttribute('aria-hidden','true');
  fusion.innerHTML='<defs><linearGradient id="fusion-color" gradientUnits="userSpaceOnUse"><stop stop-color="#86D5CF"/><stop offset=".5" stop-color="#72B9EA"/><stop offset="1" stop-color="#347EF4"/></linearGradient></defs><path fill="url(#fusion-color)" fill-rule="nonzero"/>';
  const liquidPath=fusion.querySelector('path');
  // Touch Safari can subtract overlapping subpaths from one compound SVG path.
  // Paint the mother, then overlapping bridges, then children as separate fills.
  // Desktop keeps its existing compound path and its exact rendering order.
  const neckPath=touchFirst?document.createElementNS(svgNS,'path'):null;
  const childPath=touchFirst?document.createElementNS(svgNS,'path'):null;
  if(touchFirst) {
    for(const path of [neckPath,childPath]) {
      path.setAttribute('fill','url(#fusion-color)');
      path.setAttribute('fill-rule','nonzero');
      fusion.append(path);
    }
  }
  members.prepend(fusion);
  let lastOutline='',lastNecks='',lastChildren='';
  function writeLiquid(outline,necks='',children='') {
    if(outline!==lastOutline) {liquidPath.setAttribute('d',outline);lastOutline=outline;}
    if(touchFirst) {
      if(necks!==lastNecks) {neckPath.setAttribute('d',necks);lastNecks=necks;}
      if(children!==lastChildren) {childPath.setAttribute('d',children);lastChildren=children;}
    }
  }
  const labelOpacity=new Float64Array(memberBubbles.length).fill(-1);
  memberBubbles.forEach(label=> {
    label.style.fontSize=(label.textContent.length>10?22:28)+'px';
  });
  const anniversaryTitle = one('.anniversary-title');
  const particleColors=['#86D5CF','#72B9EA','#509BEF','#347EF4','#2558B8'];
  const anniversaryParticles = memberBubbles.map((_,i)=> {
    const dot=document.createElement('i');
    dot.className='anniversary-particle';
    dot.append(document.createElement('b'));
    dot.style.setProperty('--particle-color',particleColors[i%particleColors.length]);
    const size=16+(i%5)*3;
    dot.style.width=size+'px'; dot.style.height=size+'px';
    one('.anniversary-particles').append(dot);
    return dot;
  });
  let memberStart = 0, memberDuration = 1;
  let controlsShown = false, controlScrollAnchor = 0;
  function showControls(shown) {
    controlsShown=shown;
    controls.classList.toggle('is-shown',shown);
    controls.inert=!shown || !ready;
  }
  const scrollForX = x => touchFirst ? x : lead + x + (x > bridgeStart ? bridgeDuration : 0) + (x > memberStart ? memberDuration : 0);

  function setMotionPreference() {
    reduced = mediaQuery.matches;
    root.classList.toggle('is-reduced-motion', reduced);
  }

  let mobile=null;
  const storyPosition=()=>touchFirst?shell.scrollLeft:scrollY;
  function scrollStory(top,behavior='instant') {
    if(touchFirst) shell.scrollTo({left:top,top:0,behavior});
    else scrollTo({top,behavior});
  }
  function setupMobile() {
    if(!touchFirst) return;
    mobile=new window.TwoNMobileStory({shell,track,hero,bridge,members,leaders,panels,
      onChapter:(index,position,max)=>{
        if(geometry.length) updateChapter(index,position);
        meter.style.transform='scaleX('+(position/Math.max(1,max))+')';
        previousButton.disabled=position<2;nextButton.disabled=position>=max-2;
        if(ready && Math.abs(position-controlScrollAnchor)>12) {
          showControls(position<controlScrollAnchor);controlScrollAnchor=position;
          controls.style.opacity=controlsShown?'1':'0';
          controls.style.transform=controlsShown?'translateY(0)':'translateY(110%)';
        }
      },wake:schedule,perf:P});
    shell.tabIndex=0;shell.setAttribute('aria-label','左右滑动，依次浏览完整故事');
    one('.cue-direction').textContent='左右滑动探索 →';
    shell.addEventListener('scroll',onStoryScroll,{passive:true});
  }
  function measureMobile(preserve,oldPosition) {
    const resized=mobile.width!==width || mobile.height!==height;
    const anchor=preserve&&initialized?(resized&&mobile.readingAnchor?mobile.readingAnchor:mobile.capturePosition(oldPosition)):null;
    bridgeDuration=Math.round(Math.max(width*1.8,height*2.2));
    memberDuration=Math.round(Math.max(width*7.2,height*12));
    mobile.measure(width,height,bridgeDuration,memberDuration);
    lead=0;travel=mobile.max;
    geometry=panels.map(panel=>({...mobile.bounds.get(panel),panel,surface:getComputedStyle(panel).backgroundColor}));
    bridgeStart=mobile.bounds.get(bridge).x;memberStart=mobile.bounds.get(members).x;
    stops=[...new Set([...mobile.stops,...[.30,.47,.65,.86,1].map(p=>memberStart+memberDuration*p)])].sort((a,b)=>a-b);
    logoTop=markAnchor.offsetTop;logoHeight=markAnchor.offsetHeight;
    measureBrand();
    if(scene) scene.resize();
    if(preserve&&initialized) scrollStory(clamp(mobile.restorePosition(anchor,oldPosition),0,travel));
    mobile.latest=shell.scrollLeft;
    mobile.readingAnchor=mobile.capturePosition(mobile.latest);mobile.anchorPosition=mobile.latest;
    mobile.publish();schedule();
  }
  function measureLiquid() {
    if(!messageWidth) measureMessage();
    if(gatherPlan && gatherPlan.width===width && gatherPlan.height===height) return;
    gatherPlan=L.buildGather(M,memberBubbles.length,width,height);
    splitPlan=L.buildSplit(M,memberBubbles.length,width,height,gatherPlan.rows[gatherPlan.steps].radius);
    if(touchFirst) {
      const events=[{type:'release-neck',phase:.395},{type:'break',phase:.449}];
      for(let i=0;i<memberBubbles.length;i++) {
        for(const [type,approach] of [['contact',.55],['absorb',.82]]) {
          const k=gatherPlan.rows.findIndex(row=>row.samples[i].approach>=approach);
          if(k>=0) events.push({type,phase:k/gatherPlan.steps*.30});
        }
      }
      touchTimeline=new window.TwoNTouchTimeline(events);
    }
    anniversaryParticles.forEach((dot,i)=> {
      if(touchFirst&&i>=23) return;
      const p=splitPlan.plan[i];
      if(p.active) { dot.style.width=p.orbitRadius*2+'px';dot.style.height=p.orbitRadius*2+'px'; }
    });
    lastLiquidPhase=-1;
    fusion.setAttribute('viewBox',[-width/2,-height/2,width,height].join(' '));
    const gradient=fusion.querySelector('linearGradient');
    gradient.setAttribute('x1',-gatherPlan.finalRadius);gradient.setAttribute('y1',-gatherPlan.finalRadius);
    gradient.setAttribute('x2',gatherPlan.finalRadius);gradient.setAttribute('y2',gatherPlan.finalRadius);
  }
  function measure(preserve = true) {
    if (!active) return;
    const oldLead = lead, oldTravel = travel, oldY = storyPosition();
    const previousEntry = oldLead ? oldY / oldLead : 0;
    const previousTrackRatio = oldTravel ? (oldY - oldLead) / oldTravel : 0;
    width = document.documentElement.clientWidth;
    height = innerHeight;
    root.style.setProperty('--view-height', height + 'px');
    measureMessage();
    if(touchFirst) {measureMobile(preserve,oldY);return;}
    lead = Math.round(Math.max(width * .94, height * .78));
    geometry = panels.map(panel => ({
      panel,
      x:panel.offsetLeft,
      width:panel.offsetWidth,
      copy:panel.querySelector('.biome-copy'),
      surface:getComputedStyle(panel).backgroundColor,
      visual:panel.querySelector('.biome-visual')
    }));
    bridgeStart = bridge.offsetLeft;
    bridgeDuration = Math.round(Math.max(width * 1.8, height * 2.2));
    memberStart = members.offsetLeft;
    measureLiquid();
    memberDuration = Math.round(Math.max(width*7.2, height*12));
    travel = Math.max(0, track.scrollWidth - width) + bridgeDuration + memberDuration;
    shell.style.height=(lead+travel+height)+'px';
    logoTop = markAnchor.offsetTop;
    logoHeight = markAnchor.offsetHeight;
    measureBrand();
    const trackLeft = track.getBoundingClientRect().left;
    cardGeometry = all('.leader-card').map(card => ({
      card, x:card.getBoundingClientRect().left - trackLeft, width:card.offsetWidth, content:card.lastElementChild
    }));
    stops = [0, ...geometry.map(g => scrollForX(g.x)), lead+bridgeStart+bridgeDuration, ...cardGeometry.map(g => scrollForX(g.x))];
    stops.push(...[.30,.47,.65,.86,1].map(p=>scrollForX(memberStart)+memberDuration*p));
    stops = [...new Set(stops.map(value => Math.min(lead + travel, Math.round(value))))].sort((a,b) => a-b);
    if (scene) scene.resize();
    if (preserve && initialized && ready) {
      const next = oldY <= oldLead ? previousEntry * lead : lead + previousTrackRatio * travel;
      scrollStory(clamp(next,0,lead+travel));
      renderedScroll = storyPosition();
    }
    schedule();
  }

  function applyIntro(state) {
    introLines[0].style.transform = 'translateY(' + ((1-state.lineOne)*120 - state.statementExit*125) + '%)';
    introLines[1].style.transform = 'translateY(' + ((1-state.lineTwo)*120 - state.statementExit*125) + '%)';
    introScreen.style.clipPath = 'inset(0 0 ' + state.curtain*100 + '% 0)';
    introScreen.style.pointerEvents = ready ? 'none' : 'auto';
    for (const element of [header]) {
      element.style.opacity = state.controls;
      element.style.transform = 'translateY(' + ((1-state.controls)*12) + 'px)';
    }
    controls.style.opacity=controlsShown ? state.controls : 0;
    controls.style.transform=controlsShown ? 'translateY(0)' : 'translateY(110%)';
    eyebrow.style.opacity = state.eyebrow;
    cue.style.opacity = state.controls;
  }

  function updateChapter(index, nativePosition) {
    // The docked mark sits near the left edge, ahead of the chapter center.
    if (touchFirst && Number.isFinite(nativePosition) && geometry.length) {
      const atMark=nativePosition+width*.10;
      let markChapter=0;
      for(let i=0;i<geometry.length;i++) if(geometry[i].x<=atMark) markChapter=i+1;
      const markPanel=markChapter===0?hero:panels[markChapter-1];
      const markTheme=(markPanel.dataset.theme || 'light').endsWith('dark')?'dark':'light';
      if(root.dataset.brandTheme!==markTheme) root.dataset.brandTheme=markTheme;
    }
    if (index === activeChapter) return;
    activeChapter = index;
    counter.textContent = String(index + 1).padStart(2, '0');
    chapterName.textContent = index === 0 ? '序章' : panels[index-1].dataset.chapter;
    const chapter=index===0?hero:panels[index-1];
    root.classList.toggle('is-light-chrome',chapter.dataset.chrome==='light');
    root.classList.toggle('is-ink-footer',chapter.dataset.chrome==='ink');
    root.dataset.theme=chapter.dataset.theme || 'light';
    const surface = index === 0 ? '#F7F7F3' : geometry[index-1].surface;
    root.style.setProperty('--surface-color',surface);
    themeMeta.content=surface;
  }

  function renderMembers(phase, x) {
    const arriving = touchFirst?1:smooth(progress(x,memberStart-width,memberStart));
    const crossing=x>=memberStart-width && x<memberStart;
    // One dissolve over an opaque, uniform management-colored backing. Never
    // fade both surfaces, which exposed a dark seam under the moving last card.
    members.style.transform = !touchFirst && x < memberStart ? 'translate3d(' + (x-memberStart) + 'px,0,0)' : 'none';
    members.style.opacity = String(arriving);
    members.style.zIndex = '2';
    leaders.style.opacity='1';
    viewport.style.backgroundColor=crossing?'#e5e2d8':'';
    memberHeading.style.opacity=String(smooth(progress(arriving,.6,1)));
    fusion.style.opacity=String(smooth(progress(arriving,.6,1)));
    if(x < memberStart-width || x > memberStart+width) return;
    if(P) P.values.liquidPhase=phase;
    if(lastLiquidPhase===phase && fusion.dataset.reduced===String(reduced)) return;
    lastLiquidPhase=phase;fusion.dataset.reduced=String(reduced);
    const mapped=phase<=.355?phase:phase<=.47?lerp(.355,.43,progress(phase,.355,.47)):lerp(.43,1,progress(phase,.47,1));
    const stage=M.anniversary(mapped),gather=progress(phase,0,.30);
    const flow=phase<=.355&&!reduced?L.gatherAt(M,gatherPlan,gather):null;
    const textFits=flow?smooth(progress(flow.radius*2,messageWidth+20,messageWidth+52)):0;
    memberMessage.style.opacity = reduced?'0':String(textFits*(1-smooth(progress(phase,.285,.305))));
    // Use the existing .30–.355 physical hold. Previously resultFade was
    // already fading while the result text was still entering, so it never
    // reached full opacity. Give the completed mother a clear, short beat.
    memberResult.style.opacity = reduced ? '1' : String(smooth(progress(phase,.305,.32))*(1-smooth(progress(phase,.342,.355))));
    anniversaryTitle.style.opacity = reduced ? '1' : String(stage.title);
    const titleEnter = smooth(progress(mapped, .43, .49));
    anniversaryTitle.style.transform = reduced ? 'none' : `translate3d(0,${(1-titleEnter)*8}px,0) scale(${.985+titleEnter*.015})`;
    if(reduced) {
      memberCloud.style.visibility='visible';
      memberBubbles.forEach(b=>b.style.opacity='1');
      labelOpacity.fill(-1);
      return;
    }
    const liquidStart=P?P.start():0;
    const gathering=phase<=.355, splitting=phase>.355 && phase<.47;
    fusion.style.visibility=gathering||splitting?'visible':'hidden';
    memberCloud.style.visibility=gathering?'visible':'hidden';
    let splittingState=null;
    if(gathering) {
      let outline=L.circle(flow.x,flow.y,flow.radius);
      let necks='',children='';
      flow.drops.forEach((drop,i)=> {
        if(drop.r>.1) {
          const child=L.circle(drop.x,drop.y,drop.r);
          const bridge=L.neck(flow.x,flow.y,flow.radius,drop.x,drop.y,drop.r);
          if(touchFirst) {children+=child;necks+=bridge;}
          else outline+=child+bridge;
        }
        if(touchFirst && drop.label<=.001 && !activeLabels.has(i)) return;
        const label=memberBubbles[i];
        if(drop.label>.001) activeLabels.add(i);else activeLabels.delete(i);
        if(labelOpacity[i]!==drop.label) {label.style.opacity=String(drop.label);labelOpacity[i]=drop.label;}
        if(drop.label>.001) label.style.transform='translate(-50%,-50%) translate3d('+drop.x+'px,'+drop.y+'px,0) scale('+drop.scale+')';
      });
      writeLiquid(outline,necks,children);
    } else if(splitting) {
      splittingState=L.splitAt(splitPlan,progress(phase,.355,.47));
      let outline=L.circle(0,0,splittingState.radius);
      let necks='',children='';
      splittingState.drops.forEach(drop=> {
        // Connected lobes belong to the mother silhouette; only detached drops
        // transfer to the colored compositor layers.
        const r=drop.r;
        if(drop.handoff<1) {
          const child=L.circle(drop.x,drop.y,r);
          const bridge=L.neck(0,0,splittingState.radius,drop.x,drop.y,r);
          if(touchFirst) {children+=child;necks+=bridge;}
          else outline+=child+bridge;
        }
      });
      writeLiquid(outline,necks,children);
    }
    anniversaryParticles.forEach((dot,i)=> {
      if(gathering) {dot.style.opacity='0';return;}
      const particle=splitting?splittingState.drops[i]:M.anniversaryParticle(i,anniversaryParticles.length,mapped,width,height);
      const opacity=splitting?particle.handoff:particle.opacity;
      dot.style.opacity=String(opacity);
      if(opacity<.001) return;
      dot.style.transform='translate(-50%,-50%) translate3d('+particle.x+'px,'+particle.y+'px,0) scale('+particle.scale+')';
      const color=splitting?0:smooth(progress(mapped,.48,.64));
      dot.style.setProperty('--split-color',String(color));
    });
    if(P) P.end('liquid',liquidStart);
  }

  function frameMobile(now) {
    if(!mobile) return;
    mobile.reconcile();
    const section=mobile.heavy();
    const heroRange=mobile.bounds.get(hero);
    const heroEndX=mobile.bounds.get(panels[0]).x;
    const heroEntry=ready?clamp((mobile.latest-heroRange.x)/Math.max(1,heroEndX-heroRange.x)):0;
    const heroVisible=!ready || mobile.latest<heroEndX;
    hero.style.visibility=heroVisible?'visible':'hidden';
    // All three layers use this frame's canonical Hero entry, even on a jump
    // straight out of Hero. Expensive wave drawing cannot delay/reset placement.
    if(scene) {scene.transform(heroEntry);scene.placeForeground(heroEntry);}
    if(ready) positionBrand(heroEntry,M.intro(M.DURATION));
    if(!playing&&ready&&!section) {
      if(touchTimeline) touchTimeline.reset(mobile.phase(members));
      return;
    }
    if(playing) time=Math.min(M.DURATION,now-startedAt);
    const state=M.intro(ready?M.DURATION:time);
    if(playing||!ready||section==='hero') {
      applyIntro(state);
      const entry=heroEntry;
      positionBrand(entry,state);
      hero.style.opacity=String(1-smooth(progress(entry,.68,1)));
      eyebrow.style.opacity=state.eyebrow*(1-smooth(progress(entry,.10,.5)));
      cue.style.opacity=state.controls*(1-progress(entry,0,.22));
      if(scene) {
        scene.draw(state,0,now);
      }
    }
    if(section==='together') renderBridge(mobile.phase(bridge));
    if(section==='members') {
      measureLiquid();
      liquidTarget=mobile.phase(members);
      visualLiquid=reduced?liquidTarget:touchTimeline.tick(liquidTarget,now);
      renderMembers(visualLiquid,memberStart);
      if(!reduced && touchTimeline.pending) schedule();
    } else if(touchTimeline) {
      // No offscreen liquid work or deferred animation after leaving this chapter.
      touchTimeline.reset(mobile.phase(members));
    }
    if(P) P.values.active=playing?'intro':section||'native';
    if(playing&&state.complete) finishIntro();
    if(playing || (!reduced && section==='hero')) schedule();
  }
  function renderBridge(phase) {
    const shift=smooth(progress(phase,.12,.76)),fade=smooth(progress(phase,.76,1));
    orb.style.transform=reduced?'none':'translate3d('+(-shift*width*.95)+'px,0,0) scale('+lerp(1.1,.26,shift)+')';
    orb.style.opacity=reduced?'.15':String(1-smooth(progress(phase,.62,.82)));
    bridgeFirst.style.opacity=reduced?'0':String(1-smooth(progress(phase,.26,.44)));
    bridgeFirst.style.transform=reduced?'none':'translate3d('+(-shift*Math.min(width*.08,32))+'px,0,0)';
    bridgeSecond.style.opacity=reduced?'1':String(smooth(progress(phase,.48,.66))*(1-fade*.6));
    bridgeSecond.style.transform=reduced?'none':'translate3d('+((1-shift)*Math.min(width*.06,28))+'px,0,0) scale('+(1+fade*.02)+')';
  }

  function frame(now) {
    const frameStart=P?P.start():0;
    frameId = 0;
    if (!active || !initialized || document.hidden) return;
    if(P) P.values.active=ready?'story':'intro';
    if(touchFirst) {frameMobile(now);if(P) P.end('frame',frameStart);return;}
    const dt = Math.min(60, Math.max(1, now - (lastFrame || now-16)));
    lastFrame = now;
    if (playing) time = Math.min(M.DURATION, now - startedAt);
    const state = M.intro(ready ? M.DURATION : time);
    const desired = ready ? clamp(storyPosition(), 0, lead + travel) : 0;
    // Native touch scrolling already carries momentum. A second interpolation
    // layer makes the fixed horizontal track feel as though it catches up late.
    const memberActive = desired >= scrollForX(memberStart)-width && desired <= scrollForX(memberStart)+memberDuration+width;
    renderedScroll = reduced || touchFirst || memberActive ? desired : lerp(renderedScroll, desired, 1-Math.exp(-dt/78));
    if (Math.abs(renderedScroll-desired) < .1) renderedScroll = desired;
    cursorX = lerp(cursorX, wantedX, .07); cursorY = lerp(cursorY, wantedY, .07);
    const scrolling = M.scroll(renderedScroll, lead, travel);
    const bridgeState = M.bridgeScroll(scrolling.x, bridgeStart, bridgeDuration);
    scrolling.x = bridgeState.x;
    const memberState = M.bridgeScroll(scrolling.x, memberStart, memberDuration);
    scrolling.x = memberState.x;
    liquidTarget=memberState.phase;
    visualLiquid=reduced?liquidTarget:M.liquidProgress(visualLiquid,liquidTarget,dt);
    // Keep the stage in view while its bounded visual progress catches up.
    if(Math.abs(visualLiquid-liquidTarget)>.00001) scrolling.x=memberStart;
    renderMembers(visualLiquid, scrolling.x);
    const shift = smooth(progress(bridgeState.phase,.12,.76));
    const fade = smooth(progress(bridgeState.phase,.76,1));
    orb.style.transform = reduced ? 'none' : 'translate3d(' + (-shift*width*.95) + 'px,0,0) scale(' + lerp(1.1,.26,shift) + ')';
    orb.style.opacity = reduced ? '.15' : String(1-smooth(progress(bridgeState.phase,.62,.82)));
    bridgeFirst.style.opacity = reduced ? '0' : String(1-smooth(progress(bridgeState.phase,.26,.44)));
    bridgeFirst.style.transform = reduced ? 'none' : 'translate3d(' + (-shift*Math.min(width*.08,32)) + 'px,0,0)';
    bridgeSecond.style.opacity = reduced ? '1' : String(smooth(progress(bridgeState.phase,.48,.66))*(1-fade*.6));
    bridgeSecond.style.transform = reduced ? 'none' : 'translate3d(' + ((1-shift)*Math.min(width*.06,28)) + 'px,0,0) scale(' + (1+fade*.02) + ')';
    const entry = reduced ? scrolling.entry : smooth(scrolling.entry);
    // WorldScene now carries the breathing motion in its contour, not CSS translation.
    applyIntro(state);
    track.style.transform = 'translate3d(' + (-scrolling.x) + 'px,0,0)';
    meter.style.transform = 'scaleX(' + scrolling.progress + ')';
    hero.style.opacity = 1 - smooth(progress(entry, .68, 1));
    hero.style.visibility = entry >= 1 ? 'hidden' : 'visible';
    hero.style.pointerEvents = ready && entry < .65 ? 'auto' : 'none';
    hero.inert = entry >= .65;
    positionBrand(entry,state);
    eyebrow.style.opacity = state.eyebrow*(1-smooth(progress(entry, .10, .5)));
    cue.style.opacity = state.controls*(1-progress(entry, 0, .22));
    if (scene && entry < 1) {
      // After the intro, mobile moves the finished layers on the compositor.
      // Desktop keeps the richer per-frame canvas camera.
      if (touchFirst && ready && !reduced) {scene.draw(state,0,now);scene.transform(entry);}
      else scene.draw(state, reduced ? 0 : entry, now);
    }
    let chapter = 0;
    for (let i=0; i<geometry.length; i++) {
      const g = geometry[i];
      const relative=g.x-scrolling.x;
      const visible=relative<width && relative+g.width>0 && entry>.7;
      g.panel.inert=!ready || !visible;
      if(entry>=.86 && relative<=width*.5) chapter=i+1;
      const copy = g.copy;
      if (copy) {
        // Only the current and neighbouring ecosystem need per-frame styling.
        // The track transform moves every other panel without waking its layer.
        if (relative > width*1.35 || relative+g.width < -width*.35) continue;
        const entering = i===0 && entry<1 ? progress(entry,.70,1) : clamp(1-relative/width);
        const reveal = reduced ? 1 : easeOut(progress(entering,.12,.80));
        copy.style.opacity = i===0 && entry<1 ? entering : reveal;
        copy.style.transform = reduced ? 'none' : 'translate3d(' + (1-reveal)*28 + 'px,' + (1-reveal)*18 + 'px,0)';
        if (g.visual) {
          const pan = reduced || touchFirst ? 0 : clamp(relative/width,-1,1)*width*.075;
          g.visual.style.transform = reduced || touchFirst ? 'none' : 'translate3d(' + pan + 'px,0,0) scale(1.09)';
        }
      }
    }
    cardGeometry.forEach(g => {
      const relative=g.x-scrolling.x;
      if (relative > width*1.15 || relative+g.width < -width*.15) return;
      const reveal = reduced ? 1 : easeOut(progress(1-relative/width,.04,.85));
      g.content.style.opacity = reveal;
      g.content.style.transform = reduced ? 'none' : 'translateY(' + (1-reveal)*24 + 'px)';
    });
    updateChapter(chapter);
    previousButton.disabled = renderedScroll < 2;
    nextButton.disabled = renderedScroll >= lead+travel-2;
    root.dataset.introTime = String(Math.round(ready ? M.DURATION : time));
    if (playing && state.complete) finishIntro();
    const unsettled = Math.abs(desired-renderedScroll)>.1;
    const pointerUnsettled = !touchFirst && (Math.abs(cursorX-wantedX)>.1 || Math.abs(cursorY-wantedY)>.1);
    if(P) P.end('frame',frameStart);
    if (playing || (!reduced && entry<1) || unsettled || pointerUnsettled || Math.abs(visualLiquid-liquidTarget)>.00001) schedule();
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
    header.inert = false; showControls(false); controlScrollAnchor=storyPosition();
    clearTimeout(window.twoNBootTimer);
    if (focusAfterIntro || introScreen.contains(document.activeElement)) {
      one('.brand-button').focus({ preventScroll:true }); focusAfterIntro=false;
    }
    schedule();
  }
  function replay() {
    if (!initialized || !active) return;
    one('.film video').pause();
    ready = false; playing = !reduced; time = 0; startedAt = performance.now();
    scrollStory(0); renderedScroll=0;visualLiquid=0;liquidTarget=0;
    root.dataset.state = 'intro'; root.classList.add('is-intro-locked');
    introScreen.classList.remove('is-finished'); introScreen.inert=false;
    header.inert=true; showControls(false); controlScrollAnchor=0;
    if (reduced) finishIntro(); else schedule();
  }
  function fallback() {
    active=false; ready=true; playing=false;
    clearTimeout(window.twoNBootTimer);
    if (frameId) cancelAnimationFrame(frameId);
    frameId=0;clearTimeout(resizeTimer);
    root.classList.remove('is-booting','is-enhanced','is-intro-locked');
    root.classList.add('motion-fallback');
    shell.style.height='auto'; hero.style.cssText=''; mark.style.cssText='';
    mark.classList.remove('brand-visual','is-docked','brand-in-scene');
    if(markAnchor.isConnected) {markAnchor.before(mark);markAnchor.remove();}
    if(scene) scene.restoreForeground();
    track.style.cssText='';
    if(mobile) {mobile.destroy();mobile=null;}
    introScreen.classList.add('is-finished'); introScreen.inert=true;
    for (const element of [header,controls,hero,...panels]) { element.inert=false; element.style.opacity=''; }
    for (const element of [...introLines,eyebrow,cue]) element.style.cssText='';
    all('.biome-copy,.biome-visual,.leader-card>div').forEach(element => { element.style.transform=''; element.style.opacity=''; });
    [orb,bridgeFirst,bridgeSecond].forEach(element => { element.style.transform=''; element.style.opacity=''; });
    [members,leaders,memberCore,memberMessage,memberResult,anniversaryTitle,...memberBubbles,...anniversaryParticles].forEach(element => { element.style.transform=''; element.style.opacity=''; });
    memberCloud.style.visibility='';memberHeading.style.opacity='';viewport.style.backgroundColor='';
  }

  const { goTo, nextStop } = window.TwoNNavigation.create({
    getState:()=>({active,ready,geometry,stops,max:lead+travel,reduced}),
    storyPosition, scrollStory, scrollForX, schedule,
    fallback(value) {
      if(typeof value==='string') document.getElementById(value)?.scrollIntoView();
      else scrollTo({top:0,behavior:'auto'});
    }
  });
  const isControl = target => target instanceof Element && !!target.closest('button,a,input,textarea,select,video,[contenteditable=true]');

  function skipIntro() {
    focusAfterIntro=true;
    // Loading is asynchronous: early dismissal must also stop the pending boot.
    if (initialized) finishIntro(); else window.twoNFallback();
  }
  one('.skip-intro').addEventListener('click', skipIntro);
  one('.replay-intro').addEventListener('click', () => { focusAfterIntro=true; replay(); });
  one('.previous-chapter').addEventListener('click', () => nextStop(-1));
  one('.next-chapter').addEventListener('click', () => nextStop(1));
  all('[data-section]').forEach(button=>button.addEventListener('click',()=>goTo(button.dataset.section)));
  all('[data-go="0"]').forEach(button=>button.addEventListener('click',()=>goTo(0)));
  one('.skip-link').addEventListener('click', event => { if (!active) return; event.preventDefault(); skipIntro(); goTo('biomes'); });
  mediaQuery.addEventListener('change', () => { setMotionPreference(); if(reduced && playing) finishIntro(); schedule(); });
  addEventListener('2n:fallback', fallback);
  addEventListener('2n:profile',()=>{
    if(window.TwoNProfile.input===(touchFirst?'touch':'desktop')) return;
    // Capability change, not viewport resize. Reload cleanly restores all observers,
    // event routes and geometry precision rather than leaving mixed render paths.
    location.reload();
  });
  addEventListener('error', () => { if (!ready && active) window.twoNFallback(); });
  function onStoryScroll() {
    if(touchFirst) {if(mobile) mobile.scroll();return;}
    const position=clamp(storyPosition(),0,lead+travel);
    if(ready && active) {
      const delta=position-controlScrollAnchor;
      if(position<=2) { showControls(false); controlScrollAnchor=position; }
      else if(Math.abs(delta)>=12) { showControls(delta<0); controlScrollAnchor=position; }
    }
    schedule();
  }
  addEventListener('scroll',onStoryScroll,{passive:true});
  addEventListener('wheel', event => {
    if (!active || event.ctrlKey) return;
    if (!ready) { event.preventDefault(); return; }
    if(touchFirst) return; // Native horizontal momentum owns touch-device scrolling.
    if (!isControl(event.target) && Math.abs(event.deltaX)>Math.abs(event.deltaY)) {
      event.preventDefault();
      scrollBy({top:event.deltaX*(event.deltaMode===1?16:event.deltaMode===2?height:1),behavior:'instant'});
    }
  },{passive:false});
  addEventListener('keydown', event => {
    const scrollKeys=['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '];
    if (!active) return;
    if (!ready) {
      if (event.key==='Escape') skipIntro();
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
    else goTo(storyPosition()+(['ArrowRight','ArrowDown'].includes(event.key)?1:-1)*width*.55);
  });
  if(!touchFirst) {
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
  }
  addEventListener('pointermove', event=>{
    if(touchFirst || event.pointerType!=='mouse' || !active || reduced) return;
    wantedX=(event.clientX/width-.5)*24; wantedY=(event.clientY/height-.5)*14; schedule();
  },{passive:true});
  addEventListener('blur',()=>{wantedX=0;wantedY=0;});
  let resizeTimer;
  addEventListener('resize',()=>{
    if(!active) return;
    if(window.visualViewport && Math.abs(window.visualViewport.scale-1)>.01) return;
    // Address-bar changes do not resize sticky chapters, canvases or liquid plans.
    const sameWidth=Math.abs(document.documentElement.clientWidth-width)<3;
    if(touchFirst && sameWidth && Math.abs(innerHeight-height)<Math.max(180,height*.25)) return;
    clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>measure(),180);
  },{passive:true});
  addEventListener('orientationchange',()=>{
    clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if(active) measure();},240);
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

  async function boot() {
    try {
      header.inert=true;controls.inert=true;
      setMotionPreference();
      let loaded=0;
      const images=await Promise.all(imagePaths.map(async (path,index)=>{
        const image=await window.TwoNAssets.loadImage(path,biomeImages[index]);
        loaded++;one('.load-rule i').style.transform='scaleX('+(loaded/5)+')';
        loadStatus.textContent='准备场景 '+loaded+' / 5';
        return image;
      }));
      if(!active) return;
      scene=window.TwoNWorldScene.create(images, {
        one, touchFirst, markAnchor, mark, tones, perf:P,
        getState:()=>({width,height,reduced,cursorX,cursorY,logoTop,logoHeight})
      });
      setupMobile();
      root.classList.add('is-enhanced');
      root.classList.remove('is-booting');
      measure(false); initialized=true;
      // Boot succeeded. A background-paused intro must not trigger the boot watchdog.
      clearTimeout(window.twoNBootTimer);
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

/* Opening terrain rendering. App owns scheduling and passes current geometry. */
(() => {
  'use strict';
  const { easeOut, smooth, progress } = window.TwoNMotion;
  function create(images, context) {
    const { one, touchFirst, markAnchor, mark, tones, perf: P, getState } = context;
    let width, height, reduced, cursorX, cursorY, logoTop, logoHeight;
    function sync() {
      ({ width, height, reduced, cursorX, cursorY, logoTop, logoHeight } = getState());
    }
    sync();
  class WorldScene {
    constructor(images) {
      this.images = images;
      this.back = one('.world-back');
      this.front = one('.world-front');
      this.bg = this.back.getContext('2d');
      this.fg = this.front.getContext('2d');
      if (!this.bg || !this.fg) throw new Error('Canvas unavailable');
      if(touchFirst) {
        // All wave canvases remain siblings in the native-scrolling Hero.
        // Put the single brand between the back and real front terrain instead
        // of making the front chase native movement from a body overlay.
        markAnchor.after(mark);mark.classList.add('brand-in-scene');
      } else {
        // Preserve the existing desktop composition.
        this.frontSlot=document.createComment('opening foreground');
        this.front.before(this.frontSlot);
        this.frontLayer=document.createElement('div');
        this.frontLayer.className='brand-foreground';
        this.frontLayer.setAttribute('aria-hidden','true');
        this.frontLayer.append(this.front);document.body.append(this.frontLayer);
      }
      this.atlas = document.createElement('canvas');
      this.sizeKey='';this.drawKey='';this.lastPaint=-Infinity;
      // wavelength / weight / angular speed / phase / horizontal steepness.
      // Shared swell language, with two quiet detail components on desktop.
      this.waves=[
        [1.04,.62,.52,.3,.42], [.47,.25,.83,1.9,.30],
        [.22,.10,1.17,4.1,.20], [.137,.02,1.43,.7,.12],
        [.31,.01,-.37,2.8,.10]
      ];
      this.waveCount=touchFirst?3:5;
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
      sync();
      const key=[width,height,touchFirst?1:Math.min(devicePixelRatio||1,1.5)].join(':');
      if(this.sizeKey===key) return;
      this.sizeKey=key;this.drawKey='';this.lastPaint=-Infinity;
      this.makeAtlas();
      // A 1x canvas is enough beneath the textured artwork on touch screens and
      // avoids pushing two retina-sized canvases through every scroll frame.
      this.dpr = touchFirst ? 1 : Math.min(devicePixelRatio || 1, 1.5);
      for (const canvas of [this.back, this.front]) {
        canvas.width = Math.round(width * this.dpr);
        canvas.height = Math.round(height * this.dpr);
      }
      this.sky=this.bg.createLinearGradient(0,0,0,height);
      this.sky.addColorStop(0,'#f3f2ec');this.sky.addColorStop(.53,'#e9ece1');this.sky.addColorStop(1,'#c3d2bc');
      this.shade=this.fg.createLinearGradient(0,height*.60,0,height);
      this.shade.addColorStop(0,'transparent');this.shade.addColorStop(1,'#0a100950');
    }
    wavePoint(x, base, amplitude, phase, seconds, gain, layer) {
      let dx=0,dy=0;
      const span=1.18-layer*.09, speed=.72+layer*.14;
      for(let i=0;i<this.waveCount;i++) {
        const w=this.waves[i];
        const angle=x/width*Math.PI*2/(w[0]*span)-seconds*w[2]*speed+phase+w[3];
        const a=height*amplitude*w[1]*gain;
        // Horizontal compression concentrates crests; troughs remain broad.
        // Conservative steepness keeps x monotonic, with no curling/self-crossing.
        dx-=Math.sin(angle)*a*w[4];
        dy-=Math.cos(angle)*a;
      }
      this.waveX=x+dx;this.waveY=base+dy;
    }
    sheet(ctx, base, amplitude, phase, offsetX, offsetY, wash, entry, seconds, gain, layer) {
      ctx.save();
      const zoom = 1 + easeOut(entry) * 1.35;
      ctx.translate(width * .5, height * .5);
      ctx.scale(zoom, zoom);
      ctx.translate(-width * .5 + width * .30 * entry, -height * .5 + height * .035 * entry);
      ctx.translate(0,offsetY);
      // Draw directly into the reusable context path. Time-varying contours must
      // not accumulate in the old static Path2D cache.
      ctx.beginPath();
      const samples=touchFirst?192:336;
      for(let i=0;i<=samples;i++) {
        const x=-width+i/samples*width*3;
        this.wavePoint(x,base,amplitude,phase,seconds,gain,layer);
        if(i===0) ctx.moveTo(this.waveX,this.waveY);
        else ctx.lineTo(this.waveX,this.waveY);
      }
      ctx.lineTo(width*2,height*3);ctx.lineTo(-width,height*3);ctx.closePath();ctx.clip();
      ctx.drawImage(this.atlas,-width*.08+offsetX,base-height*.19,width*1.16,height*1.25);
      if (wash) {
        ctx.fillStyle = wash; ctx.fillRect(-width, -height, width * 3, height * 4);
      }
      ctx.restore();
    }
    placeForeground(entry) {
      sync();
      if(touchFirst) return; // Hero's native scroll, clipping and fade own this.
      // Match the original Hero's native horizontal position and exit fade.
      // Its internal canvas camera remains owned by transform()/draw().
      this.frontLayer.style.transform='translate3d('+(- (touchFirst?entry*width:0))+'px,0,0)';
      this.frontLayer.style.opacity=String(1-smooth(progress(entry,.68,1)));
      this.frontLayer.style.visibility=entry>=1?'hidden':'visible';
    }
    restoreForeground() {
      if(!this.frontLayer) return;
      if(this.frontSlot.isConnected) {this.frontSlot.before(this.front);this.frontSlot.remove();}
      this.frontLayer.remove();
    }
    transform(entry) {
      sync();
      const amount = smooth(entry);
      this.back.style.transform = 'translate3d(' + (amount*width*.07) + 'px,' + (amount*height*.015) + 'px,0) scale(' + (1+amount*.32) + ')';
      this.front.style.transform = 'translate3d(' + (amount*width*.12) + 'px,' + (-amount*height*.025) + 'px,0) scale(' + (1+amount*.42) + ')';
    }
    draw(state, entry, now) {
      sync();
      const worldStart=P?P.start():0;
      const { bg, fg } = this;
      // Cap touch canvas work near 30 fps, including scroll-driven calls.
      if(touchFirst && !reduced && now-this.lastPaint<32) return;
      const key=[state.world,entry,touchFirst?0:cursorX,touchFirst?0:cursorY,reduced?0:now].join(':');
      if(key===this.drawKey) return;
      this.drawKey=key;this.lastPaint=now;
      // Touch scroll-space transforms are committed before drawing and must
      // survive both the throttled return and a full waveform repaint.
      if(!touchFirst) {
        this.back.style.transform='none';
        this.front.style.transform='none';
      }
      for (const ctx of [bg, fg]) {
        ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        ctx.clearRect(0, 0, width, height);
      }
      bg.fillStyle = this.sky; bg.fillRect(0, 0, width, height);
      const seconds=reduced?0:now/1000;
      const gain=reduced?1:1+.22*(1-state.world);
      const base = logoTop + logoHeight * .67;
      const rise = (1 - state.world) * height * .24;
      const pointerX = reduced ? 0 : cursorX;
      const pointerY = reduced ? 0 : cursorY;
      this.sheet(bg, base - height * .12, .022, .2, -pointerX * .35, rise - pointerY * .3, '#f3f2ec66', entry, seconds, gain, 0);
      this.sheet(bg, base - height * .047, .028, 1.4, pointerX * .32, rise * .7, '#151d1510', entry, seconds, gain, 1);
      // Solve the front contour against the measured logo, including the center wave.
      this.wavePoint(width*.5,0,.035,2.5,0,1,2);
      const frontBase = base - this.waveY;
      this.sheet(fg, frontBase, .035, 2.5, pointerX * .85, rise * .5 + pointerY * .42 - entry * height * .04, '#09180915', entry, seconds, gain, 2);
      fg.fillStyle = this.shade; fg.fillRect(0, height * .62, width, height * .38);
      if(P) P.end('world',worldStart);
    }
  }
    return new WorldScene(images);
  }
  window.TwoNWorldScene = Object.freeze({ create });
})();

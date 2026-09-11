/* Real content scrolling. The driver never transforms the track. */
window.TwoNMobileStory=class {
  constructor({shell,track,hero,bridge,members,leaders,panels,onChapter,wake,perf}) {
    Object.assign(this,{shell,track,hero,bridge,members,leaders,panels,onChapter,wake,perf});
    this.holds=new Map();this.bounds=new Map();this.latest=0;this.width=1;
    track.prepend(hero);
    for(const panel of [bridge,members]) {
      const hold=document.createElement('div');hold.className='native-chapter';
      panel.before(hold);hold.append(panel);this.holds.set(panel,hold);
    }
    this.targets=[hero,...panels,...leaders.querySelectorAll('.leader-card')];
    this.observer=new IntersectionObserver(entries=>{
      for(const entry of entries) {
        const visible=entry.isIntersecting;
        entry.target.classList.toggle('is-native-visible',visible);
        entry.target.inert=!visible;
      }
      this.publish();
      if(this.heavy()) this.wake();
    },{root:shell,threshold:[0,.15,.5,.85]});
    this.targets.forEach(e=>this.observer.observe(this.holds.get(e)||e));
    // Holds carry observer state but the actual stage remains interactive.
    for(const [panel,hold] of this.holds) {hold.dataset.stage=panel.id;}
    this.onEnd=()=>this.publish();
    shell.addEventListener('scrollend',this.onEnd,{passive:true});
  }
  measure(width,height,bridgeDuration,memberDuration) {
    this.width=width;this.height=height;
    for(const [panel,hold] of this.holds) {
      const duration=panel===this.bridge?bridgeDuration:memberDuration;
      hold.style.width=(width+duration)+'px';
    }
    // All writes above, then one layout read pass. Coordinates are content-local.
    const shellLeft=this.shell.getBoundingClientRect().left;
    const x=this.shell.scrollLeft;
    this.bounds.clear();
    for(const panel of [this.hero,...this.panels]) {
      const box=(this.holds.get(panel)||panel).getBoundingClientRect();
      this.bounds.set(panel,{x:box.left-shellLeft+x,width:box.width});
    }
    this.stops=[0,...this.panels.map(p=>this.bounds.get(p).x)];
    for(const card of this.leaders.querySelectorAll('.leader-card'))
      this.stops.push(card.getBoundingClientRect().left-shellLeft+x);
    this.max=this.shell.scrollWidth-width;
    this.latest=this.shell.scrollLeft;
    this.publish();
  }
  heavy() {
    const x=this.latest,w=this.width;
    for(const panel of [this.hero,this.bridge,this.members]) {
      const b=this.bounds.get(panel);
      if(b && x<b.x+b.width && x+w>b.x) return panel===this.hero?'hero':panel.id;
    }
    return '';
  }
  phase(panel) {
    const b=this.bounds.get(panel);
    return b?Math.max(0,Math.min(1,(this.latest-b.x)/Math.max(1,b.width-this.width))):0;
  }
  scroll() {this.latest=this.shell.scrollLeft;if(this.heavy()) this.wake();}
  publish() {
    if(!this.bounds.size) return;
    const center=this.latest+this.width*.5;
    let index=0;
    this.panels.forEach((p,i)=>{if(this.bounds.get(p).x<=center) index=i+1;});
    this.onChapter(index,this.latest,this.max);
    const section=this.heavy()||(index>=1&&index<=5?'biomes':index===7?'leaders':index===9?'film':'ending');
    if(this.perf) this.perf.section(section);
  }
  destroy() {
    this.observer.disconnect();this.shell.removeEventListener('scrollend',this.onEnd);
    this.shell.prepend(this.hero);
    for(const [panel,hold] of this.holds) {hold.before(panel);hold.remove();}
    this.targets.forEach(e=>{e.inert=false;e.classList.remove('is-native-visible');});
    this.track.style.transform='';
  }
};

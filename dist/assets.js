/* Loading deadline covers network and decoding; no DOM or animation ownership. */
(function (target) {
  'use strict';
  async function loadImage(path) {
    return new Promise(resolve=>{
      const image=new Image();
      let completed=false;
      const finish=value=>{if(completed)return;completed=true;clearTimeout(timer);resolve(value);};
      const timer=setTimeout(()=>finish(null),4500);
      image.decoding='async';
      image.onload=async()=>{
        // Keep the deadline active until decoding finishes as well.
        try { await image.decode(); } catch {}
        finish(image);
      };
      image.onerror=()=>finish(null);image.src=path;
    });
  }

  const api = Object.freeze({ loadImage });
  if (typeof module === 'object' && module.exports) module.exports = api;
  else target.TwoNAssets = api;
})(typeof window === 'object' ? window : this);

/* Reuse the displayed image; the deadline covers network and decoding. */
(function (target) {
  'use strict';
  async function loadImage(path, displayedImage) {
    return new Promise(resolve=>{
      const image=displayedImage || new Image();
      let completed=false;
      const finish=value=>{if(completed)return;completed=true;clearTimeout(timer);resolve(value);};
      const timer=setTimeout(()=>finish(null),4500);
      image.decoding='async';
      const decode=async()=>{
        try { await image.decode(); } catch {}
        finish(image);
      };
      image.onload=decode;
      image.onerror=()=>finish(null);
      if(displayedImage) {
        // Its src was discovered by the HTML parser; do not restart that request.
        if(image.complete) {
          if(image.naturalWidth>0) decode(); else finish(null);
        }
      } else image.src=path;
    });
  }

  const api = Object.freeze({ loadImage });
  if (typeof module === 'object' && module.exports) module.exports = api;
  else target.TwoNAssets = api;
})(typeof window === 'object' ? window : this);

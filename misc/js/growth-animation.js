/* Growth is composited from the finished pixel-print plate. The full source
   SVG is never re-rasterized for each frame, eliminating frame reordering. */
window.MS=window.MS||{};
((M)=>{
 'use strict';
 M.growthAnimation={
   play(svg){ M.pixelPlayback?.play(svg,M.currentPixelSettings||{}); },
   cancel(){ M.pixelPlayback?.stop(); }
 };
})(window.MS);

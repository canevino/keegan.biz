/* Organic growth playback (2026-10-18, revised).
 * The generator, printable SVG and all species geometry are unchanged by playback.
 * One clock drives every axis, blade and organ: no individual Web Animations,
 * no opacity crossfades, and no timer-based DOM swaps.  Cancelling ALWAYS
 * returns to the exact original, complete, exportable illustration.
 */
window.MS = window.MS || {};
((M) => {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const smooth = x => { x = clamp(x); return x*x*(3-2*x); };
  const all = (el, selector) => Array.from(el.querySelectorAll(selector));
  const create = (tag, attrs = {}) => {
    const el = document.createElementNS(NS, tag);
    for (const [key, val] of Object.entries(attrs)) el.setAttribute(key, String(val));
    return el;
  };
  const leafMatrix = (x,y,angle,length,width) => {
    const cs=Math.cos(angle),sn=Math.sin(angle);
    const a=length*cs*cs+width*sn*sn, b=(length-width)*cs*sn;
    const d=length*sn*sn+width*cs*cs;
    return `matrix(${a.toFixed(5)} ${b.toFixed(5)} ${b.toFixed(5)} ${d.toFixed(5)} ${(x-a*x-b*y).toFixed(3)} ${(y-b*x-d*y).toFixed(3)})`;
  };
  const num = (el, name, fallback) => {
    const n = Number(el.getAttribute(name));
    return el.hasAttribute(name) && Number.isFinite(n) ? n : fallback;
  };
  function coordinate(el, attribute, x=425, y=500) {
    const a = (el.getAttribute(attribute) || '').split(/[ ,]+/).map(Number);
    return a.length > 1 && a.every(Number.isFinite) ? a : [x, y];
  }
  let active = null;
  let maskSerial = 0;
  function stop() {
    const run = active;
    if (!run) return;
    active = null;
    cancelAnimationFrame(run.raf);
    // Restore original attributes, rather than trying to guess which animated
    // transforms, masks or visibilities an SVG element had before playback.
    for (const [el, prop, original] of run.changes) {
      if (original === null) el.removeAttribute(prop);
      else el.setAttribute(prop, original);
    }
    run.defs.remove();
    if(run.printGroup){if(run.printFilter)run.printGroup.setAttribute('filter',run.printFilter);else run.printGroup.removeAttribute('filter');}
    run.art.classList.remove('is-growing');
    if (run.art.isConnected) run.art.dispatchEvent(new CustomEvent('growth-complete'));
  }
  function play(art) {
    stop();
    if (!art || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const plants = all(art, '.growth-plant');
    if (!plants.length) return;
    const printGroup=art.querySelector('#artwork-layers');
    const printFilter=printGroup?.getAttribute('filter');
    if(printGroup)printGroup.removeAttribute('filter');
    const run = {printGroup,printFilter,art, raf: 0, changes: [], changed: new WeakMap(), defs:create('defs'), axes:[], blades:[], organs:[], extra:[], duration:0, previous:-1};
    active=run;
    art.insertBefore(run.defs,art.firstChild);
    art.classList.add('is-growing');
    const set=(el,prop,val)=>{
      if (!el) return;
      let props=run.changed.get(el);
      if (!props){props=new Set();run.changed.set(el,props);}
      if(!props.has(prop)) {props.add(prop);run.changes.push([el,prop,el.getAttribute(prop)]);}
      if(el.getAttribute(prop)!==String(val)) el.setAttribute(prop, String(val));
    };
    function wood(target,path,start,duration,width) {
      if (!target || !path) return;
      const brush = create('path',{'d':path,'fill':'none','stroke':'white','stroke-width':width,'stroke-linecap':'round','stroke-linejoin':'round'});
      let length=0;
      try{length=brush.getTotalLength();}catch(_){}
      if (!Number.isFinite(length) || length<.5)return;
      const id='botanical-grow-mask-'+(++maskSerial);
      // Mask generously oversized in USER coordinates; geometry is never
      // cropped at the original illustration viewBox or a branch endpoint.
      const mask=create('mask',{id,maskUnits:'userSpaceOnUse',maskContentUnits:'userSpaceOnUse',x:-1000,y:-1000,width:(M.W||850)+2000,height:(M.H||1000)+2000});
      mask.appendChild(brush);run.defs.appendChild(mask);
      set(target,'mask',`url(#${id})`);
      const L=length+width;
      brush.setAttribute('stroke-dasharray',`${L} ${L}`);
      brush.setAttribute('stroke-dashoffset',L);
      run.axes.push({brush,length:L,start,duration});
      run.duration=Math.max(run.duration,start+duration);
    }
    const phases=new Map();
    plants.forEach((plant,i)=>{
      const trunk=plant.querySelector(':scope > .growth-primary');
      if(!trunk)return;
      const fern=plant.dataset.trunk==='fern';
      const phase={start:i*160,duration:fern?2600:3000};
      phases.set(plant,phase);
      wood(trunk,trunk.getAttribute('data-growpath'),phase.start,phase.duration,fern?9:82);
    });
    // Assign all shoot schedules first, including shoots nested in tertiary
    // branches. Parents start before their children; every shoot waits until
    // the parent stem has ACTUALLY grown past its branching position.
    const shoots=all(art,'.growth-shoot');
    shoots.forEach((shoot,i)=>{
      const ancestor=shoot.parentElement.closest('.growth-shoot');
      const parent=phases.get(ancestor||shoot.closest('.growth-plant'));
      if(!parent)return;
      const root=clamp(num(shoot,'data-root-t',.43),.03,.96);
      const phase={start:parent.start+parent.duration*(ancestor?.26+.68*root:.08+.85*root)+45,
                   duration:ancestor?780:1250};
      phases.set(shoot,phase);
      wood(shoot.querySelector(':scope > .shoot-wood'),shoot.dataset.growpath,phase.start,phase.duration,28);
    });
    // Store the ORIGINAL SVG transform, then grow the whole group from its
    // attachment in SVG user coordinates, not element-local pixels. A single
    // RAF updates all leaves in shared frame time, avoiding hundreds of
    // competing easing engines and racing animation fills.
    all(art,'.growth-leaf').forEach((leaf,i)=>{
      const owner=leaf.closest('.growth-shoot')||leaf.closest('.growth-plant');
      const phase=phases.get(owner);if(!phase)return;
      const t=clamp(num(leaf,'data-grow-t',.55),.04,.98);
      const [x,y]=coordinate(leaf,'data-attachment');
      const original=leaf.getAttribute('transform')||'';
      const angle=num(leaf,'data-leaf-angle',0);
      const start=phase.start+phase.duration*(.13+.79*t)+65;
      const duration=650+((i*11)%6)*40;
      run.blades.push({leaf,original,x,y,angle,start,duration,last:-1});
      run.duration=Math.max(run.duration,start+duration);
      set(leaf,'transform',`${leafMatrix(x,y,angle,.0001,.0001)} ${original}`);
    });
    // Full final organ stays the SAME geometric object from very small bud to
    // blossom / berry. We do not swap life-bud / life-bloom / life-final:
    // swapping differently drawn groups was the visual pop in the old code.
    all(art,'.growth-organ').forEach((organ,i)=>{
      const owner=organ.closest('.growth-shoot')||organ.closest('.growth-plant');
      const phase=phases.get(owner);if(!phase)return;
      const final=organ.querySelector(':scope > .life-final');
      if(!final)return;
      const bud=organ.querySelector(':scope > .life-bud');
      const bloom=organ.querySelector(':scope > .life-bloom');
      if(bud)set(bud,'display','none');
      if(bloom)set(bloom,'display','none');
      const [x,y]=coordinate(organ,'data-life-origin');
      const original=final.getAttribute('transform')||'';
      const start=phase.start+phase.duration*.84+100+(i%4)*120;
      // Grow the calyx's connecting stalk along its own short path.
      // Previously this path was visible from the first frame and appeared
      // as a detached mark long before its supporting branch emerged.
      const calyx=organ.querySelector(':scope > path');
      if(calyx)wood(calyx,calyx.getAttribute('d'),start-320,530,8);
      const duration=1050+(i%3)*90;
      run.organs.push({el:final,original,x,y,start,duration,last:-1});
      run.duration=Math.max(run.duration,start+duration);
      set(final,'transform',`translate(${x} ${y}) scale(.0001) translate(${-x} ${-y}) ${original}`);
    });
    // A single frame reveals the botanical progression in this order:
    // primary axis -> attached shoots -> petioles and leaf blades -> flowers.
    // Show the final SVG after exactly reaching 100% (no regen, no reflow).
    function render(now) {
      if(active!==run)return;
      if(run.startTime==null)run.startTime=now;
      const elapsed=now-run.startTime;
      // 30fps is adequate for drawn ink and substantially reduces repeated
      // SVG/filter rasterization on Safari and slower mobile devices.
      if(elapsed-run.previous >= 1000/30 || elapsed>=run.duration) {
        run.previous=elapsed;
        for(const axis of run.axes){
          const u=clamp((elapsed-axis.start)/axis.duration);
          const off=axis.length*(1-smooth(u));
          axis.brush.setAttribute('stroke-dashoffset',off.toFixed(2));
        }
        for(const blade of run.blades){
          const t=clamp((elapsed-blade.start)/blade.duration);
          const p=smooth(t);
          if(Math.abs(p-blade.last)<.007)continue;
          blade.last=p;
          // Blade first elongates, then fills out. There is no fade-in and no
          // overshoot or rubber-band bounce. The transform is attachment-fixed.
          const length=.0001+.9999*smooth(Math.min(1,t*1.26));
          const width=.0001+.9999*smooth(clamp((t-.12)/.88));
          set(blade.leaf,'transform',`${leafMatrix(blade.x,blade.y,blade.angle,length,width)} ${blade.original}`);
        }
        for(const organ of run.organs){
          const t=clamp((elapsed-organ.start)/organ.duration);
          const p=smooth(t);
          if(Math.abs(p-organ.last)<.002)continue;
          organ.last=p;
          // Smooth inflation from a real attachment; the one finished shape
          // can become a flower, nut or berry without a swapped overlay.
          const size=.0001+p*.9999;
          set(organ.el,'transform',`translate(${organ.x} ${organ.y}) scale(${size.toFixed(4)}) translate(${-organ.x} ${-organ.y}) ${organ.original}`);
        }
      }
      if (elapsed < run.duration+100){run.raf=requestAnimationFrame(render);}
      else stop();
    }
    run.raf=requestAnimationFrame(render);
  }
  M.growthAnimation={play,cancel:stop};
})(window.MS);

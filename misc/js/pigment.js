/* Pigment palette and color-in-shape patterning. No loose pixel rectangles. */
window.MS=window.MS||{};
((M)=>{
  'use strict';
  const clamp=M.clamp;
  const rgb=c=>c.slice(1).match(/../g).map(x=>parseInt(x,16)/255);
  const hex=a=>'#'+a.map(x=>Math.round(clamp(x,0,1)*255).toString(16).padStart(2,'0')).join('');
  // Spectral.js 3.x is opt-in: window.spectral from a user-supplied local build.
  // Fallback is a three-channel Kubelka–Munk approximation, not full spectral integration.
  M.mix=(a,b,t)=>{
    t=clamp(t,0,1);
    if(window.spectral?.Color&&window.spectral?.mix){
      try{return window.spectral.mix([new window.spectral.Color(a),1-t],[new window.spectral.Color(b),t]).toString();}catch(e){ /* offline fallback */ }
    }
    const A=rgb(a),B=rgb(b);
    const reflect=c=>Math.max(.002,c);
    const ks=x=>(1-x)*(1-x)/(2*x);
    const inv=k=>1+k-Math.sqrt(k*k+2*k);
    return hex(A.map((x,i)=>inv((1-t)*ks(reflect(x))+t*ks(reflect(B[i])))));
  };
  M.pigmentDefs=(s,r)=>{
    const p=s.pal;
    return `<pattern id="speckle" patternUnits="userSpaceOnUse" width="57" height="49">
      ${Array.from({length:36},(_,i)=>{
        const x=r.between(0,57),y=r.between(0,49),rad=r.between(.22,1.18);
        return M.circle(x,y,rad,i%4?p.ink:p.vermillion,`opacity="${M.n(r.between(.07,.24))}"`);
      }).join('')}
    </pattern>`;
  };
  // A base color and scattered pigment are both clipped to the same geometry.
  // This is intentionally different from prior versions' free-floating mosaic squares.
  M.painted=(id,d,color,bounds,s,r,opts={})=>{
    const p=s.pal,detail=clamp(s.pigment/100,0,1),eroded=clamp(s.wear/100,0,1);
    let out=`<defs><clipPath id="clip-${id}"><path d="${d}"/></clipPath></defs>`;
    out+=M.shape(d,color,`stroke="${p.ink}" stroke-width="${M.n(opts.stroke??1.4)}" stroke-linejoin="round"`);
    out+=`<g clip-path="url(#clip-${id})">`;
    const n=opts.lightweight?Math.floor(2+detail*7):Math.floor(8+detail*75);
    for(let i=0;i<n;i++){
      const x=r.between(bounds.x,bounds.x+bounds.w),y=r.between(bounds.y,bounds.y+bounds.h);
      const rr=r.between(1.2,5.3+detail*8.2),cc=r.choose([p.lapis,p.vermillion,p.green,p.ochre,p.light]);
      // irregular, opaque pigments stay INSIDE the object silhouette
      const d2=`M${M.vec(x-rr,y)}q${M.vec(rr*.8,-rr*.9)} ${M.vec(2*rr,.2*rr)}q${M.vec(rr*.3,rr*.75)} ${M.vec(-1.3*rr,.95*rr)}Z`;
      out+=M.shape(d2,cc,`opacity="${M.n(r.between(.08,.24)*detail)}"`);
    }
    if(eroded>.05){
      for(let i=0;i<(opts.lightweight?Math.floor(eroded*5):Math.floor(eroded*48));i++){
        const x=r.between(bounds.x,bounds.x+bounds.w),y=r.between(bounds.y,bounds.y+bounds.h);
        out+=M.circle(x,y,r.between(.35,2.8),p.light,`opacity="${M.n(.12+.25*eroded)}"`);
      }
    }
    out+=`<path d="${d}" fill="url(#speckle)" opacity="${M.n(.24+detail*.5)}"/></g>`;
    return out;
  };
})(window.MS);

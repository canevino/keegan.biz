/* Botanical-only composition planner. Every layout changes the actual growth
   axes, root count and curve structure; nothing reserves room for letters. */
window.MS=window.MS||{};
((M)=>{
  'use strict';
  const P=(x,y)=>({x,y}),box=(x,y,w,h)=>({x,y,w,h});
  const clampPt=(p,b)=>P(M.clamp(p.x,b.x,b.x+b.w),M.clamp(p.y,b.y,b.y+b.h));
  function curveBox(a,b,c,d){
    const pts=M.wave(a,b,c,d,32),x=pts.map(p=>p.x),y=pts.map(p=>p.y),padding=85;
    return box(Math.min(...x)-padding,Math.min(...y)-padding,Math.max(...x)-Math.min(...x)+padding*2,Math.max(...y)-Math.min(...y)+padding*2);
  }
  function axis(a,d,side,id,r,opts={}){
    const dx=d.x-a.x,dy=d.y-a.y,normal=M.normal(M.unit({x:dx,y:dy}));
    const bend=opts.bend??r.between(75,160);
    const sign=side;
    // Different control-point offsets give genuinely different S curves, curls,
    // and asymmetrical plants rather than simply translating a straight stem.
    const first=(opts.first??.66)*bend*sign;
    const second=(opts.second??r.choose([-.82,.62,1.07]))*bend*sign;
    const bounds=box(46,44,756,914);
    const b=clampPt(P(a.x+dx*.28+normal.x*first,a.y+dy*.28+normal.y*first),bounds);
    const c=clampPt(P(a.x+dx*.72+normal.x*second,a.y+dy*.72+normal.y*second),bounds);
    return {id,a,b,c,d,side,major:opts.major!==false,width:opts.major===false?r.between(7,12):r.between(12,21),box:curveBox(a,b,c,d),character:opts.character||'wandering'};
  }
  const designs={
    single(r){return [axis(P(r.between(160,300),952),P(r.between(430,650),r.between(92,188)),1,1,r,{bend:r.between(125,215),first:1.12,second:-.86})];},
    crescent(r){return [
      axis(P(r.between(100,180),946),P(r.between(350,490),r.between(120,250)),1,1,r,{first:1.05,second:-.65}),
      axis(P(r.between(686,760),947),P(r.between(495,635),r.between(130,270)),-1,2,r,{first:.82,second:-1.08})];},
    diagonal(r){return [
      axis(P(r.between(85,165),r.between(845,948)),P(r.between(645,762),r.between(90,220)),1,1,r,{first:.8,second:-.8}),
      axis(P(r.between(700,785),r.between(882,965)),P(r.between(260,445),r.between(330,495)),-1,2,r,{major:false,first:.86,second:-.98})];},
    radiating(r){
      const root=P(r.between(285,450),r.between(790,928));
      return Array.from({length:r.int(3,4)},(_,i)=>{
        const destinations=[[130,210],[350,125],[660,172],[760,390]];
        const [tx,ty]=destinations[i];
        return axis(P(root.x+r.between(-38,38),root.y+r.between(-20,25)),P(tx+r.between(-55,55),ty+r.between(-50,55)),i%2?1:-1,i+1,r,{major:i<2,bend:r.between(65,125),first:1.03,second:-.83});
      });
    },
    meander(r){return [
      axis(P(r.between(75,155),r.between(810,952)),P(r.between(530,690),r.between(115,230)),1,1,r,{first:1.42,second:-1.25,bend:r.between(140,230),character:'meander'}),
      axis(P(r.between(690,782),r.between(920,974)),P(r.between(400,590),r.between(265,412)),-1,2,r,{major:false,first:-1.32,second:1.20,bend:r.between(95,178),character:'meander'})];},
    cluster(r){
      const center=P(r.between(330,475),r.between(760,890));
      return Array.from({length:4},(_,i)=>{
        const tips=[[120,245],[370,120],[610,210],[760,430]],q=tips[i];
        return axis(P(center.x+r.between(-56,56),center.y+r.between(-48,45)),P(q[0]+r.between(-58,58),q[1]+r.between(-55,55)),i%2?1:-1,i+1,r,{major:i<2,bend:r.between(75,142),first:1.08,second:-.62});
      });
    }
  };
  M.plan=(s,r)=>{
    // A painted stroke completely replaces generated construction axes.
    // Keep this before the random layout/geometry calls so changing Gothic
    // style cannot accidentally alter a user-authored plant.
    if(s.drawnPaths?.length){
      const stems=M.drawnStems(s.drawnPaths,r);
      if(stems.length)return {mode:'botanical',layout:'hand-drawn',structure:'hand-drawn',
        construction:null,conform:0,bounds:box(8,8,M.W-16,M.H-16),
        focal:{x:-10000,y:-10000,rx:1,ry:1},stems,knots:[],compartments:[],weaveStem:-1};
    }
    const list=Object.keys(designs);
    const selection=list.includes(s.pattern)&&s.pattern!=='random'?s.pattern:r.choose(list);
    const natural=designs[selection](r);
    const construction=M.constructGuides(s.geometry||'random',r);
    const amount=M.clamp(Number(s.conform??55)/100,0,1);
    // Below 20% preserve all the original (free) plant axes. As conformity
    // rises, the guide's branching topology also becomes part of the layout.
    const guideCount=Math.min(5,construction.rails.length);
    const count=amount<.20 ? natural.length : Math.max(natural.length,guideCount);
    const stems=Array.from({length:count},(_,i)=>{
      const source=natural[i%natural.length],rail=construction.rails[i%construction.rails.length];
      const id=i+1;
      const stem={...source,id,side:i%2?-1:1,
        guidePoints:rail,
        naturalPoints:M.wave(source.a,source.b,source.c,source.d,100),
        guideAmount:amount,
        // The guide controls structural axes, while species-dependent compliance
        // and local growth curvature are resolved in botany.js.
        guideIndex:i};
      stem.major=i<2 || (guideCount>3 && i===2);
      return stem;
    });
    return {mode:'botanical',layout:selection,structure:construction.name,construction,conform:amount,
      bounds:box(46,45,758,910),focal:{x:-10000,y:-10000,rx:1,ry:1},
      stems,knots:[],compartments:[],weaveStem:-1};
  };
})(window.MS);

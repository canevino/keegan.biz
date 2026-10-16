/* Whole-page planning. A seed changes the structure, not merely surface noise. */
window.MS=window.MS||{};
((M)=>{
  'use strict';
  const P=(x,y)=>({x,y}),box=(x,y,w,h)=>({x,y,w,h});
  const bounded=(p,b)=>P(M.clamp(p.x,b.x,b.x+b.w),M.clamp(p.y,b.y,b.y+b.h));
  const curveBox=(a,b,c,d)=>{const pts=M.wave(a,b,c,d,30),xs=pts.map(p=>p.x),ys=pts.map(p=>p.y),padding=42;
    return box(Math.max(0,Math.min(...xs)-padding),Math.max(0,Math.min(...ys)-padding),Math.max(...xs)-Math.min(...xs)+padding*2,Math.max(...ys)-Math.min(...ys)+padding*2);};
  function stemsFor(mode,focal,r){
    const canvasBounds=box(56,52,738,892),options=[
      {a:P(r.between(85,195),950),d:P(r.between(300,520),r.between(160,280)), side:1},
      {a:P(r.between(655,780),940),d:P(r.between(380,590),r.between(145,300)), side:-1},
      {a:P(74,r.between(450,700)),d:P(r.between(530,720),r.between(180,390)),side:1},
      {a:P(r.between(100,300),94),d:P(r.between(530,760),r.between(600,850)),side:-1},
      {a:P(778,r.between(330,590)),d:P(r.between(160,330),r.between(760,890)),side:-1},
      {a:P(r.between(450,700),962),d:P(r.between(160,320),r.between(250,470)),side:1},
    ];
    const chosen=r.shuffled(options).slice(0, mode==='letter'?r.int(2,3):mode==='interlace'?r.int(1,2):r.int(2,3));
    return chosen.map((v,i)=>{
      let a=v.a,d=v.d;
      const mx=(a.x+d.x)*.5,my=(a.y+d.y)*.5;
      let offset=r.between(80,170)*r.sign();
      // Route around the central decorated letter rather than through it.
      if(Math.abs(mx-focal.x)<focal.rx+55){offset=Math.sign(mx-focal.x||r.sign())*r.between(100,185);}
      const b=bounded(P(a.x*.69+d.x*.31+offset*.47,a.y*.69+d.y*.31+r.between(-90,90)),canvasBounds);
      const c=bounded(P(a.x*.28+d.x*.72+offset,a.y*.28+d.y*.72+r.between(-110,110)),canvasBounds);
      return {...v,a,b,c,d,width:r.between(11,19),major:i<2,id:i+1,box:curveBox(a,b,c,d)};
    });
  }
  M.plan=(s,r)=>{
    const mode=s.mode||'botanical';
    let center=P(r.between(365,470),r.between(440,600));
    if(mode==='interlace')center=P(r.between(390,462),r.between(470,540));
    const glyphSize=mode==='letter'?r.between(320,435):mode==='interlace'?r.between(168,245):r.between(220,305);
    const focal={x:center.x,y:center.y,rx:glyphSize*.44,ry:glyphSize*.54};
    const bounds=box(42,42,766,918);
    const nKnot=mode==='interlace'?r.int(2,3):r.int(1,2);
    const knots=Array.from({length:nKnot},(_,i)=>{
      const q=mode==='interlace' ? P(center.x+r.between(-85,85),center.y+(i-(nKnot-1)/2)*r.between(145,260))
        : P(r.between(255,660),r.chance(.5)?r.between(145,365):r.between(670,862));
      return {x:q.x,y:q.y,scale:mode==='interlace'?r.between(.56,.9):r.between(.29,.52),rotation:r.between(-20,20),id:i};
    });
    const plan={mode,bounds,focal,center,glyphSize,stems:stemsFor(mode,focal,r),knots,detail:r.int(2,5),inkRegions:[]};
    return plan;
  };
})(window.MS);

/* Pass 2 composition planner.  Every scene gets a shared structural map:
   focal letter, hand-routed growth axes, and bounded ornament cartouches.
   A seed determines the arrangement (crescent, diagonal, ascent, or split)
   before any plant or knot renderer adds details. */
window.MS=window.MS||{};
((M)=>{
  'use strict';
  const P=(x,y)=>({x,y}),box=(x,y,w,h)=>({x,y,w,h});
  const clampPt=(p,b)=>P(M.clamp(p.x,b.x,b.x+b.w),M.clamp(p.y,b.y,b.y+b.h));
  function curveBox(a,b,c,d){
    const pts=M.wave(a,b,c,d,32),xs=pts.map(p=>p.x),ys=pts.map(p=>p.y);
    const pad=70,x=Math.min(...xs)-pad,y=Math.min(...ys)-pad;
    return box(x,y,Math.max(...xs)-Math.min(...xs)+2*pad,Math.max(...ys)-Math.min(...ys)+2*pad);
  }
  const layouts=['crescent','diagonal','ascent','split'];
  function makeStems(focal,mode,layout,r){
    const bnd=box(56,54,736,882),f=focal,axes=[];
    if(layout==='crescent'){
      axes.push({a:P(r.between(90,190),950),d:P(r.between(228,395),r.between(132,250)),side:1,curve:1});
      axes.push({a:P(r.between(690,790),950),d:P(r.between(524,720),r.between(125,290)),side:-1,curve:-1});
    }else if(layout==='diagonal'){
      axes.push({a:P(r.between(66,130),r.between(785,935)),d:P(r.between(610,760),r.between(150,305)),side:1,curve:1});
      axes.push({a:P(r.between(660,778),r.between(950,980)),d:P(r.between(240,445),r.between(240,365)),side:-1,curve:-1});
    }else if(layout==='ascent'){
      axes.push({a:P(r.between(150,295),968),d:P(r.between(375,575),r.between(94,220)),side:1,curve:1});
      axes.push({a:P(r.between(560,745),r.between(930,970)),d:P(r.between(560,755),r.between(205,335)),side:-1,curve:-1});
    }else{
      axes.push({a:P(62,r.between(555,780)),d:P(r.between(390,600),r.between(93,234)),side:1,curve:1});
      axes.push({a:P(785,r.between(380,630)),d:P(r.between(300,525),r.between(860,948)),side:-1,curve:-1});
    }
    if(mode==='interlace')axes.splice(1,1);
    else if(mode==='botanical'&&r.chance(.38)){
      axes.push({a:P(r.between(150,760),970),d:P(r.between(220,660),r.between(80,245)),side:r.sign(),curve:r.sign(),minor:true});
    }
    return axes.map((v,i)=>{
      const a=v.a,d=v.d,dx=d.x-a.x,dy=d.y-a.y;
      const norm=M.normal(M.unit({x:dx,y:dy}));
      // Bend the artery around the central initial rather than through it.
      const approach=(a.x+d.x)*.5;
      const preferred=approach<f.x?-1:1;
      const bend=(r.between(55,145)*v.curve)+preferred*r.between(10,45);
      const b=clampPt(P(a.x+dx*.23+norm.x*bend,a.y+dy*.23+norm.y*bend),bnd);
      const c=clampPt(P(a.x+dx*.74+norm.x*bend*r.between(.85,1.4),a.y+dy*.74+norm.y*bend*r.between(.85,1.4)),bnd);
      return {...v,a,b,c,d,width:v.minor?r.between(9,12):r.between(12,20),major:!v.minor&&i<2,id:i+1,box:curveBox(a,b,c,d)};
    });
  }
  function allocateCartouches(stems,focal,mode,r){
    const cells=[];
    const n=mode==='interlace'?2:mode==='letter'?1:r.chance(.65)?1:2;
    const candidates=[];
    stems.forEach((stem,i)=>{
      for(const t of [.27,.55,.78]){
        const pos=M.bezier(stem.a,stem.b,stem.c,stem.d,t),tan=M.tangent(stem.a,stem.b,stem.c,stem.d,t),norm=M.normal(tan);
        for(const side of [stem.side,-stem.side]){
          const gap=r.between(65,110);
          candidates.push({x:pos.x+norm.x*side*gap,y:pos.y+norm.y*side*gap,stem:i,at:pos,rotation:r.between(-17,17)});
        }
      }
    });
    r.shuffle(candidates).forEach(c=>{
      if(cells.length>=n)return;
      c.x=M.clamp(c.x,125,720);c.y=M.clamp(c.y,128,878);
      const rx=r.between(mode==='interlace'?75:44,mode==='interlace'?115:70),ry=r.between(mode==='interlace'?90:50,mode==='interlace'?128:82);
      const dx=(c.x-focal.x)/(focal.rx+rx*.68),dy=(c.y-focal.y)/(focal.ry+ry*.68);
      if(dx*dx+dy*dy<1.1)return;
      if(cells.some(v=>Math.hypot(v.x-c.x,v.y-c.y)<Math.max(v.rx+rx,v.ry+ry)*.86))return;
      cells.push({...c,rx,ry});
    });
    // If spacing is especially tight, omit the compartment instead of forcing
    // it to overlap the main letter or another cartouche.
    return cells;
  }
  M.plan=(s,r)=>{
    const mode=s.mode||'botanical',layout=r.choose(layouts);
    const center=mode==='letter'?P(r.between(348,498),r.between(450,593)):
      mode==='interlace'?P(r.between(324,470),r.between(420,590)):
      P(r.between(343,502),r.between(420,590));
    const glyphSize=mode==='letter'?r.between(325,415):mode==='interlace'?r.between(180,247):r.between(248,320);
    const focal={x:center.x,y:center.y,rx:glyphSize*.43,ry:glyphSize*.53};
    const stems=makeStems(focal,mode,layout,r),compartments=allocateCartouches(stems,focal,mode,r);
    return {mode,layout,bounds:box(45,45,760,915),center,glyphSize,focal,stems,compartments,
      // Old property retained for compatibility with third-party experiments.
      knots:compartments.map((c,id)=>({...c,scale:Math.min(c.rx,c.ry)/280,id})),
      weaveStem:stems.length?r.int(0,stems.length-1):0};
  };
})(window.MS);

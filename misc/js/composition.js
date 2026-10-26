/* Botanical-only composition planner. Every layout changes the actual growth
   axes, root count and curve structure; nothing reserves room for letters.
   Pass 5: stronger specimen hierarchy, cleaner framing, and more authored
   silhouettes so outputs feel composed rather than merely procedural. */
window.MS=window.MS||{};
((M)=>{
  'use strict';
  const P=(x,y)=>({x,y}),box=(x,y,w,h)=>({x,y,w,h});
  const clampPt=(p,b)=>P(M.clamp(p.x,b.x,b.x+b.w),M.clamp(p.y,b.y,b.y+b.h));
  const STAGE=box(62,54,726,888);
  function curveBox(a,b,c,d){
    const pts=M.wave(a,b,c,d,34),x=pts.map(p=>p.x),y=pts.map(p=>p.y),padding=78;
    return box(Math.min(...x)-padding,Math.min(...y)-padding,Math.max(...x)-Math.min(...x)+padding*2,Math.max(...y)-Math.min(...y)+padding*2);
  }
  function axis(a,d,side,id,r,opts={}){
    const dx=d.x-a.x,dy=d.y-a.y,normal=M.normal(M.unit({x:dx,y:dy}));
    const bend=opts.bend??r.between(72,154);
    const sign=side;
    const first=(opts.first??.66)*bend*sign;
    const second=(opts.second??r.choose([-.82,.62,1.07]))*bend*sign;
    const b=clampPt(P(a.x+dx*.27+normal.x*first,a.y+dy*.26+normal.y*first),STAGE);
    const c=clampPt(P(a.x+dx*.73+normal.x*second,a.y+dy*.74+normal.y*second),STAGE);
    return {
      id,a,b,c,d,side,
      major:opts.major!==false,
      width:opts.major===false?r.between(7,11):r.between(12,20),
      box:curveBox(a,b,c,d),
      character:opts.character||'wandering',
      emphasis:opts.emphasis||1
    };
  }
  const designs={
    single(r){
      const root=P(r.between(290,405),r.between(900,946));
      const tip=P(r.between(395,565),r.between(104,198));
      return [
        axis(root,tip,r.chance(.55)?1:-1,1,r,{bend:r.between(134,212),first:r.between(.88,1.18),second:r.between(-1.02,-.62),character:'hero',emphasis:1.35})
      ];
    },
    crescent(r){
      const leftRoot=P(r.between(130,210),r.between(892,944));
      const rightRoot=P(r.between(618,710),r.between(900,952));
      return [
        axis(leftRoot,P(r.between(300,420),r.between(144,268)),1,1,r,{first:1.07,second:-.54,bend:r.between(106,172),character:'hero',emphasis:1.18}),
        axis(rightRoot,P(r.between(500,672),r.between(152,294)),-1,2,r,{first:.82,second:-.94,bend:r.between(96,162),character:'support',emphasis:.94})
      ];
    },
    diagonal(r){
      return [
        axis(P(r.between(126,210),r.between(858,938)),P(r.between(612,740),r.between(114,194)),1,1,r,{first:.92,second:-.82,bend:r.between(98,164),character:'sweep',emphasis:1.16}),
        axis(P(r.between(644,734),r.between(904,960)),P(r.between(272,400),r.between(310,468)),-1,2,r,{major:false,first:.92,second:-1.02,bend:r.between(92,152),character:'echo',emphasis:.78})
      ];
    },
    radiating(r){
      const root=P(r.between(350,446),r.between(792,910));
      const destinations=[[126,256],[332,124],[560,146],[734,334]];
      return Array.from({length:4},(_,i)=>{
        const [tx,ty]=destinations[i];
        return axis(
          P(root.x+r.between(-28,28),root.y+r.between(-20,20)),
          P(tx+r.between(-44,44),ty+r.between(-44,44)),
          i<2?-1:1,
          i+1,
          r,
          {major:i<2,bend:r.between(66,122),first:r.between(.92,1.12),second:r.between(-.92,-.58),character:i===1?'hero':'crown',emphasis:i===1?1.2:.92}
        );
      });
    },
    meander(r){
      return [
        axis(P(r.between(108,190),r.between(864,946)),P(r.between(528,684),r.between(138,224)),1,1,r,{first:1.42,second:-1.22,bend:r.between(138,220),character:'meander',emphasis:1.18}),
        axis(P(r.between(636,728),r.between(914,968)),P(r.between(392,566),r.between(256,418)),-1,2,r,{major:false,first:-1.28,second:1.14,bend:r.between(98,172),character:'counter',emphasis:.82})
      ];
    },
    cluster(r){
      const center=P(r.between(350,462),r.between(782,890));
      const tips=[[150,276],[344,126],[532,166],[706,378]];
      return Array.from({length:4},(_,i)=>{
        const [x,y]=tips[i];
        return axis(
          P(center.x+r.between(-54,54),center.y+r.between(-34,38)),
          P(x+r.between(-50,50),y+r.between(-48,48)),
          i%2?1:-1,
          i+1,
          r,
          {major:i<2,bend:r.between(78,136),first:r.between(.96,1.15),second:r.between(-.86,-.46),character:i===0?'hero':'thicket',emphasis:i===0?1.18:.88}
        );
      });
    }
  };

  const speciesAffinities={
    holly:['single','crescent','radiating'],
    hazel:['crescent','cluster','single'],
    ivy:['meander','diagonal','crescent'],
    hawthorn:['radiating','cluster','crescent'],
    oak:['single','radiating','cluster'],
    dogrose:['crescent','single','cluster'],
    honeysuckle:['meander','diagonal','crescent'],
    bramble:['cluster','crescent','diagonal'],
    fern:['radiating','single','crescent'],
    acanthus:['single','radiating','meander'],
    hybrid:['single','crescent','meander']
  };
  const surpriseLayouts=['single','crescent','single','meander','radiating','single','cluster','crescent','diagonal'];

  function displayedStems(stems,layout){
    const limits={single:1,crescent:2,diagonal:2,meander:2,radiating:4,cluster:4};
    if(layout==='single')return [stems.find(st=>st.major)||stems[0]].filter(Boolean);
    return stems.slice(0,limits[layout]||stems.length);
  }
  function stemLayoutScore(stems){
    if(!stems||!stems.length)return -1e9;
    const all=[];
    stems.forEach(st=>{ (M.wave(st.a,st.b,st.c,st.d,26)||[]).forEach(p=>all.push(p)); });
    const xs=all.map(p=>p.x), ys=all.map(p=>p.y);
    const minX=Math.min(...xs), maxX=Math.max(...xs), minY=Math.min(...ys), maxY=Math.max(...ys);
    const w=maxX-minX, h=maxY-minY, cx=(minX+maxX)/2, cy=(minY+maxY)/2;
    const area=(w*h)/(STAGE.w*STAGE.h);
    const centerPenalty=Math.abs(cx-(STAGE.x+STAGE.w/2))/STAGE.w + Math.abs(cy-(STAGE.y+STAGE.h*0.48))/STAGE.h;
    const targetArea=.22;
    const areaPenalty=Math.abs(area-targetArea)*2.8;
    const aspectPenalty=Math.abs((h/Math.max(1,w))-1.55)*.22;
    const spreadBonus=Math.min(1.1,w/430)+Math.min(1.0,h/710);
    // Avoid preferring an ostensibly broad crown made of axes that will be
    // discarded by the chosen growth mode. Distinct trunks get a small bonus.
    const breadthPenalty=Math.max(0,320-w)/220;
    const majorBonus=stems.filter(st=>st.major).length*.12;
    const activeBonus=Math.min(3,stems.length-1)*.23;
    return spreadBonus + majorBonus + activeBonus - centerPenalty - areaPenalty - aspectPenalty - breadthPenalty;
  }
  function pickNaturals(s,selection,architectureSpecies){
    const list=Object.keys(designs);
    const preferred=(speciesAffinities[s.species]||surpriseLayouts).filter(v=>list.includes(v));
    const explicit=list.includes(s.pattern)&&s.pattern!=='random';
    const layouts=explicit ? [selection] : [...new Set([selection,...preferred])].slice(0,4);
    const candidates=[];
    layouts.forEach((layout,layoutIndex)=>{
      for(let i=0;i<3;i++){
        const rr=M.rng(M.childSeed(Number(s.seed)>>>0||1,0x71f200 + layoutIndex*37 + i*101));
        const natural=(M.makeSpeciesAxes && M.makeSpeciesAxes(architectureSpecies,layout,rr)) || designs[layout](rr);
        const actual=displayedStems(natural,layout);
        candidates.push({layout,stems:natural,score:stemLayoutScore(actual)});
      }
    });
    candidates.sort((a,b)=>b.score-a.score);
    return candidates[0] || {layout:selection,stems:designs[selection](M.rng(M.childSeed(Number(s.seed)>>>0||1,1901)))};
  }

  M.plan=(s,r)=>{
    if(s.drawnPaths?.length){
      const stems=M.drawnStems(s.drawnPaths,r);
      if(stems.length)return {mode:'botanical',layout:'hand-drawn',structure:'hand-drawn',
        construction:null,conform:0,bounds:box(8,8,M.W-16,M.H-16),
        focal:{x:-10000,y:-10000,rx:1,ry:1},stems,knots:[],compartments:[],weaveStem:-1};
    }
    const list=Object.keys(designs);
    const preferred=speciesAffinities[s.species]||surpriseLayouts;
    const selection=list.includes(s.pattern)&&s.pattern!=='random'
      ? s.pattern
      : r.choose([...preferred,...surpriseLayouts]);

    const architectureSpecies=s.species==='random'
      ? r.choose(['dogrose','honeysuckle','hazel','bramble','hawthorn','ivy','holly'])
      : s.species;
    const best=pickNaturals(s,selection,architectureSpecies);
    const selectionResolved=best.layout||selection;
    const natural=best.stems;
    const construction=M.constructGuides(s.geometry||'random',r);
    const amount=M.clamp(Number(s.conform??55)/100,0,1);
    const chosen=displayedStems(natural,selectionResolved);
    const topologyRails={
      single:[0], crescent:[0,1], diagonal:[0,2],
      meander:[2,0], radiating:[0,1,2,3,4], cluster:[2,0,1,4,3]
    };
    const route=topologyRails[selectionResolved]||topologyRails.single;
    const guideRails=chosen.map((source,i)=>{
      const sourceRail=construction.rails[route[i%route.length]%construction.rails.length];
      const copy=Math.floor(i/construction.rails.length);
      const sway=source.side||((i%2)?-1:1);
      return sourceRail.map((p,j)=>{
        const t=j/(Math.max(1,sourceRail.length-1));
        const xOffset=copy*18*sway + (selectionResolved==='cluster'?sway*10*Math.sin(Math.PI*t):0);
        const yOffset=copy*14 + (selectionResolved==='single'?-18*Math.max(0,.35-t):0);
        return {x:M.clamp(p.x+xOffset,70,780),y:M.clamp(p.y+yOffset,66,938)};
      });
    });
    construction.rails=guideRails;
    const stems=chosen.map((source,i)=>({
      ...source,
      id:i+1,
      side:source.side||((i%2)?-1:1),
      guidePoints:guideRails[i],
      naturalPoints:M.wave(source.a,source.b,source.c,source.d,100),
      guideAmount:amount,
      guideIndex:i
    }));
    return {mode:'botanical',layout:selectionResolved,structure:construction.name,construction,conform:amount,
      bounds:box(54,58,742,894),focal:{x:-10000,y:-10000,rx:1,ry:1},
      stems,knots:[],compartments:[],weaveStem:-1};
  };
})(window.MS);

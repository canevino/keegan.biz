/* Botanical ornament — v9 / pass 1.
   A tapering, sampled Bézier skeleton carries primary shoots, fine ramifications,
   acanthus and lanceolate leaves, vein engraving, curls and tiny flower clusters.
   All parts share the same plant geometry; nothing is scattered across the page.
   Requires core.js, pigment.js and finish.js; no new dependencies. */
window.MS=window.MS||{};
((M)=>{
  'use strict';
  const pt=(x,y)=>({x,y});
  const add=(a,b,k=1)=>pt(a.x+b.x*k,a.y+b.y*k);
  const dir=a=>Math.atan2(a.y,a.x);
  const polar=(a,d)=>pt(Math.cos(a)*d,Math.sin(a)*d);
  const signed=(n)=>M.n(n);
  const vec=(p)=>M.vec(p.x,p.y);
  const clamp=M.clamp;

  // Point-to-point proximity is only a soft exclusion. Small shoots may touch
  // the initial or knotwork, but large leaves should not obscure their centers.
  function permitted(p,plan,margin=0){
    return M.inBounds(p,plan.bounds,margin) && !M.insideEllipse(p,plan.focal,.90);
  }

  // Slight lateral growth along the plan's primary Bézier, recomputing the
  // tangent from the displaced points. This avoids long straight-looking poles
  // while preserving endpoints and the composition planner's intended routing.
  function organicSpine(stem,r){
    const origin=M.wave(stem.a,stem.b,stem.c,stem.d,100),
      chord=M.unit(pt(stem.d.x-stem.a.x,stem.d.y-stem.a.y)),
      normal=M.normal(chord),
      amp=r.between(12,32)*(stem.major?1:.85),
      phase=r.between(-.6,.6);
    const pts=origin.map(v=>{
      const envelope=Math.sin(Math.PI*v.t);
      const sway=amp*envelope*(.68*Math.sin(2*Math.PI*v.t+phase)+.32*Math.sin(3.5*Math.PI*v.t-phase));
      return {...v,x:v.x+normal.x*sway,y:v.y+normal.y*sway};
    });
    for(let i=0;i<pts.length;i++){
      const a=pts[Math.max(0,i-1)],b=pts[Math.min(pts.length-1,i+1)];
      pts[i].tng=M.unit(pt(b.x-a.x,b.y-a.y));
    }
    return pts;
  }

  // Tube formed by the two sides of a sampled curve. Width changes continuously
  // along its actual tangent/normal; this is a closed filled path, not a stroke.
  function stemOutline(samples,rootWidth,tipWidth=.55,opts={}){
    const left=[],right=[],phase=opts.phase||0;
    for(const v of samples){
      const t=v.t;
      const normal=M.normal(v.tng);
      const taper=(1-t)**(opts.exponent||1.18);
      const minor=1 + (.027*Math.sin(19*t+phase)+.016*Math.sin(43*t+phase*.9))*Math.sin(Math.PI*t);
      let width=(tipWidth+(rootWidth-tipWidth)*taper)*minor;
      // Rounded instead of square-cut ends, without sacrificing a broad root.
      if(t<.015 && opts.roundRoot)width*=.88+.12*t/.015;
      left.push(add(v,normal,width*.5));
      right.push(add(v,normal,-width*.5));
    }
    return M.poly(left.concat(right.reverse()));
  }

  function cubicFromAnchor(base,tangent,length,side,r,turn=.96){
    const a=dir(tangent),out=a+side*turn;
    const goal=add(base,polar(out,length));
    const c1=add(base,polar(a+side*.32,length*.38));
    const c2=add(goal,polar(out+side*r.between(-.35,.30)+Math.PI,length*.43));
    return {a:base,b:c1,c:c2,d:goal};
  }

  function stemDetails(samples,baseWidth,pal,r,complexity){
    if(complexity<.04)return '';
    let out='';
    const step=(a)=>Math.max(1,Math.min(samples.length-1,Math.round(a*(samples.length-1))));
    const l=[];
    for(let i=step(.065);i<step(.82);i+=2){
      const v=samples[i],n=M.normal(v.tng),w=(.55+baseWidth*(1-v.t)**1.18)*.17;
      l.push(add(v,n,-w));
    }
    if(l.length>1){
      const d=l.map((v,i)=>(i?'L':'M')+vec(v)).join('');
      out+=M.path(d,M.mix(pal.ochre,pal.light,.28),Math.max(.42,baseWidth*.062),`opacity="${signed(.22+.19*complexity)}"`);
    }
    const count=Math.round((2+baseWidth*.32)*(.40+complexity*.70));
    for(let i=0;i<count;i++){
      const t=r.between(.085,.78),v=samples[step(t)],n=M.normal(v.tng);
      const width=(.65+baseWidth*(1-t)**1.18)*.35;
      const x=add(v,n,-width*.7),to=add(x,v.tng,r.between(1.2,4.3));
      out+=M.path(`M${vec(x)}L${vec(to)}`,r.choose([pal.ink,pal.ochre,pal.light]),r.between(.24,.67),`opacity="${signed(r.between(.20,.5))}"`);
    }
    return out;
  }

  function leafKind(r,large){
    return large?r.choose(['acanthus','acanthus','acanthus','lance','trumpet']):r.choose(['lance','lance','lance','mini-acanthus']);
  }

  // Leaf coordinates are LOCAL: the petiole is (0,0), and the leaf grows toward +X.
  // Its attachment angle is applied only once by leafAt().
  function leafSilhouette(length,kind,r){
    const l=length,asym=r.between(.89,1.12);
    const h=l*r.between(.29,.40);
    const U=(x,y)=>M.vec(x*l,y*h);
    const D=(x,y)=>M.vec(x*l,y*h*asym);
    if(kind==='lance'){
      return `M0 0 C${U(.12,-.46)} ${U(.51,-1.32)} ${U(.82,-.68)} Q${U(.94,-.40)} ${U(1,0)} `+
        `Q${D(.82,.49)} ${D(.56,.78)} C${D(.36,.9)} ${D(.12,.58)} 0 0 Z`;
    }
    if(kind==='trumpet'){
      return `M0 0 Q${U(.20,-.47)} ${U(.27,-.49)} `+
        `C${U(.30,-1.12)} ${U(.58,-1.34)} ${U(.73,-.88)} `+
        `Q${U(.76,-.48)} ${U(.94,-.28)} Q${U(1.06,-.08)} ${U(.98,.12)} `+
        `Q${D(.87,.13)} ${D(.82,.25)} C${D(.64,.82)} ${D(.42,.97)} 0 0 Z`;
    }
    // Deeply lobed, notched acanthus. Unlike a generic star, every upper/lower
    // lobe grows along the same midrib, with narrowing lateral excursions.
    const mod=kind==='mini-acanthus'?.78:1;
    return `M0 0 `+
      `C${U(.055,-.29*mod)} ${U(.125,-.67*mod)} ${U(.19,-.78*mod)} `+
      `Q${U(.17,-1.14*mod)} ${U(.29,-1.23*mod)} `+
      `Q${U(.295,-.66*mod)} ${U(.395,-.59*mod)} `+
      `Q${U(.445,-1.26*mod)} ${U(.55,-1.06*mod)} `+
      `Q${U(.52,-.56*mod)} ${U(.635,-.49*mod)} `+
      `Q${U(.73,-.94*mod)} ${U(.80,-.65*mod)} `+
      `Q${U(.79,-.28*mod)} ${U(1,0)} `+
      `Q${D(.815,.31*mod)} ${D(.81,.58*mod)} `+
      `Q${D(.73,.94*mod)} ${D(.645,.52*mod)} `+
      `Q${D(.51,.55*mod)} ${D(.555,1.03*mod)} `+
      `Q${D(.43,1.20*mod)} ${D(.388,.65*mod)} `+
      `Q${D(.28,.64*mod)} ${D(.29,1.12*mod)} `+
      `Q${D(.16,1.08*mod)} ${D(.18,.72*mod)} `+
      `Q${D(.075,.40*mod)} 0 0 Z`;
  }

  function leafEngraving(length,kind,pal,r,detail){
    if(detail<=0)return '';
    const l=length,ink=M.mix(pal.ink,pal.green,.12),mid=M.mix(pal.ink,pal.ochre,.15);
    let z=M.path(`M0 0 Q${M.vec(l*.46,-l*.065)} ${M.vec(l*.95,0)}`,ink,Math.max(.38,l*.022),`opacity="${signed(.45+.3*detail)}"`);
    if(length<12)return z;
    const veins=(kind==='acanthus'||kind==='mini-acanthus')?[.23,.41,.57,.74]:[.28,.46,.66];
    for(const a of veins){
      const x=l*a,rh=(1-a)*l*(kind==='lance'?.22:.29);
      for(const sign of [-1,1]){
        z+=M.path(`M${M.vec(x,-l*.025)} Q${M.vec(x+l*.065,sign*rh*.72)} ${M.vec(x+l*.11,sign*rh)}`,mid,Math.max(.32,l*.012),`opacity="${signed(.3+.34*detail)}"`);
      }
    }
    if(kind==='acanthus'&&detail>.40){
      for(let i=0;i<4;i++){
        const x=l*(.25+i*.14),cy=r.between(-.08,.08)*l;
        z+=M.path(`M${M.vec(x,cy)}l${M.vec(l*.045,l*.05)}`,pal.ink,.38,`opacity="${signed(r.between(.2,.36)*detail)}"`);
      }
    }
    if(detail>.52 && length>19){
      // Short parallel scratches resemble engraved or dry-brushed relief,
      // NOT uniform digital shading. They live inside the leaf clip path.
      for(let i=0;i<Math.round(2+detail*6);i++){
        const x=l*r.between(.16,.78),y=l*r.between(-.11,.11);
        z+=M.path(`M${M.vec(x,y)}l${M.vec(l*r.between(.02,.08),l*r.between(-.06,.04))}`,r.choose([pal.ink,pal.light,pal.ochre]),r.between(.27,.6),`opacity="${signed(r.between(.10,.28))}"`);
      }
    }
    return z;
  }

  function leafAt(at,rot,len,pal,r,s,opts={}){
    const big=opts.large ?? len>29;
    const kind=opts.kind||leafKind(r,big);
    const d=leafSilhouette(len,kind,r);
    const isGreen=r.chance(.44);
    const primary=opts.primaryColor|| (isGreen
      ? M.mix(pal.green,pal.ochre,r.between(.04,.22))
      : r.choose([pal.lapis,pal.vermillion,pal.green,M.mix(pal.green,pal.ink,.24)]));
    const detail=M.clamp(s.detail/100,0,1);
    const darkEdge=M.mix(pal.ink,primary,.16);
    let content=M.shape(d,primary,`stroke="${darkEdge}" stroke-width="${signed(big?.88:.70)}" stroke-linejoin="round"`);
    if(big){
      // Only large leaves require a unique clipping path for inside-the-leaf
      // pigment and engraved hatching. Small folioles use simple SVG shapes.
      const id=`fol-${r.int(100000,999999999)}`;
      content+=`<defs><clipPath id="${id}"><path d="${d}"/></clipPath></defs>`;
      content+=`<g clip-path="url(#${id})">`;
      content+=M.shape(d,pal.light,`opacity=".055" transform="translate(${signed(len*.04)} ${signed(-len*.032)})"`);
      if(s.pigment>9)content+=M.shape(d,'url(#speckle)',`opacity="${signed(.12+s.pigment*.0026)}"`);
      content+=leafEngraving(len,kind,pal,r,.22+detail*.8);
      content+='</g>';
    } else {
      content+=leafEngraving(len,kind,pal,r,.15+detail*.60);
    }
    if(big&&r.chance(.37)){
      // A two-tone rim gives thicker historic ink edges without a shiny bevel.
      content+=M.path(`M${M.vec(len*.18,-len*.09)}q${M.vec(len*.21,-len*.07)} ${M.vec(len*.31,-len*.035)}`,M.mix(primary,pal.ochre,.25),.65,'opacity=".42"');
    }
    return `<g transform="translate(${vec(at)}) rotate(${signed(rot*180/Math.PI)})">${content}</g>`;
  }

  function terminalScroll(at,direction,radius,pal,r,opts={}){
    // Curved, tapering terminal. Its first point touches the branch end.
    const turn=r.between(1.25,2.1)*2*Math.PI;
    const sign=opts.side||r.sign();
    const steps=32,pts=[];
    const center=add(at,polar(direction+sign*Math.PI*.5,radius*.55));
    for(let i=0;i<=steps;i++){
      const t=i/steps,a=direction-sign*Math.PI*.60+sign*t*turn;
      const rr=radius*(1-.94*t);
      pts.push(pt(center.x+rr*Math.cos(a),center.y+rr*Math.sin(a)));
    }
    pts[0]=at;
    const d=pts.map((q,i)=>(i?'L':'M')+vec(q)).join('');
    const line=r.choose([pal.ink,pal.vermillion,pal.green]);
    return M.path(d,line,r.between(.68,1.35),`opacity="${signed(r.between(.68,.96))}"`)+
      M.circle(pts[pts.length-1].x,pts[pts.length-1].y,r.between(.5,1.2),pal.ochre);
  }

  function berryRosette(at,size,pal,r,detail){
    const petals=r.choose([4,5,6]),cols=[pal.vermillion,pal.lapis,M.mix(pal.ochre,pal.green,.45)];
    let z='';
    for(let i=0;i<petals;i++){
      const a=2*Math.PI*i/petals+ r.between(-.055,.055),
        rad=size*.5,center=add(at,polar(a,rad));
      z+=`<ellipse cx="${signed(center.x)}" cy="${signed(center.y)}" rx="${signed(size*.22)}" ry="${signed(size*.55)}" transform="rotate(${signed(a*180/Math.PI+90)} ${signed(center.x)} ${signed(center.y)})" fill="${cols[i%cols.length]}" stroke="${pal.ink}" stroke-width=".60"/>`;
      if(detail>.46)z+=M.path(`M${vec(add(at,polar(a,size*.38)))}L${vec(add(at,polar(a,size*.78)))}`,pal.ink,.36,'opacity=".38"');
    }
    z+=M.circle(at.x,at.y,size*.19,pal.ochre,`stroke="${pal.ink}" stroke-width=".55"`);
    if(detail>.38){
      for(let i=0;i<petals;i++){
        const p=add(at,polar(2*Math.PI*i/petals,size*1.15));
        z+=M.circle(p.x,p.y,.75,pal.ink,`opacity=".62"`);
      }
    }
    return z;
  }

  function bud(at,ang,size,pal,r,s){
    const stalkEnd=add(at,polar(ang,size*.45));
    let z=M.path(`M${vec(at)}L${vec(stalkEnd)}`,M.mix(pal.green,pal.ink,.3),.6);
    const d=leafSilhouette(size*.85,'lance',r);
    z+=`<g transform="translate(${vec(stalkEnd)}) rotate(${signed(ang*180/Math.PI)})">`+
      M.shape(d,r.choose([pal.lapis,pal.vermillion,pal.green]),`stroke="${pal.ink}" stroke-width=".54"`)+
      M.path(`M0 0 L${M.vec(size*.7,0)}`,pal.ink,.38,'opacity=".55"')+'</g>';
    return z;
  }

  // Secondary twig: curved, narrow, and carrying only one to three folioles.
  function secondaryTwig(on,tangent,side,len,plan,s,r,pal){
    const c=cubicFromAnchor(on,tangent,len,side,r,r.between(.72,1.20));
    if(!permitted(c.d,plan,8))return '';
    const samples=M.wave(c.a,c.b,c.c,c.d,18),outline=stemOutline(samples,r.between(1.6,3.2),.24,{roundRoot:true});
    let z=M.shape(outline,M.mix(pal.green,pal.ink,.33),`stroke="${pal.ink}" stroke-width=".35"`);
    for(const t of [.34,.70]){
      const p=samples[Math.round(t*18)],ang=dir(p.tng)+side*r.between(.48,.98);
      const l=len*r.between(.28,.45),probe=add(p,polar(ang,l*.8));
      if(permitted(probe,plan,6))z+=leafAt(p,ang,l,pal,r,s,{large:false});
    }
    if(r.chance(.42))z+=terminalScroll(c.d,dir(samples[18].tng),r.between(3.8,7.5),pal,r,{side});
    else if(r.chance(.25))z+=bud(c.d,dir(samples[18].tng),r.between(6,10),pal,r,s);
    return z;
  }

  function primaryShoot(at,tangent,side,len,plan,s,r,pal,index){
    const turn=r.between(.76,1.17);
    let c=cubicFromAnchor(at,tangent,len,side,r,turn);
    // Try redirecting a branch before discarding it when it approaches a focal
    // element. Shorter branches emerge naturally near the letter rather than
    // generating leaves over the letter's body.
    for(let k=0;k<3 && !permitted(c.d,plan,8);k++){
      len*=.74;
      c=cubicFromAnchor(at,tangent,len,side,r,turn);
    }
    if(len<34||!permitted(c.d,plan,8))return '';
    const samples=M.wave(c.a,c.b,c.c,c.d,34),width=r.between(3.3,6.7)*Math.max(.58,Math.min(1.12,len/100));
    const d=stemOutline(samples,width,.45,{roundRoot:true,phase:index*.37});
    let out=M.shape(d,M.mix(pal.green,pal.ink,.37),`stroke="${pal.ink}" stroke-width=".5"`);
    if(r.chance(.56))out+=stemDetails(samples,width,pal,r,M.clamp(s.detail/100,0,1));
    // Large acanthus and smaller leaflets alternate but use the actual shoot
    // tangent. These are not separately rotated a second time.
    const richness=s.foliage/100;
    const leafTs=richness<.24?[.37,.77]:richness<.64?[.22,.48,.76]:[.18,.38,.61,.84];
    leafTs.forEach((t,j)=>{
      const q=samples[Math.round(t*34)],
        sign=(j%2===0 ? -1 : 1)*side,
        a=dir(q.tng)+sign*r.between(.69,1.24),
        size=len*r.between(j===leafTs.length-1?.28:.33,.57)*(1-.16*t),
        test=add(q,polar(a,size*.82));
      if(permitted(test,plan,8))out+=leafAt(q,a,size,pal,r,s,{large:size>=24});
    });
    if(richness>.32 && r.chance(.56+.26*richness)){
      // One fine ramification per major shoot, not uncontrolled recursion.
      const t=r.between(.40,.64),q=samples[Math.round(t*34)];
      out+=secondaryTwig(q,q.tng,-side,len*r.between(.34,.57),plan,s,r,pal);
    }
    const tipAngle=dir(samples[samples.length-1].tng);
    if(r.chance(.24))out+=berryRosette(c.d,r.between(5.2,10),pal,r,s.detail/100);
    else if(r.chance(.66))out+=terminalScroll(c.d,tipAngle,r.between(6,13),pal,r,{side});
    else out+=bud(c.d,tipAngle,r.between(7,12),pal,r,s);
    return out;
  }

  function mainEnd(at,tangent,pal,r,s){
    const a=dir(tangent),side=r.sign(),len=r.between(30,60),
      tip=add(at,polar(a+side*.33,len));
    // Fine continuation completes the main stem; avoids an abrupt, chopped tip.
    const b=add(at,polar(a,len*.34)),c=add(tip,polar(a+side*.4,-len*.28));
    const w=M.wave(at,b,c,tip,26);
    let out=M.shape(stemOutline(w,3.1,.22),M.mix(pal.green,pal.ink,.4),`stroke="${pal.ink}" stroke-width=".40"`);
    const anchor=w[14],leafA=dir(anchor.tng)+side*1.05;
    out+=leafAt(anchor,leafA,r.between(18,26),pal,r,s,{large:false});
    out+=terminalScroll(tip,dir(w[26].tng),r.between(9,17),pal,r,{side});
    return out;
  }

  M.botanical=(plan,s,r)=>{
    if(s.foliage<=0)return '';
    const pal=s.pal,foliage=M.clamp(s.foliage/100,0,1);
    let result='';
    const stems=plan.stems.slice(0,foliage<.12?1:plan.stems.length);
    for(const stem of stems){
      const samples=organicSpine(stem,r),baseWidth=stem.width*r.between(.99,1.22);
      const d=stemOutline(samples,baseWidth,1.25,{roundRoot:true,phase:stem.id});
      const bark=M.mix(pal.green,pal.ink,r.between(.38,.57));
      let body=M.painted(`bark-${stem.id}`,d,bark,stem.box,s,r,{stroke:.72,lightweight:true});
      body+=stemDetails(samples,baseWidth,pal,r,M.clamp(s.detail/100,0,1));
      // The foremost silhouette grows from the thickest root; side shoots are
      // organized along the natural arc-length, with randomized spacing.
      const count=stem.major?Math.round(6+foliage*11):Math.round(4+foliage*8);
      const nodes=[];
      for(let j=0;j<count;j++){
        const t=clamp(.10+(j+.55)*.78/count+r.between(-.013,.013),.08,.91);
        nodes.push(t);
      }
      nodes.forEach((t,i)=>{
        const q=samples[Math.round(t*100)],side=(i%2===0?stem.side:-stem.side)*(r.chance(.12)?-1:1),
          length=r.between(stem.major?84:61,stem.major?145:118)*(1-.17*t);
        body+=primaryShoot(q,q.tng,side,length,plan,s,r,pal,i);
        if(s.detail>42 && r.chance(.17)){
          const l=r.between(13,21),a=dir(q.tng)-side*r.between(.65,1.15),v=add(q,polar(a,l));
          if(permitted(v,plan,7))body+=leafAt(q,a,l,pal,r,s,{large:false});
        }
      });
      // The root is hidden under paired broad acanthus lobes and penwork, instead
      // of ending as a hard diagonal cut. The main continuation remains thin.
      const root=samples[5],rootDir=dir(root.tng);
      // A backwards-pointing basal acanthus caps the root instead of leaving
      // an exposed flat cut at the beginning of an otherwise organic stem.
      const baseAngle=dir(samples[0].tng)+Math.PI+r.between(-.18,.18);
      body+=leafAt(samples[0],baseAngle,r.between(34,54),pal,r,s,{large:true,kind:'acanthus'});
      for(const sign of [-1,1]){
        const ra=rootDir+sign*r.between(.88,1.35),l=r.between(35,64),tip=add(root,polar(ra,l*.8));
        if(permitted(tip,plan,4))body+=leafAt(root,ra,l,pal,r,s,{large:true,kind:'acanthus'});
      }
      if(r.chance(.53))body+=terminalScroll(samples[0],rootDir+Math.PI,r.between(7,13),pal,r,{side:r.sign()});
      body+=mainEnd(samples[100],samples[100].tng,pal,r,s);
      // One filter per whole plant: faster and visually more cohesive than a
      // separate turbulence filter on each of its many leaves.
      result+=`<g filter="url(#press)">${body}</g>`;
    }
    return result;
  };
})(window.MS);

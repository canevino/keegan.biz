/* Botanical ornament — v10 / pass 2.
   Focus of this pass:
   - more bendy, less pole-like stems
   - cleaner bud attachment and terminal curls
   - leaf attachments pushed to the stem edge so they do not sit oddly behind branches
   - slightly more manuscript-like routing, especially on the main artery
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

  function permitted(p,plan,margin=0){
    return M.inBounds(p,plan.bounds,margin) && !M.insideEllipse(p,plan.focal,.90);
  }

  function localWidth(rootWidth,tipWidth,t,exponent=1.18){
    return tipWidth+(rootWidth-tipWidth)*(1-t)**exponent;
  }

  // Displace a sampled curve along its own local normals, not the chord normal.
  // This produces a more botanical, less pole-like motion.
  function undulate(samples,r,opts={}){
    const amp=opts.amp||18;
    const phase=opts.phase||0;
    const f1=opts.f1||2.1;
    const f2=opts.f2||4.4;
    const f3=opts.f3||6.8;
    const power=opts.power||1.1;
    const out=samples.map(v=>{
      const normal=M.normal(v.tng);
      const env=Math.sin(Math.PI*v.t)**power;
      const sway=env*amp*(
        0.58*Math.sin(f1*Math.PI*v.t+phase)+
        0.30*Math.sin(f2*Math.PI*v.t-phase*1.35)+
        0.18*Math.sin(f3*Math.PI*v.t+phase*0.6)
      );
      return {...v,x:v.x+normal.x*sway,y:v.y+normal.y*sway};
    });
    for(let i=0;i<out.length;i++){
      const a=out[Math.max(0,i-1)],b=out[Math.min(out.length-1,i+1)];
      out[i].tng=M.unit(pt(b.x-a.x,b.y-a.y));
    }
    return out;
  }

  function organicSpine(stem,r){
    const origin=M.wave(stem.a,stem.b,stem.c,stem.d,100);
    return undulate(origin,r,{
      amp:r.between(stem.major?18:11,stem.major?42:24),
      phase:r.between(-1.2,1.2),
      f1:r.between(1.7,2.5),
      f2:r.between(3.8,5.4),
      f3:r.between(5.6,8.1),
      power:1.08
    });
  }

  function stemOutline(samples,rootWidth,tipWidth=.55,opts={}){
    const left=[],right=[],phase=opts.phase||0;
    for(const v of samples){
      const t=v.t;
      const normal=M.normal(v.tng);
      const taper=(1-t)**(opts.exponent||1.18);
      const minor=1 + (.027*Math.sin(19*t+phase)+.016*Math.sin(43*t+phase*.9))*Math.sin(Math.PI*t);
      let width=(tipWidth+(rootWidth-tipWidth)*taper)*minor;
      if(t<.015 && opts.roundRoot)width*=.88+.12*t/.015;
      left.push(add(v,normal,width*.5));
      right.push(add(v,normal,-width*.5));
    }
    return M.poly(left.concat(right.reverse()));
  }

  function cubicFromAnchor(base,tangent,length,side,r,turn=.96){
    const a=dir(tangent),out=a+side*turn;
    const goal=add(base,polar(out,length));
    const c1=add(base,polar(a+side*r.between(.22,.52),length*r.between(.28,.40)));
    const c2=add(goal,polar(out+side*r.between(-.52,.38)+Math.PI,length*r.between(.28,.46)));
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
    return `M0 0 `+
      `C${U(.055,-.29)} ${U(.125,-.67)} ${U(.19,-.78)} `+
      `Q${U(.17,-1.14)} ${U(.29,-1.23)} `+
      `Q${U(.295,-.66)} ${U(.395,-.59)} `+
      `Q${U(.445,-1.26)} ${U(.55,-1.06)} `+
      `Q${U(.52,-.56)} ${U(.635,-.49)} `+
      `Q${U(.73,-.94)} ${U(.80,-.65)} `+
      `Q${U(.79,-.28)} ${U(1,0)} `+
      `Q${D(.815,.31)} ${D(.81,.58)} `+
      `Q${D(.73,.94)} ${D(.645,.52)} `+
      `Q${D(.51,.55)} ${D(.555,1.03)} `+
      `Q${D(.43,1.20)} ${D(.388,.65)} `+
      `Q${D(.28,.64)} ${D(.29,1.12)} `+
      `Q${D(.16,1.08)} ${D(.18,.72)} `+
      `Q${D(.075,.40)} 0 0 Z`;
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
    const primary=opts.primaryColor||(isGreen
      ? M.mix(pal.green,pal.ochre,r.between(.04,.22))
      : r.choose([pal.lapis,pal.vermillion,pal.green,M.mix(pal.green,pal.ink,.24)]));
    const detail=M.clamp(s.detail/100,0,1);
    const darkEdge=M.mix(pal.ink,primary,.16);
    const petioleLen=opts.petioleLen ?? Math.max(1.8,Math.min(8,len*.10));
    const petioleColor=M.mix(pal.green,pal.ink,.36);
    let content=M.path(`M0 0 L${M.vec(petioleLen,0)}`,petioleColor,Math.max(.45,len*.03),`opacity=".92"`);
    const leafTransform=`translate(${M.vec(petioleLen,0)})`;
    content+=`<g transform="${leafTransform}">`;
    content+=M.shape(d,primary,`stroke="${darkEdge}" stroke-width="${signed(big?.88:.70)}" stroke-linejoin="round"`);
    if(big){
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
    if(big&&r.chance(.26)){
      content+=M.path(`M${M.vec(petioleLen+len*.16,-len*.08)}q${M.vec(len*.21,-len*.07)} ${M.vec(len*.31,-len*.035)}`,M.mix(primary,pal.ochre,.25),.55,'opacity=".30"');
    }
    content+='</g>';
    return `<g transform="translate(${vec(at)}) rotate(${signed(rot*180/Math.PI)})">${content}</g>`;
  }

  function stemEdgePoint(sample,side,width,push=.44,along=0){
    const n=M.normal(sample.tng);
    return add(add(sample,n,side*width*push),sample.tng,along);
  }

  function terminalScroll(at,direction,radius,pal,r,opts={}){
    const sign=opts.side||r.sign();
    const steps=24;
    const out=[];
    const first=add(at,polar(direction,radius*.22));
    for(let i=0;i<=steps;i++){
      const t=i/steps;
      const a=direction+sign*(.32+t*1.62)*Math.PI;
      const rr=radius*(1-.88*t);
      const c=add(first,polar(a,rr*.72));
      out.push(c);
    }
    out.unshift(at);
    const d=out.map((q,i)=>(i?'L':'M')+vec(q)).join('');
    const line=M.mix(r.choose([pal.ink,pal.vermillion,pal.green]),pal.light,.06);
    return `<g opacity="${signed(r.between(.72,.96))}">`+
      M.path(d,line,r.between(.72,1.18),``) +
      M.circle(out[out.length-1].x,out[out.length-1].y,r.between(.42,.92),pal.ochre,`stroke="${pal.ink}" stroke-width=".35"`) +
    `</g>`;
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
    const bend=r.between(.32,.56)*r.sign();
    const mid=add(at,polar(ang+bend*.35,size*.34));
    const tip=add(mid,polar(ang+bend,size*.44));
    const path=M.wave(at,add(at,polar(ang,size*.18)),mid,tip,10);
    const stalk=path.map((q,i)=>(i?'L':'M')+vec(q)).join('');
    const bodyAng=dir(path[path.length-1].tng||polar(ang,1));
    const fill=r.choose([pal.lapis,pal.vermillion,M.mix(pal.green,pal.ochre,.16)]);
    const petal=`M0 0 C${M.vec(size*.18,-size*.22)} ${M.vec(size*.55,-size*.38)} ${M.vec(size*.76,-size*.07)} `+
      `Q${M.vec(size*.87,0)} ${M.vec(size*.76,size*.07)} C${M.vec(size*.55,size*.38)} ${M.vec(size*.18,size*.22)} 0 0 Z`;
    const calyx=M.mix(pal.green,pal.ink,.22);
    let z=M.path(stalk,M.mix(pal.green,pal.ink,.32),Math.max(.52,size*.07),``);
    z+=`<g transform="translate(${vec(tip)}) rotate(${signed(bodyAng*180/Math.PI)})">`+
      M.shape(petal,fill,`stroke="${pal.ink}" stroke-width=".56" stroke-linejoin="round"`) +
      M.path(`M${M.vec(size*.02,0)} L${M.vec(size*.67,0)}`,M.mix(pal.ink,fill,.25),.35,'opacity=".52"') +
      M.path(`M0 0 l${M.vec(-size*.16,-size*.16)} M0 0 l${M.vec(-size*.18,size*.14)}`,calyx,.54,'opacity=".95"') +
    `</g>`;
    return z;
  }

  function secondaryTwig(on,tangent,side,len,plan,s,r,pal){
    const c=cubicFromAnchor(on,tangent,len,side,r,r.between(.76,1.14));
    if(!permitted(c.d,plan,8))return '';
    let samples=M.wave(c.a,c.b,c.c,c.d,18);
    samples=undulate(samples,r,{amp:Math.min(9,len*.09),phase:r.between(-1,1),f1:2.4,f2:4.7,f3:6.1,power:1.2});
    const width=r.between(1.7,3.0);
    const outline=stemOutline(samples,width,.26,{roundRoot:true});
    let z=M.shape(outline,M.mix(pal.green,pal.ink,.33),`stroke="${pal.ink}" stroke-width=".35"`);
    for(const t of [.34,.70]){
      const idx=Math.round(t*18),p=samples[idx],leafSide=(t<.5?side:-side),local=localWidth(width,.26,t),
        ang=dir(p.tng)+leafSide*r.between(.62,1.04),
        l=len*r.between(.24,.40),probe=add(p,polar(ang,l*.8)),
        attach=stemEdgePoint(p,leafSide,local,.50,1.2);
      if(permitted(probe,plan,6))z+=leafAt(attach,ang,l,pal,r,s,{large:false,petioleLen:Math.max(1.8,l*.10)});
    }
    const tipAngle=dir(samples[18].tng);
    if(r.chance(.34))z+=terminalScroll(c.d,tipAngle,r.between(3.6,6.4),pal,r,{side});
    else if(r.chance(.26))z+=bud(c.d,tipAngle,r.between(5.4,9),pal,r,s);
    return z;
  }

  function primaryShoot(at,tangent,side,len,plan,s,r,pal,index){
    const turn=r.between(.78,1.16);
    let c=cubicFromAnchor(at,tangent,len,side,r,turn);
    for(let k=0;k<3 && !permitted(c.d,plan,8);k++){
      len*=.74;
      c=cubicFromAnchor(at,tangent,len,side,r,turn);
    }
    if(len<34||!permitted(c.d,plan,8))return '';
    let samples=M.wave(c.a,c.b,c.c,c.d,34);
    samples=undulate(samples,r,{amp:Math.min(12,len*.085),phase:index*.51+r.between(-.8,.8),f1:2.2,f2:4.8,f3:7.0,power:1.15});
    const width=r.between(3.2,6.2)*Math.max(.58,Math.min(1.10,len/100));
    const d=stemOutline(samples,width,.45,{roundRoot:true,phase:index*.37});
    let out=M.shape(d,M.mix(pal.green,pal.ink,.37),`stroke="${pal.ink}" stroke-width=".5"`);
    if(r.chance(.56))out+=stemDetails(samples,width,pal,r,M.clamp(s.detail/100,0,1));
    const richness=s.foliage/100;
    const leafTs=richness<.24?[.37,.77]:richness<.64?[.22,.48,.76]:[.18,.38,.61,.84];
    leafTs.forEach((t,j)=>{
      const idx=Math.round(t*34),q=samples[idx],sign=(j%2===0 ? -1 : 1)*side,
        a=dir(q.tng)+sign*r.between(.72,1.18),
        size=len*r.between(j===leafTs.length-1?.28:.33,.55)*(1-.16*t),
        test=add(q,polar(a,size*.82)),
        lw=localWidth(width,.45,t),
        attach=stemEdgePoint(q,sign,lw,.52,1.4);
      if(permitted(test,plan,8))out+=leafAt(attach,a,size,pal,r,s,{large:size>=24,petioleLen:Math.max(2,size*.11)});
    });
    if(richness>.32 && r.chance(.56+.26*richness)){
      const t=r.between(.40,.64),q=samples[Math.round(t*34)],local=localWidth(width,.45,t),
        launch=stemEdgePoint(q,-side,local,.36,.6);
      out+=secondaryTwig(launch,q.tng,-side,len*r.between(.34,.57),plan,s,r,pal);
    }
    const tipAngle=dir(samples[samples.length-1].tng);
    if(r.chance(.21))out+=berryRosette(c.d,r.between(5.2,9),pal,r,s.detail/100);
    else if(r.chance(.58))out+=terminalScroll(c.d,tipAngle,r.between(5.5,10.5),pal,r,{side});
    else out+=bud(c.d,tipAngle,r.between(6.4,11),pal,r,s);
    return out;
  }

  function mainEnd(at,tangent,pal,r,s){
    const a=dir(tangent),side=r.sign(),len=r.between(34,62),tip=add(at,polar(a+side*.42,len));
    const b=add(at,polar(a+side*.18,len*.32)),c=add(tip,polar(a+side*.58,-len*.26));
    let w=M.wave(at,b,c,tip,26);
    w=undulate(w,r,{amp:Math.min(10,len*.12),phase:r.between(-.8,.8),f1:2.3,f2:4.1,f3:6.6,power:1.22});
    let out=M.shape(stemOutline(w,3.1,.22),M.mix(pal.green,pal.ink,.4),`stroke="${pal.ink}" stroke-width=".40"`);
    const anchor=w[14],leafSide=side,leafA=dir(anchor.tng)+leafSide*1.02,attach=stemEdgePoint(anchor,leafSide,1.35,.75,.7);
    out+=leafAt(attach,leafA,r.between(18,24),pal,r,s,{large:false,petioleLen:2.4});
    out+=terminalScroll(tip,dir(w[26].tng),r.between(8,14),pal,r,{side});
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
      // Genuine alternating over/under weaving hugs the actual bendy trunk.
      // Only one major vine receives this treatment; it is not a loose tile.
      if(stem.id===plan.weaveStem+1 && s.knots>26 && M.braidOnStem){
        body+=M.braidOnStem(samples,pal,r,{amplitude:Math.min(baseWidth*.38,5.7),width:Math.min(3.4,1.4+s.knots*.019)});
      }
      const count=stem.major?Math.round(6+foliage*11):Math.round(4+foliage*8);
      const nodes=[];
      for(let j=0;j<count;j++){
        const t=clamp(.10+(j+.55)*.78/count+r.between(-.013,.013),.08,.91);
        nodes.push(t);
      }
      nodes.forEach((t,i)=>{
        const q=samples[Math.round(t*100)],side=(i%2===0?stem.side:-stem.side)*(r.chance(.12)?-1:1),
          length=r.between(stem.major?84:61,stem.major?145:118)*(1-.17*t),
          lw=localWidth(baseWidth,1.25,t),launch=stemEdgePoint(q,side,lw,.34,.3);
        body+=primaryShoot(launch,q.tng,side,length,plan,s,r,pal,i);
        if(s.detail>42 && r.chance(.14)){
          const l=r.between(13,19),a=dir(q.tng)-side*r.between(.65,1.02),v=add(q,polar(a,l)),attach=stemEdgePoint(q,-side,lw,.54,.7);
          if(permitted(v,plan,7))body+=leafAt(attach,a,l,pal,r,s,{large:false,petioleLen:2.2});
        }
      });
      const root=samples[5],rootDir=dir(root.tng);
      const baseAngle=dir(samples[0].tng)+Math.PI+r.between(-.18,.18);
      body+=leafAt(samples[0],baseAngle,r.between(34,54),pal,r,s,{large:true,kind:'acanthus',petioleLen:3.2});
      for(const sign of [-1,1]){
        const ra=rootDir+sign*r.between(.88,1.32),l=r.between(35,60),tip=add(root,polar(ra,l*.8)),attach=stemEdgePoint(root,sign,baseWidth*.72,.46,.6);
        if(permitted(tip,plan,4))body+=leafAt(attach,ra,l,pal,r,s,{large:true,kind:'acanthus',petioleLen:3});
      }
      if(r.chance(.42))body+=terminalScroll(samples[0],rootDir+Math.PI,r.between(6.2,10.2),pal,r,{side:r.sign()});
      body+=mainEnd(samples[100],samples[100].tng,pal,r,s);
      result+=`<g filter="url(#press)">${body}</g>`;
    }
    return result;
  };
})(window.MS);

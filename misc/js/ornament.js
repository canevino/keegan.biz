/* Manuscript-style botanical ornament / Pass 3.
   All additional shapes grow from an existing stem, flower or leaf.
   No letters, knot grids, borders, or dense hatching. 0 = natural anatomy.
   Designed to operate independently of the species and Gothic guide engines. */
window.MS=window.MS||{};
((M)=>{
  'use strict';
  const n=M.n, V=M.vec;
  const P=(x,y)=>({x,y});
  const q=(at,angle,len)=>P(at.x+Math.cos(angle)*len,at.y+Math.sin(angle)*len);
  const clamp=M.clamp;
  M.ornamentLevel=s=>clamp(Number(s?.ornament||0)/100,0,1);
  const bias={acanthus:1.14,ivy:1.10,honeysuckle:1.13,fern:.96,holly:.78,oak:.84,hazel:.98,bramble:.90,hawthorn:.93,dogrose:.99};
  function influence(sp,s){return clamp(M.ornamentLevel(s)*(bias[sp?.leaf]||1),0,1);}
  M.ornamentInfluence=influence;

  // Variation of an EXISTING silhouette's width; preserve lobes and serrations.
  // Does not substitute an unrelated generic leaf for a holly/fern/oak leaf.
  M.ornamentWidth=(kind,t,width,amount,phase=0)=>{
    if(amount<=0)return width;
    const envelope=Math.pow(Math.sin(Math.PI*t),.76);
    const lobes=kind==='acanthus'?5:kind==='oak'?4:kind==='hawthorn'?3:kind==='holly'?5:kind==='ivy'?3:2;
    const curl=Math.sin(t*Math.PI*2*lobes + phase);
    const lobeVariation=(.39*curl+.13*Math.sin(t*Math.PI*(lobes+1))) * amount * envelope;
    const exaggerated=(1+.34*amount)*width*(1+lobeVariation);
    return exaggerated;
  };
  // Transform leaf-axis point locally; endpoint anchored, so petiole connections hold.
  M.ornamentPoint=(x,y,t,amount,len,phase)=>P(
    x + amount*len*.075*Math.sin(Math.PI*t)*Math.sin(t*5.5+phase),
    y + amount*len*.14*Math.sin(Math.PI*t)*Math.sin(t*4.4+phase*.4)
  );
  // Small number of bold interior scrolls rather than dense ornamental penwork.
  M.ornamentLeafInterior=(sp,len,col,pal,r,s)=>{
    const lev=influence(sp,s);
    if(lev<.49 || len<15 || !r.chance((lev-.34)*.60))return '';
    const ink=M.mix(pal.ink,col,.27),x=len*r.between(.32,.54),height=len*r.between(.10,.19)*lev;
    return M.path(`M${V(x,0)}q${V(len*.08,-height)} ${V(len*.16,-height*.2)}q${V(len*.05,height*.45)} ${V(-len*.018,height*.56)}`, ink,Math.max(.35,len*.012),`opacity="${n(.36+.27*lev)}"`);
  };

  // Physically connected spiral: start = stem endpoint, then extend into a
  // tapering volute. Never place a loose curl somewhere on the canvas.
  function volute(at,angle,radius,pal,r,amount,side){
    const sgn=side||r.sign(),center=q(at,angle,radius*.80);
    const points=[at];
    const count=27;
    for(let i=0;i<=count;i++){
      const t=i/count;
      const a=angle+Math.PI+sgn*(Math.PI*.12+Math.PI*2.52*t);
      const rad=radius*(1-.91*t);
      points.push(q(center,a,rad));
    }
    const path=points.map((p,i)=>(i?'L':'M')+V(p.x,p.y)).join('');
    return M.path(path,r.choose([pal.ink,pal.green,pal.vermillion,pal.ochre]),r.between(.68,1.15)*(1+.35*amount),`opacity="${n(.6+.35*amount)}"`);
  }
  M.ornamentTerminal=(sp,at,angle,scale,pal,r,s,force=false)=>{
    const lev=influence(sp,s);
    if(lev<.24 || (!force && !r.chance(Math.pow(lev,1.5)*.40)))return '';
    const rad=clamp(scale*(.60+.95*lev),3.5,21);
    return volute(at,angle,rad,pal,r,lev,r.sign());
  };

  // Three connected, hand-built painted motifs; petal/berry forms retain some
  // deliberately colorful symbol-like shapes from the early generator.
  function illuminatedFlower(at,angle,size,pal,r,lev){
    const count=r.choose([4,5,6]);
    let z='';
    const center=q(at,angle,size*.70);
    z+=M.path(`M${V(at.x,at.y)} Q${V(q(at,angle+.35,size*.42).x,q(at,angle+.35,size*.42).y)} ${V(center.x,center.y)}`,M.mix(pal.green,pal.ink,.38),Math.max(.5,size*.06));
    const paints=r.shuffle([pal.vermillion,pal.lapis,pal.green,pal.ochre]);
    for(let i=0;i<count;i++){
      const a=i*2*Math.PI/count+angle*.22,petalCenter=q(center,a,size*.30),
        tilt=n((a+Math.PI/2)*180/Math.PI),petal=r.between(.34,.49)*size;
      z+=`<ellipse cx="${n(petalCenter.x)}" cy="${n(petalCenter.y)}" rx="${n(size*.17)}" ry="${n(petal)}" transform="rotate(${tilt} ${V(petalCenter.x,petalCenter.y)})" fill="${paints[i%paints.length]}" stroke="${pal.ink}" stroke-width=".5"/>`;
    }
    z+=M.circle(center.x,center.y,Math.max(.9,size*.12),pal.ochre,`stroke="${pal.ink}" stroke-width=".45"`);
    return z;
  }
  function paintedFleuron(at,angle,size,pal,r,lev){
    const c=q(at,angle,size*.72),cs=Math.cos(angle),sn=Math.sin(angle);
    const path=`M${V(at.x,at.y)} Q${V(q(at,angle-.44,size*.45).x,q(at,angle-.44,size*.45).y)} ${V(c.x,c.y)}`;
    let z=M.path(path,M.mix(pal.green,pal.ink,.32),.9);
    const petal=`M0 0 Q${V(size*.24,-size*.62)} ${V(size*.65,-size*.16)} L${V(size*.85,0)} Q${V(size*.66,size*.17)} ${V(size*.24,size*.62)} Q${V(size*.24,.1*size)} 0 0 Z`;
    z+=`<g transform="translate(${V(c.x,c.y)}) rotate(${n(angle*180/Math.PI)})">`+
       M.shape(petal,r.choose([pal.lapis,pal.vermillion,pal.ochre]),`stroke="${pal.ink}" stroke-width=".65"`)+
       M.path(`M0 0Q${V(size*.45,0)} ${V(size*.8,0)}`,M.mix(pal.ink,pal.ochre,.23),.64,'opacity=".53"')+
       '</g>';
    return z;
  }
  function pointBud(at,angle,size,pal,r,lev){
    const tip=q(at,angle,size*1.24),base=q(at,angle,size*.43);
    const a=q(base,angle+.7,size*.55),b=q(base,angle-.7,size*.55);
    const petal=`M${V(at.x,at.y)}Q${V(a.x,a.y)} ${V(tip.x,tip.y)}Q${V(b.x,b.y)} ${V(at.x,at.y)}Z`;
    return M.path(`M${V(at.x,at.y)}L${V(base.x,base.y)}`,M.mix(pal.ink,pal.green,.45),.7)+
      M.shape(petal,r.choose([pal.lapis,pal.vermillion,pal.ochre]),`stroke="${pal.ink}" stroke-width=".5"`);
  }
  M.ornamentJunction=(sp,at,angle,size,pal,r,s,plan,role='joint')=>{
    const lev=influence(sp,s);
    if(lev<.22)return '';
    const chance=(role==='terminal'?.60:.46)*Math.pow(lev,1.06);
    if(!r.chance(chance))return '';
    const length=clamp(size*(.7+.6*lev),5,25);
    const direction=angle+r.between(-.62,.62);
    const test=q(at,direction,length*1.45);
    if(plan && (!M.inBounds(test,plan.bounds,8) || plan.spatial && !plan.spatial.accept(test,length*.34,{group:'ornament',density:Math.max(35,Number(s.foliage||70))})))return '';
    const choice=r.random();
    if(choice<.44)return illuminatedFlower(at,direction,length,pal,r,lev);
    if(choice<.78)return paintedFleuron(at,direction,length,pal,r,lev);
    return pointBud(at,direction,length,pal,r,lev);
  };
  // At high settings a short bifurcating tendril can transform the very end of
  // a shoot; this is explicitly subordinate to the plant's anatomical growth.
  M.ornamentSplitTip=(sp,at,angle,size,pal,r,s,plan)=>{
    const lev=influence(sp,s);
    if(lev<.55 || !r.chance((lev-.43)*.48))return '';
    let z='';
    for(const side of [-1,1]){
      const a=angle+side*r.between(.42,.72),end=q(at,a,size*.86);
      if(plan && !M.inBounds(end,plan.bounds,12))continue;
      z+=M.path(`M${V(at.x,at.y)} Q${V(q(at,a*.72+angle*.28,size*.39).x,q(at,a*.72+angle*.28,size*.39).y)} ${V(end.x,end.y)}`,
        M.mix(pal.ink,pal.green,.32),Math.max(.38,size*.052));
      z+=volute(end,a,size*r.between(.20,.31),pal,r,lev,side);
    }
    return z;
  };
})(window.MS);

/* Manuscript-style botanical ornament.
   Ornament should feel like a disciplined extension of the plant, not random
   free-floating doodles. Low values stay mostly botanical; high values nudge
   anatomy toward illuminated stylisation. */
window.MS=window.MS||{};
((M)=>{
  'use strict';
  const n=M.n, V=M.vec;
  const P=(x,y)=>({x,y});
  const q=(at,angle,len)=>P(at.x+Math.cos(angle)*len,at.y+Math.sin(angle)*len);
  const clamp=M.clamp;
  M.ornamentLevel=s=>clamp(Number(s?.ornament||0)/100,0,1);
  const bias={acanthus:1.10,ivy:1.02,honeysuckle:1.04,fern:.92,holly:.76,oak:.82,hazel:.92,bramble:.88,hawthorn:.90,dogrose:.94};
  function influence(sp,s){
    const base=Math.pow(M.ornamentLevel(s),1.05);
    return clamp(base*(bias[sp?.leaf]||1),0,1);
  }
  M.ornamentInfluence=influence;
  const vineLike=sp=>['climbing','twining'].includes(sp?.habit)||['ivy','honeysuckle'].includes(sp?.leaf);

  M.ornamentWidth=(kind,t,width,amount,phase=0)=>{
    if(amount<=0)return width;
    const envelope=Math.pow(Math.sin(Math.PI*t),.82);
    const lobes=kind==='acanthus'?5:kind==='oak'?4:kind==='hawthorn'?3:kind==='holly'?5:kind==='ivy'?3:2;
    const curl=Math.sin(t*Math.PI*2*lobes + phase);
    const lobeVariation=(.29*curl+.11*Math.sin(t*Math.PI*(lobes+1))) * amount * envelope;
    return width*(1+.34*amount)*(1+lobeVariation);
  };
  M.ornamentPoint=(x,y,t,amount,len,phase)=>P(
    x + amount*len*.04*Math.sin(Math.PI*t)*Math.sin(t*5.2+phase),
    y + amount*len*.08*Math.sin(Math.PI*t)*Math.sin(t*4.0+phase*.4)
  );
  M.ornamentLeafInterior=(sp,len,col,pal,r,s)=>{
    const lev=influence(sp,s);
    if(lev<.22 || len<17)return '';
    const ink=lev>.62 ? M.mix(pal.ochre,pal.vermillion,.24) : M.mix(pal.ink,col,.30);
    const width=Math.max(.35,len*.020);
    let z=M.path(`M${V(len*.08,0)}Q${V(len*.53,-len*.018)} ${V(len*.86,0)}`,
      ink,width,`opacity="${n(.17+.55*lev)}"`);
    if(lev>.42){
      for(const side of [-1,1])for(let i=0;i<3;i++){
        const t=.25+i*.20,x=len*t;
        const y=side*len*.14*Math.sin(Math.PI*t);
        z+=M.path(`M${V(x,0)}Q${V(x+len*.075,y*.42)} ${V(x+len*.13,y)}`,
          ink,Math.max(.35,len*.01),`opacity="${n(.12+.42*lev)}"`);
      }
    }
    if(lev>.66){
      for(let i=0;i<5;i++){
        const t=.24+i*.18,y=len*.08*Math.sin(Math.PI*t);
        z+=M.circle(len*t, (i%2?1:-1)*y,Math.max(.5,len*.017),
          r.choose([pal.ochre,pal.lapis,pal.vermillion]),`opacity="${n((lev-.68)*1.9)}"`);
      }
    }
    return z;
  };


  // Printed secondary color is carried by real leaf surfaces, never by detached symbols.
  M.ornamentColorPatch=(sp,len,pal,r,s)=>{
    const lev=influence(sp,s);
    if(lev<.16 || len<10)return '';
    const strength=Math.pow((lev-.16)/.84,1.00);
    const color=r.choose([pal.vermillion,pal.lapis,pal.ochre]);
    const start=len*(.28+r.between(-.04,.05)),width=len*(.15+.21*strength);
    const side=r.sign(),height=len*(.11+.21*strength)*side;
    const paint=`M${V(start,-height*.16)}Q${V(start+len*.09,height*.89)} ${V(start+width,height)}L${V(start+width+len*.09,-height*.14)}Z`;
    return `<path d="${paint}" fill="${color}" opacity="${n(strength*(.41+.38*r.random()))}"/>`;
  };
  function pointBud(at,angle,size,pal,r){
    const tip=q(at,angle,size*1.18),base=q(at,angle,size*.40);
    const a=q(base,angle+.7,size*.52),b=q(base,angle-.7,size*.52);
    const petal=`M${V(at.x,at.y)}Q${V(a.x,a.y)} ${V(tip.x,tip.y)}Q${V(b.x,b.y)} ${V(at.x,at.y)}Z`;
    return M.path(`M${V(at.x,at.y)}L${V(base.x,base.y)}`,M.mix(pal.ink,pal.green,.45),.65)+
      M.shape(petal,r.choose([pal.green,pal.ochre,pal.vermillion]),`stroke="${pal.ink}" stroke-width=".48"`);
  }
  function illuminatedFlower(at,angle,size,pal,r,lev){
    const count=r.choose([4,5,5]);
    let z='';
    const center=q(at,angle,size*.66);
    z+=M.path(`M${V(at.x,at.y)} Q${V(q(at,angle+.35,size*.40).x,q(at,angle+.35,size*.40).y)} ${V(center.x,center.y)}`,M.mix(pal.green,pal.ink,.38),Math.max(.48,size*.055));
    const paints=r.shuffle([pal.vermillion,pal.ochre,pal.green,pal.lapis]);
    for(let i=0;i<count;i++){
      const a=i*2*Math.PI/count+angle*.18,petalCenter=q(center,a,size*.28),
        tilt=n((a+Math.PI/2)*180/Math.PI),petal=r.between(.30,.42)*size;
      z+=`<ellipse cx="${n(petalCenter.x)}" cy="${n(petalCenter.y)}" rx="${n(size*.15)}" ry="${n(petal)}" transform="rotate(${tilt} ${V(petalCenter.x,petalCenter.y)})" fill="${paints[i%paints.length]}" stroke="${pal.ink}" stroke-width=".46"/>`;
    }
    z+=M.circle(center.x,center.y,Math.max(.9,size*.11),pal.ochre,`stroke="${pal.ink}" stroke-width=".42"`);
    return z;
  }
  function paintedFleuron(at,angle,size,pal,r){
    const c=q(at,angle,size*.68);
    const path=`M${V(at.x,at.y)} Q${V(q(at,angle-.40,size*.42).x,q(at,angle-.40,size*.42).y)} ${V(c.x,c.y)}`;
    let z=M.path(path,M.mix(pal.green,pal.ink,.32),.86);
    const petal=`M0 0 Q${V(size*.20,-size*.56)} ${V(size*.60,-size*.14)} L${V(size*.79,0)} Q${V(size*.61,size*.14)} ${V(size*.20,size*.56)} Q${V(size*.18,.08*size)} 0 0 Z`;
    z+=`<g transform="translate(${V(c.x,c.y)}) rotate(${n(angle*180/Math.PI)})">`+
       M.shape(petal,r.choose([pal.lapis,pal.vermillion,pal.ochre,pal.green]),`stroke="${pal.ink}" stroke-width=".58"`)+
       M.path(`M0 0Q${V(size*.40,0)} ${V(size*.72,0)}`,M.mix(pal.ink,pal.ochre,.23),.58,'opacity=".50"')+
       '</g>';
    return z;
  }
  M.ornamentTerminal=(sp,at,angle,scale,pal,r,s,force=false)=>{
    const lev=influence(sp,s);
    if(lev<.34)return '';
    const vine=vineLike(sp);
    const chance=(force?.25:0)+ (vine?.10:.05) + Math.pow(Math.max(0,lev-.34),1.15)*(vine?.35:.18);
    if(!force && !r.chance(chance))return '';
    const size=clamp(scale*(.64+.46*lev),4,18);
    // No unattached volutes: terminal details terminate as an actual bud or leaf.
    if(lev>.78 && r.chance(.44))return paintedFleuron(at,angle,size*.83,pal,r);
    return pointBud(at,angle,size,pal,r);
  };

  M.ornamentJunction=(sp,at,angle,size,pal,r,s,plan,role='joint')=>{
    const lev=influence(sp,s);
    if(lev<.30)return '';
    const chance=(role==='terminal'?.82:.87)*Math.pow(lev,.85);
    if(!r.chance(chance))return '';
    const length=clamp(size*(.83+.68*lev),7,27);
    const direction=angle+r.between(-.48,.48);
    const test=q(at,direction,length*1.35);
    if(plan && (!M.inBounds(test,plan.bounds,10) || plan.spatial && !plan.spatial.accept(test,length*.30,{group:'ornament',density:Math.max(35,Number(s.foliage||70))})))return '';
    const choice=r.random();
    if(choice<.67)return illuminatedFlower(at,direction,length,pal,r,lev);
    if(choice<.94)return paintedFleuron(at,direction,length,pal,r);
    return pointBud(at,direction,length*.92,pal,r);
  };


})(window.MS);

/* Botanical engine: variable-width filled stems and tangent-attached acanthus. */
window.MS=window.MS||{};
((M)=>{
  'use strict';
  const P=(x,y)=>({x,y});
  const plus=(a,b,t=1)=>P(a.x+b.x*t,a.y+b.y*t);
  const angle=v=>Math.atan2(v.y,v.x);
  const color=(p,r)=>r.choose([p.green,p.green,p.vermillion,p.lapis,M.mix(p.ochre,p.green,.55)]);
  function taperedTube(samples,baseWidth,endWidth=1.1){
    const sides=[[],[]];
    for(let i=0;i<samples.length;i++){
      const q=samples[i],t=q.t,perp=M.normal(q.tng);
      const w=(endWidth+(baseWidth-endWidth)*Math.pow(1-t,1.25)) * (1+.04*Math.sin(t*18));
      sides[0].push(plus(q,perp,w*.5)); sides[1].push(plus(q,perp,-w*.5));
    }
    return M.poly([...sides[0],...sides[1].reverse()]);
  }
  // Local +X is the length of the leaf; rotate at final attachment exactly once.
  function leafShape(len,typ,r){
    const h=len*r.between(.28,.38),notch=r.between(.12,.2)*len;
    if(typ==='acanthus'){
      return `M0 0 C${M.vec(.1*len,-.34*h)} ${M.vec(.2*len,-.8*h)} ${M.vec(.28*len,-.9*h)} `+
        `Q${M.vec(.24*len,-1.25*h)} ${M.vec(.43*len,-1.38*h)} `+
        `Q${M.vec(.39*len,-.8*h)} ${M.vec(.54*len,-.67*h)} `+
        `Q${M.vec(.66*len,-1.04*h)} ${M.vec(.72*len,-.84*h)} `+
        `Q${M.vec(.68*len,-.42*h)} ${M.vec(len,0)} `+
        `Q${M.vec(.66*len,.64*h)} ${M.vec(.72*len,1.05*h)} `+
        `Q${M.vec(.53*len,.91*h)} ${M.vec(.51*len,.52*h)} `+
        `Q${M.vec(.35*len,.98*h)} ${M.vec(.29*len,1.17*h)} `+
        `Q${M.vec(.23*len,.54*h)} ${M.vec(0,0)}Z`;
    }
    return `M0 0 C${M.vec(len*.24,-h*.82)} ${M.vec(len*.67,-h*1.35)} ${M.vec(len,0)} `+
      `C${M.vec(len*.65,h*1.16)} ${M.vec(len*.23,h*.9)} 0 0 Z`;
  }
  function leafAt(p,ang,len,pal,r,s,typ){
    const d=leafShape(len,typ,r),col=color(pal,r),id=`leaf-${r.int(1,100000000)}`;
    let z=M.painted(id,d,col,{x:0,y:-len*.48,w:len,h:len},s,r,{stroke:.94,lightweight:true});
    z+=M.path(`M0 0 Q${M.vec(len*.46,-len*.06)} ${M.vec(len*.91,0)}`,M.mix(pal.ink,pal.ochre,.35),.72,'opacity=".82"');
    if(typ==='acanthus'){
      for(let t of [.32,.54,.73]){
        z+=M.path(`M${M.vec(len*t,-len*.035)}q${M.vec(len*.045,-len*.12)} ${M.vec(len*.10,-len*.14)}`,pal.ink,.46,'opacity=".52"');
        z+=M.path(`M${M.vec(len*t,-len*.035)}q${M.vec(len*.045,len*.10)} ${M.vec(len*.09,len*.12)}`,pal.ink,.42,'opacity=".52"');
      }
    }
    return `<g transform="translate(${M.vec(p.x,p.y)}) rotate(${M.n(ang*180/Math.PI)})">${z}</g>`;
  }
  function curl(p,angleValue,size,pal,r){
    const parts=[];
    const n=30,theta0=angleValue;
    for(let i=0;i<=n;i++){
      const t=i/n,a=theta0+t*Math.PI*r.between(2.1,2.13),radius=size*(1-.87*t);
      parts.push(P(p.x+Math.cos(a)*radius,p.y+Math.sin(a)*radius));
    }
    return M.path(parts.map((q,i)=>(i?'L':'M')+M.vec(q.x,q.y)).join(''),r.choose([pal.ink,pal.vermillion,pal.lapis]),r.between(.85,2.2));
  }
  function tinyFlower(p,size,pal,r){
    const n=r.choose([4,5,6]);let z='';
    for(let i=0;i<n;i++){
      const a=i*Math.PI*2/n,xx=p.x+Math.cos(a)*size*.43,yy=p.y+Math.sin(a)*size*.43;
      z+=`<ellipse cx="${M.n(xx)}" cy="${M.n(yy)}" rx="${M.n(size*.37)}" ry="${M.n(size*.57)}" transform="rotate(${M.n(a*180/Math.PI)} ${M.n(xx)} ${M.n(yy)})" fill="${r.choose([pal.vermillion,pal.lapis,pal.ochre])}" stroke="${pal.ink}" stroke-width=".8"/>`;
    }
    z+=M.circle(p.x,p.y,size*.17,pal.ochre,`stroke="${pal.ink}" stroke-width=".7"`);return z;
  }
  function shootAt(point,tangent,side,size,plan,s,r){
    const pal=s.pal,dir=angle(tangent)+side*r.between(.6,1.13);
    const tip=plus(point,{x:Math.cos(dir),y:Math.sin(dir)},size);
    const bend=plus(point,{x:Math.cos(dir-.34*side),y:Math.sin(dir-.34*side)},size*.42);
    const ctrl2=plus(tip,{x:Math.cos(dir+side*.5),y:Math.sin(dir+side*.5)},-size*.4);
    if(!M.inBounds(tip,plan.bounds,12))return '';
    if(M.insideEllipse(tip,plan.focal,.92))return '';
    const curve=M.wave(point,bend,ctrl2,tip,24);
    const tube=taperedTube(curve,size*.12+2.5,.7);
    let out=M.shape(tube,M.mix(pal.green,pal.ink,.26),`stroke="${pal.ink}" stroke-width=".8"`);
    const leafCount=r.int(4,6);
    for(let j=0;j<leafCount;j++){
      const q=curve[Math.round(5+(curve.length-9)*j/(leafCount-1))],sg=(j%2?1:-1)*side;
      const a=angle(q.tng)+sg*r.between(.65,1.1);
      const len=r.between(size*.32,size*.52);
      out+=leafAt(q,a,len,pal,r,s,r.chance(.58)?'acanthus':'lance');
    }
    if(r.chance(.29))out+=tinyFlower(tip,r.between(7,13),pal,r);
    else if(r.chance(.42))out+=curl(tip,dir,r.between(6,13),pal,r);
    return out;
  }
  M.botanical=(plan,s,r)=>{
    if(s.foliage<=0)return '';
    const pal=s.pal, density=s.foliage/100;
    let result='';
    for(const stem of plan.stems.slice(0,density<.15?1:plan.stems.length)){
      const {a,b,c,d}=stem;
      const pts=M.wave(a,b,c,d,90);
      const tube=taperedTube(pts,stem.width*r.between(.88,1.17),1.6);
      let draw=M.painted(`vine-${stem.id}`,tube,M.mix(pal.green,pal.ink,.40),stem.box,s,r,{stroke:1.05});
      draw+=M.path(M.curveD(a,b,c,d),M.mix(pal.light,pal.green,.22),Math.max(.4,stem.width*.065),'opacity=".30"');
      const n=Math.round(6+density*(stem.major?24:15));
      for(let j=0;j<n;j++){
        const t=.10+(j+.2)*.76/n+r.between(-.018,.018);
        const k=M.clamp(Math.round(t*90),3,86),p=pts[k];
        let side=stem.side*(j%2?-1:1);
        const branchLen=r.between(65,136)*(1-t*.31)*(stem.major?1:.83);
        draw+=shootAt(p,p.tng,side,branchLen,plan,s,r);
      }
      if(r.chance(.8))draw+=curl(d,angle(pts[89].tng),r.between(13,30),pal,r);
      result+=`<g filter="url(#press)">${draw}</g>`;
    }
    return result;
  };
})(window.MS);

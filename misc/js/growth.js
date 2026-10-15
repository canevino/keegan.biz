/* Planar growth: stroke-following ivy + attractor competition + imperfect terminal strokes.
   Inspired by VegetationGeneratorThreeJS and VineJS; independently implemented SVG geometry. */
window.Ornament=window.Ornament||{};
((O)=>{
  'use strict';
  const {f,clamp,path,fill,blob}=O;
  const P=(p)=>`${f(p.x)} ${f(p.y)}`;
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const lerp=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
  const rotate=(a,t)=>({x:Math.cos(a)*t,y:Math.sin(a)*t});
  function smooth(points){
    if(points.length<2)return '';
    let d='M'+P(points[0]);
    for(let i=0;i<points.length-1;i++){
      const q=points[i],p=points[Math.max(0,i-1)],a=points[i+1],b=points[Math.min(points.length-1,i+2)];
      d+=`C${P({x:q.x+(a.x-p.x)/6,y:q.y+(a.y-p.y)/6})} ${P({x:a.x-(b.x-q.x)/6,y:a.y-(b.y-q.y)/6})} ${P(a)}`;
    }
    return d;
  }
  function drops(nodes,pal,r,density){
    let s='';
    for(let i=0;i<nodes.length;i++)if(r.chance(.03+.13*density)){
      const p=nodes[i],a=r.n(2,11),b=r.n(1,5);
      s+=fill(blob(p.x,p.y,a,b,r,r.int(7,12)),r.pick(pal),`opacity="${f(r.n(.4,.95))}"`);
    }
    return s;
  }
  function strokeVine(points,s,pal,r,strength=1){
    if(points.length<2)return '';
    const n=Math.max(2,Math.min(80,points.length));
    let src=points.filter((p,i)=>i===0||i===points.length-1||dist(points[i-1],p)>2);
    if(src.length<2)return '';
    // Curvature depends on real sampled path rather than a fixed decoration template.
    const trunk=smooth(src),c1=r.pick(pal),c2=r.pick(pal);
    const girth=r.n(2,9)*(.35+s.density/100)*strength;
    let out=path(trunk,c1,girth,`opacity="${f(r.n(.72,.98))}"`);
    if(r.chance(.45))out+=path(trunk,c2,Math.max(.5,girth*.20),`opacity=".62"`);
    let branches='';
    const step=Math.max(2,Math.floor(src.length/22));
    for(let i=1;i<src.length-1;i+=step){
      if(!r.chance(.13+.35*s.density/100))continue;
      const prev=src[i-1],next=src[i+1],p=src[i];
      let a=Math.atan2(next.y-prev.y,next.x-prev.x)+(r.chance(.5)?1:-1)*r.n(.42,1.35);
      const length=r.n(18,160)*strength*(.6+s.growth/100);
      const count=r.int(3,8),nodes=[p];
      let x=p.x,y=p.y;
      for(let j=0;j<count;j++){
        a+=r.n(-.34,.34)*(1+s.damage/100);
        x+=Math.cos(a)*length/count*r.n(.66,1.3);
        y+=Math.sin(a)*length/count*r.n(.66,1.3);
        nodes.push({x,y});
      }
      const width=girth*r.n(.23,.57);
      branches+=path(smooth(nodes),r.chance(.76)?c1:c2,width);
      if(r.chance(.45))branches+=path(`M${P(nodes.at(-2))}Q${P(lerp(nodes.at(-2),nodes.at(-1),1.6))} ${P(nodes.at(-1))}`,r.pick(pal),r.n(.6,2));
      branches+=drops(nodes,pal,r,s.density/100);
    }
    return `<g filter="url(#ink)">${out+branches}</g>`;
  }
  function attractor(x,y,span,angle,s,pal,r){
    const forward=rotate(angle,span),side=rotate(angle+Math.PI/2,span),focus=[];
    const groups=r.int(2,5);
    for(let i=0;i<groups;i++)focus.push({x:x+forward.x*r.n(.22,.95)+side.x*r.n(-.52,.52),y:y+forward.y*r.n(.22,.95)+side.y*r.n(-.52,.52)});
    let targets=Array.from({length:r.int(48,126)},()=>{
      const fcs=r.pick(focus),a=r.n(0,Math.PI*2),rad=Math.sqrt(r.next())*span*r.n(.09,.38);
      return {x:fcs.x+Math.cos(a)*rad,y:fcs.y+Math.sin(a)*rad};
    });
    let nodes=[{x,y,parent:-1,heading:angle,mass:1}],step=r.n(12,21),reach=step*r.n(6,11);
    for(let round=0;round<135&&nodes.length<180&&targets.length;round++){
      const forces=new Map(),remaining=[];
      for(const t of targets){
        let best=-1,bd=reach*reach;
        for(let j=0;j<nodes.length;j++){
          const dx=nodes[j].x-t.x,dy=nodes[j].y-t.y,d=dx*dx+dy*dy;
          if(d<bd){bd=d;best=j;}
        }
        if(bd<step*step*.9)continue;
        remaining.push(t);
        if(best!==-1){const node=nodes[best],v=forces.get(best)||{x:0,y:0};let D=Math.sqrt(bd);v.x+=(t.x-node.x)/D;v.y+=(t.y-node.y)/D;forces.set(best,v);}
      }
      targets=remaining;
      if(forces.size===0){
        const tip=nodes.length-1;
        let closest=targets.slice().sort((a,b)=>dist(a,nodes[tip])-dist(b,nodes[tip]))[0];
        if(!closest)break;
        let a=Math.atan2(closest.y-nodes[tip].y,closest.x-nodes[tip].x);
        forces.set(tip,{x:Math.cos(a),y:Math.sin(a)});
      }
      for(const [j,v] of forces){
        let node=nodes[j],want=Math.atan2(v.y,v.x),d=Math.atan2(Math.sin(want-node.heading),Math.cos(want-node.heading));
        let heading=node.heading+d*r.n(.38,.85)+r.n(-.17,.17)*(1+s.damage/100);
        let length=step*r.n(.76,1.28),candidate={x:node.x+Math.cos(heading)*length,y:node.y+Math.sin(heading)*length};
        if(nodes.slice(-60).some(q=>q!==node&&dist(q,candidate)<step*.42))continue;
        nodes.push({...candidate,parent:j,heading,mass:1});
        if(nodes.length>=180)break;
      }
    }
    for(let i=nodes.length-1;i>0;i--)nodes[nodes[i].parent].mass+=nodes[i].mass;
    let rendered='',tint=r.pick(pal),accent=r.pick(pal),scale=(.45+s.density/100)*r.n(1.2,3.8);
    for(let i=1;i<nodes.length;i++){
      const n=nodes[i],p=nodes[n.parent],m=lerp(n,p,.5),bend=r.n(-.29,.29)*step;
      const d=`M${P(p)}Q${P({x:m.x-Math.sin(n.heading)*bend,y:m.y+Math.cos(n.heading)*bend})} ${P(n)}`;
      rendered+=path(d,n.mass<2&&r.chance(.15)?accent:tint,clamp(Math.sqrt(n.mass)*scale*.55,.65,11));
      if(n.mass<2&&r.chance(.13))rendered+=fill(blob(n.x,n.y,r.n(1,7),r.n(1,4),r,9),r.pick(pal));
    }
    return `<g filter="url(#ink)">${rendered}</g>`;
  }
  function spiral(x,y,length,angle,s,pal,r){
    // Tendrils grow around winding axes with stochastic side shoots.
    let pts=[{x,y}],a=angle,xx=x,yy=y;
    const count=r.int(16,46),spin=r.sign()*r.n(.018,.12),size=length/count;
    for(let i=0;i<count;i++){
      a+=r.n(-.22,.22)*(1+s.damage/100)+spin*(i/count);
      xx+=Math.cos(a)*size*r.n(.7,1.25);yy+=Math.sin(a)*size*r.n(.7,1.25);
      pts.push({x:xx,y:yy});
    }
    return strokeVine(pts,s,pal,r,r.n(.6,1.5));
  }
  O.growth=(x,y,s,pal,r)=>{
    const angle=r.n(-Math.PI,Math.PI),span=r.n(210,740)*(.45+s.growth/110);
    return r.chance(.5)?attractor(x,y,span,angle,s,pal,r):spiral(x,y,span,angle,s,pal,r);
  };
  O.strokeVine=strokeVine;
  O.smooth=smooth;
})(window.Ornament);

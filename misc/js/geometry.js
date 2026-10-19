/* Invisible construction geometry for botanical compositions.
   These are growth trajectories, not visible knotwork or borders. The named
   shapes are intentionally stable so choosing one feels like choosing a real
   construction grammar rather than a random surprise. */
window.MS=window.MS||{};
((M)=>{
 'use strict';
 const P=(x,y)=>({x,y}), W=M.W, H=M.H, cx=W*.5, cy=H*.53;
 const sample=(fn,n=100)=>Array.from({length:n+1},(_,i)=>fn(i/n));
 const cubic=(a,b,c,d,n=100)=>sample(t=>M.bezier(a,b,c,d,t),n);
 const scaled=(x,y)=>P(cx+x,cy+y);
 const reverse=a=>a.slice().reverse();
 const path=(points)=>points.map((p,i)=>(i?'L':'M')+M.vec(p.x,p.y)).join('');
 const fromPoints=(anchors,steps=100)=>{
   const n=anchors.length-1;
   const bezierSeg=(a,b,c,d,t)=>M.bezier(a,b,c,d,t);
   const tension=.52;
   return sample(t=>{
     const v=Math.min(n-.00001,t*n),i=Math.floor(v),u=v-i;
     const a=anchors[Math.max(0,i-1)],b=anchors[i],c=anchors[i+1],d=anchors[Math.min(n,i+2)];
     const c1=P(b.x+(c.x-a.x)*tension/3,b.y+(c.y-a.y)*tension/3);
     const c2=P(c.x-(d.x-b.x)*tension/3,c.y-(d.y-b.y)*tension/3);
     return bezierSeg(b,c1,c2,c,u);
   },steps);
 };
 const ellipse=(rx,ry,start,end,rot=0)=>sample(t=>{
   const a=start+(end-start)*t;
   const x=rx*Math.cos(a),y=ry*Math.sin(a),co=Math.cos(rot),si=Math.sin(rot);
   return scaled(x*co-y*si,x*si+y*co);
 });
 const styles={
  'gothic-pointed':r=>{
    const peak=scaled(r.between(-20,20),-350), left=scaled(-280,385),right=scaled(280,385);
    return [
      cubic(left,scaled(-305,92),scaled(-182,-285),peak),
      cubic(right,scaled(315,80),scaled(185,-285),peak),
      cubic(scaled(-55,390),scaled(-40,154),scaled(-65,-110),scaled(-4,-283))
    ];
  },
  'gothic-quatrefoil':r=>{
    const rot=r.between(-.08,.08);
    const loop=(shift,end)=>sample(t=>{
      const a=shift+(end-shift)*t+rot,rad=227*(1+.20*Math.cos(4*a));
      return scaled(rad*Math.cos(a),rad*1.30*Math.sin(a));
    });
    return [loop(Math.PI*.5,Math.PI*2.03),loop(-Math.PI*.5,Math.PI*1.04),
      cubic(scaled(-165,338),scaled(-210,65),scaled(145,-80),scaled(180,-319))];
  },
  'gothic-radial':r=>{
    const center=scaled(r.between(-26,26),r.between(36,132)),n=r.int(4,5);
    return Array.from({length:n},(_,i)=>{
      const angle=(-Math.PI*.90)+i*(Math.PI*1.8/Math.max(1,n-1));
      const end=scaled(Math.cos(angle)*r.between(235,320),Math.sin(angle)*r.between(285,360));
      const tangent=P(Math.cos(angle),Math.sin(angle));
      return cubic(center,
        P(center.x+tangent.x*65-tangent.y*r.between(18,44),center.y+tangent.y*65+tangent.x*r.between(18,44)),
        P(end.x-tangent.x*100+tangent.y*r.between(-36,36),end.y-tangent.y*100-tangent.x*r.between(-36,36)),end);
    });
  },
  'anglo-lozenge':r=>{
    const a=r.between(190,238),b=r.between(255,310);
    return [
      fromPoints([scaled(-a,390),scaled(-45,b*.6),scaled(a,-45),scaled(15,-b),scaled(-a,-110)]),
      fromPoints([scaled(a,392),scaled(58,b*.48),scaled(-a,30),scaled(-12,-b),scaled(a,-80)]),
      cubic(scaled(-95,380),scaled(95,250),scaled(-85,-215),scaled(102,-350))
    ];
  },
  'anglo-fret':r=>{
    const x=r.between(150,188);
    return [
      fromPoints([scaled(-300,350),scaled(-x,350),scaled(-x,135),scaled(-25,135),scaled(-25,-90),scaled(x,-90),scaled(x,-337)]),
      fromPoints([scaled(280,384),scaled(x,200),scaled(x,80),scaled(20,80),scaled(20,-200),scaled(-x,-200),scaled(-x,-348)]),
      cubic(scaled(-275,60),scaled(-85,175),scaled(165,-185),scaled(277,-45))
    ];
  },
  'celtic-triskele':r=>{
    const rot=r.between(-.16,.16),origin=scaled(0,60);
    return Array.from({length:3},(_,i)=>sample(t=>{
      const a=rot+i*Math.PI*2/3 + .44 + t*Math.PI*2.05;
      const d=18+294*Math.pow(t,.9);
      return P(origin.x+d*Math.cos(a),origin.y+d*Math.sin(a)*1.16);
    }));
  },
  'celtic-double-spiral':r=>{
    const arms=[];
    for(const sign of [-1,1]){
      const origin=scaled(sign*55,18);
      arms.push(sample(t=>{
        const a=(sign===1 ? 0:Math.PI)+sign*t*Math.PI*3.0;
        const rr=18+260*t;
        return P(origin.x+Math.cos(a)*rr,origin.y+Math.sin(a)*rr*1.10);
      }));
    }
    arms.push(cubic(scaled(-180,398),scaled(225,305),scaled(-190,-270),scaled(190,-350)));
    return arms;
  },
  'celtic-scroll':r=>[
    cubic(scaled(-285,390),scaled(240,220),scaled(-240,-45),scaled(250,-360)),
    cubic(scaled(275,380),scaled(-270,185),scaled(250,-130),scaled(-220,-340)),
    cubic(scaled(-75,410),scaled(250,165),scaled(-290,-210),scaled(70,-345))
  ],
  'insular-vesica':r=>{
    const top=scaled(0,-250),bottom=scaled(0,345),left=scaled(-170,48),right=scaled(170,48);
    return [
      cubic(bottom,scaled(-210,210),scaled(-215,-120),top),
      cubic(bottom,scaled(210,210),scaled(215,-120),top),
      cubic(left,scaled(-55,48),scaled(55,48),right)
    ];
  },
  'roundel':r=>[
    ellipse(250,325,-Math.PI*.56,Math.PI*1.44,.04),
    ellipse(160,218,-Math.PI*.30,Math.PI*1.70,-.05),
    cubic(scaled(-25,365),scaled(40,170),scaled(-55,-55),scaled(14,-305))
  ]
 };
 const curated=[
  'gothic-pointed','gothic-quatrefoil','gothic-radial',
  'anglo-lozenge','anglo-fret',
  'celtic-triskele','celtic-double-spiral','celtic-scroll',
  'insular-vesica','roundel'
 ];
 M.geometryStyles=curated;
 M.geometryNames={
  'gothic-pointed':'pointed arch',
  'gothic-quatrefoil':'quatrefoil',
  'gothic-radial':'radial tracery',
  'anglo-lozenge':'lozenge',
  'anglo-fret':'stepped fret',
  'celtic-triskele':'triskele',
  'celtic-double-spiral':'double spiral',
  'celtic-scroll':'scrollwork',
  'insular-vesica':'vesica',
  'roundel':'roundel'
 };
 M.constructGuides=(selected,r)=>{
   const locked=!!styles[selected];
   // Most spontaneous drawings favour open branching guides. More radical
   // spirals, frets and closed roundels remain available when selected.
   const naturalGuides=['gothic-pointed','gothic-pointed','gothic-radial',
       'gothic-radial','insular-vesica','anglo-lozenge','celtic-scroll'];
   const name=locked?selected:r.choose(naturalGuides);
   let rails=styles[name](r);
   const rotation=locked?r.between(-.04,.04):r.between(-.12,.12);
   const mirror=locked?1:(r.chance(.28)?-1:1);
   const dx=r.between(locked?-10:-20,locked?10:20);
   const dy=r.between(locked?-10:-16,locked?10:16);
   const co=Math.cos(rotation),si=Math.sin(rotation);
   rails=rails.map((arr,i)=>{
     const transformed=arr.map(p=>{
       const x=(p.x-cx)*mirror,y=p.y-cy;
       return P(cx+x*co-y*si+dx,cy+x*si+y*co+dy);
     });
     return (!locked && i===0 && r.chance(.16))?reverse(transformed):transformed;
   });
   const bounds={x:55,y:60,w:740,h:880};
   rails=rails.map(arr=>arr.map(p=>P(M.clamp(p.x,bounds.x,bounds.x+bounds.w),M.clamp(p.y,bounds.y,bounds.y+bounds.h))));
   return {name,rails,paths:rails.map(path),bounds};
 };
 M.attractShoot=(start,target,construction,conform,habit)=>{
   if(!construction || conform<=0)return target;
   const v=P(target.x-start.x,target.y-start.y),length=Math.hypot(v.x,v.y)||1;
   let best=null,score=Infinity;
   for(const line of construction.rails){
     for(let i=5;i<line.length;i+=4){
       const q=line[i],dx=q.x-target.x,dy=q.y-target.y;
       const distance2=dx*dx+dy*dy;
       if(distance2>150*150)continue;
       const forward=((q.x-start.x)*v.x+(q.y-start.y)*v.y)/length;
       if(forward<length*.55)continue;
       const weight=distance2+(forward-length)**2*.15;
       if(weight<score){score=weight;best=q;}
     }
   }
   if(!best)return target;
   const bias=habit==='climbing'?.24:habit==='twining'?.19:habit==='heavy'?.11:.16;
   const power=M.clamp(conform/100,0,1)*bias;
   const dx=best.x-target.x,dy=best.y-target.y,dist=Math.hypot(dx,dy);
   const move=Math.min(18*power,dist*power);
   return P(target.x+dx/(dist||1)*move,target.y+dy/(dist||1)*move);
 };
 M.drawGuides=(construction)=>{
   if(!construction)return '';
   let z='';
   for(const rail of construction.rails){
     z+=M.path(path(rail),'#8e5c44',1.35,'stroke-dasharray="6 7" opacity=".67"');
     for(const i of [0,25,50,75,100]){
       const p=rail[i];
       z+=M.circle(p.x,p.y, i===0?3.8:2.2,'#d8a933','stroke="#8e5c44" stroke-width=".55" opacity=".8"');
     }
   }
   return `<g id="construction-guides" pointer-events="none">${z}</g>`;
 };
})(window.MS);

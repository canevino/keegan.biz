/* Invisible construction geometry for botanical compositions.
   Gothic: pointed arch, quatrefoil, ogee, radial tracery.
   Anglo-Saxon-inspired: lozenge work, stepped fret, saltire.
   Insular/Celtic-inspired: triskele, double spiral, curvilinear scroll.
   These are growth trajectories, not visible knotwork or borders. */
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
   // Cardinal spline softens geometric vertices, so stems use the geometry
   // without acquiring unplant-like hard 90-degree elbows.
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
 const styles={
  'gothic-pointed':r=>{
    // The two arcs converge at a cusp; they are not a square picture frame.
    const peak=scaled(r.between(-32,32),-350), left=scaled(-280,385),right=scaled(280,385);
    return [
      cubic(left,scaled(-305,92),scaled(-182,-285),peak),
      cubic(right,scaled(315,80),scaled(185,-285),peak),
      cubic(scaled(-55,390),scaled(-40,154),scaled(-65,-110),scaled(-4,-283))
    ];
  },
  'gothic-quatrefoil':r=>{
    const rot=r.between(-.18,.18);
    const loop=(shift,end)=>sample(t=>{
      const a=shift+(end-shift)*t+rot,rad=227*(1+.24*Math.cos(4*a));
      return scaled(rad*Math.cos(a),rad*1.30*Math.sin(a));
    });
    return [loop(Math.PI*.5,Math.PI*2.03),loop(-Math.PI*.5,Math.PI*1.04),
      cubic(scaled(-165,338),scaled(-210,65),scaled(145,-80),scaled(180,-319))];
  },
  'gothic-ogee':r=>[
    cubic(scaled(-268,405),scaled(-285,60),scaled(180,35),scaled(33,-345)),
    cubic(scaled(265,388),scaled(305,80),scaled(-178,-35),scaled(-33,-335)),
    cubic(scaled(-130,356),scaled(180,152),scaled(-200,-148),scaled(125,-305))
  ],
  'gothic-radial':r=>{
    const center=scaled(r.between(-45,45),r.between(30,150)),n=r.int(4,6);
    return Array.from({length:n},(_,i)=>{
      const angle=(-Math.PI*.94)+i*(Math.PI*1.9/(n-1));
      const end=scaled(Math.cos(angle)*r.between(235,335),Math.sin(angle)*r.between(295,380));
      const tangent=P(Math.cos(angle),Math.sin(angle));
      return cubic(center,
        P(center.x+tangent.x*65-tangent.y*r.between(20,65),center.y+tangent.y*65+tangent.x*r.between(20,65)),
        P(end.x-tangent.x*100+tangent.y*r.between(-55,55),end.y-tangent.y*100-tangent.x*r.between(-55,55)),end);
    });
  },
  'anglo-lozenge':r=>{
    // Diamond tracery guides; plant segments soften angular junctions organically.
    const a=r.between(180,250),b=r.between(250,325);
    return [
      fromPoints([scaled(-a,390),scaled(-45,b*.6),scaled(a,-45),scaled(15,-b),scaled(-a,-110)]),
      fromPoints([scaled(a,392),scaled(58,b*.48),scaled(-a,30),scaled(-12,-b),scaled(a,-80)]),
      cubic(scaled(-95,380),scaled(95,250),scaled(-85,-215),scaled(102,-350))
    ];
  },
  'anglo-fret':r=>{
    const x=r.between(145,195);
    return [
      fromPoints([scaled(-300,350),scaled(-x,350),scaled(-x,135),scaled(-25,135),scaled(-25,-90),scaled(x,-90),scaled(x,-337)]),
      fromPoints([scaled(280,384),scaled(x,200),scaled(x,80),scaled(20,80),scaled(20,-200),scaled(-x,-200),scaled(-x,-348)]),
      cubic(scaled(-275,60),scaled(-85,175),scaled(165,-185),scaled(277,-45))
    ];
  },
  'anglo-saltire':r=>[
    cubic(scaled(-290,370),scaled(-235,120),scaled(195,-150),scaled(275,-343)),
    cubic(scaled(286,388),scaled(220,145),scaled(-175,-150),scaled(-287,-340)),
    cubic(scaled(-220,375),scaled(-15,280),scaled(30,-95),scaled(195,-337))
  ],
  'celtic-triskele':r=>{
    const rot=r.between(-.4,.4),origin=scaled(0,60);
    return Array.from({length:3},(_,i)=>sample(t=>{
      const a=rot+i*Math.PI*2/3 + .4 + t*Math.PI*2.15;
      const d=14+300*Math.pow(t,.88);
      return P(origin.x+d*Math.cos(a),origin.y+d*Math.sin(a)*1.18);
    }));
  },
  'celtic-double-spiral':r=>{
    const arms=[];
    for(const sign of [-1,1]){
      const origin=scaled(sign*55,18);
      arms.push(sample(t=>{
        const a=(sign===1 ? 0:Math.PI)+sign*t*Math.PI*3.1;
        const rr=18+270*t;
        return P(origin.x+Math.cos(a)*rr,origin.y+Math.sin(a)*rr*1.12);
      }));
    }
    arms.push(cubic(scaled(-180,398),scaled(225,305),scaled(-190,-270),scaled(190,-350)));
    return arms;
  },
  'celtic-scroll':r=>[
    cubic(scaled(-285,390),scaled(240,220),scaled(-240,-45),scaled(250,-360)),
    cubic(scaled(275,380),scaled(-270,185),scaled(250,-130),scaled(-220,-340)),
    cubic(scaled(-75,410),scaled(250,165),scaled(-290,-210),scaled(70,-345))
  ]
 };
 M.geometryStyles=Object.keys(styles);
 M.geometryNames={
  'gothic-pointed':'Gothic / pointed arch',
  'gothic-quatrefoil':'Gothic / quatrefoil',
  'gothic-ogee':'Gothic / ogee',
  'gothic-radial':'Gothic / radial tracery',
  'anglo-lozenge':'Anglo-Saxon / lozenge',
  'anglo-fret':'Anglo-Saxon / stepped fret',
  'anglo-saltire':'Anglo-Saxon / saltire',
  'celtic-triskele':'Celtic / triskele',
  'celtic-double-spiral':'Celtic / double spiral',
  'celtic-scroll':'Celtic / scrollwork'
 };
 M.constructGuides=(selected,r)=>{
   const name=styles[selected]?selected:r.choose(M.geometryStyles);
   let rails=styles[name](r);
   // A shared transformation moves the whole geometry without destroying its
   // proportions. Infrequently reversing a rail creates hanging or entering
   // stems rather than always rooting everything at the bottom edge.
   const rotation=r.between(-.14,.14),mirror=r.chance(.42)?-1:1;
   const dx=r.between(-22,22),dy=r.between(-17,17);
   const co=Math.cos(rotation),si=Math.sin(rotation);
   rails=rails.map((arr,i)=>{
     const transformed=arr.map(p=>{
       const x=(p.x-cx)*mirror,y=p.y-cy;
       return P(cx+x*co-y*si+dx,cy+x*si+y*co+dy);
     });
     return i===0 && r.chance(.19)?reverse(transformed):transformed;
   });
   const bounds={x:55,y:60,w:740,h:880};
   rails=rails.map(arr=>arr.map(p=>P(M.clamp(p.x,bounds.x,bounds.x+bounds.w),M.clamp(p.y,bounds.y,bounds.y+bounds.h))));
   return {name,rails,paths:rails.map(path),bounds};
 };
 // Gentle field attraction for secondary shoots. The major arteries follow
 // the guide much more closely; lateral growth only responds when a guide
 // passes nearby and ahead of its intended direction.
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
   const bias=habit==='climbing'?.26:habit==='twining'?.20:habit==='heavy'?.12:.17;
   const power=M.clamp(conform/100,0,1)*bias;
   const dx=best.x-target.x,dy=best.y-target.y,dist=Math.hypot(dx,dy);
   const move=Math.min(22*power,dist*power);
   return P(target.x+dx/(dist||1)*move,target.y+dy/(dist||1)*move);
 };
 M.drawGuides=(construction)=>{
   if(!construction)return '';
   // Separate overlay; not included in exported SVG/PNG.
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

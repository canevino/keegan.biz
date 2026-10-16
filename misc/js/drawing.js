/* Pass 5: user-defined growth paths. Coordinates stay in SVG's 850x1000 viewBox.
   The tool is inert until drawing is explicitly enabled. No external libraries. */
window.MS=window.MS||{};
((M)=>{
  'use strict';
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const linear=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
  // Distinct captured strokes represent separate main stems. Each becomes 101
  // evenly spaced samples, with continuous tangents and t from 0 to 1.
  M.resampleStroke=(raw,count=100)=>{
    if(!Array.isArray(raw)||raw.length<2)return [];
    const finite=raw.filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)).map(p=>({x:M.clamp(p.x,4,M.W-4),y:M.clamp(p.y,4,M.H-4)}));
    if(finite.length<2)return [];
    const unique=[finite[0]];
    for(const p of finite.slice(1)) if(dist(p,unique[unique.length-1])>1.5)unique.push(p);
    if(unique.length<2)return [];
    // Chaikin corner cutting gives a calm, brushlike line while respecting the
    // initial and final roots. Softening is applied only once per generation.
    let smooth=unique;
    for(let pass=0;pass<2;pass++){
      const next=[smooth[0]];
      for(let i=0;i<smooth.length-1;i++){
        next.push(linear(smooth[i],smooth[i+1],.25),linear(smooth[i],smooth[i+1],.75));
      }
      next.push(smooth[smooth.length-1]);smooth=next;
    }
    const distance=[0];
    for(let i=1;i<smooth.length;i++)distance.push(distance[i-1]+dist(smooth[i-1],smooth[i]));
    const total=distance[distance.length-1];
    if(total<55)return [];
    let k=1;
    const result=Array.from({length:count+1},(_,i)=>{
      const goal=total*i/count;
      while(k<distance.length-1&&distance[k]<goal)k++;
      const section=Math.max(1e-7,distance[k]-distance[k-1]);
      return {...linear(smooth[k-1],smooth[k],M.clamp((goal-distance[k-1])/section,0,1)),t:i/count};
    });
    for(let i=0;i<result.length;i++){
      const a=result[Math.max(0,i-1)],b=result[Math.min(result.length-1,i+1)];
      result[i].tng=M.unit({x:b.x-a.x,y:b.y-a.y});
    }
    return result;
  };
  M.drawnStems=(strokes,r)=>{
    const bounds={x:36,y:36,w:M.W-72,h:M.H-72};
    return (strokes||[]).slice(0,4).map((raw,i)=>{
      const naturalPoints=M.resampleStroke(raw,100);
      if(!naturalPoints.length)return null;
      const a=naturalPoints[0],d=naturalPoints[100];
      const b=naturalPoints[33],c=naturalPoints[66];
      const xs=naturalPoints.map(p=>p.x),ys=naturalPoints.map(p=>p.y),pad=70;
      return {id:i+1,a,b,c,d,major:i<2,side:i%2?-1:1,
        width:r.between(i<2?12:8,i<2?19:12),
        box:{x:Math.min(...xs)-pad,y:Math.min(...ys)-pad,w:Math.max(...xs)-Math.min(...xs)+pad*2,h:Math.max(...ys)-Math.min(...ys)+pad*2},
        guideAmount:0,guidePoints:null,naturalPoints,
        userDrawn:true};
    }).filter(Boolean).map(s=>({...s,bounds}));
  };
  M.strokePath=points=>points.map((p,i)=>(i?'L':'M')+M.vec(p.x,p.y)).join('');
})(window.MS);

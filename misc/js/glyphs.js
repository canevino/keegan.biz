/* Custom drawn Insular-influenced capital construction.
   Not a font: each letter consists of independently specified curved pen strokes.
   Stroke centrelines are expanded to closed SVG silhouettes so they can be
   filled, clipped, patterned and exported without depending on local fonts.
   Coordinates: roughly x=-60..60, y=-145..4. Includes all 26 letters. */
window.MS=window.MS||{};
((M)=>{
  'use strict';
  const shapes={
    A:['M-48 0 C-30 -38 -15 -101 1 -140','M1 -140 C19 -100 34 -37 52 0','M-31 -47 C-6 -53 18 -51 36 -46'],
    B:['M-43 -139 C-47 -99 -45 -48 -43 4','M-43 -136 C-10 -149 49 -140 43 -107 C42 -83 4 -76 -40 -73','M-42 -75 C9 -90 51 -73 47 -34 C45 -4 4 7 -44 3'],
    C:['M45 -121 C24 -151 -35 -147 -43 -94 C-54 -38 -18 14 48 -14'],
    D:['M-43 -139 C-46 -86 -44 -39 -43 4','M-45 -136 C26 -155 56 -111 54 -67 C52 -21 25 13 -44 2'],
    E:['M48 -137 C15 -141 -15 -140 -44 -139','M-41 -139 C-45 -92 -42 -48 -43 3','M-42 -70 C-6 -74 19 -71 37 -70','M-43 3 C-11 2 23 4 50 -5'],
    F:['M-43 -137 C-45 -94 -45 -42 -42 5','M-43 -136 C-14 -141 23 -140 50 -132','M-43 -69 C-11 -72 16 -70 35 -71'],
    G:['M43 -119 C9 -158 -40 -139 -45 -85 C-54 -33 -18 13 37 -1 C45 -12 45 -47 43 -63','M43 -63 C26 -62 12 -64 1 -61'],
    H:['M-45 -139 C-46 -95 -45 -40 -45 4','M46 -139 C43 -91 42 -41 47 3','M-44 -70 C-14 -78 17 -66 45 -72'],
    I:['M-19 -139 C-5 -142 13 -141 28 -137','M5 -138 C3 -93 2 -39 5 4','M-20 3 C-4 1 17 2 28 1'],
    J:['M-25 -139 C-3 -141 22 -139 43 -136','M27 -139 C24 -95 26 -43 15 -12 C6 9 -20 10 -39 -9'],
    K:['M-43 -139 C-46 -91 -44 -44 -44 3','M42 -138 C15 -111 -9 -87 -40 -67','M-15 -84 C4 -49 28 -20 51 4'],
    L:['M-40 -139 C-45 -96 -44 -40 -40 3','M-40 2 C-10 0 22 4 49 -1'],
    M:['M-51 4 C-50 -43 -49 -98 -46 -139','M-46 -139 C-25 -107 -6 -75 1 -54','M1 -54 C14 -84 30 -119 44 -139','M44 -139 C45 -95 46 -38 51 4'],
    N:['M-45 3 C-46 -49 -46 -95 -46 -139','M-46 -139 C-14 -91 18 -43 46 3','M46 3 C45 -39 43 -94 44 -139'],
    O:['M-4 -143 C-47 -153 -60 -103 -52 -61 C-43 2 -8 18 22 0 C55 -21 61 -93 39 -125 C29 -139 13 -143 -4 -143'],
    P:['M-42 4 C-46 -46 -44 -100 -42 -139','M-42 -137 C-9 -154 47 -139 45 -104 C44 -72 11 -63 -43 -76'],
    Q:['M-4 -143 C-47 -153 -60 -103 -52 -61 C-43 2 -8 18 22 0 C55 -21 61 -93 39 -125 C29 -139 13 -143 -4 -143','M16 -25 C29 -11 42 5 55 17'],
    R:['M-43 4 C-44 -49 -44 -97 -43 -139','M-43 -138 C-8 -151 44 -137 43 -105 C42 -77 13 -69 -42 -75','M-11 -77 C10 -52 30 -20 49 3'],
    S:['M42 -130 C17 -153 -37 -146 -42 -108 C-50 -81 -26 -67 8 -64 C57 -60 55 -7 11 5 C-13 12 -36 0 -47 -10'],
    T:['M-53 -138 C-16 -140 20 -137 53 -137','M0 -138 C-2 -96 0 -49 3 5'],
    U:['M-44 -139 C-46 -98 -47 -45 -35 -22 C-18 13 22 10 35 -23 C47 -47 46 -100 44 -139'],
    V:['M-49 -138 C-33 -92 -15 -37 1 5','M1 5 C18 -39 36 -94 50 -138'],
    W:['M-53 -139 C-45 -89 -38 -38 -23 3','M-23 3 C-13 -24 -6 -51 2 -77','M2 -77 C13 -50 22 -22 29 3','M29 3 C43 -42 47 -95 54 -139'],
    X:['M-46 -138 C-13 -92 15 -41 47 3','M47 -139 C16 -90 -13 -42 -48 4'],
    Y:['M-47 -138 C-25 -108 -10 -86 1 -65','M46 -138 C28 -104 12 -80 1 -65','M1 -65 C-1 -41 2 -17 2 4'],
    Z:['M-47 -136 C-12 -138 20 -138 50 -137','M50 -137 C16 -93 -10 -41 -47 1','M-47 1 C-10 1 22 4 52 0']
  };
  const cmds=/[MLCQ]|-?\d+(?:\.\d+)?/g;
  function trace(d){
    const a=d.match(cmds)||[],p=[],steps=13;
    let i=0,c={x:0,y:0};
    const num=()=>Number(a[i++]);
    while(i<a.length){
      const cmd=a[i++];
      if(cmd==='M'){c={x:num(),y:num()};p.push({...c});}
      else if(cmd==='L'){const to={x:num(),y:num()};for(let t=1;t<=6;t++)p.push(M.pt(c,to,t/6));c=to;}
      else if(cmd==='C'){
        const p1={x:num(),y:num()},p2={x:num(),y:num()},to={x:num(),y:num()};
        for(let t=1;t<=steps;t++)p.push(M.bezier(c,p1,p2,to,t/steps));c=to;
      } else if(cmd==='Q'){
        const p1={x:num(),y:num()},to={x:num(),y:num()};
        for(let t=1;t<=steps;t++){const u=t/steps,k=1-u;p.push({x:k*k*c.x+2*k*u*p1.x+u*u*to.x,y:k*k*c.y+2*k*u*p1.y+u*u*to.y});}c=to;
      }
    }
    return p;
  }
  function expanded(points,width,seed){
    if(points.length<2)return '';
    const left=[],right=[],phase=seed*.61;
    for(let i=0;i<points.length;i++){
      const t=i/(points.length-1),a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],norm=M.normal(M.unit({x:b.x-a.x,y:b.y-a.y}));
      const modulation=1 + .09*Math.sin(Math.PI*t)*Math.sin(9*t+phase)+.025*Math.sin(23*t+phase*.7);
      const w=width*modulation*.5;
      left.push({x:points[i].x+norm.x*w,y:points[i].y+norm.y*w});
      right.push({x:points[i].x-norm.x*w,y:points[i].y-norm.y*w});
    }
    // Rounded caps; eliminates dead-straight font-like endings.
    let d=left.map((p,i)=>(i?'L':'M')+M.vec(p.x,p.y)).join('');
    const end=points[points.length-1],le=left[left.length-1],re=right[right.length-1],last=M.unit({x:end.x-points[points.length-2].x,y:end.y-points[points.length-2].y});
    d+=`Q${M.vec(end.x+last.x*width*.55,end.y+last.y*width*.55)} ${M.vec(re.x,re.y)}`;
    d+=right.reverse().slice(1).map(p=>'L'+M.vec(p.x,p.y)).join('');
    const start=points[0],next=M.unit({x:points[1].x-start.x,y:points[1].y-start.y});
    d+=`Q${M.vec(start.x-next.x*width*.55,start.y-next.y*width*.55)} ${M.vec(left[0].x,left[0].y)}Z`;
    return d;
  }
  function construct(letter,size,r){
    letter=(letter||'B').toUpperCase().slice(0,1);
    const defs=shapes[letter]||shapes.B;
    const scale=size/160;
    const pan=r.between(-2.6,2.6),skew=r.between(-.085,.085);
    const polys=defs.map((stroke,i)=>expanded(trace(stroke),r.between(19,25)*(i===0?1.05:.95),i+size*.01));
    const transform=`scale(${M.n(scale)}) translate(${M.n(pan)} 0) skewX(${M.n(skew*180/Math.PI)})`;
    // Real pen-stroke endpoints let finials grow from letter geometry.
    const terminals=defs.flatMap((spec,i)=>{
      const points=trace(spec);
      const start=points[0],end=points[points.length-1];
      const first=points[1]||end,prior=points[points.length-2]||start;
      return [
        {x:start.x,y:start.y,angle:Math.atan2(start.y-first.y,start.x-first.x),stroke:i},
        {x:end.x,y:end.y,angle:Math.atan2(end.y-prior.y,end.x-prior.x),stroke:i}
      ];
    });
    return {letter,paths:polys,terminals,transform,size,scale,shape:polys.map(d=>`<path d="${d}"/>`).join('')};
  }
  M.glyph=construct;
})(window.MS);

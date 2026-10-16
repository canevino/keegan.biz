/* Knot cells, crossings and break-reconnections: George Bain mirror curves.
   Algorithm adapted from Olivier Giulieri's Celtic Knot Maker (MIT).
   Licensed attribution in THIRD_PARTY_LICENSES.md. */
window.MS = window.MS || {};
((O)=>{
  'use strict';
  const f=O.n, clamp=O.clamp;
  const line=(a,b,c,d,col,w)=>O.path(`M${f(a)} ${f(b)}L${f(c)} ${f(d)}`,col,w);
  // Mirror-curve interlace. Crossing state 0 = cross, 1 = horizontal
  // break, 2 = vertical break. The ends on the outer border fold back.
  const CROSS=0, HB=1, VB=2;
  function knotGrid(cols,rows,r,density) {
    const g={cw:cols,ch:rows,W:2*cols,H:2*rows};
    const state=new Uint8Array((g.W+1)*(g.H+1));
    const idx=(x,y)=>y*(g.W+1)+x;
    const inner=(x,y)=>x>0&&x<g.W&&y>0&&y<g.H&&(x+y)%2===1;
    const intersections=[];
    for(let y=1;y<g.H;y++)for(let x=1+(y%2);x<g.W;x+=2) intersections.push([x,y]);
    function wall(x,y,axis,n) {
      for(let i=0;i<n;i++) {
        let X=x+(axis===HB?2*i:0),Y=y+(axis===VB?2*i:0);
        if(inner(X,Y))state[idx(X,Y)]=axis;
      }
    }
    const walls=Math.round((.12+density*.52)*g.W*g.H/5);
    for(let j=0;j<walls;j++) {
      const axis=r.chance(.5)?HB:VB;
      let x=r.int(1,g.W-1),y=r.int(1,g.H-1);
      if((x+y)%2!==1) x=x<g.W-1?x+1:x-1;
      wall(x,y,axis,r.int(1,Math.max(2,Math.min(cols,rows))));
    }
    function trace() {
      const KW=2*g.H+1,seen=new Uint16Array((2*g.W+1)*KW),loops=[];
      const at=(x,y)=>x===0||x===g.W?VB:y===0||y===g.H?HB:state[idx(x,y)];
      for(let j=0;j<g.ch;j++)for(let i=0;i<g.cw;i++) {
        const cx=2*i+1,cy=2*j+1;
        const starts=[[cx,cy-1,1,1],[cx+1,cy,-1,1],[cx,cy+1,-1,-1],[cx-1,cy,1,-1]];
        for(const [x0,y0,dx0,dy0] of starts) {
          if(seen[(2*x0+dx0)*KW+(2*y0+dy0)])continue;
          const pts=[];let x=x0,y=y0,dx=dx0,dy=dy0,guard=0;
          do {
            const nx=x+dx,ny=y+dy;
            if(nx<0||nx>g.W||ny<0||ny>g.H)break;
            seen[(x+nx)*KW+(y+ny)]=loops.length+1;
            const t=at(nx,ny);
            if(t===HB)dy=-dy;else if(t===VB)dx=-dx;
            pts.push([nx,ny,t]);x=nx;y=ny;
            guard++;
          }while((x!==x0||y!==y0||dx!==dx0||dy!==dy0)&&guard<g.W*g.H*16);
          if(pts.length>1)loops.push(pts);
        }
      }
      return {loops,owner:(x2,y2)=>Math.max(0,(seen[x2*KW+y2]||1)-1)};
    }
    // Joining two different strands is always possible by changing the
    // crossing to a break; only accept changes that lower loop count.
    let n=trace().loops.length;
    const candidates=r.shuffle(intersections.slice());
    const target=r.int(1,Math.min(4,Math.max(1,n)));
    for(let pass=0;pass<2&&n>target;pass++) {
      for(const [x,y] of candidates) {
        if(n<=target)break;
        const k=idx(x,y),old=state[k];
        for(const v of r.shuffle([CROSS,HB,VB].filter(v=>v!==old))) {
          state[k]=v;
          const next=trace().loops.length;
          if(next<n){n=next;break;}state[k]=old;
        }
      }
    }
    return {g,state,intersections,idx,trace};
  }
  function renderKnot(cx,cy,scale,rotation,cfg,pal,r,opts={}) {
    const cols=r.int(3,opts.big?8:6),rows=r.int(3,opts.big?7:6);
    const k=knotGrid(cols,rows,r,cfg.density);
    const {loops,owner}=k.trace();
    if(!loops.length)return '';
    const u=r.n(24,35),ww=k.g.W*u,hh=k.g.H*u;
    const phase=r.n(0,6.28),phase2=r.n(0,6.28);
    const amp=cfg.distort*r.n(2,24), freq=r.n(.007,.020);
    const P=(x,y)=>{
      let X=x*u-ww/2,Y=y*u-hh/2;
      X+=Math.sin(Y*freq+phase)*amp+Math.sin(X*freq*.43+phase2)*amp*.5;
      Y+=Math.sin(X*freq*.89+phase2)*amp*.74+Math.cos(Y*freq*.72+phase)*amp*.42;
      return [X,Y];
    };
    const point=(x,y)=>{let p=P(x,y);return `${f(p[0])} ${f(p[1])}`;};
    const middle=(a,b)=>P((a[0]+b[0])/2,(a[1]+b[1])/2);
    function drawLoop(pts) {
      let n=pts.length,at=(i)=>pts[(i%n+n)%n],m=middle(at(n-1),at(0));
      let out=`M${f(m[0])} ${f(m[1])}`;
      for(let i=0;i<n;i++){
        const q=P(at(i)[0],at(i)[1]),b=middle(at(i),at(i+1));
        if(at(i)[2]===CROSS)out+=`L${f(b[0])} ${f(b[1])}`;
        else out+=`C${f(m[0]+.47*(q[0]-m[0]))} ${f(m[1]+.47*(q[1]-m[1]))} ${f(b[0]+.47*(q[0]-b[0]))} ${f(b[1]+.47*(q[1]-b[1]))} ${f(b[0])} ${f(b[1])}`;
        m=b;
      }
      return out+'Z';
    }
    const edge=r.pick([pal[0],pal[0],pal[0],pal[1]]),ribbonWidth=u*r.n(.15,.33),edgeWidth=ribbonWidth*.13;
    const order=r.shuffle(pal.slice(1));
    const inkLayers=[];
    const ribbonColor=i=>order[i%order.length]||pal[1];
    const style=r.pick(['bands','linework','linework','double','double']);
    const makeStroke=(d,i,cap='round')=> {
      if(style==='linework'){
        let s=`<path d="${d}" stroke="${edge}" stroke-width="${f(ribbonWidth*.65)}" stroke-linecap="${cap}" stroke-linejoin="round" fill="none"/>`;
        if(i%2===0)s+=`<path d="${d}" stroke="${ribbonColor(i)}" stroke-width="${f(ribbonWidth*.21)}" opacity=".7" fill="none"/>`;
        return s;
      }
      const col=ribbonColor(i);
      let s=`<path d="${d}" stroke="${edge}" stroke-width="${f(ribbonWidth+2*edgeWidth)}" stroke-linecap="${cap}" stroke-linejoin="round" fill="none"/>`;
      s+=`<path d="${d}" stroke="${col}" stroke-width="${f(ribbonWidth)}" stroke-linecap="${cap}" stroke-linejoin="round" fill="none"/>`;
      if(style==='double')s+=`<path d="${d}" stroke="${edge}" stroke-width="${f(edgeWidth*.6)}" stroke-linecap="${cap}" fill="none"/>`;
      return s;
    };
    loops.forEach((pts,i)=>{inkLayers.push(makeStroke(drawLoop(pts),i));});
    // Repaint only the over-crossing stroke, keeping alternating weave intact.
    for(const [X,Y] of k.intersections) {
      if(k.state[k.idx(X,Y)]!==CROSS)continue;
      const back=(X%2===0);
      const a=back?[X-.55,Y-.55]:[X-.55,Y+.55],b=back?[X+.55,Y+.55]:[X+.55,Y-.55];
      const i=back?owner(2*X+1,2*Y+1):owner(2*X+1,2*Y-1);
      const midpoint=[(a[0]+b[0])/2,(a[1]+b[1])/2];
      const d=`M${point(...a)}Q${point(...midpoint)} ${point(...b)}`;
      inkLayers.push(makeStroke(d,i,'butt'));
    }
    const tilt=r.n(-18,18)*cfg.distort;
    const sx=r.n(.66,1.22),sy=r.n(.64,1.29);
    const tr=`translate(${f(cx)} ${f(cy)}) rotate(${f(rotation)}) skewX(${f(tilt)}) scale(${f(scale*sx)} ${f(scale*sy)})`;
    const main=`<g transform="${tr}" filter="url(#press)">${inkLayers.join('')}</g>`;
    const reg=cfg.misprint;
    if(!reg||!r.chance(.66))return main;
    const shift=r.n(2,15)*reg;
    const register=`<g transform="translate(${f(shift)} ${f(-shift*.7)})" opacity="${f(.1+.25*reg)}"><g transform="${tr}" fill="none" stroke="${pal[r.int(1,pal.length-1)]}" filter="url(#dry)">${loops.slice(0,Math.max(1,Math.round(loops.length*.7))).map(pts=>`<path d="${drawLoop(pts)}" fill="none" stroke="currentColor" stroke-width="${f(ribbonWidth*.7)}"/>`).join('')}</g></g>`;
    // Colored copies use the stroke attribute explicitly; currentColor is
    // avoided here for standalone SVG viewers with no inherited CSS.
    return register.replaceAll('stroke="currentColor"',`stroke="${pal[1]}"`)+main;
  }


  /* Woven bands following an existing vine centreline. Alternating mask gaps
     preserve the over-under sequence at each crossing; unlike a tiled knot,
     this intertwines with the plant and shares its actual curve. */
  O.braidOnStem=(samples,pal,r,opts={})=>{
    if(!samples||samples.length<12)return '';
    const count=r.int(4,7),amp=opts.amplitude||4.9,band=opts.width||2.8;
    const id='braid-'+r.int(100000,999999999),a=[],b=[];
    const pts=Array.from({length:101},(_,i)=>samples[Math.round(i*(samples.length-1)/100)]);
    pts.forEach((p,i)=>{
      const t=i/100,normal=O.normal(p.tng),h=Math.sin(2*Math.PI*count*t)*amp;
      a.push([p.x+normal.x*h,p.y+normal.y*h]);
      b.push([p.x-normal.x*h,p.y-normal.y*h]);
    });
    const d=points=>'M'+points.map(p=>`${f(p[0])} ${f(p[1])}`).join('L');
    let am='',bm='';
    for(let k=1;k<2*count;k++){
      const t=k/(2*count),p=pts[Math.round(t*100)],gap=band*1.18;
      const hole=`<circle cx="${f(p.x)}" cy="${f(p.y)}" r="${f(gap)}" fill="black"/>`;
      if(k%2)am+=hole;else bm+=hole;
    }
    const mask=which=>`<mask id="${id}-${which}" maskUnits="userSpaceOnUse" x="0" y="0" width="850" height="1000"><rect x="0" y="0" width="850" height="1000" fill="white"/>${which==='a'?am:bm}</mask>`;
    const A=d(a),B=d(b),edge=pal.ink,colors=[pal.ochre,pal.lapis,pal.vermillion,pal.green];
    const ribbon=(path,col,maskid)=>`<g mask="url(#${maskid})"><path d="${path}" fill="none" stroke="${edge}" stroke-width="${f(band+1.05)}" stroke-linecap="round" stroke-linejoin="round"/><path d="${path}" fill="none" stroke="${col}" stroke-width="${f(band)}" stroke-linecap="round" stroke-linejoin="round"/></g>`;
    return `<defs>${mask('a')}${mask('b')}</defs><g opacity=".88">${ribbon(A,r.pick(colors),id+'-a')}${ribbon(B,r.pick(colors),id+'-b')}</g>`;
  };

  /* Dense interlace inside a deliberately non-rectangular cartouche.
     A cartouche is located by the composition planner, usually near growth
     or a letter terminal. Underlying grid crossings still obey mirror curves. */
  O.knotCartouche=(cell,cfg,palette,r)=>{
    const x=cell.x,y=cell.y,rx=cell.rx,ry=cell.ry;
    const id='cartouche-'+r.int(100000,999999999),col=palette[0];
    const n=16,ps=[];
    const phi=r.n(0,6.28);
    for(let i=0;i<n;i++){
      const theta=2*Math.PI*i/n,mod=1+.065*Math.sin(5*theta+phi)+.03*Math.sin(9*theta-phi);
      ps.push([x+rx*Math.cos(theta)*mod,y+ry*Math.sin(theta)*mod]);
    }
    const midpoint=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];
    const first=midpoint(ps[n-1],ps[0]);
    let outline=`M${f(first[0])} ${f(first[1])}`;
    ps.forEach((p,i)=>{const q=midpoint(p,ps[(i+1)%n]);outline+=`Q${f(p[0])} ${f(p[1])} ${f(q[0])} ${f(q[1])}`;});
    outline+='Z';
    const inner=`<path d="${outline}" fill="${palette[3]||palette[2]}" fill-opacity=".075" stroke="${col}" stroke-width="1.3"/>`;
    const border=`<path d="${outline}" fill="none" stroke="${palette[2]}" stroke-width="4.2" stroke-opacity=".65"/>`;
    const knots=O.knot(x,y,Math.min(rx,ry)/260,cell.rotation||0,{density:cfg.density||.5,distort:cfg.distort||0,misprint:cfg.misprint||0},palette,r,{big:true});
    let rivets='';
    for(let i=0;i<8;i++){
      const a=2*Math.PI*i/8,xp=x+(rx*.91)*Math.cos(a),yp=y+(ry*.91)*Math.sin(a);
      rivets+=O.circle(xp,yp,r.n(.8,2.1),palette[(i%3)+1],`stroke="${col}" stroke-width=".45"`);
    }
    return `<defs><clipPath id="${id}"><path d="${outline}"/></clipPath></defs>`+
      `<g opacity=".9">${inner}<g clip-path="url(#${id})">${knots}</g>${border}${rivets}</g>`;
  };

  O.knot=renderKnot;
})(window.MS);

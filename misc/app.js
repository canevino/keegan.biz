(() => {
  "use strict";
  // Abstract ornament machine. The woven-grid engine is adapted from the
  // George Bain mirror-curve method, as implemented by Olivier Giulieri
  // in Celtic Knot Maker (MIT). See README and THIRD_PARTY_LICENSES.md.
  const W = 1200, H = 1000;
  const $ = id => document.getElementById(id);
  const ctl = ["mode","palette","density","knots","growth","glyphs","distort","bleed","misprint","seed"];
  const rangeIds = ["density","knots","growth","glyphs","distort","bleed","misprint"];
  const colors = {
    site: ["#11110f","#c1272d","#006a44","#fdb913"],
    insular: ["#201c18","#ac3d22","#42624b","#284b8b","#c7a148"],
    night: ["#11110f","#17338c","#9e1f39","#6b5735"],
    acid: ["#151712","#e53331","#d8d726","#007c7c","#8025ad"],
    mono: ["#11110f","#11110f","#11110f"]
  };
  const modes = {
    chance: {k:1, v:.6, t:1, g:1, debris:1},
    interlace: {k:2.1,v:.3,t:.7,g:.5,debris:.55},
    wild: {k:.48,v:.7,t:2.5,g:.45,debris:.8},
    letters: {k:.55,v:.25,t:.85,g:2.6,debris:.9},
    debris: {k:.95,v:.35,t:1.0,g:1.05,debris:2.2}
  };
  const esc = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  const f = n => Number(n.toFixed(2));
  const clamp = (x,a,b) => Math.max(a,Math.min(b,x));
  const mixRgb = (a,b,t) => {
    const A = a.match(/[0-9a-f]{2}/gi).map(s=>parseInt(s,16));
    const B = b.match(/[0-9a-f]{2}/gi).map(s=>parseInt(s,16));
    return '#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join('');
  };
  function pigment(a,b,t) {
    if (window.spectral && typeof window.spectral.mix === 'function' && typeof window.spectral.Color === 'function') {
      try {return window.spectral.mix([new window.spectral.Color(a),1-t],[new window.spectral.Color(b),t]).toString();} catch(e) {}
    }
    return mixRgb(a,b,t);
  }
  // Integer-seeded xorshift: same seed + settings produces the same structure.
  function RNG(seed) {
    let x=(seed>>>0)||0x9e3779b9;
    return {
      next() {x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;},
      n(a,b) {return a+(b-a)*this.next();},
      int(a,b) {return Math.floor(this.n(a,b+1));},
      chance(p) {return this.next()<p;},
      pick(a) {return a[Math.floor(this.next()*a.length)];},
      sign() {return this.chance(.5)?-1:1;},
      shuffle(arr) {for(let i=arr.length-1;i>0;i--){const j=this.int(0,i);[arr[i],arr[j]]=[arr[j],arr[i]];}return arr;}
    };
  }
  function settings() {
    return {
      mode:$('mode').value,palette:$('palette').value,
      density:+$('density').value/100, knots:+$('knots').value/100, growth:+$('growth').value/100,
      glyphs:+$('glyphs').value/100,distort:+$('distort').value/100,
      bleed:+$('bleed').value/100,misprint:+$('misprint').value/100,
      seed:(Number($('seed').value)||1)>>>0
    };
  }
  const line = (a,b,c,d,col,width,op=1) => `<path d="M${f(a)} ${f(b)}L${f(c)} ${f(d)}" fill="none" stroke="${col}" stroke-width="${f(width)}" stroke-linecap="round" opacity="${f(op)}"/>`;
  const path = (d,col,sw=0,stroke='none',op=1) => `<path d="${d}" fill="${col}" stroke="${stroke}" stroke-width="${f(sw)}" opacity="${f(op)}"/>`;
  function shapeBlob(cx,cy,rx,ry,r,detail=12) {
    const pts=[];
    for(let i=0;i<detail;i++) {
      const a=(i/detail)*Math.PI*2, scale=r.n(.62,1.27);
      pts.push([cx+Math.cos(a)*rx*scale,cy+Math.sin(a)*ry*scale]);
    }
    const start=[(pts[0][0]+pts.at(-1)[0])/2,(pts[0][1]+pts.at(-1)[1])/2];
    let d=`M${f(start[0])} ${f(start[1])}`;
    for(let i=0;i<pts.length;i++) {const p=pts[i],q=pts[(i+1)%pts.length];d+=`Q${f(p[0])} ${f(p[1])} ${f((p[0]+q[0])/2)} ${f((p[1]+q[1])/2)}`;}
    return d+'Z';
  }
  function defs(cfg,r) {
    const b=cfg.bleed,d=cfg.distort;
    const light=1+5*b;
    return `<defs>
      <filter id="ink" x="-38%" y="-44%" width="176%" height="188%" color-interpolation-filters="sRGB">
        <feGaussianBlur in="SourceAlpha" stdDeviation="${f(.5+1.65*b)}" result="soft"/>
        <feComponentTransfer in="soft" result="threshold"><feFuncA type="discrete" tableValues="0 0 0 1 1 1 1 1"/></feComponentTransfer>
        <feMorphology in="threshold" operator="dilate" radius="${f(.18+1.25*b)}" result="spread"/>
        <feTurbulence type="fractalNoise" baseFrequency="${f(.009+.009*d)} ${f(.06+.10*d)}" numOctaves="3" seed="${r.int(1,1000)}" result="grain"/>
        <feDisplacementMap in="spread" in2="grain" scale="${f(1+7*d)}" xChannelSelector="R" yChannelSelector="G" result="fray"/>
        <feComposite in="SourceGraphic" in2="fray" operator="in" result="core"/>
        <feGaussianBlur in="SourceGraphic" stdDeviation="${f(.7+2.5*b)}" result="halo"/>
        <feComponentTransfer in="halo" result="faded"><feFuncA type="linear" slope="${f(.12+.24*b)}"/></feComponentTransfer>
        <feMerge><feMergeNode in="faded"/><feMergeNode in="core"/></feMerge>
      </filter>
      <filter id="rough" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB">
        <feTurbulence baseFrequency="${f(.014+.035*d)}" numOctaves="2" seed="${r.int(1,999)}" type="fractalNoise" result="n"/>
        <feDisplacementMap in="SourceGraphic" in2="n" scale="${f(light*.75)}" xChannelSelector="R" yChannelSelector="G"/>
      </filter>
      <filter id="grain" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
        <feTurbulence baseFrequency=".35" numOctaves="2" seed="${r.int(1,999)}" type="fractalNoise" result="n"/>
        <feColorMatrix in="n" type="saturate" values="0" result="mono"/>
        <feComponentTransfer in="mono" result="faint"><feFuncA type="linear" slope="0.18"/></feComponentTransfer>
        <feComposite in="faint" in2="SourceAlpha" operator="in" result="grainInside"/>
        <feBlend in="SourceGraphic" in2="grainInside" mode="multiply"/>
      </filter>
    </defs>`;
  }

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
    const edge=r.pick([pal[0],pal[0],pal[0],pal[1]]),ribbonWidth=u*r.n(.34,.62),edgeWidth=ribbonWidth*.18;
    const order=r.shuffle(pal.slice(1));
    const inkLayers=[];
    const ribbonColor=i=>order[i%order.length]||pal[1];
    const style=r.pick(['bands','bands','linework','double']);
    const makeStroke=(d,i,cap='round')=> {
      const col=style==='linework'?edge:ribbonColor(i);
      let s=`<path d="${d}" stroke="${edge}" stroke-width="${f(ribbonWidth+2*edgeWidth)}" stroke-linecap="${cap}" stroke-linejoin="round" fill="none"/>`;
      s+=`<path d="${d}" stroke="${col}" stroke-width="${f(style==='linework'?edgeWidth*1.2:ribbonWidth)}" stroke-linecap="${cap}" stroke-linejoin="round" fill="none"/>`;
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
    const main=`<g transform="${tr}" filter="url(#ink)">${inkLayers.join('')}</g>`;
    const reg=cfg.misprint;
    if(!reg||!r.chance(.66))return main;
    const shift=r.n(2,15)*reg;
    const register=`<g transform="translate(${f(shift)} ${f(-shift*.7)})" opacity="${f(.1+.25*reg)}"><g transform="${tr}" fill="none" stroke="${pal[r.int(1,pal.length-1)]}" filter="url(#rough)">${loops.slice(0,Math.max(1,Math.round(loops.length*.7))).map(pts=>`<path d="${drawLoop(pts)}" fill="none" stroke="currentColor" stroke-width="${f(ribbonWidth*.7)}"/>`).join('')}</g></g>`;
    // Colored copies use the stroke attribute explicitly; currentColor is
    // avoided here for standalone SVG viewers with no inherited CSS.
    return register.replaceAll('stroke="currentColor"',`stroke="${pal[1]}"`)+main;
  }
  // Branch engines: one stochastic L-system turtle, one space-colonization
  // attractor field. These grow vector skeletons, not figurative tree icons.
  // The former uses rewriting plus a [push]/[pop] turtle stack; the latter
  // assigns target points to their nearest branch, then extends toward the
  // weighted average. All branching and coordinates come from the shared seed.
  function growSystem(cx,cy,span,angle,cfg,pal,r) {
    const iterate=r.int(3,4),maxSymbols=1900;
    let sentence='F';
    const grammar=r.pick([
      ['F[+F]F[-F]F','F[-F]F','FF[+F][-F]'],
      ['FF[-F+F][+F-F]','F[+F]F[-F]','F[-F]F'],
      ['F[+F][-F]F','F[+F]F','F[-F]F'],
      ['FF[--F][+F]','F[-F]FF','F[+F]F']
    ]);
    for(let gen=0;gen<iterate;gen++) {
      let next='';
      for(const token of sentence) {
        if(token!=='F') {next+=token;continue;}
        next+=r.pick(grammar);
        if(next.length>maxSymbols)break;
      }
      if(next.length>maxSymbols)break;
      sentence=next;
    }
    const nF=[...sentence].filter(x=>x==='F').length;
    const baseStep=clamp(span/(iterate*6.4),7.5,24)*r.n(.68,1.14);
    const turn=r.n(.33,1.25),drift=r.n(-.08,.08);
    const baseWeight=r.n(4.5,13.5)*(.55+cfg.density*.75);
    const rootColor=r.pick(pal),branchColor=r.pick(pal);
    let x=cx,y=cy,a=angle,depth=0,segment=0,paths=[];
    const stack=[];
    for(const token of sentence) {
      if(token==='[') {stack.push([x,y,a,depth]);depth++;continue;}
      if(token===']') {if(stack.length)[x,y,a,depth]=stack.pop();continue;}
      if(token==='+'){a+=turn*r.n(.62,1.7);continue;}
      if(token==='-'){a-=turn*r.n(.62,1.7);continue;}
      if(token!=='F')continue;
      a+=drift+r.n(-.18,.18)*(0.35+cfg.distort*1.5);
      const len=baseStep*r.n(.45,1.5)*(depth? r.n(.7,1.1):1.2);
      const ex=x+Math.cos(a)*len,ey=y+Math.sin(a)*len;
      const normal=a+Math.PI/2;
      const bend=r.n(-1.7,1.7)*len*.58;
      const qx=(x+ex)/2+Math.cos(normal)*bend;
      const qy=(y+ey)/2+Math.sin(normal)*bend;
      const d=`M${f(x)} ${f(y)}Q${f(qx)} ${f(qy)} ${f(ex)} ${f(ey)}`;
      let width=Math.max(.65,baseWeight*Math.pow(.68,depth)*r.n(.75,1.15));
      const col=depth>2?branchColor:rootColor;
      paths.push(`<path d="${d}" fill="none" stroke="${col}" stroke-width="${f(width)}" stroke-linecap="round"/>`);
      if(segment%13===0&&r.chance(.48))paths.push(`<path d="${d}" fill="none" stroke="${r.pick(pal)}" stroke-width="${f(width*.32)}" opacity=".75" stroke-linecap="round"/>`);
      if(depth>=2&&r.chance(.055+.08*cfg.bleed))paths.push(path(shapeBlob(ex,ey,r.n(2,9),r.n(1,7),r,9),r.pick(pal)));
      x=ex;y=ey;segment++;
      if(segment>430)break;
    }
    return `<g filter="url(#ink)">${paths.join('')}</g>`;
  }
  function growAttractors(cx,cy,span,angle,cfg,pal,r) {
    const ct=Math.cos(angle),st=Math.sin(angle);
    const nodes=[{x:cx,y:cy,dir:angle,parent:-1,weight:1}];
    const clusterCount=r.int(2,4);
    const clusters=Array.from({length:clusterCount},(_,i)=>{
      const t=.30+(i+1)/clusterCount*.56;
      return {x:cx+ct*span*t+Math.cos(angle+Math.PI/2)*r.n(-span*.42,span*.42),
              y:cy+st*span*t+Math.sin(angle+Math.PI/2)*r.n(-span*.42,span*.42),
              sx:span*r.n(.16,.38),sy:span*r.n(.12,.4)};
    });
    let sites=Array.from({length:r.int(48,125)},()=>{
      const c=r.pick(clusters),u=r.n(-Math.PI,Math.PI),rad=Math.sqrt(r.next());
      return {x:c.x+Math.cos(u)*rad*c.sx,y:c.y+Math.sin(u)*rad*c.sy};
    });
    const step=r.n(13,23),reach=step*r.n(5.4,10.7),kill=step*r.n(.8,1.35);
    for(let round=0;round<135&&sites.length&&nodes.length<220;round++) {
      const influence=new Map();
      const keep=[];
      for(const site of sites) {
        let best=-1,bestD=reach*reach;
        for(let i=0;i<nodes.length;i++) {
          const dx=site.x-nodes[i].x,dy=site.y-nodes[i].y,d2=dx*dx+dy*dy;
          if(d2<bestD){bestD=d2;best=i;}
        }
        if(bestD<kill*kill)continue;
        keep.push(site);
        if(best>=0) {
          const n=nodes[best],dist=Math.sqrt(bestD);
          if(!influence.has(best))influence.set(best,{dx:0,dy:0,count:0});
          const item=influence.get(best);
          item.dx+=(site.x-n.x)/dist;item.dy+=(site.y-n.y)/dist;item.count++;
        }
      }
      sites=keep;
      if(!influence.size) {
        // Some attractors can be farther away than the influence radius.
        // Continue the main stem toward the nearest unvisited target.
        let bestD=Infinity,bestSite=null,tip=nodes.length-1;
        for(const site of sites){const dx=site.x-nodes[tip].x,dy=site.y-nodes[tip].y,d=dx*dx+dy*dy;if(d<bestD){bestD=d;bestSite=site;}}
        if(!bestSite)break;
        influence.set(tip,{dx:(bestSite.x-nodes[tip].x)/Math.sqrt(bestD),dy:(bestSite.y-nodes[tip].y)/Math.sqrt(bestD),count:1});
      }
      // Deliberately uneven competition creates voids rather than a symmetric canopy.
      for(const [index,force] of influence) {
        const n=nodes[index],target=Math.atan2(force.dy,force.dx);
        const diff=Math.atan2(Math.sin(target-n.dir),Math.cos(target-n.dir));
        const dir=n.dir+diff*r.n(.45,.85)+r.n(-.2,.2)*(cfg.distort+.35);
        const len=step*r.n(.75,1.25),xx=n.x+Math.cos(dir)*len,yy=n.y+Math.sin(dir)*len;
        if(!Number.isFinite(xx+yy))continue;
        // Spatial suppression keeps nearby tips from filling every gap.
        if(nodes.slice(-75).some((q,i)=>q!==n&&Math.hypot(q.x-xx,q.y-yy)<step*.43))continue;
        nodes.push({x:xx,y:yy,dir,parent:index,weight:1});
        if(nodes.length>=220)break;
      }
    }
    // Subtree mass controls the stroke width (branches taper naturally).
    for(let i=nodes.length-1;i>0;i--)nodes[nodes[i].parent].weight+=nodes[i].weight;
    const dark=r.pick(pal),accent=r.pick(pal),base=r.n(1.4,3.2)*(0.8+cfg.density*.6);
    let art='';
    for(let i=1;i<nodes.length;i++) {
      const n=nodes[i],p=nodes[n.parent],width=clamp(.7+Math.sqrt(n.weight)*base*.32,.8,12);
      const bend=r.n(-.29,.29)*(0.2+cfg.distort)*Math.hypot(n.x-p.x,n.y-p.y);
      const qx=(n.x+p.x)/2-Math.sin(n.dir)*bend,qy=(n.y+p.y)/2+Math.cos(n.dir)*bend;
      const d=`M${f(p.x)} ${f(p.y)}Q${f(qx)} ${f(qy)} ${f(n.x)} ${f(n.y)}`;
      art+=`<path d="${d}" fill="none" stroke="${n.weight<2 && i%17===0?accent:dark}" stroke-linecap="round" stroke-width="${f(width)}"/>`;
      if(n.weight<2&&r.chance(.13+.15*cfg.density)){
        // Ink reservoirs and torn calligraphic terminals, not leaves or blossoms.
        const rx=r.n(2,13),ry=r.n(1,5);
        art+=path(shapeBlob(n.x,n.y,rx,ry,r,r.int(7,12)),r.pick(pal),0,'none',r.n(.55,1));
      }
    }
    const offset=r.n(2,10)*cfg.misprint;
    const copy=offset>2&&r.chance(.55)?`<g opacity="${f(cfg.misprint*.25)}" transform="translate(${f(offset)} ${f(-offset)})" fill="none" stroke="${accent}" filter="url(#rough)">${nodes.slice(1).filter((_,i)=>i%4===0).map(n=>{const p=nodes[n.parent];return line(p.x,p.y,n.x,n.y,accent,1.1);}).join('')}</g>`:'';
    return copy+`<g filter="url(#ink)">${art}</g>`;
  }
  function growthField(cx,cy,cfg,pal,r) {
    const span=r.n(220,760)*(.5+cfg.growth*.8);
    const angle=r.n(-Math.PI,Math.PI);
    return (r.chance(.50)?growAttractors:growSystem)(cx,cy,span,angle,cfg,pal,r);
  }

  function drawVine(x,y,length,angle,pal,cfg,r,depth=0) {
    const color=r.pick(pal),width=r.n(depth?1.8:3.5,depth?6:12)*(.5+cfg.density);
    let d=`M${f(x)} ${f(y)}`;
    const pts=[[x,y]];
    let a=angle,px=x,py=y;
    const pieces=r.int(5,10);
    for(let i=0;i<pieces;i++){
      a+=r.n(-.65,.65)*(1+cfg.distort*.8);
      const step=length/pieces,ax=px+Math.cos(a)*step,ay=py+Math.sin(a)*step;
      const bend=a+r.n(-1,1);
      d+=`Q${f(px+Math.cos(bend)*step*.6)} ${f(py+Math.sin(bend)*step*.6)} ${f(ax)} ${f(ay)}`;
      pts.push([ax,ay]);px=ax;py=ay;
    }
    let out=`<path d="${d}" stroke="${color}" stroke-width="${f(width)}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    if(!depth&&r.chance(.6))out+=`<path d="${d}" transform="translate(${f(r.n(-4,4)*cfg.misprint)} ${f(r.n(-4,4)*cfg.misprint)})" stroke="${r.pick(pal)}" stroke-width="${f(width*.4)}" opacity=".48" fill="none"/>`;
    for(let i=1;i<pts.length-1;i++) {
      if(!r.chance(.36+cfg.density*.25))continue;
      const p=pts[i],pr=pts[i-1],next=pts[i+1];
      const tangent=Math.atan2(next[1]-pr[1],next[0]-pr[0]);
      const orient=tangent+r.sign()*r.n(.48,1.4);
      const seg=r.n(16,67)*(depth?.62:1);
      if(r.chance(.66)) {
        const xx=p[0]+Math.cos(orient)*seg, yy=p[1]+Math.sin(orient)*seg;
        const blade=`M${f(p[0])} ${f(p[1])}Q${f(xx+r.n(-23,23))} ${f(yy+r.n(-23,23))} ${f(xx)} ${f(yy)}Q${f((p[0]+xx)/2+r.n(-15,15))} ${f((p[1]+yy)/2+r.n(-15,15))} ${f(p[0])} ${f(p[1])}Z`;
        out+=path(blade,r.pick(pal),0,'none',r.n(.55,1));
      } else {
        const xx=p[0]+Math.cos(orient)*seg,yy=p[1]+Math.sin(orient)*seg;
        out+=line(p[0],p[1],xx,yy,r.pick(pal),r.n(1.1,4.2));
        if(r.chance(.5))out+=path(shapeBlob(xx,yy,r.n(2,7),r.n(2,8),r,8),r.pick(pal));
      }
      if(!depth&&r.chance(.12))out+=drawVine(p[0],p[1],length*r.n(.18,.4),orient,pal,cfg,r,1);
    }
    return out;
  }
  function drawLetter(cx,cy,size,angle,pal,cfg,r) {
    const alphabet='AÆBCEFGHIKLMNØPRSTUVWXYZÞŒ';
    const chars=r.chance(.7)?1:r.int(2,5);
    let str='';for(let i=0;i<chars;i++)str+=alphabet[r.int(0,alphabet.length-1)];
    const serif=r.chance(.73),family=serif?'Georgia, Times New Roman, serif':'Helvetica, Arial, sans-serif';
    const xskew=r.n(-29,29)*(0.2+cfg.distort),yscale=r.n(.45,1.45);
    const outline=r.chance(.30),fontSize=size/(chars===1?1:chars*.6);
    const x=f(cx),y=f(cy);
    const ink=r.pick(pal),other=r.pick(pal);
    let base=`<text x="0" y="0" font-family="${esc(family)}" font-size="${f(fontSize)}" font-weight="${serif?900:800}" letter-spacing="${f(r.n(-.13,.04)*fontSize)}" text-anchor="middle" dominant-baseline="central" paint-order="stroke fill" ${outline?`fill="none" stroke="${ink}" stroke-width="${f(r.n(1,5))}"`:`fill="${ink}" stroke="${ink}" stroke-width="${f(r.n(.5,2.2)*cfg.bleed)}"`}>${esc(str)}</text>`;
    const tr=`translate(${x} ${y}) rotate(${f(angle)}) skewX(${f(xskew)}) scale(${f(r.n(.74,1.28))} ${f(yscale)})`;
    let s=`<g transform="${tr}" filter="url(#ink)">${base}</g>`;
    if(cfg.misprint>.05&&r.chance(.75)) {
      const dx=r.n(-25,25)*cfg.misprint,dy=r.n(-22,22)*cfg.misprint;
      s=`<g transform="translate(${f(dx)} ${f(dy)})" opacity="${f(.15+.20*cfg.misprint)}"><g transform="${tr}" filter="url(#rough)">${base.replaceAll(ink,other)}</g></g>`+s;
    }
    if(r.chance(.47)) {
      // A fractured printing plate: secondary crop taken from the original letter.
      const clipId='cut'+r.int(1,999999999);
      const w=fontSize*r.n(.23,.75),h=fontSize*r.n(.17,.56);
      s+=`<defs><clipPath id="${clipId}"><rect x="${f(cx-w/2)}" y="${f(cy-h/2)}" width="${f(w)}" height="${f(h)}" transform="rotate(${f(angle)} ${x} ${y})"/></clipPath></defs>`;
      s+=`<g clip-path="url(#${clipId})" transform="translate(${f(r.n(-15,15)*cfg.distort)} ${f(r.n(-22,22)*cfg.distort)})" opacity=".92"><g transform="${tr}">${base}</g></g>`;
    }
    return s;
  }
  function fragments(cfg,pal,r,n) {
    let s='';
    for(let i=0;i<n;i++){
      const x=r.n(-40,W+40),y=r.n(-40,H+40),col=r.pick(pal);
      const style=r.int(0,5);
      if(style===0){const d=shapeBlob(x,y,r.n(7,65),r.n(3,34),r,r.int(7,15));s+=path(d,col,0,'none',r.n(.45,1));}
      else if(style===1){let angle=r.n(-Math.PI,Math.PI),len=r.n(25,200);s+=line(x,y,x+Math.cos(angle)*len,y+Math.sin(angle)*len,col,r.n(2,17),r.n(.45,1));}
      else if(style===2){const a=r.n(9,55),b=r.n(2,22),d=`M${f(x)} ${f(y)}l${f(a)} ${f(-b)} ${f(-a*.2)} ${f(b*2.2)}z`;s+=path(d,col);}
      else if(style===3){const dots=r.int(4,25);for(let j=0;j<dots;j++)s+=`<circle cx="${f(x+r.n(-58,58))}" cy="${f(y+r.n(-44,44))}" r="${f(r.n(.6,3.7))}" fill="${col}" opacity="${f(r.n(.35,.85))}"/>`;}
      else if(style===4){const sq=r.n(9,60),skew=r.n(-.4,.4);s+=`<path d="M${f(x)} ${f(y)} l${f(sq)} ${f(sq*skew)} l${f(r.n(-12,12))} ${f(sq*.4)} l${f(-sq)} ${f(-sq*.2)}Z" fill="${col}" opacity="${f(r.n(.25,.75))}"/>`;}
      else {for(let j=0;j<r.int(2,8);j++){const w=r.n(3,12);s+=`<rect x="${f(x+j*r.n(6,14))}" y="${f(y+r.n(-9,9))}" width="${f(w)}" height="${f(r.n(3,12))}" fill="${col}" opacity="${f(r.n(.4,.85))}"/>`;}}
    }
    return s;
  }
  let lastSvg='';
  function build(cfg) {
    const r=RNG(cfg.seed),weights={...modes[cfg.mode]};
    if(cfg.mode==='chance') {
      // Each seed chooses a different compositional emphasis and not just a layout.
      weights.k*=r.n(.35,2.25);weights.v*=r.n(.30,2.55);weights.t*=r.n(.2,2.7);
      weights.g*=r.n(.30,2.6);weights.debris*=r.n(.45,2.1);
    }
    const pal=cfg.palette==='chance'?colors[r.pick(['site','insular','night','acid'])].slice():colors[cfg.palette].slice();
    if(cfg.palette!=='mono'&&r.chance(.65))pal.splice(r.int(1,pal.length-1),0,pigment(r.pick(pal),r.pick(pal),r.n(.25,.7)));
    const fullness=.6+cfg.density*1.1;
    const knotCount=clamp(Math.round(cfg.knots*weights.k*r.n(3.2,7.8)*fullness),0,15);
    const vineCount=clamp(Math.round(weights.v*r.n(3,9)*fullness),0,22);
    const growthCount=cfg.growth===0?0:clamp(Math.round(cfg.growth*weights.t*r.n(2.5,6.2)*fullness),0,10);
    const letterCount=clamp(Math.round(cfg.glyphs*weights.g*r.n(4,12)*fullness),0,30);
    const fragmentCount=clamp(Math.round(weights.debris*r.n(19,60)*fullness),2,140);
    const composition=r.int(0,5);
    // Distinct macro layouts: peripheral, central, diagonally interrupted,
    // distributed, fractured, and narrow long-field.
    const anchor=(i,kind)=>{
      if(composition===0) {const a=r.n(0,Math.PI*2),rad=r.n(120,480);return [W/2+Math.cos(a)*rad,H/2+Math.sin(a)*rad];}
      if(composition===1) return [r.n(230,970),r.n(170,810)];
      if(composition===2) return [r.n(50,1150),clamp(200+r.n(-150,150)+i*65,30,970)];
      if(composition===3) return [r.n(-30,W+30),r.n(-40,H+40)];
      if(composition===4) return [kind==='k'?r.pick([r.n(70,360),r.n(800,1100)]):r.n(50,1120),r.n(60,940)];
      return [W/2+r.n(-250,250),r.n(-100,1100)];
    };
    const knots=[],vines=[],letters=[],growth=[],other=[];
    const half=Math.ceil(knotCount*.4);
    for(let i=0;i<knotCount;i++) {
      const [x,y]=anchor(i,'k');
      const sc= (i<half?r.n(.72,1.25):r.n(.28,.78))*r.n(.65,1.15);
      knots.push(renderKnot(x,y,sc,r.n(-140,140),cfg,pal,r,{big:i<half}));
    }
    for(let i=0;i<vineCount;i++) {
      const [x,y]=anchor(i,'v');
      vines.push(drawVine(x,y,r.n(170,630),r.n(-Math.PI,Math.PI),pal,cfg,r));
    }
    for(let i=0;i<growthCount;i++) {
      const [x,y]=anchor(i,'t');
      growth.push(growthField(x,y,cfg,pal,r));
    }
    for(let i=0;i<letterCount;i++) {
      const [x,y]=anchor(i,'g');
      const size=i<Math.max(1,letterCount*.27)?r.n(200,570):r.n(35,210);
      letters.push(drawLetter(x,y,size,r.n(-175,175),pal,cfg,r));
    }
    other.push(fragments(cfg,pal,r,fragmentCount));
    // Richer compositions are layered, but the ordering itself is randomized:
    // ornaments frequently cross letters rather than sitting politely around them.
    const layers=r.shuffle([`<g filter="url(#ink)">${vines.join('')}</g>`,`<g>${knots.join('')}</g>`,`<g>${letters.join('')}</g>`,`<g>${growth.join('')}</g>`]);
    const inkSplashes=r.int(5,16);
    let stains='';
    for(let i=0;i<inkSplashes;i++)if(r.chance(.55)){
      const [x,y]=anchor(i,'stain');
      const rx=r.n(9,57)*(.6+cfg.bleed),ry=r.n(3,28)*(.6+cfg.bleed);
      stains+=path(shapeBlob(x,y,rx,ry,r,r.int(9,18)),r.pick(pal),0,'none',r.n(.35,.85));
    }
    const body=`<g filter="url(#rough)">${other.join('')}</g>${layers[0]}<g filter="url(#ink)">${stains}</g>${layers[1]}${layers[2]}${layers[3]}`;
    return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-label="Abstract ink ornament, transparent background">${defs(cfg,r)}${body}</svg>`;
  }
  function redraw(){
    $('status').textContent='drawing…';
    try{
      const cfg=settings();lastSvg=build(cfg);
      $('artwork').innerHTML=lastSvg.replace(/^<\?xml[^>]*>\s*/, '');
      $('status').textContent='seed '+cfg.seed;
    }catch(err){console.error(err);$('status').textContent='error — see console';}
  }
  function randomSeed() {
    const a=new Uint32Array(1);
    if(window.crypto?.getRandomValues)window.crypto.getRandomValues(a);else a[0]=Math.floor(Math.random()*4294967295);
    return a[0]||1;
  }
  function regenerate(){ $('seed').value=randomSeed();redraw(); }
  function filename(ext){return `keegan-ornament-${settings().seed}.${ext}`;}
  function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),8000);}
  async function savePng() {
    if(!lastSvg)return;
    const btn=$('png-export');btn.disabled=true;$('status').textContent='exporting transparent png…';
    const url=URL.createObjectURL(new Blob([lastSvg],{type:'image/svg+xml;charset=utf-8'}));
    try{
      const image=new Image();
      await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=url;});
      const canvas=document.createElement('canvas');
      // Browser export is intentionally high-resolution; transparency stays intact.
      canvas.width=2400;canvas.height=2000;
      const ctx=canvas.getContext('2d',{alpha:true});ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.drawImage(image,0,0,canvas.width,canvas.height);
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
      if(!blob)throw Error('Canvas export failed');
      download(blob,filename('png'));
      $('status').textContent='png saved';
    }catch(e){console.error(e);$('status').textContent='export failed — try svg';}
    finally{URL.revokeObjectURL(url);btn.disabled=false;}
  }
  function init(){
    $('seed').value=randomSeed();
    rangeIds.forEach(id=>{
      const update=()=>{$(id+'-value').textContent=$(id).value;};update();
      $(id).addEventListener('input',()=>{update();redraw();});
    });
    ['mode','palette'].forEach(id=>$(id).addEventListener('change',redraw));
    $('seed').addEventListener('change',redraw);
    $('seed').addEventListener('keydown',e=>{if(e.key==='Enter')redraw();});
    $('generate').addEventListener('click',regenerate);
    $('use-seed').addEventListener('click',redraw);
    $('svg-export').addEventListener('click',()=>{if(lastSvg)download(new Blob([lastSvg],{type:'image/svg+xml;charset=utf-8'}),filename('svg'));});
    $('png-export').addEventListener('click',savePng);
    window.addEventListener('keydown',e=>{if((e.code==='Space' || e.key==='r')&&!e.repeat&&!['INPUT','SELECT','TEXTAREA','BUTTON'].includes(document.activeElement?.tagName)){e.preventDefault();regenerate();}});
    redraw();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

/* Illuminarium — original SVG illustration engine for keegan.biz/misc.
   No framework, build process or external artwork required. */
(() => {
  'use strict';
  const W = 780, H = 1080;
  const $ = id => document.getElementById(id);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const fix = n => Number(n.toFixed(2));
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  const palettes = {
    lapis: {paper:'#f2e6ca', dark:'#2c211f', faded:'#947b65', red:'#c3432b', blue:'#243d9b', green:'#567d44', gold:'#d2a440', lilac:'#8a527a', light:'#f4d78b'},
    moss: {paper:'#e8dec2', dark:'#30251e', faded:'#806e54', red:'#a83b40', blue:'#44647a', green:'#3c6c4f', gold:'#c69d4e', lilac:'#9a697a', light:'#e1c47e'},
    midnight: {paper:'#e8dfc8', dark:'#211a29', faded:'#897b77', red:'#b83749', blue:'#1b276b', green:'#386d69', gold:'#d2a83e', lilac:'#75497c', light:'#f4d8a0'},
    rose: {paper:'#f1e1d1', dark:'#3d293b', faded:'#ae8d86', red:'#bd4b67', blue:'#3d5fb1', green:'#62867c', gold:'#cf9b51', lilac:'#955e99', light:'#edd0aa'}
  };
  const labels = {hours:'BOOK OF HOURS',insular:'INSULAR CARPET PAGE',gothic:'GOTHIC STORY PAGE',distorted:'DISTORTED ORNAMENT'};
  const descriptions = {
    hours:'Botanical marginalia, small figures, gold details and rubricated text.',
    insular:'Geometric interlace, spirals, medallions and a monumental initial.',
    gothic:'Pointed arches, diagrammatic scenes and manuscript panel borders.',
    distorted:'Wandering vines, irregular color fields, mosaic pixels and misregistered pigments.'
  };
  let state = {}, previewWidth = 0, zoom = 1, svgMarkup = '';
  let random = () => .5;
  const rnd = (a=0,b=1) => a + (b-a)*random();
  const ri = (a,b) => Math.floor(rnd(a,b+1));
  const choose = arr => arr[ri(0,arr.length-1)];
  const prob = p => random() < p;
  const rgb = hex => hex.replace('#','').match(/.{2}/g).map(x=>parseInt(x,16));
  const hex = ar => '#' + ar.map(x=>Math.round(clamp(x,0,255)).toString(16).padStart(2,'0')).join('');
  const pigmentCache = new Map();
  function mix(a,b,t) {
    t = clamp(t,0,1); const k=a+b+Math.round(t*100);
    if (pigmentCache.has(k)) return pigmentCache.get(k);
    let value;
    if (window.spectral && window.spectral.Color && window.spectral.mix) {
      try {value = window.spectral.mix([new window.spectral.Color(a), 1-t],[new window.spectral.Color(b),t]).toString();} catch(e) {/* linear fallback */}
    }
    if(!value) {const aa=rgb(a), bb=rgb(b); value=hex(aa.map((x,i)=>x*(1-t)+bb[i]*t));}
    pigmentCache.set(k,value); return value;
  }
  function rng(seed) {let x=(seed>>>0)||1;return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;};}
  function path(d,fill='none',stroke='none',width=1,more='') {return `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" ${more}/>`;}
  function rect(x,y,w,h,fill,more='') {return `<rect x="${fix(x)}" y="${fix(y)}" width="${fix(w)}" height="${fix(h)}" fill="${fill}" ${more}/>`;}
  function circle(x,y,r,fill,more='') {return `<circle cx="${fix(x)}" cy="${fix(y)}" r="${fix(r)}" fill="${fill}" ${more}/>`;}
  function ellipse(x,y,rx,ry,fill,more='') {return `<ellipse cx="${fix(x)}" cy="${fix(y)}" rx="${fix(rx)}" ry="${fix(ry)}" fill="${fill}" ${more}/>`;}
  function text(x,y,t,size,fill,extra='') {return `<text x="${fix(x)}" y="${fix(y)}" fill="${fill}" font-size="${size}" ${extra}>${esc(t)}</text>`;}
  function group(content,transform='',extra='') {return `<g ${transform ? `transform="${transform}"` : ''} ${extra}>${content}</g>`;}
  function star(x,y,r,color) {return path(`M ${fix(x-r)} ${fix(y)} L ${fix(x+r)} ${fix(y)} M ${fix(x)} ${fix(y-r)} L ${fix(x)} ${fix(y+r)}`,'none',color,fix(r*.19),'stroke-linecap="round"');}
  function params() {
    return {style:$('style').value,palette:$('palette').value,scene:$('scene').value, initial:($('initial').value.trim().slice(0,1)||'I').toUpperCase(),
      words:$('manuscriptText').value.trim(),seed:clamp(Number($('seed').value)||1428,1,999999999),
      density:Number($('ornament').value)/100, age:Number($('age').value)/100, warp:Number($('warp').value)/100,
      mosaic:Number($('mosaic').value)/100, offset:Number($('offset').value)/100,
      gold:$('gold').checked, knots:$('knots').checked, grain:$('grain').checked};
  }
  function svgDefs(p) {
    const warm=mix(p.paper,p.gold,.24), margin=mix(p.paper,p.faded,.36), g=p.gold;
    return `<defs>
    <linearGradient id="parchment" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${p.paper}"/><stop offset=".5" stop-color="${warm}"/><stop offset="1" stop-color="${p.paper}"/></linearGradient>
    <radialGradient id="vignette"><stop offset=".62" stop-color="${p.paper}" stop-opacity="0"/><stop offset="1" stop-color="${margin}" stop-opacity=".57"/></radialGradient>
    <linearGradient id="gild" x1="0" y1="0" x2=".9" y2=".8"><stop stop-color="${mix(g,'#ffffff',.50)}"/><stop offset=".24" stop-color="${g}"/><stop offset=".53" stop-color="${mix(g,'#794518',.43)}"/><stop offset=".78" stop-color="${mix(g,'#fff4b4',.53)}"/><stop offset="1" stop-color="${g}"/></linearGradient>
    <pattern id="diaper" width="26" height="26" patternUnits="userSpaceOnUse"><path d="M0 13 L13 0 L26 13 L13 26Z" fill="none" stroke="${p.faded}" stroke-width=".8" opacity=".48"/>${circle(13,13,2,p.red,'opacity=".55"')}</pattern>
    <linearGradient id="mappedInk" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${p.red}"/><stop offset=".34" stop-color="${p.gold}"/><stop offset=".66" stop-color="${p.green}"/><stop offset="1" stop-color="${p.blue}"/></linearGradient>
    <pattern id="dots" width="17" height="17" patternUnits="userSpaceOnUse">${circle(3,4,.95,p.dark,'opacity=".38"')}${circle(11,12,.7,p.red,'opacity=".42"')}</pattern>
    <pattern id="pixelPattern" width="30" height="30" patternUnits="userSpaceOnUse">${rect(0,0,9,9,p.red,'opacity=".85"')}${rect(12,1,11,12,p.blue,'opacity=".6"')}${rect(1,13,11,8,p.gold,'opacity=".62"')}${rect(17,17,10,11,p.green,'opacity=".75"')}</pattern>
    <filter id="fibre" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".53" numOctaves="3" seed="${state.seed%77}" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
    <filter id="inkRough" x="-12%" y="-12%" width="124%" height="124%"><feTurbulence baseFrequency=".017 .029" numOctaves="2" seed="${state.seed%91}" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale="${fix(state.warp*(state.style==='distorted'?22:5))}" xChannelSelector="R" yChannelSelector="G"/></filter>
    <clipPath id="sheet"><rect width="780" height="1080"/></clipPath>
    </defs>`;
  }
  function pageGround(p) {
    let s=rect(0,0,W,H,'url(#parchment)');
    s+=rect(0,0,W,H,'url(#vignette)');
    s+=rect(0,0,W,H,'#6b4527',`filter="url(#fibre)" opacity="${fix(state.grain ? .095 : 0)}" style="mix-blend-mode:multiply"`);
    for(let i=0;i<95*state.age;i++) {let x=choose([rnd(6,80),rnd(700,774)]),y=rnd(0,H);s+=circle(x,y,rnd(1.5,13),p.faded,`opacity="${fix(rnd(.015,.08))}"`);}
    if(state.age>.3)for(let j=0;j<30;j++){let x=rnd(10,770), y=choose([rnd(6,55),rnd(1025,1072)]);s+=ellipse(x,y,rnd(5,26),rnd(1,6),p.faded,`opacity="${fix(rnd(.015,.07))}"`);}
    return s;
  }
  function border(x,y,w,h,p,weight=1) {
    let s=rect(x,y,w,h,'none',`stroke="${p.dark}" stroke-width="${fix(weight*2.1)}"`);
    s+=rect(x+6,y+6,w-12,h-12,'none',`stroke="${p.gold}" stroke-width="${fix(weight*3.1)}"`);
    s+=rect(x+12,y+12,w-24,h-24,'none',`stroke="${p.dark}" stroke-width="${fix(weight*.9)}"`);
    return s;
  }
  function beadLine(x1,y1,x2,y2,n,p) {let s='';for(let i=0;i<n;i++){const t=(i+.5)/n;s+=circle(x1+(x2-x1)*t,y1+(y2-y1)*t,2.1,p.gold,`stroke="${p.dark}" stroke-width=".35"`);}return s;}
  function rosette(x,y,r,p,alt=false) {
    let s='';const c=alt?p.blue:p.red,n=alt?6:5;
    for(let i=0;i<n;i++){let a=i*Math.PI*2/n;
      s+=ellipse(x+Math.cos(a)*r*.53,y+Math.sin(a)*r*.53,r*.35,r*.66,c,`stroke="${p.dark}" stroke-width="${fix(.52+r*.025)}" transform="rotate(${fix(a*180/Math.PI+90)} ${fix(x+Math.cos(a)*r*.53)} ${fix(y+Math.sin(a)*r*.53)})"`);
      s+=path(`M${fix(x)} ${fix(y)} Q${fix(x+Math.cos(a)*r*.7)} ${fix(y+Math.sin(a)*r*.7)} ${fix(x+Math.cos(a)*r*1.05)} ${fix(y+Math.sin(a)*r*1.05)}`,'none',p.gold,.6);
    }
    s+=circle(x,y,r*.29,p.gold,`stroke="${p.dark}" stroke-width=".8"`);s+=circle(x,y,r*.1,p.dark);
    return s;
  }
  function leaf(x,y,angle,len,p,shade,curvy=0) {
    const width=len*(.31+curvy*.11), color=shade;
    let d=`M0 0 C${fix(-width)} ${fix(-len*.21)} ${fix(-width*.65)} ${fix(-len*.7)} 0 ${fix(-len)} C${fix(width*1.05)} ${fix(-len*.67)} ${fix(width)} ${fix(-len*.20)} 0 0Z`;
    let s=path(d,color,p.dark,.58)+path(`M0 0 Q${fix(len*.07)} ${fix(-len*.45)} 0 ${fix(-len)}`,'none',mix(p.dark,p.gold,.4),.47);
    return group(s,`translate(${fix(x)} ${fix(y)}) rotate(${fix(angle)})`);
  }
  function tendril(x,y,len,dir,p) {
    return path(`M${fix(x)} ${fix(y)} q${fix(dir*len*.47)} ${fix(-len*.3)} ${fix(dir*len*.5)} ${fix(-len*.65)} q0 ${fix(-len*.33)} ${fix(-dir*len*.23)} ${fix(-len*.2)} q${fix(-dir*len*.22)} ${fix(len*.13)} ${fix(dir*len*.09)} ${fix(len*.21)}`,'none',p.dark,fix(.45+len*.012), 'stroke-linecap="round"');
  }
  function vine(x,y,height,p,side=1,scale=1) {
    let s='',stem=[],count=clamp(Math.round(height/(30-state.density*12)),7,40);
    for(let i=0;i<=count;i++){let t=i/count, yy=y+t*height; let xx=x+Math.sin(t*6.5*Math.PI+state.seed*.01)*((12+state.warp*19)*scale) + Math.sin(t*13*Math.PI)*4*scale;stem.push([xx,yy]);}
    let d=`M${fix(stem[0][0])} ${fix(stem[0][1])}`;
    for(let i=0;i<count;i++){let [ax,ay]=stem[i],[bx,by]=stem[i+1],mx=(ax+bx)/2;d+=` Q${fix(mx+rnd(-3,3))} ${fix(ay+height/count*.33)} ${fix(bx)} ${fix(by)}`;}
    s+=path(d,'none',p.dark,2.5*scale,'stroke-linecap="round"');s+=path(d,'none',p.green,1.5*scale,'stroke-linecap="round"');
    for(let i=1;i<count;i++) {
      const [sx,sy]=stem[i], dir=(i%2?side:-side),reach=rnd(27,65)*scale,up=rnd(15,39)*scale;
      const ex=sx+dir*reach, ey=sy-up;
      s+=path(`M${fix(sx)} ${fix(sy)} Q${fix(sx+dir*reach*.68)} ${fix(sy-up*.10)} ${fix(ex)} ${fix(ey)}`,'none',p.dark,.86*scale);
      s+=leaf(ex,ey,dir>0?36:-36,rnd(15,28)*scale,p,choose([p.green,p.blue,p.red,mix(p.green,p.gold,.32)]),rnd(0,1));
      if(prob(.63)) s+=leaf(sx+dir*reach*.54,sy-up*.08,dir>0?95:-95,rnd(13,27)*scale,p,choose([p.green,p.gold,p.blue]));
      if(prob(state.density*.4+.18)) s+=rosette(ex+dir*rnd(0,9),ey-rnd(14,23),rnd(5,10)*scale,p,prob(.5));
      if(prob(.3))s+=tendril(ex,ey,15*scale,dir,p);
    }
    return s;
  }
  function vineSweep(x,y,w,h,p,reverse=false) {
    let s=''; const len=Math.hypot(w,h), angle=Math.atan2(h,w)*180/Math.PI-90;
    s=vine(0,0,len,p,reverse?-1:1,.8);
    return group(s,`translate(${fix(x)} ${fix(y)}) rotate(${fix(angle)})`);
  }
  function marginalCritter(x,y,p,k=0) {
    const c=choose([p.blue,p.green,p.red]);let s='';
    // Bird-like marginal ornament, not naturalistic clipart.
    s+=ellipse(0,0,19,11,c,`stroke="${p.dark}" stroke-width="1" transform="rotate(-22)"`);
    s+=path(`M-4 0 Q-25 -31 -43 -22 Q-17 -17 -11 8Z`,mix(c,p.gold,.4),p.dark,1);
    s+=path(`M7 -4 Q26 -22 35 -10 L31 -3 L12 3Z`,p.gold,p.dark,.9);
    s+=path(`M-12 6 Q-47 8 -57 35 Q-27 15 -10 13Z`,p.red,p.dark,1);
    s+=circle(19,-5,1.6,p.dark);s+=path('M14 4 L17 13 L5 14','none',p.dark,.9);
    return group(s,`translate(${x} ${y}) rotate(${k})`);
  }
  function knotTile(x,y,size,p,rotation=0) {
    const r=size, a=p.blue,b=p.gold,edge=p.dark, width=r*.13;
    let s='';
    s+=path(`M 0 ${r*.25} C ${r*.28} ${-r*.22} ${r*.72} ${r*1.22} ${r} ${r*.75}`,'none',edge,width+2,'stroke-linecap="round"');
    s+=path(`M 0 ${r*.25} C ${r*.28} ${-r*.22} ${r*.72} ${r*1.22} ${r} ${r*.75}`,'none',a,width,'stroke-linecap="round"');
    s+=path(`M 0 ${r*.75} C ${r*.28} ${r*1.22} ${r*.72} ${-r*.22} ${r} ${r*.25}`,'none',edge,width+2,'stroke-linecap="round"');
    s+=path(`M 0 ${r*.75} C ${r*.28} ${r*1.22} ${r*.72} ${-r*.22} ${r} ${r*.25}`,'none',b,width,'stroke-linecap="round"');
    s+=path(`M${r*.35} ${r*.35} Q${r*.5} ${r*.5} ${r*.65} ${r*.65}`,'none',edge,width+2,'stroke-linecap="round"');
    s+=path(`M${r*.35} ${r*.35} Q${r*.5} ${r*.5} ${r*.65} ${r*.65}`,'none',a,width,'stroke-linecap="round"');
    return group(s,`translate(${fix(x)} ${fix(y)}) rotate(${rotation})`);
  }
  function knotStrip(x,y,cols,rows,size,p) {
    let s='';for(let i=0;i<rows;i++)for(let j=0;j<cols;j++)s+=knotTile(x+j*size,y+i*size,size,p,(i+j)%2?0:90);
    return s;
  }
  function interlaceRound(x,y,r,p) {
    let s=circle(x,y,r,p.blue,`stroke="${p.dark}" stroke-width="2"`);
    s+=circle(x,y,r*.79,p.gold,`stroke="${p.dark}" stroke-width="2"`);
    s+=circle(x,y,r*.66,p.red,`stroke="${p.dark}" stroke-width="1.2"`);
    for(let i=0;i<3;i++) {let a=i*Math.PI*2/3,xx=x+r*.28*Math.cos(a), yy=y+r*.28*Math.sin(a);s+=circle(xx,yy,r*.27,p.paper,`stroke="${p.dark}" stroke-width="2"`);s+=circle(xx,yy,r*.18,p.blue,`stroke="${p.gold}" stroke-width="2"`);}
    s+=circle(x,y,r*.16,p.gold,`stroke="${p.dark}" stroke-width="1"`);return s;
  }
  function goldFleck(x,y,w,h,p) {
    if(!state.gold)return '';
    let s='';for(let j=0;j<Math.floor(w*h/570);j++){const xx=rnd(x,x+w), yy=rnd(y,y+h), rr=rnd(.5,2.5);s+=circle(xx,yy,rr,mix(p.gold,p.light,rnd(0,1)),`opacity="${fix(rnd(.4,.9))}"`);}
    return s;
  }
  function figure(x,y,s,p,kind='saint',flip=false,robeColor=null) {
    const robe=robeColor || choose([p.red,p.blue,p.green]), skin=mix(p.paper,p.red,.23);let g='';
    // y is the ground and everything is drawn in local proportions.
    g+=path(`M -20 0 Q-21 -25 -16 -43 L-20 -72 Q-8 -90 12 -72 L18 -36 L28 0 Q0 -6 -20 0Z`,robe,p.dark,1.3);
    g+=path(`M-10 -73 Q0 -52 6 -31 L19 -2`, 'none',mix(robe,p.paper,.4),2.4);
    g+=path(`M-2 -80 L6 -101 L12 -79`,skin,p.dark,1.2);
    g+=ellipse(0,-106,17,20,skin,`stroke="${p.dark}" stroke-width="1.15"`);
    g+=path(`M-15 -111 Q-16 -135 0 -129 Q16 -130 16 -112 Q2 -124 -15 -111Z`,kind==='angel'?p.gold:mix(p.gold,p.red,.34),p.dark,.9);
    g+=circle(0,-106,23,'none',`stroke="${p.gold}" stroke-width="${state.gold?4:1.5}"`);
    g+=path('M-7 -108 L-5 -109 M 5 -108 L7 -109 M -2 -99 Q2 -96 5 -100','none',p.dark,1.0);
    g+=path('M-12 -63 Q-26 -56 -20 -34 M11 -63 Q29 -47 21 -31','none',skin,7,'stroke-linecap="round"');
    g+=path('M-12 -63 Q-26 -56 -20 -34 M11 -63 Q29 -47 21 -31','none',p.dark,.7);
    if(kind==='angel'){
      g+=path('M-18 -72 Q-74 -109 -51 -150 Q-29 -134 -12 -84Z',p.light,p.gold,2);
      g+=path('M-21 -71 Q-66 -86 -60 -113 M-17 -82 Q-45 -110 -51 -137','none',p.blue,2);
    }
    if(kind==='scribe') {
      g+=rect(4,-48,30,21,p.paper,`stroke="${p.dark}" stroke-width="1" transform="rotate(-11 4 -48)"`);
      g+=path('M10 -30 L40 -71','none',p.dark,1);
    }
    return group(g,`translate(${fix(x)} ${fix(y)}) scale(${flip?-s:s} ${s})`);
  }
  function scenePanel(x,y,w,h,p,scene,variant=0) {
    let s=''; const bg=variant%2?p.blue:p.red;
    s+=rect(x,y,w,h,p.paper,`stroke="${p.dark}" stroke-width="1.6"`);
    s+=rect(x+5,y+5,w-10,h*.64,bg);
    s+=rect(x+5,y+h*.67,w-10,h*.29,p.gold);
    s+=rect(x+5,y+h*.67,w-10,h*.29,'url(#diaper)',`opacity=".8"`);
    s+=path(`M${x+5} ${y+h*.68} L${x+5} ${y+h*.26} Q${x+w*.5} ${y-h*.18} ${x+w-5} ${y+h*.26} L${x+w-5} ${y+h*.68}`,'none',p.gold,6);
    s+=path(`M${x+9} ${y+h*.66} L${x+9} ${y+h*.27} Q${x+w*.5} ${y-h*.13} ${x+w-9} ${y+h*.27} L${x+w-9} ${y+h*.66}`,'none',p.dark,1.3);
    for(let i=0;i<14;i++)s+=star(rnd(x+15,x+w-15),rnd(y+20,y+h*.6),rnd(2,5),p.light);
    if (scene==='garden') {
      s+=rect(x+w*.15,y+h*.65,w*.7,h*.05,p.green);
      s+=vine(x+w*.54,y+h*.42,h*.43,p,-1,.6);
      s+=figure(x+w*.28,y+h*.94,h/180,p,'saint',false,p.red);
      s+=figure(x+w*.77,y+h*.94,h/175,p,'saint',true,p.blue);
    } else if(scene==='scribe') {
      s+=figure(x+w*.34,y+h*.9,h/180,p,'scribe',false,p.red);
      s+=figure(x+w*.7,y+h*.9,h/190,p,'saint',true,p.green);
    } else {
      s+=figure(x+w*.31,y+h*.92,h/180,p,'angel',false,p.red);
      s+=figure(x+w*.71,y+h*.92,h/180,p,'saint',true,p.blue);
      s+=star(x+w*.5,y+h*.26,11,p.gold);
    }
    s+=border(x,y,w,h,p,.75);return s;
  }
  function manuscriptLines(x,y,w,maxLines,p,options={}) {
    const content=(state.words || 'Illuminatio in luce.').replace(/\s+/g,' ').split(' ');
    const size=options.size||24,line=options.line||38, maxChars=Math.max(12,Math.floor(w/(size*.52)));
    const lines=[];let cur='';
    for(const word of content){if((cur+' '+word).trim().length>maxChars && cur){lines.push(cur);cur=word;}else cur+=(cur?' ':'')+word;}
    if(cur)lines.push(cur);
    while(lines.length<maxLines)lines.push(lines[lines.length%Math.max(1,lines.length)]||'In principio erat verbum');
    let s='';
    for(let i=0;i<maxLines;i++) {
      let val=lines[i%lines.length], yy=y+i*line;
      s+=text(x,yy,val.slice(0,maxChars),size,i===0?p.red:p.dark,`font-family="Palatino Linotype, Book Antiqua, Georgia, serif" letter-spacing="-.8"`);
      if(prob(.23))s+=path(`M${x} ${yy+7} h${fix(rnd(w*.28,w*.84))}`,'none',p.gold,.68);
    }
    return s;
  }
  function decoratedInitial(x,y,size,p,letter=state.initial) {
    let s=''; const w=size*.84;
    s+=rect(x,y,w,size*.99,p.blue,`stroke="${p.dark}" stroke-width="3.6"`);
    s+=rect(x+7,y+7,w-14,size*.99-14,'none',`stroke="${p.gold}" stroke-width="2"`);
    for(let i=0;i<28*state.density;i++){
      const ax=rnd(x+10,x+w-10), ay=rnd(y+10,y+size-10);
      s+=circle(ax,ay,rnd(2.5,9),choose([p.red,p.green,p.gold]),`opacity=".8" stroke="${p.dark}" stroke-width=".4"`);
    }
    s+=text(x+w*.49,y+size*.80,letter,size*.92,state.gold?'url(#gild)':p.gold,`font-family="Georgia, Times New Roman, serif" font-weight="bold" text-anchor="middle" stroke="${p.dark}" stroke-width="2.6" paint-order="stroke fill"`);
    if(state.knots)s+=interlaceRound(x+w*.16,y+size*.16,size*.11,p);
    s+=goldFleck(x+12,y+12,w-24,size*.9,p);return s;
  }
  function headers(p) {return text(390,59,'ILLUMINARIUM · FOLIO '+state.seed,12,p.faded,'font-family="Georgia,serif" letter-spacing="3" text-anchor="middle"');}
  function cornerFiligree(x,y,s,p,rot) {
    let g=path(`M0 ${s} Q${s*.1} ${s*.12} ${s} 0 M${s*.14} ${s*.86} Q${s*.17} ${s*.19} ${s*.86} ${s*.14}`,'none',p.blue,4);
    g+=rosette(s*.1,s*.22,s*.12,p,true)+rosette(s*.26,s*.08,s*.1,p,false);
    g+=leaf(s*.36,s*.36,30,s*.27,p,p.green);
    return group(g,`translate(${x} ${y}) rotate(${rot})`);
  }
  function hoursPage(p) {
    let s='',dens=state.density;
    s+=rect(67,72,646,944,'none',`stroke="${p.gold}" stroke-width="1.2"`);
    s+=rect(80,86,620,916,'none',`stroke="${p.dark}" stroke-width=".5"`);
    s+=scenePanel(212,116,356,400,p,state.scene,0);
    // Three-dimensional niches around the central miniature.
    for(const x of [216,552]){
      s+=rect(x,120,10,380,mix(p.paper,p.blue,.11),`stroke="${p.dark}" stroke-width=".55"`);
      s+=ellipse(x+5,141,8,5,p.gold);
    }
    s+=rosette(393,103,12,p,true);
    // Ornate bounding botanical vines, dense but with visible manuscript space.
    s+=vine(116,113,804,p,1,1.02);s+=vine(660,109,817,p,-1,1.03);
    s+=vineSweep(163,980,450,0,p,true);
    if(dens>.46){s+=vine(156,180,620,p,-1,.51);s+=vine(616,238,615,p,1,.49);}
    for(let i=0;i<5;i++)s+=rosette(rnd(111,179),rnd(145,935),rnd(5,8),p,i%2===0);
    s+=decoratedInitial(213,546,95,p);
    s+=manuscriptLines(307,584,260,2,p,{size:25,line:35});
    s+=manuscriptLines(212,699,352,4,p,{size:24,line:48});
    s+=text(390,910,'✢   FINIS   ✢',23,p.red,'font-family="Georgia, serif" letter-spacing="3" text-anchor="middle"');
    s+=marginalCritter(145,936,p,12);s+=marginalCritter(629,964,p,-18);
    s+=cornerFiligree(90,86,65,p,0);s+=cornerFiligree(690,90,65,p,90);
    return s;
  }
  function carpetGrid(p) {
    let s='', left=99,top=115, cw=58,ch=58;
    s+=rect(74,89,632,904,p.blue);
    s+=border(74,89,632,904,p,1.9);
    s+=rect(107,122,566,836,p.red,`stroke="${p.gold}" stroke-width="5"`);
    if(state.knots){
      s+=knotStrip(left,107,10,2,cw,p);
      s+=knotStrip(left,864,10,2,cw,p);
      for(let j=0;j<12;j++){s+=knotTile(84,181+j*57,43,p);s+=knotTile(647,181+j*57,43,p);}
    }
    s+=rect(152,234,476,615,p.paper,`stroke="${p.dark}" stroke-width="5"`);
    s+=rect(166,248,448,587,p.gold,`stroke="${p.dark}" stroke-width="3"`);
    s+=rect(178,260,424,563,p.red,`stroke="${p.paper}" stroke-width="1"`);
    for(let i=0;i<11;i++){
      let ang=i*Math.PI*2/11;
      s+=interlaceRound(390+174*Math.cos(ang),539+237*Math.sin(ang),rnd(21,30),p);
    }
    s+=text(390,713,state.initial,508,state.gold?'url(#gild)':p.gold,'font-family="Georgia,serif" font-weight="bold" text-anchor="middle" stroke="'+p.dark+'" stroke-width="8" paint-order="stroke fill"');
    for(let i=0;i<16;i++){let ang=i*Math.PI*2/16, x=390+139*Math.cos(ang),y=535+171*Math.sin(ang);s+=rosette(x,y,rnd(8,14),p,i%2===0);}
    for(let i=0;i<4;i++)s+=interlaceRound(222+(i%2)*336,304+Math.floor(i/2)*465,37,p);
    // Linear spirals recalling Insular manuscript ornament.
    for(let i=0;i<12;i++){
      const x=144+(i%3)*246, y=134+Math.floor(i/3)*240;
      s+=path(`M${x} ${y} c25 -35 75 8 47 35 c-27 23 -53 -24 -23 -25 c24 -1 12 25 2 19`,'none',p.gold,2.4);
    }
    return s;
  }
  function insularPage(p){
    let s=carpetGrid(p);
    s+=rect(195,848,393,2,p.dark);
    
    s+=text(390,1021,'NOMEN ET SIGNUM',17,p.dark,'font-family="Georgia,serif" text-anchor="middle" letter-spacing="4"');
    return s;
  }
  function gothicPanels(p){
    let s=border(67,78,648,918,p,1.8), panels=[[95,149],[400,149],[95,530],[400,530]];
    s+=rect(87,96,609,51,p.blue);
    for(let i=0;i<10;i++) {
      let x=87+i*62;
      s+=path(`M${x} 147 L${x+31} 99 L${x+62} 147Z`,i%2?p.red:p.gold,p.dark,1.1);
      s+=star(x+31,116,5,p.paper);
    }
    panels.forEach(([x,y],i)=>{
      s+=rect(x,y,284,351,p.paper,`stroke="${p.dark}" stroke-width="2"`);
      s+=rect(x+5,y+5,274,343,i%2?p.red:p.blue);
      s+=rect(x+5,y+5,274,343,'url(#diaper)',`opacity=".3"`);
      s+=path(`M ${x+8} ${y+72} L${x+142} ${y+8} L${x+276} ${y+72}`,'none',p.gold,8);
      s+=path(`M ${x+20} ${y+75} L${x+142} ${y+21} L${x+264} ${y+75}`,'none',p.dark,1.4);
      s+=rect(x+6,y+258,272,89,p.gold);
      s+=rect(x+6,y+258,272,89,'url(#diaper)',`opacity=".75"`);
      if(i===2){
        s+=ellipse(x+142,y+272,85,40,p.paper,`stroke="${p.dark}" stroke-width="2"`);
        for(let j=0;j<3;j++)s+=figure(x+62+j*79,y+303,1.18,p,'saint',j%2===1,choose([p.blue,p.red,p.green]));
      }else {
        let count=i===1?2:3;
        for(let j=0;j<count;j++)s+=figure(x+(count===2?78+j*130:61+j*79),y+306,1.3,p,i===1&&j===0?'scribe':'saint',j%2===1,choose([p.red,p.blue,p.green]));
      }
      for(let k=0;k<11;k++)s+=star(rnd(x+28,x+256),rnd(y+80,y+175),rnd(1,4),p.gold);
      s+=border(x,y,284,351,p,.85);
    });
    s+=text(390,1043,'LIBER · PICTURARUM · '+state.seed,15,p.red,'font-family="Georgia,serif" text-anchor="middle" letter-spacing="2"');
    return s;
  }
  function gothicPage(p) {
    let s=gothicPanels(p);
    s+=rect(82,922,618,77,p.paper);
    s+=decoratedInitial(100,927,63,p);
    s+=manuscriptLines(176,950,495,1,p,{size:21});
    return s;
  }
  function latticeMosaic(x,y,w,h,p,rate=1) {
    let s='',cols=Math.floor(w/12),rows=Math.floor(h/12);
    const blocks=Math.floor(cols*rows*state.mosaic*.75*rate);
    for(let i=0;i<blocks;i++){
      const col=ri(0,cols-1), row=ri(0,rows-1), size=choose([6,12,18,24,31]);
      const c=choose([p.red,p.blue,p.green,p.gold,p.lilac,mix(p.red,p.blue,.5)]);
      s+=rect(x+col*12,y+row*12,size,size,c,`opacity="${fix(rnd(.22,.83))}"`);
    }
    return s;
  }
  function ornateSpiral(x,y,r,p,phase=0) {
    let d='',n=50;
    for(let i=0;i<=n;i++){let t=i/n,ang=phase+t*5*Math.PI,rr=r*(1-t); let xx=x+rr*Math.cos(ang),yy=y+rr*Math.sin(ang);d+=(i?' L':'M')+fix(xx)+' '+fix(yy);}
    let s=path(d,'none',p.dark,7,'stroke-linecap="round"');s+=path(d,'none',choose([p.gold,p.blue,p.red]),5,'stroke-linecap="round"');
    return s;
  }
  function distortedPage(p) {
    let s='', mis=state.offset*14;
    s+=rect(45,64,690,952,p.paper,`stroke="${p.dark}" stroke-width="2"`);
    // irregular abstract fields (fragmented print separations, not transparent stained glass)
    s+=path('M48 90 L350 63 L445 335 L173 475 L51 388Z',p.blue,p.dark,2);
    s+=path('M420 69 L734 67 L731 390 L572 320Z',p.red,p.dark,2);
    s+=path('M49 610 Q230 490 422 687 L735 525 L731 1015 L50 1014Z',p.green,p.dark,3);
    s+=rect(57,72,673,929,'url(#dots)',`opacity=".8"`);
    s+=rect(58,78,665,914,'url(#mappedInk)',`opacity=".16" style="mix-blend-mode:multiply"`);
    s+=latticeMosaic(59,78,650,909,p,1.3);
    // Misregistered printed color echoes, intentionally not perfectly aligned.
    if(state.offset>.02){
      s+=group(vine(121,126,800,{...p,green:p.red,blue:p.red,gold:p.red},1,1.55),`translate(${fix(mis)} ${fix(-mis*.53)})`,'opacity=".52"');
      s+=group(vine(624,114,815,{...p,green:p.blue,red:p.blue,gold:p.blue},-1,1.55),`translate(${fix(-mis*.8)} ${fix(mis*.3)})`,'opacity=".56"');
    }
    s+=group(vine(132,120,824,p,1,1.55),'','filter="url(#inkRough)"');
    s+=group(vine(643,126,824,p,-1,1.55),'','filter="url(#inkRough)"');
    s+=group(vineSweep(180,810,390,-540,p,false),'','filter="url(#inkRough)"');
    for(let i=0;i<10;i++) {
      let xx=rnd(150,630),yy=rnd(130,935), rr=rnd(22,56);
      if(prob(.5))s+=ornateSpiral(xx,yy,rr,p,rnd(0,Math.PI*2));
      else s+=rosette(xx,yy,rr*.55,p,i%2===0);
    }
    s+=path('M164 230 Q352 108 570 268 L599 487 Q378 595 176 443Z',p.paper,p.dark,4);
    s+=rect(189,258,390,198,'url(#pixelPattern)',`opacity="${fix(.18+state.mosaic*.55)}"`);
    s+=text(386,431,state.initial,258,state.gold?'url(#gild)':p.gold,`font-family="Georgia,serif" font-weight="bold" text-anchor="middle" stroke="${p.dark}" stroke-width="9" paint-order="stroke fill"`);
    s+=rect(134,558,530,14,p.dark);s+=rect(134,580,530,4,p.gold);
    s+=text(397,640,'✥  ORNAMENTUM  ✥',34,p.paper,'font-family="Georgia,serif" text-anchor="middle" letter-spacing="2" stroke="'+p.dark+'" stroke-width="4" paint-order="stroke fill"');
    s+=text(397,678,'fragmenta · flora · pigmenta',20,p.paper,'font-family="Georgia,serif" text-anchor="middle" font-style="italic"');
    s+=group(manuscriptLines(210,741,370,2,{...p,dark:p.paper,red:p.light},{size:19,line:30}), '',`opacity=".95"`);
    s+=rect(86,915,604,69,p.paper,`stroke="${p.dark}" stroke-width="3"`);
    s+=text(388,960,'ILLUMINATIO  /  '+String(state.seed).padStart(5,'0'),23,p.dark,'font-family="Georgia,serif" text-anchor="middle" letter-spacing="3"');
    return s;
  }
  function marginalSpeckle(p) {
    let s='';if(!state.grain)return s;
    for(let i=0;i<340*state.density;i++){
      const x=rnd(40,740),y=rnd(58,1014),r=rnd(.2,1.2);
      s+=circle(x,y,r,choose([p.red,p.dark,p.green,p.blue]),`opacity="${fix(rnd(.08,.36))}"`);
    }
    return s;
  }
  function makeFolio() {
    state=params(); random=rng(state.seed);pigmentCache.clear();
    const p=palettes[state.palette], base=svgDefs(p)+`<g clip-path="url(#sheet)">`+pageGround(p);
    let content = state.style==='hours'?hoursPage(p):state.style==='insular'?insularPage(p):state.style==='gothic'?gothicPage(p):distortedPage(p);
    svgMarkup=`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="A generated ${labels[state.style]} manuscript folio">${base}${content}${marginalSpeckle(p)}</g></svg>`;
    $('preview').innerHTML=svgMarkup;
    $('compositionName').textContent=labels[state.style];
    $('folioNumber').textContent='NO. '+String(state.seed).padStart(5,'0');
    $('styleNote').textContent=descriptions[state.style];
    $('pigmentStatus').textContent=window.spectral?.Color ? 'Pigment engine: Spectral.js 3.0' : 'Pigment engine: RGB fallback (Spectral.js loads when online)';
    $('pigmentStatus').title='Spectral.js models pigment-like mixtures. The SVG stays exportable without the library.';
  }
  function fileBlob(content,type) {return new Blob([content],{type});}
  function save(blob,filename) {const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2500);}
  function exportSvg() {save(fileBlob(svgMarkup,'image/svg+xml;charset=utf-8'),'illuminarium-'+state.style+'-'+state.seed+'.svg');}
  async function exportPng(){
    const button=$('downloadPNG'), prev=button.textContent;
    button.disabled=true;button.textContent='Rendering…';
    try{
      const data=new Blob([svgMarkup],{type:'image/svg+xml;charset=utf-8'});
      const url=URL.createObjectURL(data), img=new Image();
      await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(new Error('SVG preview could not be rasterized'));img.src=url;});
      const width=Number($('pngSize').value), height=Math.round(width*H/W),c=document.createElement('canvas');c.width=width;c.height=height;
      const ctx=c.getContext('2d');ctx.drawImage(img,0,0,width,height);URL.revokeObjectURL(url);
      const blob=await new Promise(res=>c.toBlob(res,'image/png'));
      if(!blob)throw Error('PNG creation failed');save(blob,'illuminarium-'+state.style+'-'+state.seed+'.png');
    }catch(e){alert('Could not export PNG: '+e.message+'\nTry downloading the SVG instead.');}
    finally {button.disabled=false;button.textContent=prev;}
  }
  function fit(){
    const stage=$('stage'), maxWidth=Math.min(stage.clientWidth-58,740);
    previewWidth=Math.max(190,maxWidth);zoom=1;applyZoom();
  }
  function applyZoom(){
    $('paperWrap').style.width=Math.round(previewWidth*zoom)+'px';
    $('zoomLabel').textContent=Math.round(100*zoom)+'%';
  }
  for(const id of ['ornament','age','warp','mosaic','offset']) {
    const field=$(id),label=$(id+'Out');
    field.addEventListener('input',()=>{label.textContent=field.value+'%';});
    field.addEventListener('change',makeFolio);
  }
  for(const id of ['style','palette','scene','gold','knots','grain','initial','manuscriptText','seed']) $(id).addEventListener('change',makeFolio);
  $('generate').addEventListener('click',()=>{let next=Number($('seed').value)+1;if(next>999999999)next=1;$('seed').value=next;makeFolio();});
  $('newSeed').addEventListener('click',()=>{$('seed').value=1+Math.floor(Math.random()*999999998);makeFolio();});
  $('downloadSVG').addEventListener('click',exportSvg);
  $('downloadPNG').addEventListener('click',exportPng);
  $('fitPage').addEventListener('click',fit);
  $('zoomOut').addEventListener('click',()=>{zoom=clamp(zoom-.15,.5,2);applyZoom();});
  $('zoomIn').addEventListener('click',()=>{zoom=clamp(zoom+.15,.5,2);applyZoom();});
  addEventListener('resize',()=>{if(zoom===1)fit();});
  makeFolio();fit();
  addEventListener('load',()=>{$('pigmentStatus').textContent=window.spectral?.Color?'Pigment engine: Spectral.js 3.0':'Pigment engine: RGB fallback (Spectral.js loads when online)';makeFolio();});
})();

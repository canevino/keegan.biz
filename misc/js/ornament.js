/* Ornament compositor: cleaner manuscript-inspired layouts with more natural vines. */
window.Ornament = window.Ornament || {};
((O)=>{
  'use strict';
  const {f,path,fill,rect,circle,blob,esc} = O;
  const V = (x,y) => `${f(x)} ${f(y)}`;
  const G = (tr,body,extra='') => `<g transform="${tr}" ${extra}>${body}</g>`;
  const dark = s => s.pal[0], red = s => s.pal[1], blue = s => s.pal[2], green = s => s.pal[3], gold = s => s.pal[4], paper = s => s.pal[5];
  const mix = (a,b,t) => O.pigment(a,b,t);

  function lineDecor(x,y,w,h,r,s,count=8){
    let z='';
    for(let i=0;i<count;i++){
      const xx=x+r.n(0,w), yy=y+r.n(0,h);
      if(r.chance(.62)) z += path(`M${V(xx,yy)}l${f(r.n(-6,6))} ${f(r.n(-2,10))}`, r.pick([dark(s), red(s), blue(s), gold(s)]), r.n(.22,.72), `opacity="${f(r.n(.08,.28))}"`);
      else z += rect(xx,yy,r.n(1,5.5),r.n(1,5.5), r.pick([red(s),blue(s),green(s),gold(s),dark(s)]), `opacity="${f(r.n(.08,.22))}"`);
    }
    return z;
  }

  function leaf(x,y,len,ang,s,r,fillCol){
    const wid = len * r.n(.24,.36);
    const curl = len * r.n(.08,.16) * r.sign();
    const tipX = Math.cos(ang) * len;
    const tipY = Math.sin(ang) * len;
    const leftX = Math.cos(ang - Math.PI/2) * wid;
    const leftY = Math.sin(ang - Math.PI/2) * wid;
    const rightX = Math.cos(ang + Math.PI/2) * wid;
    const rightY = Math.sin(ang + Math.PI/2) * wid;
    const d = `M0 0 C${f(leftX*.55)} ${f(leftY*.55)} ${f(leftX+curl*.18)} ${f(leftY+tipY*.38)} ${f(tipX)} ${f(tipY)} C${f(rightX+curl*.12)} ${f(rightY+tipY*.4)} ${f(rightX*.58)} ${f(rightY*.58)} 0 0 Z`;
    const vein = `M0 0 Q${f(tipX*.46+curl*.08)} ${f(tipY*.48)} ${f(tipX)} ${f(tipY)}`;
    const col = fillCol || r.pick([green(s), mix(green(s),gold(s),.2), red(s), blue(s)]);
    return G(`translate(${V(x,y)}) rotate(${f(ang*180/Math.PI)})`,
      fill(d,col,`stroke="${dark(s)}" stroke-width=".72"`) +
      path(vein, mix(dark(s), paper(s), .25), .5, `opacity=".74"`)
    );
  }

  function flower(x,y,size,s,r){
    let z='';
    const n = r.pick([4,5,6]);
    const cols = [red(s), blue(s), gold(s), green(s)];
    for(let i=0;i<n;i++){
      const a = (Math.PI*2*i/n) + r.n(-.08,.08);
      const cx = Math.cos(a) * size * .3;
      const cy = Math.sin(a) * size * .3;
      z += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(size*.18)}" ry="${f(size*.42)}" transform="rotate(${f(a*180/Math.PI)} ${f(cx)} ${f(cy)})" fill="${cols[i%cols.length]}" stroke="${dark(s)}" stroke-width=".65"/>`;
    }
    z += circle(0,0,size*.14,gold(s),`stroke="${dark(s)}" stroke-width=".8"`);
    return G(`translate(${V(x,y)}) rotate(${f(r.n(-18,18))})`,z);
  }

  function spiral(x,y,rad,s,r,col){
    let turns=r.n(1.2,2.2),steps=34,pts=[];
    for(let i=0;i<=steps;i++){
      let t=i/steps, a=t*turns*2*Math.PI + r.n(-.008,.008), rr=rad*(.08+.9*t);
      pts.push([x+Math.cos(a)*rr,y+Math.sin(a)*rr]);
    }
    return path('M'+V(...pts[0])+pts.slice(1).map(p=>'L'+V(...p)).join(''), col || dark(s), r.n(.8,1.4), 'stroke-linecap="round"');
  }

  function stemStroke(d,s,w,inner){
    const bark = inner || mix(dark(s), green(s), .18);
    return path(d, dark(s), w*1.18, `opacity=".98"`) +
      path(d, bark, w*.76, `opacity=".98"`) +
      path(d, mix(bark,paper(s),.42), Math.max(.55,w*.11), `opacity=".26"`);
  }

  function smoothPath(points){
    if(points.length < 2) return '';
    if(points.length === 2) return `M${V(...points[0])} L${V(...points[1])}`;
    let d = `M${V(...points[0])}`;
    for(let i=1;i<points.length-1;i++){
      const midX = (points[i][0] + points[i+1][0]) / 2;
      const midY = (points[i][1] + points[i+1][1]) / 2;
      d += ` Q${V(...points[i])} ${V(midX,midY)}`;
    }
    d += ` Q${V(...points[points.length-2])} ${V(...points[points.length-1])}`;
    return d;
  }

  function segmentSamples(points, step=70){
    const out=[];
    for(let i=0;i<points.length-1;i++){
      const a=points[i], b=points[i+1];
      const dx=b[0]-a[0], dy=b[1]-a[1];
      const len=Math.hypot(dx,dy);
      const angle=Math.atan2(dy,dx);
      const count=Math.max(1,Math.floor(len/step));
      for(let j=0;j<count;j++){
        const t=(j+0.5)/(count+0.2);
        out.push({x:a[0]+dx*t, y:a[1]+dy*t, angle, seg:i, t});
      }
    }
    return out;
  }

  function guidedVine(points,s,r,opts={}){
    const density = s.foliage/100;
    const weight = opts.weight || 1;
    const d = smoothPath(points);
    let z = stemStroke(d,s,5.8*weight, mix(dark(s), r.pick([green(s), red(s), blue(s)]), .12));
    const samples = segmentSamples(points, Math.max(42, 78 - density*34));
    let side = opts.side || 1;
    for(let i=0;i<samples.length;i++){
      const p = samples[i];
      if(opts.skipEnds && (i < 1 || i > samples.length-2)) continue;
      const localSide = (opts.fixedSide ? side : (i%2===0 ? side : -side)) * (r.chance(.84)?1:-1);
      const leafAng = p.angle + localSide * r.n(.72,1.14);
      const branchLen = r.n(14,34) * (.72 + density*.55) * weight;
      const bx = p.x + Math.cos(leafAng) * branchLen;
      const by = p.y + Math.sin(leafAng) * branchLen;
      const bcx = p.x + Math.cos(leafAng + r.n(-.22,.22)) * branchLen * .54;
      const bcy = p.y + Math.sin(leafAng + r.n(-.22,.22)) * branchLen * .54;
      if(r.chance(.66)) z += stemStroke(`M${V(p.x,p.y)} Q${V(bcx,bcy)} ${V(bx,by)}`, s, 1.3*weight, mix(dark(s),green(s),.22));
      if(r.chance(.88)) z += leaf(bx,by,r.n(16,38) * (.8 + density*.55) * weight, leafAng, s, r);
      if(r.chance(.26 + density*.2)) z += leaf(p.x + Math.cos(leafAng)*branchLen*.42, p.y + Math.sin(leafAng)*branchLen*.42, r.n(12,26)*weight, leafAng + localSide*r.n(.14,.34), s, r);
      if(r.chance(.18 + density*.12)) z += spiral(p.x + Math.cos(leafAng)*branchLen*.1, p.y + Math.sin(leafAng)*branchLen*.1, r.n(5,12)*weight, s, r, mix(dark(s), red(s), .2));
      if(opts.flowers && r.chance(.07 + density*.1)) z += flower(bx,by,r.n(7,12)*weight,s,r);
    }
    return G('', z, `filter="url(#ink)"`);
  }

  function pigmentField(x,y,w,h,s,r,shape='blob'){
    if(s.pigment < 4) return '';
    const clip = shape==='panel'
      ? `M${V(x-w/2,y-h/2)}L${V(x+w/2,y-h/2)}L${V(x+w/2,y+h/2)}L${V(x-w/2,y+h/2)}Z`
      : blob(x,y,w*.48,h*.48,r,18);
    const id = `p-${Math.round(x)}-${Math.round(y)}-${Math.round(w)}`;
    let z = `<clipPath id="${id}"><path d="${clip}"/></clipPath>`;
    const cols = r.int(8,14), rows = r.int(9,18), cw = w/cols, ch = h/rows;
    z += `<g clip-path="url(#${id})" opacity="${f(.14+.32*s.pigment/100)}">`;
    for(let j=0;j<rows;j++) for(let i=0;i<cols;i++) if(r.chance(.24+.36*s.pigment/100)){
      const col = r.pick([red(s),blue(s),green(s),gold(s),mix(red(s),blue(s),.5),dark(s)]);
      const xx = x-w/2+i*cw + r.n(-1.5,1.5);
      const yy = y-h/2+j*ch + r.n(-1.5,1.5);
      z += rect(xx,yy,cw*r.n(.54,1.14),ch*r.n(.54,1.14),col,`opacity="${f(r.n(.26,.82))}"`);
    }
    z += `</g>`;
    if(s.wear > 26){
      z += `<g clip-path="url(#${id})" opacity="${f(.08+.12*s.wear/100)}" filter="url(#rough)">`;
      for(let i=0;i<12+Math.floor(s.wear*.35);i++){
        const xx = x+r.n(-w*.44,w*.44), yy = y+r.n(-h*.44,h*.44);
        z += rect(xx,yy,r.n(5,18),r.n(3,14),r.pick([paper(s),paper(s),gold(s),red(s)]),`opacity="${f(r.n(.16,.34))}"`);
      }
      z += `</g>`;
    }
    z += lineDecor(x-w/2,y-h/2,w,h,r,s,10+Math.floor(s.pigment/10));
    return z;
  }

  function initial(x,y,size,s,r,ch){
    const e = esc((ch||'A').toUpperCase().slice(0,1));
    const tone = r.pick([
      mix(gold(s), paper(s), .24),
      mix(gold(s), dark(s), .18),
      mix(paper(s), gold(s), .42)
    ]);
    const letterId = `init-${Math.round(x)}-${Math.round(y)}-${Math.round(size)}`;
    const strokeW = size * .015;
    let base = `<defs><clipPath id="${letterId}"><text x="0" y="0" text-anchor="middle" font-family="Georgia,Times New Roman,serif" font-weight="700" font-size="${f(size)}">${e}</text></clipPath></defs>`;
    let body = `<text x="0" y="0" text-anchor="middle" font-family="Georgia,Times New Roman,serif" font-weight="700" font-size="${f(size)}" fill="${tone}" stroke="${dark(s)}" stroke-width="${f(strokeW)}" paint-order="stroke fill">${e}</text>`;
    let grain = `<g clip-path="url(#${letterId})" opacity=".76">`;
    for(let i=0;i<28+Math.floor(s.wear*.42);i++){
      const xx = r.n(-size*.32,size*.28), yy = r.n(-size*.82,size*.04);
      grain += rect(xx,yy,r.n(2,13),r.n(1.3,6.4),r.pick([paper(s),gold(s),red(s),blue(s),green(s)]),`opacity="${f(r.n(.08,.22))}"`);
      if(r.chance(.38)) grain += path(`M${V(xx,yy)}l${f(r.n(-8,8))} ${f(r.n(-1,10))}`, r.pick([dark(s),red(s),gold(s)]), r.n(.28,.84), `opacity="${f(r.n(.1,.28))}"`);
    }
    grain += `</g>`;
    let flourishes='';
    const n = 3 + Math.floor(s.foliage/28);
    for(let i=0;i<n;i++){
      const t = i/Math.max(1,n-1);
      const ax = (i%2?-1:1) * size * r.n(.11,.18);
      const ay = -size*(.12+t*.66);
      flourishes += spiral(ax,ay,size*r.n(.024,.055),s,r,i%2?green(s):red(s));
      if(r.chance(.52)) flourishes += leaf(ax+r.n(-4,4), ay+r.n(-4,4), size*r.n(.04,.075), r.n(-2.3,2.3), s, r, r.pick([green(s), red(s), blue(s)]));
    }
    return G(`translate(${V(x,y)}) rotate(${f(r.n(-3,3))})`, base + G('',body+grain,`filter="url(#ink)"`) + flourishes);
  }

  function medallion(x,y,radius,s,r){
    let out='';
    out += circle(x,y,radius,'none',`stroke="${dark(s)}" stroke-width="2"`);
    out += circle(x,y,radius-5,'none',`stroke="${gold(s)}" stroke-width="3" opacity=".86"`);
    for(let i=0;i<8;i++){
      const a = i*Math.PI/4;
      out += leaf(x+Math.cos(a)*radius*.82,y+Math.sin(a)*radius*.82,radius*.24,a+Math.PI/2,s,r,r.pick([red(s),green(s),blue(s),gold(s)]));
    }
    out += spiral(x,y,radius*.42,s,r,red(s));
    out += circle(x,y,radius*.12,gold(s),`stroke="${dark(s)}" stroke-width="1.1"`);
    return out;
  }

  function knots(x,y,scale,rotation,s,r,big=false){
    if(s.knots<=0) return '';
    const settings = { density:.22+s.knots/170, distort:s.wear/200, misprint:s.wear/260 };
    return O.knot(x,y,scale,rotation,settings,[dark(s),blue(s),red(s),gold(s),green(s)],r,{big});
  }

  function fragmentGlyphs(x,y,w,h,s,r){
    if(s.letters < 10) return '';
    let z='';
    const chars = ['a','b','d','m','n','r','x','v','✣'];
    const bigCount = 1 + Math.round(s.letters/55);
    for(let i=0;i<bigCount;i++){
      const ch = r.pick(chars);
      const xx = x+r.n(-w*.42,w*.42), yy=y+r.n(-h*.42,h*.42), size=r.n(80,170), rot=r.n(-24,24);
      const col = r.pick([paper(s), dark(s), red(s), green(s)]);
      z += G(`translate(${V(xx,yy)}) rotate(${f(rot)})`, `<text x="0" y="0" font-family="Georgia,Times New Roman,serif" font-size="${f(size)}" font-weight="700" fill="${col}">${esc(ch)}</text>`, `opacity="${f(r.n(.06,.16))}" filter="url(#ink)"`);
    }
    for(let i=0;i<4+Math.round(s.letters*.08);i++){
      const str = r.pick(['ink','ordo','xiv','ruin','leaf','folio','umbra']);
      const xx = x+r.n(-w*.46,w*.46), yy=y+r.n(-h*.46,h*.46), rot=r.n(-28,28), size=r.n(14,32);
      z += G(`translate(${V(xx,yy)}) rotate(${f(rot)})`, `<text x="0" y="0" font-family="Georgia,Times New Roman,serif" font-size="${f(size)}" font-style="${r.chance(.45)?'italic':'normal'}" fill="${r.pick([dark(s),red(s),blue(s),green(s)])}">${esc(str)}</text>`, `opacity="${f(r.n(.08,.28))}" filter="url(#dry)"`);
    }
    return z;
  }

  function marginaliaComposition(s,r){
    let art='';
    art += pigmentField(272,540,210,520,s,r) + pigmentField(596,662,176,300,s,r);
    art += guidedVine([[132,994],[114,852],[126,680],[148,500],[174,324],[196,228]],s,r,{weight:1.28,side:1,flowers:true,skipEnds:true});
    art += guidedVine([[738,998],[726,852],[714,690],[716,520],[734,344],[752,230]],s,r,{weight:1.18,side:-1,flowers:true,skipEnds:true});
    art += guidedVine([[182,322],[282,276],[402,258],[544,280],[670,246]],s,r,{weight:.78,side:1,flowers:true,fixedSide:false});
    if(s.foliage > 52) art += guidedVine([[248,928],[346,894],[476,874],[620,890]],s,r,{weight:.62,side:-1});
    if(s.showInitial) art += initial(436,688,r.n(282,356),s,r,s.initial);
    if(s.knots > 18) art += knots(548,266,r.n(.34,.46),r.n(-10,10),s,r);
    if(s.knots > 54) art += medallion(252,902,44,s,r);
    art += lineDecor(120,120,640,820,r,s,8);
    return art;
  }

  function initialComposition(s,r){
    let art='';
    art += pigmentField(446,540,470,690,s,r,'blob');
    art += guidedVine([[168,966],[172,844],[186,696],[214,544],[240,372],[278,228]],s,r,{weight:1.16,side:1,flowers:true,skipEnds:true});
    art += guidedVine([[676,918],[658,786],[632,650],[606,518],[590,390],[574,252]],s,r,{weight:.92,side:-1,flowers:true,skipEnds:true});
    art += guidedVine([[262,270],[368,246],[478,242],[594,274]],s,r,{weight:.66,side:1});
    if(s.showInitial) art += initial(436,618,r.n(390,486),s,r,s.initial);
    if(s.knots > 20) art += knots(584,816,r.n(.34,.5),r.n(-10,10),s,r);
    if(s.letters > 44) art += fragmentGlyphs(448,554,460,680,s,r);
    art += lineDecor(140,116,600,840,r,s,7);
    return art;
  }

  function interlaceComposition(s,r){
    let art='';
    art += pigmentField(440,520,420,760,s,r,'panel');
    art += knots(440,512,r.n(.9,1.1),r.n(-3,3),s,r,true);
    if(s.knots>36) art += knots(440,228,.46,r.n(-6,6),s,r);
    art += guidedVine([[132,972],[118,840],[120,692],[142,532],[170,366],[208,234]],s,r,{weight:.96,side:1,flowers:true,skipEnds:true});
    art += guidedVine([[748,972],[744,836],[726,692],[712,544],[710,394],[732,250]],s,r,{weight:.94,side:-1,flowers:true,skipEnds:true});
    if(s.showInitial) art += initial(198,278,r.n(128,176),s,r,s.initial);
    if(s.letters > 54) art += fragmentGlyphs(440,518,360,640,s,r);
    art += lineDecor(152,120,576,840,r,s,6);
    return art;
  }

  function chromaticComposition(s,r){
    let art='';
    art += pigmentField(300,296,400,300,s,r) + pigmentField(530,562,480,420,s,r) + pigmentField(298,818,260,180,s,r);
    if(s.showInitial) art += initial(404,486,r.n(296,372),s,r,s.initial);
    art += guidedVine([[142,988],[150,832],[182,676],[246,534],[320,420],[406,334]],s,r,{weight:1.08,side:1,skipEnds:true});
    art += guidedVine([[730,964],[666,836],[614,720],[570,592],[526,470],[470,348]],s,r,{weight:.98,side:-1,skipEnds:true});
    if(s.knots > 22) art += knots(582,768,r.n(.34,.52),r.n(-12,12),s,r);
    art += fragmentGlyphs(440,520,620,780,s,r);
    art += lineDecor(106,112,668,848,r,s,12);
    return art;
  }

  function composition(mode,s,r){
    if(mode === 'marginalia') return marginaliaComposition(s,r);
    if(mode === 'initial') return initialComposition(s,r);
    if(mode === 'interlace') return interlaceComposition(s,r);
    return chromaticComposition(s,r);
  }

  function render(settings){
    let s = {...settings}, r = O.RNG(s.seed); s.pal = O.palette(s.palette,r);
    let out = O.filters(s,r);
    out += `<g id="ornament">${composition(s.mode,s,r)}</g>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 880 1040" width="880" height="1040" role="img" aria-label="Generative ornamental artwork" preserveAspectRatio="xMidYMid meet">${out}</svg>`;
  }
  O.render = render;
  O.intro = () => {
    let r = O.RNG(72281), s = {pal:O.palettes.insular, foliage:58, wear:18, bleed:true};
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 330 350">${O.filters(s,r)}${guidedVine([[76,328],[70,260],[82,192],[112,126],[150,70]],s,r,{weight:.82,side:1,flowers:true})}${spiral(190,88,18,s,r,red(s))}</svg>`;
  };
})(window.Ornament);

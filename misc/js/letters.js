/* Letterpress collisions: overlapping text scraps, partial capitals, handwritten trails.
   Everything exports as live SVG text; no decorative webfont required. */
window.Ornament=window.Ornament||{};
((O)=>{
  'use strict';
  const {f,esc,path,point,fill,blob}=O;
  const alphabets=[
    ['A','Æ','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'],
    ['a','e','g','h','i','k','l','m','n','r','s','t','u','v','x','y','z','æ','œ','þ','ð'],
    ['I','V','X','M','N','R','P','D','S','Q','E','T','A','C']
  ];
  const scraps=['æra','terra','folio','corpus','moss','rune','umbra','frange','orta','aer','relic','vern','-um','and','rot','err','textus','ink','ora','ard','æ','xii'];
  function glyph(x,y,ch,size,a,color,s,r){
    const weight=r.pick([400,500,700,900]),family=r.chance(.52)?'Georgia,Times New Roman,serif':'Helvetica,Arial,sans-serif';
    const sx=r.n(.48,1.55),sy=r.n(.65,1.4);
    const skew=r.n(-20,20)*s.damage/100;
    const reverse=r.chance(.12)?-1:1;
    const opacity=f(r.n(.58,.98));
    const geom=`translate(${f(x)} ${f(y)}) rotate(${f(a)}) skewX(${f(skew)}) scale(${f(sx*reverse)} ${f(sy)})`;
    const text=`<text x="0" y="0" font-family="${family}" font-size="${f(size)}" font-weight="${weight}" font-style="${r.chance(.45)?'italic':'normal'}" letter-spacing="${f(r.n(-size*.07,size*.04))}" text-anchor="middle" dominant-baseline="central" fill="${color}" opacity="${opacity}">${esc(ch)}</text>`;
    let out=`<g class="field-glyph" data-field="1" transform="${geom}" filter="url(#ink)">${text}</g>`;
    if(r.chance(s.misprint/150))out=`<g transform="translate(${f(r.n(-13,13)*s.misprint/100)} ${f(r.n(-15,15)*s.misprint/100)})" opacity=".22">${out}</g>`;
    return out;
  }
  function writing(x,y,radius,angle,s,pal,r,id){
    const n=r.int(4,16),fsize=r.n(12,44),spacing=r.n(.65,1.3)*fsize;
    const curves=[],side=r.n(-1,1)*radius*.5;
    const px=x+Math.cos(angle)*radius,py=y+Math.sin(angle)*radius;
    const ax=x-Math.cos(angle)*radius,ay=y-Math.sin(angle)*radius;
    const d=`M${point(ax,ay)}Q${point(x-Math.sin(angle)*side,y+Math.cos(angle)*side)} ${point(px,py)}`;
    const text=Array.from({length:n},()=>r.pick(r.pick(alphabets))).join(r.chance(.5)?'':' ');
    return `<defs><path id="writing-${id}" d="${d}"/></defs><text font-family="Georgia,Times New Roman,serif" font-size="${f(fsize)}" font-weight="${r.pick([400,700])}" letter-spacing="${f(r.n(-3,7))}" fill="${r.pick(pal)}" opacity="${f(r.n(.55,.98))}" filter="url(#dry)"><textPath href="#writing-${id}" startOffset="${f(r.n(0,18))}%">${esc(text)}</textPath></text>`;
  }
  function runes(x,y,length,angle,s,pal,r){
    let output='',c=r.pick(pal),count=r.int(3,11),step=length/count;
    for(let i=0;i<count;i++){
      const cx=x+Math.cos(angle)*step*i,cy=y+Math.sin(angle)*step*i;
      const a=angle+Math.PI/2+r.n(-.3,.3),d=r.n(9,26),v={x:Math.cos(a)*d,y:Math.sin(a)*d};
      const d1=`M${point(cx-v.x,cy-v.y)}L${point(cx+v.x,cy+v.y)}`;
      let p=path(d1,c,r.n(.9,3));
      if(r.chance(.7)){
        const k=r.n(.1,.8),p0={x:cx-v.x*k,y:cy-v.y*k};
        p+=path(`M${point(p0.x,p0.y)}L${point(cx+Math.cos(angle)*d*.75,cy+Math.sin(angle)*d*.75)}`,c,r.n(1,2.7));
      }
      if(r.chance(.3))p+=path(`M${point(cx,cy)}L${point(cx-Math.cos(angle)*d*.65,cy-Math.sin(angle)*d*.65)}`,c,r.n(.8,2.2));
      output+=p;
    }
    return `<g opacity="${f(r.n(.45,1))}" filter="url(#dry)">${output}</g>`;
  }
  O.letters=(cx,cy,s,pal,r,idx=0)=>{
    const n=Math.round((2+r.n(1,9))*s.letters/70),fragments=[];
    for(let i=0;i<n;i++){
      const x=cx+r.n(-290,290),y=cy+r.n(-245,245),c=r.pick(r.pick(alphabets));
      const huge=r.chance(.22);
      fragments.push(glyph(x,y,c,huge?r.n(145,420):r.n(18,112),r.n(-115,115),r.pick(pal),s,r));
    }
    if(r.chance(.78))fragments.push(writing(cx+r.n(-260,260),cy+r.n(-210,210),r.n(100,320),r.n(-Math.PI,Math.PI),s,pal,r,idx));
    if(r.chance(.56))fragments.push(runes(cx+r.n(-210,210),cy+r.n(-180,180),r.n(100,300),r.n(-Math.PI,Math.PI),s,pal,r));
    if(r.chance(.36)){
      const word=r.pick(scraps),x=cx+r.n(-260,260),y=cy+r.n(-200,200);
      fragments.push(glyph(x,y,word,r.n(29,126),r.n(-38,38),r.pick(pal),s,r));
    }
    return fragments.join('');
  };
})(window.Ornament);

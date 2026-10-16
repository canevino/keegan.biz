/* Layer compositor. Modules share a single scene plan and seeded randomness. */
window.MS=window.MS||{};
((M)=>{
 'use strict';
 function dotRosette(x,y,radius,p,r){
   let z='';const ct=r.choose([5,6,7]);
   for(let i=0;i<ct;i++){
     const a=i*2*Math.PI/ct,ax=x+Math.cos(a)*radius*.38,ay=y+Math.sin(a)*radius*.38;
     z+=`<ellipse cx="${M.n(ax)}" cy="${M.n(ay)}" rx="${M.n(radius*.23)}" ry="${M.n(radius*.55)}" transform="rotate(${M.n(180*a/Math.PI+90)} ${M.n(ax)} ${M.n(ay)})" fill="${r.choose([p.vermillion,p.lapis,p.green,p.ochre])}" stroke="${p.ink}" stroke-width=".82"/>`;
   }
   return z+M.circle(x,y,radius*.14,p.ochre,`stroke="${p.ink}" stroke-width="1"`);
 }
 function ornaments(plan,s,r){
   const p=s.pal,amount=2+Math.round(s.detail/20),buf=[];
   for(let i=0;i<amount;i++){
     let pos=null;
     for(let j=0;j<25;j++){
       let q={x:r.between(115,735),y:r.between(110,890)};
       if(M.insideEllipse(q,plan.focal,1.45))continue;
       if(plan.knots.some(k=>Math.hypot(q.x-k.x,q.y-k.y)<120))continue;
       pos=q;break;
     }
     if(pos)buf.push(`<g filter="url(#press)" opacity="${M.n(r.between(.75,.95))}">${dotRosette(pos.x,pos.y,r.between(9,23),p,r)}</g>`);
   }
   return buf.join('');
 }
 function interlace(plan,s,r){
   if(s.knots===0)return '';
   const pal=s.pal,region=plan.mode==='interlace';
   let z='';
   const active=region?plan.knots:plan.knots.slice(0,s.knots>48?2:1);
   for(const k of active){
     const density=.12+s.knots*.0075;
     const scale=k.scale*(region?.83:.73)*(s.knots<12?.6:1);
     z+=M.knot(k.x,k.y,scale,k.rotation,{density,distort:s.distortion/170,misprint:s.distortion/200},[pal.ink,pal.lapis,pal.ochre,pal.vermillion,pal.green],r,{big:region});
   }
   return z;
 }
 function fragments(plan,s,r){
   if(s.fragments < 20)return '';
   const p=s.pal,chunks=['I','V','X','M','n','m','ꝏ','†','✣'];
   const n=Math.floor((s.fragments-12)*.13),parts=[];
   for(let i=0;i<n;i++){
     const side=r.choose(['top','bottom','left','right']),x=side==='left'?r.between(75,160):side==='right'?r.between(690,790):r.between(160,680);
     const y=side==='top'?r.between(90,190):side==='bottom'?r.between(840,930):r.between(220,795);
     const size=r.between(12,34)+(s.fragments>75?r.between(0,23):0);
     const ch=r.choose(chunks),rotation=r.between(-24,24);
     parts.push(`<g transform="translate(${M.vec(x,y)}) rotate(${M.n(rotation)})" filter="url(#dry-print)" opacity="${M.n(r.between(.18,.5))}"><text x="0" y="0" font-family="Georgia,serif" font-size="${M.n(size)}" fill="${r.choose([p.ink,p.vermillion,p.lapis])}">${M.escape(ch)}</text></g>`);
   }
   return parts.join('');
 }
 M.render=(settings)=>{
   const s={...settings,pal:M.palette(settings.palette)};
   const root=Number(s.seed)>>>0||1;
   const plan=M.plan(s,M.rng(M.childSeed(root,0xaced0081)));
   const pigmentR=M.rng(M.childSeed(root,17)), finishR=M.rng(M.childSeed(root,29));
   let body='';
   // Layers: structural bands -> initial -> attached growth -> accents -> restrained glyph debris.
   if(plan.mode==='interlace')body+=interlace(plan,s,M.rng(M.childSeed(root,40)));
   body+=M.initial(plan,s,M.rng(M.childSeed(root,42)));
   body+=M.botanical(plan,s,M.rng(M.childSeed(root,43)));
   if(plan.mode!=='interlace')body+=interlace(plan,s,M.rng(M.childSeed(root,40)));
   if(s.detail>0)body+=ornaments(plan,s,M.rng(M.childSeed(root,44)));
   body+=fragments(plan,s,M.rng(M.childSeed(root,45)));
   const defs=M.pigmentDefs(s,pigmentR)+M.finishDefs(s,finishR);
   return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${M.W} ${M.H}" width="${M.W}" height="${M.H}" role="img" aria-label="Generated ornamental artwork">`+
     `<defs>${defs}</defs><g id="artwork-layers">${body}</g></svg>`;
 };
})(window.MS);

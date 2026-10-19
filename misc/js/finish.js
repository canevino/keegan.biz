/* Local, non-destructive ink impression. No exterior glow or shadow. */
window.MS=window.MS||{};
((M)=>{
 'use strict';
 M.finishDefs=(s,r)=>{
   const n=M.n,c=M.clamp;
   const wear=c(Number(s.wear||0)/100,0,1);
   const spread=c(Number(s.spread||0)/100,0,1);
   const warp=c(Number(s.printWarp||0)/100,0,1);
   // The old wide blurred alpha dilation drew a uniform grey outer halo.
   // Ink now pools *inside* existing printed edges; there is no drop shadow.
   const edge=n(.23+.36*spread);
   const shift=n(.22+.50*spread+.20*warp);
   return `<filter id="impression" x="-3%" y="-3%" width="106%" height="106%" color-interpolation-filters="sRGB">`+
       `<feTurbulence type="fractalNoise" baseFrequency=".058 .083" numOctaves="2" seed="${r.int(1,99999)}" result="fiber"/>`+
       `<feDisplacementMap in="SourceGraphic" in2="fiber" scale="${shift}" xChannelSelector="R" yChannelSelector="G" result="drawn"/>`+
       `<feMorphology in="SourceAlpha" operator="erode" radius="${edge}" result="inside"/>`+
       `<feComposite in="SourceAlpha" in2="inside" operator="out" result="wetEdge"/>`+
       `<feFlood flood-color="${s.pal.ink}" flood-opacity="${n(.07+.11*spread)}" result="ink"/>`+
       `<feComposite in="ink" in2="wetEdge" operator="in" result="pooled"/>`+
       `<feMerge><feMergeNode in="drawn"/><feMergeNode in="pooled"/></feMerge></filter>`+
       `<filter id="dry-print" x="-4%" y="-4%" width="108%" height="108%">`+
       `<feTurbulence type="fractalNoise" baseFrequency=".11" seed="${r.int(1,99998)}" numOctaves="2" result="n"/>`+
       `<feDisplacementMap in="SourceGraphic" in2="n" scale="${n(.18+wear*.64)}" xChannelSelector="R" yChannelSelector="G"/></filter>`;
 };
})(window.MS);


/* Pass 0 — manuscript pixel impression.
   The actual plant skeleton (woody branches, petioles and growth paths)
   stays vector. Complete leaf impressions, including their contours and
   painted veins, are rendered as a discrete-pixel relief plate. This recreates
   the accidental Illustrator export without introducing broken geometry.
   The entire pass is deterministic, uses the existing wear control and is
   shared by on-page preview, SVG export and PNG export. */
((M)=>{
  'use strict';
  const NS='http://www.w3.org/2000/svg';
  const make=(tag)=>document.createElementNS(NS,tag);
  const drawTags=new Set(['path','circle','ellipse','rect','polygon','polyline','line','text','use','image']);
  const originalOutline='[data-print-leaf]';
  const pigment='[data-pixel-pigment]';

  M.pixelPlateSettings=s=>{
    const wear=M.clamp(Number(s.finishLevel??s.wear??20)/100,0,1);
    return {scale:0.47 - wear*0.018, wear,
      seed:(Number(s.seed)>>>0)||1, ink:(s.pal?.ink||'#1d1c17')};
  };

  function separateOrgans(svg){
    // Fruit/flower ink uses the same impression. The narrow stalks remain
    // connected vector paths so the export does not lose fine branchwork.
    for(const shape of svg.querySelectorAll('.growth-organ .life-final path[fill], .growth-organ .life-final circle[fill], .growth-organ .life-final ellipse[fill]')){
      const fill=shape.getAttribute('fill');
      if(!fill||fill==='none'||shape.hasAttribute('data-pixel-pigment'))continue;
      const outline=shape.cloneNode(false);
      outline.removeAttribute('id');outline.removeAttribute('data-pixel-pigment');
      outline.setAttribute('fill','none');
      shape.parentNode.insertBefore(outline,shape.nextSibling);
      shape.setAttribute('stroke','none');shape.setAttribute('data-pixel-pigment','1');
    }
  }

  function keepOnlyPrinting(node,grade){
    // Preserve transforms and local defs on the way down to a print leaf.
    // Copy the WHOLE leaf subtree, not only its flat fill. Thus dark contours
    // and ochre vein details are pixelated in the same grid as pigment.
    for(const child of [...node.children]){
      if(child.localName==='defs')continue;
      if(child.hasAttribute('data-print-leaf')){
        if(child.getAttribute('data-print-leaf')!==grade){child.remove();continue;}
        // Leaf contours must survive low-res rasterization. Unlike the
        // original low-contrast overlay, they are part of the printed plate.
        for(const outline of child.querySelectorAll('path[fill="none"][stroke]')){
          const w=Number(outline.getAttribute('stroke-width')||.5);
          if(w<1.1)outline.setAttribute('stroke-width',String(Math.max(w,1.1)));
        }
        continue;
      }
      if(child.hasAttribute('data-pixel-pigment')){
        if(grade==='coarse')continue;
        child.remove();continue;
      }
      if(drawTags.has(child.localName)){child.remove();continue;}
      keepOnlyPrinting(child,grade);
      if(child.localName!=='defs'&&!child.querySelector('[data-print-leaf], [data-pixel-pigment]'))child.remove();
    }
  }

  function plateDocument(source,grade){
    const svg=source.cloneNode(true);
    svg.setAttribute('viewBox',`0 0 ${M.W} ${M.H}`);
    svg.setAttribute('width',String(M.W));svg.setAttribute('height',String(M.H));
    svg.setAttribute('xmlns',NS);
    for(const child of [...svg.children]){
      if(child.localName==='defs'||child.id==='artwork-layers')continue;
      child.remove();
    }
    const art=svg.querySelector('#artwork-layers');
    if(!art)return null;
    art.removeAttribute('filter');
    keepOnlyPrinting(art,grade);
    return svg;
  }

  // Stable small hash; contrast clusters are tied to actual printed pixels,
  // never randomized during playback or by changing a slider.
  function noise(x,y,seed){
    let h=Math.imul(x+7919,374761393)^Math.imul(y+1543,668265263)^seed;
    h=Math.imul(h^(h>>>13),1274126177);
    return ((h^(h>>>16))>>>0)/4294967295;
  }
  const clampByte=v=>Math.max(0,Math.min(255,Math.round(v)));

  function makeInkBlocks(context,width,height,s,grade){
    const src=context.getImageData(0,0,width,height),rgba=src.data;
    const count=width*height,inside=new Uint8Array(count);
    for(let p=0;p<count;p++)inside[p]=rgba[p*4+3]>=118?1:0;
    const dark=[24,22,18],outer=[174,166,155];
    const out=context.createImageData(width,height),dst=out.data;
    const has=(x,y)=>x>=0&&x<width&&y>=0&&y<height&&inside[y*width+x];
    const idx=(x,y)=>(y*width+x)*4;
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){
      const p=y*width+x,at=p*4,yes=inside[p],left=has(x-1,y),right=has(x+1,y),up=has(x,y-1),down=has(x,y+1);
      if(!yes){
        // A sharply stepped grey impression, NOT a blurred glow. It is only
        // one small print cell wide and never changes actual leaf geometry.
        if(grade==='coarse' && (left||right||up||down)){
          dst[at]=outer[0];dst[at+1]=outer[1];dst[at+2]=outer[2];
          dst[at+3]=138;
        }
        continue;
      }
      const alpha=rgba[at+3];
      // Darkened, unevenly registered block outline. Do not choke out small
      // serrations: interior pixels retain their mineral pigments.
      const edge=!(left&&right&&up&&down);
      const original=[rgba[at],rgba[at+1],rgba[at+2]];
      const luminance=(original[0]*.25+original[1]*.62+original[2]*.13);
      let col;
      if(edge){
        const t=(grade==='fine'?.31:.77)+.16*noise(x,y,s.seed+7);
        col=original.map((v,i)=>v*(1-t)+dark[i]*t);
      } else if(luminance<52){
        col=original.map((v,i)=>v*.37+dark[i]*.63);
      } else {
        // Small tonal blocks, rather than either an RGB checkerboard or a
        // smooth CSS gradient. Follow the existing leaf pigments/veins.
        const k=noise(x,y,s.seed),m=noise(x,y,s.seed+31);
        const shade=k<.17?-.125:k>.84?.085:0;
        const warmth=m<.12?.12:m>.92?-.075:0;
        col=[
          original[0]*(1+shade)+original[1]*warmth*.28,
          original[1]*(1+shade*.57)-original[1]*warmth*.18,
          original[2]*(1+shade*.72)-original[2]*warmth*.20
        ];
        // The imported SVG already supplies mineral red, lapis and ochre.
        // Posterize the existing color without replacing it with RGB noise.
        col=col.map(v=>Math.round(v/12)*12);
      }
      dst[at]=clampByte(col[0]);dst[at+1]=clampByte(col[1]);
      dst[at+2]=clampByte(col[2]);dst[at+3]=255;
    }
    context.putImageData(out,0,0);
  }

  async function rasterize(svg,s,grade){
    const documentSvg=plateDocument(svg,grade);
    if(!documentSvg)return null;
    const xml=new XMLSerializer().serializeToString(documentSvg);
    const url=URL.createObjectURL(new Blob([xml],{type:'image/svg+xml;charset=utf-8'}));
    try{
      const img=new Image();
      await new Promise((resolve,reject)=>{
        img.onload=resolve;img.onerror=()=>reject(new Error('The browser could not render the print plate'));
        img.src=url;
      });
      const actualScale=grade==='fine'?.95:s.scale;
      const w=Math.max(120,Math.round(M.W*actualScale)),h=Math.max(150,Math.round(M.H*actualScale));
      const low=document.createElement('canvas');low.width=w;low.height=h;
      const ctx=low.getContext('2d',{alpha:true,willReadFrequently:true});
      if(!ctx)throw new Error('2D printing context unavailable');
      ctx.clearRect(0,0,w,h);ctx.imageSmoothingEnabled=true;
      ctx.drawImage(img,0,0,w,h);
      makeInkBlocks(ctx,w,h,s,grade);
      // Nearest-neighbor enlargement is encoded into the actual PNG, not
      // left to a browser-dependent SVG image-rendering interpretation.
      const full=document.createElement('canvas');full.width=M.W;full.height=M.H;
      const up=full.getContext('2d',{alpha:true});
      up.imageSmoothingEnabled=false;up.drawImage(low,0,0,M.W,M.H);
      return full.toDataURL('image/png');
    }finally{URL.revokeObjectURL(url);}
  }

  function showVector(svg,vector){
    const plates=svg?.querySelectorAll('[data-pixel-plate]')||[];
    if(!svg)return;
    svg.querySelector('#artwork-layers')?.removeAttribute('filter');
    for(const plate of plates)plate.setAttribute('display',vector?'none':'inline');
    for(const leaf of svg.querySelectorAll(originalOutline)){
      if(vector)leaf.removeAttribute('display');
      else leaf.setAttribute('display','none');
    }
    // Final reproductive pigment shares the pixel impression. Do not hide
    // the outline or petiole that connects it to the live shoot.
    for(const shape of svg.querySelectorAll(pigment)){
      if(vector)shape.removeAttribute('display');
      else shape.setAttribute('display','none');
    }
  }
  M.useVectorPigment=svg=>showVector(svg,true);
  M.usePixelPigment=svg=>showVector(svg,false);
  M.applyPixelPlate=async(svg,settings)=>{
    if(!svg||svg.querySelector('#pixel-pigment-plate'))return svg;
    const art=svg.querySelector('#artwork-layers');if(!art)return svg;
    separateOrgans(svg);
    try{
      const printSettings=M.pixelPlateSettings(settings);
      // Print grades are independent: large botanical blades receive broad
      // ink cells; tiny leaflets retain their recognisable outlines.
      const outputs=await Promise.all(['fine','coarse'].map(async grade=>({
        grade,url:await rasterize(svg,printSettings,grade)
      })));
      for(const {grade,url} of outputs){
        if(!url)continue;
        const image=make('image');
        image.id=grade==='coarse'?'pixel-pigment-plate':'pixel-pigment-fine';
        image.setAttribute('data-pixel-plate',grade);
        image.setAttribute('width',String(M.W));image.setAttribute('height',String(M.H));
        image.setAttribute('preserveAspectRatio','none');
        image.setAttribute('image-rendering','pixelated');image.setAttribute('href',url);
        art.insertBefore(image,art.firstChild);
      }
      M.usePixelPigment(svg);
    }catch(error){console.warn('Pixel-print fallback: keeping full vector artwork',error);}
    return svg;
  };
})(window.MS);

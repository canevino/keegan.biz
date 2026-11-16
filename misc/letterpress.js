/* /misc letters: original design v74/v75 print plates, restored. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const home=document.querySelector('.home');
  const launcher=$('letterpress-launcher'), panel=$('letterpress-panel'), close=$('letterpress-close');
  const stage=$('letterpress-preview'), title=$('letterpress-editor');
  const ink=$('letterpress-ink'), bleed=$('letterpress-underprint'), paper=$('letterpress-paper');
  const transparent=$('letterpress-transparent'), resetButton=$('letterpress-reset'), exportButton=$('letterpress-export');
  const note=$('letterpress-note');
  if(![home,launcher,panel,close,stage,title,ink,bleed,paper,transparent,resetButton,exportButton,note].every(Boolean)) return;
  const defaults={text:'design',ink:'#d71d31',bleed:'#f2b426',paper:'#ece7d7'};
  let scheduled=false, composing=false;
  const cleanText=value=>String(value||'').replace(/\u00a0/g,' ').replace(/[\r\n]+/g,' ').slice(0,32);
  const getText=()=>cleanText(title.textContent);
  const knownProfiles = new Set(["d", "e", "s", "i", "g", "n"]);
  const knownVariants = {
    d: "a",
    e: "b",
    s: "c",
    i: "a",
    g: "c",
    n: "b"
  };
  const fallbackVariants = ["a", "b", "c"];



  const hashChar = (char, index) => {
    const code = char.codePointAt(0) || 0;
    return ((code * 37) + (index * 61) + 17) >>> 0;
  };

  const applyFallbackProfile = (span, char, index) => {
    const h = hashChar(char, index);
    const signed = (n, scale) => (((h >> n) & 15) / 15 - .5) * scale;

    span.style.setProperty("--design-join", `${(-0.082 - ((h & 7) * 0.006)).toFixed(3)}em`);
    span.style.setProperty("--design-x", `${signed(3, 0.010).toFixed(3)}em`);
    span.style.setProperty("--design-y", `${signed(7, 0.009).toFixed(3)}em`);
    span.style.setProperty("--design-sx", (1.006 + ((h >> 5) & 7) * 0.0018).toFixed(4));

    span.style.setProperty("--yellow-x", `${signed(9, 0.040).toFixed(3)}em`);
    span.style.setProperty("--yellow-y", `${(0.004 + ((h >> 2) & 7) * 0.0025).toFixed(3)}em`);
    span.style.setProperty("--yellow-opacity", (0.68 + ((h >> 6) & 7) * 0.022).toFixed(3));
    span.style.setProperty("--yellow-sx", (1.018 + ((h >> 10) & 7) * 0.0017).toFixed(4));

    span.style.setProperty("--red-x", `${signed(12, 0.010).toFixed(3)}em`);
    span.style.setProperty("--red-y", `${signed(15, 0.008).toFixed(3)}em`);
    span.style.setProperty("--red-sx", (1.015 + ((h >> 13) & 7) * 0.0022).toFixed(4));
    span.style.setProperty("--red-sy", (1.009 + ((h >> 16) & 7) * 0.0017).toFixed(4));
    span.style.setProperty("--red-bleed-opacity", (0.91 + ((h >> 19) & 3) * 0.025).toFixed(3));
  };

  const makeLetter = (char, index) => {
    const span = document.createElement("span");
    const lower = char.toLocaleLowerCase();

    span.classList.add("design-letter");

    if (char === " ") {
      span.classList.add("design-letter--space");
      span.dataset.char = "\u00a0";
      span.textContent = "\u00a0";
      return span;
    }

    const variant = knownVariants[lower] || fallbackVariants[hashChar(char, index) % fallbackVariants.length];
    span.classList.add(`design-letter--${variant}`);

    if (knownProfiles.has(lower)) {
      span.classList.add(`design-letter--${lower}`);
    } else {
      applyFallbackProfile(span, char, index);
    }

    span.dataset.char = char;
    span.textContent = char;
    return span;
  };


  function caretOffset(){
    const sel=getSelection();if(!sel||!sel.rangeCount)return getText().length;
    const range=sel.getRangeAt(0);if(!title.contains(range.endContainer))return getText().length;
    const ahead=range.cloneRange();ahead.selectNodeContents(title);ahead.setEnd(range.endContainer,range.endOffset);
    return cleanText(ahead.toString()).length;
  }
  function restoreCaret(index){
    const sel=getSelection();if(!sel)return;
    const range=document.createRange();const walker=document.createTreeWalker(title,NodeFilter.SHOW_TEXT);
    let node,rem=index;
    while((node=walker.nextNode())){const count=node.textContent.length;if(rem<=count){range.setStart(node,rem);range.collapse(true);sel.removeAllRanges();sel.addRange(range);return;}rem-=count;}
    range.selectNodeContents(title);range.collapse(false);sel.removeAllRanges();sel.addRange(range);
  }
  function buildLetters(value,keepCaret=false){
    const offset=keepCaret?caretOffset():0,fragment=document.createDocumentFragment();
    [...cleanText(value)].forEach((char,i)=>fragment.appendChild(makeLetter(char,i)));
    title.replaceChildren(fragment);title.dataset.value=cleanText(value);
    if(keepCaret&&document.activeElement===title)restoreCaret(Math.min(offset,cleanText(value).length));
    requestPaint();
  }
  function fitType(){
    if(stage.clientWidth<30)return;
    const available=stage.clientWidth-(matchMedia('(max-width:700px)').matches?24:54);
    const h=stage.clientHeight-34;
    // Keep the original large, close-set letterforms while fitting long words.
    let size=Math.min(168,Math.max(34,available*.36));
    for(let i=0;i<24;i++){
      title.style.fontSize=size+'px';
      const box=title.getBoundingClientRect();
      if(box.width <= available && box.height <= h)break;
      size=Math.max(18,size*.92);
    }
  }
  const toRgb=(hex)=>{const n=parseInt(hex.slice(1),16);return [(n>>>16)&255,(n>>>8)&255,n&255];};
  const darker=(hex)=>'#'+toRgb(hex).map(n=>Math.round(n*.86).toString(16).padStart(2,'0')).join('');
  function applyColors(){
    stage.style.setProperty('--wordmark-face',ink.value);
    stage.style.setProperty('--wordmark-shadow',darker(ink.value));
    stage.style.setProperty('--wordmark-bleed',bleed.value);
    stage.style.setProperty('--wordmark-paper',paper.value);
    stage.classList.toggle('is-transparent',transparent.checked);
    // Original SVG filters have a color flood. Update it so each plate uses the chosen ink.
    stage.querySelectorAll('filter[id^="letterpress-red-"] feFlood').forEach(el=>el.setAttribute('flood-color',darker(ink.value)));
    stage.querySelectorAll('filter[id^="letterpress-yellow-"] feFlood').forEach(el=>el.setAttribute('flood-color',bleed.value));
  }
  function requestPaint(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;if(panel.hidden)return;fitType();applyColors();});}
  function closePanel(){
    if(panel.hidden)return;
    panel.hidden=true;panel.classList.remove('is-open');launcher.hidden=false;
    launcher.setAttribute('aria-expanded','false');home.classList.remove('letterpress-open');
    launcher.focus({preventScroll:true});
  }
  function openPanel(){
    if(!panel.hidden)return;
    if(!$('chess-panel').hidden)$('chess-close').click();
    if(!$('sports-panel').hidden)$('sports-close').click();
    home.classList.add('letterpress-open');panel.hidden=false;panel.classList.add('is-open');
    launcher.hidden=true;launcher.setAttribute('aria-expanded','true');
    requestPaint();
    requestAnimationFrame(()=>{title.focus({preventScroll:true});restoreCaret(getText().length);});
  }
  function reset(){
    ink.value=defaults.ink;bleed.value=defaults.bleed;paper.value=defaults.paper;
    transparent.checked=false;
    buildLetters(defaults.text);note.textContent='click the word to edit it.';
    applyColors();requestPaint();
  }
  // Rasterize the actual rendered DOM/SVG print, including the original per-character
  // blur -> alpha threshold -> irregular displacement filters. The exported PNG is
  // based on the same plates the visitor sees, not a separate blurred approximation.
  async function exactPrintCanvas(){
    const sheet=[...document.styleSheets].find(item=>{
      if(!item.href)return false;
      try{return new URL(item.href,location.href).pathname.endsWith('/misc/letterpress.css');}
      catch{return false;}
    });
    let stylesheet='';
    if(sheet)stylesheet=[...sheet.cssRules].map(rule=>rule.cssText).join('\n');
    // Also supports an inline developer preview / offline testing environment.
    else if(!document.querySelector('link[href*="letterpress.css"]')){
      stylesheet=[...document.styleSheets].filter(item=>!item.href).flatMap(item=>{
        try{return [...item.cssRules].map(rule=>rule.cssText);}catch{return [];}
      }).join('\n');
    }
    if(!stylesheet)throw Error('Letterpress stylesheet not available');
    const w=Math.max(1,Math.round(stage.clientWidth)),h=Math.max(1,Math.round(stage.clientHeight));
    const clone=stage.cloneNode(true);
    clone.style.width=w+'px';clone.style.height=h+'px';
    const paperOverride=transparent.checked?'background:transparent!important;background-image:none!important;':'';
    const overrides=`#letterpress-preview{border:0!important;min-height:0!important;aspect-ratio:auto!important;width:${w}px!important;height:${h}px!important;${paperOverride}}`;
    const safeCSS=(stylesheet+'\n'+overrides).replace(/&/g,'&amp;').replace(/</g,'&lt;');
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml" style="position:relative;width:${w}px;height:${h}px;--red:#c1272d;--green:#006a44;--paper:#ece7d7"><style>${safeCSS}</style>${clone.outerHTML}</div></foreignObject></svg>`;
    const image=new Image();
    const wait=new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(Error('SVG rasterization failed'));});
    image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
    await wait;
    const ratio=3,canvas=document.createElement('canvas');
    canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);
    const ctx=canvas.getContext('2d',{alpha:true});if(!ctx)throw Error('Canvas unavailable');
    ctx.scale(ratio,ratio);ctx.drawImage(image,0,0,w,h);
    return canvas;
  }
  // PNG export based on the original design.js v76 per-letter ink-plate exporter.
  const getNumberPx=(v,font)=>{const x=String(v||'').trim();if(!x||x==='none')return 0;return parseFloat(x)*(x.endsWith('em')?font:1)||0;};
  async function savePng(){
    if(!getText().trim()){note.textContent='type a word first.';title.focus();return;}
    exportButton.disabled=true;
    try {
      if(document.fonts?.ready)await document.fonts.ready;
      fitType();
      let exact=null;
      try { exact=await exactPrintCanvas(); }
      catch(e) { console.warn('Exact wordmark export unavailable; using original design exporter:',e); }
      const box=title.getBoundingClientRect(),nodes=[...title.querySelectorAll('.design-letter')];
      const scale=Math.max(2.5,window.devicePixelRatio||1),pad=Math.ceil(Math.max(32,box.height*.2));
      const cvs=document.createElement('canvas');cvs.width=Math.ceil((box.width+pad*2)*scale);cvs.height=Math.ceil((box.height+pad*2)*scale);
      const ctx=cvs.getContext('2d',{alpha:true});if(!ctx)throw Error('No canvas');ctx.scale(scale,scale);
      if(!transparent.checked){ctx.fillStyle=paper.value;ctx.fillRect(0,0,cvs.width/scale,cvs.height/scale);}
      const titleCss=getComputedStyle(title),fontSize=parseFloat(titleCss.fontSize)||120;
      // Keep the per-character geometry, original offsets and joins exactly as the DOM renders them.
      nodes.forEach(el=>{
        const text=el.textContent||'';if(!text||text==='\u00a0')return;
        const rect=el.getBoundingClientRect(),css=getComputedStyle(el),fs=parseFloat(css.fontSize)||fontSize;
        const x=rect.left-box.left+pad,y=rect.top-box.top+pad+fs*.77;
        const property=(k)=>css.getPropertyValue(k);
        const number=(k,def)=>{const n=parseFloat(property(k));return Number.isFinite(n)?n:def;};
        ctx.font=`${css.fontWeight||700} ${fs}px ${css.fontFamily||'Helvetica,Arial,sans-serif'}`;
        ctx.textBaseline='alphabetic';ctx.textAlign='left';
        const draw=(color,alpha,dx,dy,sx,sy,blur)=>{
          ctx.save();ctx.translate(x+dx,y+dy);ctx.scale(sx,sy);ctx.globalAlpha=alpha;
          ctx.fillStyle=color;ctx.shadowColor=color;ctx.shadowBlur=blur;
          ctx.fillText(text,0,0);ctx.restore();
        };
        draw(bleed.value,number('--yellow-opacity',.72),getNumberPx(property('--yellow-x'),fs),getNumberPx(property('--yellow-y'),fs),number('--yellow-sx',1.018),number('--yellow-sy',1.018),fs*.035);
        draw(darker(ink.value),number('--red-bleed-opacity',.94),getNumberPx(property('--red-x'),fs),getNumberPx(property('--red-y'),fs),number('--red-sx',1.016),number('--red-sy',1.01),fs*.055);
        draw(ink.value,1,getNumberPx(property('--design-x'),fs),getNumberPx(property('--design-y'),fs),number('--design-sx',1),1,0);
      });
      const output=exact||cvs;
      const blob=await new Promise(resolve=>output.toBlob(resolve,'image/png'));
      if(!blob)throw Error('PNG unavailable');
      const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;
      a.download=(getText().trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'letters')+'-print.png';
      document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
      note.textContent=`png ready · ${output.width} × ${output.height} px`;
    }catch(error){console.error('Letterpress PNG export failed:',error);note.textContent='Could not export. Please try again.';}
    finally{exportButton.disabled=false;}
  }
  launcher.addEventListener('click',openPanel);close.addEventListener('click',closePanel);
  resetButton.addEventListener('click',reset);exportButton.addEventListener('click',savePng);
  [ink,bleed,paper,transparent].forEach(el=>{el.addEventListener('input',applyColors);el.addEventListener('change',applyColors);});
  title.addEventListener('beforeinput',e=>{if(e.inputType==='insertParagraph'||e.inputType==='insertLineBreak'||e.inputType?.startsWith('format'))e.preventDefault();});
  title.addEventListener('keydown',e=>{if(e.key==='Enter')e.preventDefault();});
  title.addEventListener('paste',e=>{
    e.preventDefault();const paste=cleanText(e.clipboardData?.getData('text/plain')||'');
    const sel=getSelection();if(!sel||!sel.rangeCount)return;const r=sel.getRangeAt(0);if(!title.contains(r.commonAncestorContainer))return;
    r.deleteContents();const t=document.createTextNode(paste);r.insertNode(t);r.setStartAfter(t);r.collapse(true);sel.removeAllRanges();sel.addRange(r);
    buildLetters(getText(),true);
  });
  title.addEventListener('compositionstart',()=>{composing=true;});
  title.addEventListener('compositionend',()=>{composing=false;buildLetters(getText(),true);});
  title.addEventListener('input',()=>{if(!composing)buildLetters(getText(),true);});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden&&!document.querySelector('.how-overlay.is-visible'))closePanel();});
  if('ResizeObserver'in window)new ResizeObserver(requestPaint).observe(stage);
  else window.addEventListener('resize',requestPaint);
  buildLetters(defaults.text);applyColors();
})();

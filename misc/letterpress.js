/*
 * Misc / letters. No external scripts, font files, downloaded filters or images.
 * A single canvas renderer supplies both the interactive print and the PNG,
 * so exports use the same ink masks as the on-screen drawing.
 */
(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const home = document.querySelector('.home');
  const launcher = $('letterpress-launcher');
  const panel = $('letterpress-panel');
  const close = $('letterpress-close');
  const stage = $('letterpress-preview');
  const editor = $('letterpress-editor');
  const canvas = $('letterpress-canvas');
  const inkPicker = $('letterpress-ink');
  const secondPicker = $('letterpress-underprint');
  const paperPicker = $('letterpress-paper');
  const transparentCheckbox = $('letterpress-transparent');
  const resetButton = $('letterpress-reset');
  const saveButton = $('letterpress-export');
  const note = $('letterpress-note');

  if (![home,launcher,panel,close,stage,editor,canvas,inkPicker,secondPicker,paperPicker,
    transparentCheckbox,resetButton,saveButton,note].every(Boolean)) return;

  const defaults = {
    text: 'design',
    ink: '#d71d31',
    underprint: '#f2b426',
    paper: '#ece7d7',
    transparent: false
  };

  let composing = false;
  let scheduled = false;
  const context = canvas.getContext('2d', { alpha: true });
  if (!context) {
    note.textContent = 'This browser does not support canvas rendering.';
    saveButton.disabled = true;
    return;
  }

  const textValue = () => (editor.textContent || '')
    .replace(/\u00a0/g, ' ')
    .replace(/[\r\n]+/g, ' ')
    .slice(0, 32);

  function createLetters(value) {
    const fragment = document.createDocumentFragment();
    Array.from(value).forEach((character, index) => {
      const span = document.createElement('span');
      span.className = 'lp-character';
      span.dataset.letterIndex = String(index);
      if (character === ' ') {
        span.classList.add('lp-space');
        span.textContent = '\u00a0';
      } else {
        span.textContent = character;
        // Hand-register the plates, not the layout: keep each letter editable.
        const shift = ((index * 17 + character.codePointAt(0)) % 7 - 3) * 0.004;
        span.style.setProperty('--lp-shift', String(shift));
      }
      fragment.appendChild(span);
    });
    editor.replaceChildren(fragment);
  }

  function currentCaret() {
    const selection = getSelection();
    if (!selection || selection.rangeCount === 0) return textValue().length;
    const range = selection.getRangeAt(0);
    if (!editor.contains(range.endContainer)) return textValue().length;
    const preceding = range.cloneRange();
    preceding.selectNodeContents(editor);
    preceding.setEnd(range.endContainer, range.endOffset);
    return preceding.toString().length;
  }

  function setCaret(offset) {
    const selection = getSelection();
    if (!selection) return;
    const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    let remaining = Math.max(0, offset);
    let node;
    while ((node = walker.nextNode())) {
      const size = node.textContent.length;
      if (remaining <= size) {
        range.setStart(node, remaining);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        return;
      }
      remaining -= size;
    }
    range.selectNodeContents(editor);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  function rebuildEditable(preserveCaret = true) {
    if (composing) return;
    const caret = preserveCaret ? currentCaret() : textValue().length;
    const value = textValue();
    createLetters(value);
    if (preserveCaret && document.activeElement === editor) setCaret(Math.min(caret, value.length));
    scheduleDraw();
  }

  function setText(value) {
    createLetters(value);
    scheduleDraw();
  }

  function fitType() {
    const available = Math.max(150, stage.clientWidth - (window.innerWidth <= 700 ? 26 : 44));
    const boxHeight = Math.max(110, stage.clientHeight - 30);
    const content = textValue();
    if (!content) return;

    // A roomy initial letter size. Long words shrink rather than clipping.
    const upper = Math.min(160, Math.max(66, available * 0.25));
    let size = upper;
    for (let pass = 0; pass < 18; pass++) {
      editor.style.fontSize = `${size}px`;
      // Allow at most two visual lines; smaller type is preferable to overflow.
      const height = editor.getBoundingClientRect().height;
      const spans = [...editor.querySelectorAll('.lp-character')];
      const right = spans.length ? Math.max(...spans.map((el) => el.getBoundingClientRect().right)) : 0;
      const left = spans.length ? Math.min(...spans.map((el) => el.getBoundingClientRect().left)) : 0;
      if (height <= boxHeight && (right - left) <= available + 2) break;
      size = Math.max(25, size * 0.88);
    }
  }

  function seededRandom(seed) {
    let value = seed >>> 0;
    return () => {
      value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
      return value / 4294967296;
    };
  }

  const makeCanvas = (width,height) => {
    const element = document.createElement('canvas');
    element.width = width;
    element.height = height;
    return element;
  };

  function tintMask(mask, color) {
    const layer = makeCanvas(mask.width, mask.height);
    const ctx = layer.getContext('2d', { willReadFrequently:false });
    ctx.drawImage(mask,0,0);
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = color;
    ctx.fillRect(0,0,layer.width,layer.height);
    ctx.globalCompositeOperation = 'source-over';
    return layer;
  }

  function spreadMask(source, radius, low, high) {
    const scratch = makeCanvas(source.width, source.height);
    const ctx = scratch.getContext('2d', { willReadFrequently:true });
    ctx.filter = `blur(${radius}px)`;
    ctx.drawImage(source,0,0);
    ctx.filter = 'none';
    const image = ctx.getImageData(0,0,source.width,source.height);
    const pixels = image.data;
    for (let i=0; i<pixels.length; i+=4) {
      // Smooth threshold: blurring enlarges and merges nearby letterforms.
      // This is ink pooling, not a conventional drop shadow.
      const alpha = pixels[i+3]/255;
      const t = Math.max(0,Math.min(1,(alpha-low)/(high-low)));
      pixels[i]=pixels[i+1]=pixels[i+2]=255;
      pixels[i+3]=Math.round((t*t*(3-2*t))*255);
    }
    ctx.putImageData(image,0,0);
    return scratch;
  }

  function colorDarker(hex, amount) {
    const clean = hex.replace('#','');
    const rgb = [0,2,4].map(i => parseInt(clean.slice(i,i+2),16));
    return '#' + rgb.map(v => Math.round(v*(1-amount)).toString(16).padStart(2,'0')).join('');
  }

  function makeGlyphPositions() {
    const stageRect = stage.getBoundingClientRect();
    const fontSize = parseFloat(getComputedStyle(editor).fontSize) || 120;
    return [...editor.querySelectorAll('.lp-character')]
      .map((el,index) => {
        const rect = el.getBoundingClientRect();
        return {
          char: (el.textContent || '').replace(/\u00a0/g,' '),
          index,
          x: rect.left - stageRect.left,
          baseline: rect.top - stageRect.top + fontSize * .79,
          width: rect.width,
          fontSize
        };
      });
  }

  function renderPrint(target, ratio, transparent) {
    const width = Math.max(1, Math.round(stage.clientWidth * ratio));
    const height = Math.max(1, Math.round(stage.clientHeight * ratio));
    target.width=width;
    target.height=height;
    const dest = target.getContext('2d', { alpha:true });
    dest.clearRect(0,0,width,height);
    if (!transparent) {
      dest.fillStyle = paperPicker.value;
      dest.fillRect(0,0,width,height);
    }

    const glyphs = makeGlyphPositions();
    const fontSize = glyphs[0]?.fontSize || 120;
    const inkMask = makeCanvas(width,height);
    const underMask = makeCanvas(width,height);
    const inkCtx = inkMask.getContext('2d');
    const underCtx = underMask.getContext('2d');
    const font = `700 ${fontSize*ratio}px Helvetica,Arial,sans-serif`;
    [inkCtx,underCtx].forEach(ctx => {
      ctx.font = font;
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#fff';
    });

    glyphs.forEach(({char,x,baseline,index}) => {
      if (char === ' ') return;
      const hash = (char.codePointAt(0) * 31 + index*71) >>> 0;
      const jitterX = (((hash>>>4)&7)-3) * fontSize *.003;
      const jitterY = (((hash>>>8)&7)-3) * fontSize *.0025;
      const scaleX = 1 + (((hash>>>12)&7)-3) * .004;
      const scaleY = 1 + (((hash>>>16)&7)-3) * .002;
      const dx = x*ratio;
      const dy = baseline*ratio;

      inkCtx.save();
      inkCtx.translate(dx+jitterX*ratio,dy+jitterY*ratio);
      inkCtx.scale(scaleX,scaleY);
      inkCtx.fillText(char,0,0);
      inkCtx.restore();

      // Each underprint plate slips a little differently from its neighbor.
      const misX = ((((hash>>>20)&15)-7) * .004 + .012) * fontSize * ratio;
      const misY = ((((hash>>>24)&7)-3) * .004 + .014) * fontSize * ratio;
      underCtx.save();
      underCtx.translate(dx+misX,dy+misY);
      underCtx.scale(scaleX*1.015,scaleY*1.012);
      underCtx.fillText(char,0,0);
      underCtx.restore();
    });

    const underSpread = spreadMask(underMask,Math.max(1, fontSize*ratio*.018),.19,.65);
    const inkSpread = spreadMask(inkMask,Math.max(1, fontSize*ratio*.024),.10,.57);
    const underTint = tintMask(underSpread,secondPicker.value);
    const spreadTint = tintMask(inkSpread,colorDarker(inkPicker.value,.1));
    const faceTint = tintMask(inkMask,inkPicker.value);

    dest.globalAlpha=.83;
    dest.drawImage(underTint,0,0);
    dest.globalAlpha=.83;
    dest.drawImage(spreadTint,0,0);
    dest.globalAlpha=1;

    // Wear is clipped to the ink itself: no unrelated decorative marks.
    const wear = faceTint.getContext('2d');
    const rand = seededRandom(0x71a8cc ^ [...textValue()].reduce((h,c)=>Math.imul(h,33)^c.charCodeAt(0),5381));
    wear.globalCompositeOperation='destination-out';
    const number = Math.min(540,Math.round(glyphs.length * fontSize * .21));
    for (let n=0;n<number;n++) {
      const glyph = glyphs[Math.floor(rand()*glyphs.length)];
      if (!glyph || glyph.char===' ') continue;
      const px=(glyph.x + rand()*Math.max(2,glyph.width))*ratio;
      const py=(glyph.baseline-(.13+rand()*.62)*fontSize)*ratio;
      const radius = (.24 + rand()*1.28) * ratio;
      wear.beginPath();
      wear.ellipse(px,py,radius,radius*(.25+rand()*.6),rand()*Math.PI,0,Math.PI*2);
      wear.fill();
    }
    wear.globalCompositeOperation='source-over';
    dest.drawImage(faceTint,0,0);
    dest.globalAlpha=1;
    return target;
  }

  function draw() {
    scheduled=false;
    if (panel.hidden || stage.clientWidth < 30) return;
    fitType();
    const ratio=Math.min(2,Math.max(1,window.devicePixelRatio||1));
    renderPrint(canvas,ratio,transparentCheckbox.checked);
    stage.style.setProperty('--lp-paper',paperPicker.value);
    stage.style.setProperty('--lp-ink',inkPicker.value);
    stage.classList.toggle('is-transparent',transparentCheckbox.checked);
  }

  function scheduleDraw() {
    if (scheduled) return;
    scheduled=true;
    requestAnimationFrame(draw);
  }

  function closePanel() {
    if (panel.hidden) return;
    panel.hidden=true;
    panel.classList.remove('is-open');
    launcher.hidden=false;
    launcher.setAttribute('aria-expanded','false');
    home.classList.remove('letterpress-open');
    launcher.focus({preventScroll:true});
  }

  function openPanel() {
    if (!panel.hidden) return;
    // Existing chess/sports cleanup runs through its own close buttons.
    if (!$('chess-panel').hidden) $('chess-close').click();
    if (!$('sports-panel').hidden) $('sports-close').click();
    home.classList.add('letterpress-open');
    panel.hidden=false;
    panel.classList.add('is-open');
    launcher.hidden=true;
    launcher.setAttribute('aria-expanded','true');
    scheduleDraw();
    requestAnimationFrame(()=>editor.focus({preventScroll:true}));
  }

  function reset() {
    setText(defaults.text);
    inkPicker.value=defaults.ink;
    secondPicker.value=defaults.underprint;
    paperPicker.value=defaults.paper;
    transparentCheckbox.checked=defaults.transparent;
    note.textContent='click the word to edit it.';
    scheduleDraw();
  }

  async function savePng() {
    if (!textValue().trim()) { note.textContent='type a word first.'; editor.focus(); return; }
    saveButton.disabled=true;
    note.textContent='preparing png…';
    try {
      if (document.fonts?.ready) await document.fonts.ready;
      fitType();
      const exportCanvas=makeCanvas(1,1);
      // High-resolution export, including all four printed layers.
      renderPrint(exportCanvas,3.2,transparentCheckbox.checked);
      const blob=await new Promise((resolve)=>exportCanvas.toBlob(resolve,'image/png'));
      if (!blob) throw new Error('PNG encoding is unavailable');
      const url=URL.createObjectURL(blob);
      const link=document.createElement('a');
      const name=(textValue().trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || 'letters').slice(0,40);
      link.href=url;
      link.download=`${name}-print.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
      note.textContent=`png ready · ${exportCanvas.width} × ${exportCanvas.height} px`;
    } catch(err) {
      console.error('Letterpress export failed:',err);
      note.textContent='Could not export the PNG. Please try again.';
    } finally {
      saveButton.disabled=false;
    }
  }

  launcher.addEventListener('click',openPanel);
  close.addEventListener('click',closePanel);
  resetButton.addEventListener('click',reset);
  saveButton.addEventListener('click',savePng);
  [inkPicker,secondPicker,paperPicker,transparentCheckbox].forEach(control=>control.addEventListener('input',scheduleDraw));
  [inkPicker,secondPicker,paperPicker,transparentCheckbox].forEach(control=>control.addEventListener('change',scheduleDraw));

  editor.addEventListener('beforeinput',(event)=>{
    if (['insertParagraph','insertLineBreak'].includes(event.inputType)) event.preventDefault();
  });
  editor.addEventListener('keydown',(event)=>{
    if (event.key==='Enter') event.preventDefault();
  });
  editor.addEventListener('paste',(event)=>{
    event.preventDefault();
    const content=(event.clipboardData?.getData('text/plain') || '').replace(/[\r\n]+/g,' ');
    const selection=getSelection();
    if (!selection || selection.rangeCount===0) return;
    const range=selection.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) return;
    range.deleteContents();
    const text=document.createTextNode(content);
    range.insertNode(text);
    range.setStartAfter(text);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    rebuildEditable();
  });
  editor.addEventListener('compositionstart',()=>{composing=true;});
  editor.addEventListener('compositionend',()=>{composing=false;rebuildEditable();});
  editor.addEventListener('input',()=>rebuildEditable());
  document.addEventListener('keydown',(event)=>{
    if (event.key==='Escape' && !panel.hidden && !document.querySelector('.how-overlay.is-visible')) closePanel();
  });
  if ('ResizeObserver' in window) new ResizeObserver(scheduleDraw).observe(stage);
  else window.addEventListener('resize',scheduleDraw);
  createLetters(defaults.text);
})();

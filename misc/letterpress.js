/* Misc / letters: simple two-ink print editor. */
(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const home = document.querySelector('.home');
  const launcher = $('letterpress-launcher');
  const panel = $('letterpress-panel');
  const closeButton = $('letterpress-close');
  const stage = $('letterpress-preview');
  const editor = $('letterpress-editor');
  const fontSelect = $('letterpress-font');
  const ink = $('letterpress-ink');
  const underprint = $('letterpress-underprint');
  const paper = $('letterpress-paper');
  const transparent = $('letterpress-transparent');
  const effects = {
    overlap: $('letterpress-overlap'),
    spread: $('letterpress-spread'),
    register: $('letterpress-register'),
    roughness: $('letterpress-roughness'),
    underprintStrength: $('letterpress-underprint-strength'),
    variation: $('letterpress-variation'),
    pressure: $('letterpress-pressure'),
    pooling: $('letterpress-pooling')
  };
  const effectOutputs = Object.fromEntries(Object.entries(effects).map(([key, element]) =>
    [key, $(element.id + '-value')]));
  const randomButton = $('letterpress-randomize');
  const resetButton = $('letterpress-reset');
  const exportButton = $('letterpress-export');
  const note = $('letterpress-note');

  const required = [home, launcher, panel, closeButton, stage, editor, fontSelect, ink,
    underprint, paper, transparent, ...Object.values(effects),
    ...Object.values(effectOutputs), randomButton, resetButton, exportButton, note];
  if (!required.every(Boolean)) return;

  const defaults = {
    text: 'keegan.biz', font: 'helvetica', ink: '#c1272d', underprint: '#fdb913',
    paper: '#ece7d7', effects: {
      overlap: 50, spread: 50, register: 50, roughness: 50,
      underprintStrength: 50, variation: 50, pressure: 50, pooling: 0
    }
  };

  // Rely on widely available system faces, without an external font download.
  // The declared stack also carries through into exported SVG and canvas PNGs.
  const fontChoices = {
    helvetica: { family: 'Helvetica, Arial, sans-serif', weight: 700 },
    georgia: { family: 'Georgia, "Times New Roman", serif', weight: 700 },
    baskerville: { family: 'Baskerville, "Palatino Linotype", Georgia, serif', weight: 700 },
    impact: { family: 'Impact, "Arial Narrow", sans-serif', weight: 400 },
    trebuchet: { family: '"Trebuchet MS", "Lucida Grande", Arial, sans-serif', weight: 700 },
    bodoni: { family: '"Bodoni 72", "Bodoni MT", "Times New Roman", serif', weight: 700 }
  };
  function applyFont() {
    const selected = fontChoices[fontSelect.value] || fontChoices.helvetica;
    editor.style.fontFamily = selected.family;
    editor.style.fontWeight = String(selected.weight);
  }

  let seed = 0;
  let composing = false;
  let paintScheduled = false;
  const cleanText = value => String(value || '')
    .replace(/\u00a0/g, ' ').replace(/[\r\n]+/g, ' ').slice(0, 32);
  const getText = () => cleanText(editor.textContent);
  const clamp = (x, min, max) => Math.max(min, Math.min(max, x));
  const random = (min, max) => Math.round(min + Math.random() * (max - min));
  const hash = (ch, index) => (((ch.codePointAt(0) || 0) * 37) + index * 61 + 17) >>> 0;
  const seeded = n => () => {
    n ^= n << 13; n ^= n >>> 17; n ^= n << 5;
    return (n >>> 0) / 4294967296;
  };

  function selectionOffset() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return getText().length;
    const range = selection.getRangeAt(0);
    if (!editor.contains(range.endContainer)) return getText().length;
    const ahead = range.cloneRange();
    ahead.selectNodeContents(editor);
    ahead.setEnd(range.endContainer, range.endOffset);
    return cleanText(ahead.toString()).length;
  }

  function restoreSelection(index) {
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
    let node;
    let remaining = index;
    while ((node = walker.nextNode())) {
      if (remaining <= node.textContent.length) {
        range.setStart(node, remaining);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        return;
      }
      remaining -= node.textContent.length;
    }
    range.selectNodeContents(editor);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  function makeLetter(ch, index) {
    const span = document.createElement('span');
    span.className = 'design-letter design-letter--' + ['a', 'b', 'c'][hash(ch, index) % 3];
    if (ch === ' ') span.classList.add('design-letter--space');
    span.dataset.char = ch === ' ' ? '\u00a0' : ch;
    span.textContent = ch === ' ' ? '\u00a0' : ch;
    return span;
  }

  function buildLetters(value, keepCaret = false) {
    const offset = keepCaret ? selectionOffset() : 0;
    const cleaned = cleanText(value);
    const fragment = document.createDocumentFragment();
    Array.from(cleaned).forEach((ch, index) => fragment.appendChild(makeLetter(ch, index)));
    editor.replaceChildren(fragment);
    if (keepCaret && document.activeElement === editor) {
      restoreSelection(Math.min(offset, cleaned.length));
    }
    requestPaint();
  }

  function applyColors() {
    stage.style.setProperty('--lp-face', ink.value);
    stage.style.setProperty('--lp-underprint', underprint.value);
    stage.style.setProperty('--lp-paper', paper.value);
    stage.querySelectorAll('filter[id^="letterpress-red-"] feFlood')
      .forEach(el => el.setAttribute('flood-color', ink.value));
    stage.querySelectorAll('filter[id^="letterpress-yellow-"] feFlood')
      .forEach(el => el.setAttribute('flood-color', underprint.value));
  }

  const level = name => Number(effects[name].value);

  // The editable word is composed of separate spans for independent ink plates.
  // Separate spans do not receive the font's normal pair kerning, so restore
  // that pair-specific spacing before applying the visitor's overlap setting.
  const kerningContext = document.createElement('canvas').getContext('2d');
  const kerningCache = new Map();
  if (kerningContext) kerningContext.fontKerning = 'normal';
  function pairKerning(a, b) {
    if (!kerningContext) return 0;
    const face = fontChoices[fontSelect.value] || fontChoices.helvetica;
    kerningContext.font = `${face.weight} 1000px ${face.family}`;
    const key = `${fontSelect.value}:${a}${b}`;
    if (!kerningCache.has(key)) {
      const amount = (kerningContext.measureText(a + b).width
        - kerningContext.measureText(a).width
        - kerningContext.measureText(b).width) / 1000;
      kerningCache.set(key, amount);
    }
    return kerningCache.get(key);
  }

  // Left side of the slider opens up spacing; right side brings letters together.
  // Keep glyph widths unchanged. The adjustment is made to the gaps only.
  function overlapGap() {
    const value = level('overlap');
    return value <= 50 ? (50 - value) / 50 * .10
      : -(value - 50) / 50 * .14;
  }

  function updateEffects() {
    for (const [key, input] of Object.entries(effects)) {
      effectOutputs[key].textContent = input.value;
      input.setAttribute('aria-valuetext', input.value + ' of 100');
    }

    editor.style.setProperty('--letter-gap', overlapGap().toFixed(5) + 'em');
    const letters = Array.from(editor.querySelectorAll('.design-letter'));
    letters.forEach((span, index) => {
      const next = letters[index + 1];
      const currentChar = span.dataset.char || '';
      const nextChar = next?.dataset.char || '';
      const join = next && currentChar.trim() && nextChar.trim();
      span.classList.toggle('design-letter--join', Boolean(join));
      if (join) {
        span.style.setProperty('--letter-kern', pairKerning(currentChar, nextChar).toFixed(5) + 'em');
      } else {
        span.style.removeProperty('--letter-kern');
      }
    });

    const bleed = level('spread') / 50;
    const shift = level('register') / 50;
    const roughness = level('roughness') / 50;
    const secondStrength = level('underprintStrength') / 50;
    const variation = level('variation') / 50;
    const pressure = level('pressure');
    // At 50 the print is fully opaque. Lower pressure makes both plates
    // lighter together, rather than exposing a differently-colored outline.
    const coverage = pressure < 50 ? .42 + .58 * pressure / 50 : 1;
    const extraDeposit = Math.max(0, pressure - 50) / 50;
    const pooling = level('pooling') / 100;

    editor.querySelectorAll('.design-letter:not(.design-letter--space)')
      .forEach((span, index) => {
        const rand = seeded(hash(span.dataset.char || ' ', index) ^ seed);
        const wiggle = () => rand() * 2 - 1;
        // Pooling changes the overprinted ink only, not the letter's width.
        const pool = pooling * (.55 + rand() * .45);
        span.style.setProperty('--jitter-x', (wiggle() * variation * .009).toFixed(4) + 'em');
        span.style.setProperty('--jitter-y', (wiggle() * variation * .012).toFixed(4) + 'em');
        span.style.setProperty('--jitter-angle', (wiggle() * variation * 1.1).toFixed(3) + 'deg');
        span.style.setProperty('--yellow-x', (shift * (.012 + wiggle() * .006)).toFixed(4) + 'em');
        span.style.setProperty('--yellow-y', (shift * (.016 + wiggle() * .006)).toFixed(4) + 'em');
        span.style.setProperty('--yellow-scale', (1 + shift * .010 + pool * .025).toFixed(4));
        span.style.setProperty('--red-scale', (1 + bleed * .009 + pool * .055 + extraDeposit * .014).toFixed(4));
        span.style.setProperty('--red-scale-y', (1 + bleed * .009 + pool * .032 + extraDeposit * .010).toFixed(4));
        span.style.setProperty('--print-opacity', coverage.toFixed(3));
        span.style.setProperty('--underprint-opacity',
          clamp((.77 + wiggle() * .08) * secondStrength, 0, 1).toFixed(3));
        // Never tint the face independently of its red ink plate.
        span.style.removeProperty('--letter-face');
        span.style.removeProperty('--red-opacity');
      });

    stage.querySelectorAll('filter[id^="letterpress-"]').forEach(filter => {
      const red = filter.id.includes('-red-');
      const blur = filter.querySelector('feGaussianBlur[in="SourceAlpha"]');
      const displacement = filter.querySelector('feDisplacementMap');
      if (blur) {
        if (!blur.hasAttribute('data-default'))
          blur.setAttribute('data-default', blur.getAttribute('stdDeviation'));
        const base = Number(blur.getAttribute('data-default'));
        blur.setAttribute('stdDeviation',
          (base * (red ? .28 + bleed * .72 : .75 + bleed * .25)).toFixed(3));
      }
      if (displacement) {
        if (!displacement.hasAttribute('data-default'))
          displacement.setAttribute('data-default', displacement.getAttribute('scale'));
        const base = Number(displacement.getAttribute('data-default'));
        displacement.setAttribute('scale', (base * (.2 + roughness * .8)).toFixed(3));
      }
    });
  }

  function fitType() {
    if (stage.clientWidth < 30) return;
    const availableWidth = Math.max(50, stage.clientWidth - 32);
    const availableHeight = Math.max(60, stage.clientHeight - 24);
    let size = Math.min(150, stage.clientWidth * .28);
    // Fit against the WIDEST slider setting so moving "overlap" never
    // changes font size or stretches/shrinks the letterforms themselves.
    const currentGap = editor.style.getPropertyValue('--letter-gap');
    editor.style.setProperty('--letter-gap', '.10em');
    editor.style.fontSize = size + 'px';
    for (let i = 0; i < 8; i++) {
      const rect = editor.getBoundingClientRect();
      if (rect.width <= availableWidth && rect.height <= availableHeight) break;
      const factor = Math.min(availableWidth / Math.max(1, rect.width),
        availableHeight / Math.max(1, rect.height));
      size = Math.max(11, size * Math.min(.98, factor * .97));
      editor.style.fontSize = size + 'px';
    }
    if (currentGap) editor.style.setProperty('--letter-gap', currentGap);
    else editor.style.removeProperty('--letter-gap');
  }

  function paint() {
    paintScheduled = false;
    if (panel.hidden) return;
    applyFont();
    applyColors();
    updateEffects();
    fitType();
  }
  function requestPaint() {
    if (paintScheduled) return;
    paintScheduled = true;
    requestAnimationFrame(paint);
  }

  function closePanel() {
    if (panel.hidden) return;
    panel.hidden = true;
    panel.classList.remove('is-open');
    home.classList.remove('letterpress-open');
    launcher.hidden = false;
    launcher.setAttribute('aria-expanded', 'false');
    launcher.focus({ preventScroll: true });
  }
  function openPanel() {
    if (!panel.hidden) return;
    if (!$('chess-panel').hidden) $('chess-close').click();
    if (!$('sports-panel').hidden) $('sports-close').click();
    home.classList.add('letterpress-open');
    panel.hidden = false;
    panel.classList.add('is-open');
    launcher.hidden = true;
    launcher.setAttribute('aria-expanded', 'true');
    requestPaint();
    void refillWords();
    requestAnimationFrame(() => {
      editor.focus({ preventScroll: true });
      restoreSelection(getText().length);
    });
  }

  function reset() {
    seed = 0;
    fontSelect.value = defaults.font;
    ink.value = defaults.ink;
    underprint.value = defaults.underprint;
    paper.value = defaults.paper;
    for (const [key, input] of Object.entries(effects)) {
      input.value = defaults.effects[key];
    }
    transparent.checked = false;
    buildLetters(defaults.text);
    note.textContent = 'click the word to edit';
    requestPaint();
  }

  // Short, legible words are still available when the optional API is offline.
  const fallbackWords = [
    'afterglow', 'apparition', 'atlas', 'bloom', 'bramble', 'cobalt',
    'current', 'echo', 'fable', 'flicker', 'folklore', 'fossil', 'garden',
    'glimmer', 'hollow', 'horizon', 'inkling', 'lantern', 'marble',
    'meadow', 'mosaic', 'murmur', 'orbit', 'pattern', 'raven', 'riddle',
    'ripple', 'signal', 'spiral', 'static', 'tangent', 'thicket',
    'thread', 'tremor', 'velvet', 'weather'
  ];
  const inkPalettes = [
    ['#c1272d', '#fdb913'], ['#006a44', '#e46b32'],
    ['#164b8a', '#f2ad31'], ['#612c70', '#e4a73b'],
    ['#a72a43', '#5aaf91'], ['#1e584e', '#df6d35'],
    ['#272525', '#e0aa1c'], ['#a4313d', '#4f93bd'],
    ['#563e88', '#e5a43b'], ['#1e4165', '#ea7c49'],
    ['#a62660', '#44a389'], ['#a84c24', '#367e9d']
  ];
  let lastPalette = 0;
  let lastRandomWord = '';
  let wordPool = [];
  let fetchingWords = false;
  let nextFetchAfter = 0;

  // Prefetch up to five common words per request. This API is optional;
  // a failed request never prevents Randomize from working immediately.
  async function refillWords() {
    if (fetchingWords || wordPool.length >= 3 || Date.now() < nextFetchAfter) return;
    fetchingWords = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2400);
    try {
      const length = random(4, 9);
      const response = await fetch(
        `https://random-word-api.herokuapp.com/word?number=5&length=${length}&diff=2`,
        { mode: 'cors', signal: controller.signal, cache: 'no-store' }
      );
      if (!response.ok) throw new Error('Word service unavailable');
      const result = await response.json();
      if (!Array.isArray(result)) throw new Error('Unexpected word response');
      const fresh = result.filter(word => typeof word === 'string'
        && /^[a-z]{4,10}$/i.test(word))
        .map(word => word.toLowerCase())
        .filter(word => !wordPool.includes(word) && word !== lastRandomWord);
      if (!fresh.length) throw new Error('No suitable words');
      wordPool.push(...fresh);
    } catch (error) {
      // Network failure, rate limiting, and blocked cross-origin requests
      // all use the built-in word list. Try the service again later.
      nextFetchAfter = Date.now() + 60000;
    } finally {
      clearTimeout(timeout);
      fetchingWords = false;
    }
  }

  function nextWord() {
    let word;
    if (wordPool.length) {
      const options = wordPool.filter(item => item !== lastRandomWord);
      word = (options.length ? options : wordPool)[random(0,
        (options.length ? options : wordPool).length - 1)];
      wordPool = wordPool.filter(item => item !== word);
    } else {
      const options = fallbackWords.filter(item =>
        item !== lastRandomWord && item !== getText().toLowerCase());
      word = options[random(0, options.length - 1)];
    }
    lastRandomWord = word;
    void refillWords();
    return word;
  }

  function randomize() {
    seed = (seed + 1 + random(1, 999999)) >>> 0;
    const ranges = {
      overlap: [22, 80], spread: [23, 85], register: [12, 88],
      roughness: [18, 92], underprintStrength: [22, 94],
      variation: [25, 88], pressure: [28, 82], pooling: [0, 75]
    };
    for (const [key, input] of Object.entries(effects)) {
      input.value = String(random(...ranges[key]));
    }
    // Each new random print also selects a different typeface.
    const otherFonts = Object.keys(fontChoices).filter(name => name !== fontSelect.value);
    fontSelect.value = otherFonts[random(0, otherFonts.length - 1)];
    // Choose a distinct, readable two-ink combination. Paper is untouched.
    const next = (lastPalette + 1 + random(0, inkPalettes.length - 2)) % inkPalettes.length;
    lastPalette = next;
    [ink.value, underprint.value] = inkPalettes[next];
    buildLetters(nextWord());
    note.textContent = 'click the word to edit';
    requestPaint();
  }

  // Rasterize the actual displayed CSS print when supported by the browser.
  async function exactPrintCanvas() {
    const sheet = Array.from(document.styleSheets).find(item => {
      if (!item.href) return false;
      try { return new URL(item.href, location.href).pathname.endsWith('/misc/letterpress.css'); }
      catch { return false; }
    });
    let stylesheet = '';
    if (sheet) stylesheet = Array.from(sheet.cssRules).map(rule => rule.cssText).join('\n');
    else if (!document.querySelector('link[href*="letterpress.css"]')) {
      stylesheet = Array.from(document.styleSheets).filter(item => !item.href)
        .flatMap(item => { try { return Array.from(item.cssRules).map(rule => rule.cssText); }
          catch { return []; } }).join('\n');
    }
    if (!stylesheet) throw Error('Print stylesheet unavailable');
    const width = Math.max(1, Math.round(stage.clientWidth));
    const height = Math.max(1, Math.round(stage.clientHeight));
    const clone = stage.cloneNode(true);
    clone.style.width = width + 'px';
    clone.style.height = height + 'px';
    const paperOverride = transparent.checked
      ? 'background:transparent!important;' : '';
    const overrides = '#letterpress-preview{min-height:0!important;width:' + width +
      'px!important;height:' + height + 'px!important;' + paperOverride + '}';
    const safeCSS = (stylesheet + '\n' + overrides).replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px;height:${height}px;--red:#c1272d;--green:#006a44;--paper:#ece7d7"><style>${safeCSS}</style>${clone.outerHTML}</div></foreignObject></svg>`;
    const image = new Image();
    const loaded = new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(Error('Print rasterization unavailable'));
    });
    image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    await loaded;
    const ratio = 3;
    const canvas = document.createElement('canvas');
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) throw Error('Canvas unavailable');
    ctx.scale(ratio, ratio);
    ctx.drawImage(image, 0, 0, width, height);
    return canvas;
  }

  // Fallback for browsers that do not rasterize foreignObject SVGs.
  function fallbackCanvas() {
    const ratio = 3;
    const width = Math.round(stage.clientWidth);
    const height = Math.round(stage.clientHeight);
    const canvas = document.createElement('canvas');
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) throw Error('Canvas unavailable');
    ctx.scale(ratio, ratio);
    if (!transparent.checked) {
      ctx.fillStyle = paper.value;
      ctx.fillRect(0, 0, width, height);
    }
    const stageRect = stage.getBoundingClientRect();
    editor.querySelectorAll('.design-letter').forEach(span => {
      if (span.classList.contains('design-letter--space')) return;
      const char = span.textContent;
      const rect = span.getBoundingClientRect();
      const css = getComputedStyle(span);
      const size = parseFloat(css.fontSize) || 80;
      const x = rect.left - stageRect.left;
      const y = rect.top - stageRect.top + size * .81;
      const num = (name, fallback) => {
        const v = parseFloat(css.getPropertyValue(name));
        return Number.isFinite(v) ? v : fallback;
      };
      const selectedFont = fontChoices[fontSelect.value] || fontChoices.helvetica;
      ctx.font = `${selectedFont.weight} ${size}px ${selectedFont.family}`;
      ctx.textBaseline = 'alphabetic';
      const draw = (color, alpha, dx, dy, blur) => {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = blur;
        ctx.fillText(char, x + dx, y + dy);
        ctx.restore();
      };
      const coverage = num('--print-opacity', 1);
      draw(underprint.value, num('--underprint-opacity', .78) * coverage,
        num('--yellow-x', .014) * size, num('--yellow-y', .015) * size, size * .018);
      draw(ink.value, coverage, 0, 0, size * .022 * level('spread') / 50);
      draw(ink.value, coverage, 0, 0, 0);
    });
    return canvas;
  }

  async function savePng() {
    if (!getText().trim()) {
      note.textContent = 'type a word first';
      editor.focus();
      return;
    }
    exportButton.disabled = true;
    try {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      paint();
      let canvas;
      try { canvas = await exactPrintCanvas(); }
      catch (error) { console.warn('Using compatible PNG export:', error); canvas = fallbackCanvas(); }
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw Error('PNG could not be generated');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = (getText().trim().toLowerCase()
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'letters') + '-print.png';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      note.textContent = 'png ready';
    } catch (error) {
      console.error('Letterpress export failed:', error);
      note.textContent = 'could not save png';
    } finally {
      exportButton.disabled = false;
    }
  }

  launcher.addEventListener('click', openPanel);
  closeButton.addEventListener('click', closePanel);
  resetButton.addEventListener('click', reset);
  randomButton.addEventListener('click', randomize);
  fontSelect.addEventListener('change', requestPaint);
  exportButton.addEventListener('click', savePng);
  [ink, underprint, paper, transparent, ...Object.values(effects)]
    .forEach(input => {
      input.addEventListener('input', requestPaint);
      input.addEventListener('change', requestPaint);
    });

  // Edit the text as a string, not as separate styled spans. This prevents
  // backspace/delete at a span boundary from leaving the underlying text unchanged.
  function selectedOffsets() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return { start: getText().length, end: getText().length };
    const range = selection.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) {
      return { start: getText().length, end: getText().length };
    }
    const startRange = range.cloneRange();
    startRange.selectNodeContents(editor);
    startRange.setEnd(range.startContainer, range.startOffset);
    const endRange = range.cloneRange();
    endRange.selectNodeContents(editor);
    endRange.setEnd(range.endContainer, range.endOffset);
    return { start: cleanText(startRange.toString()).length,
      end: cleanText(endRange.toString()).length };
  }
  function replaceSelection(insert, backwards = false, forwards = false) {
    const text = getText();
    let { start, end } = selectedOffsets();
    if (start === end && backwards) start = Math.max(0, start - 1);
    if (start === end && forwards) end = Math.min(text.length, end + 1);
    const next = cleanText(text.slice(0, start) + insert + text.slice(end));
    buildLetters(next);
    restoreSelection(Math.min(start + insert.length, next.length));
  }
  editor.addEventListener('beforeinput', event => {
    if (composing || event.isComposing) return;
    if (event.inputType === 'insertParagraph' || event.inputType === 'insertLineBreak'
        || event.inputType?.startsWith('format')) {
      event.preventDefault();
      return;
    }
    if (event.inputType === 'insertText') {
      event.preventDefault();
      replaceSelection(cleanText(event.data || ''));
    } else if (event.inputType === 'deleteContentBackward') {
      event.preventDefault();
      replaceSelection('', true, false);
    } else if (event.inputType === 'deleteContentForward') {
      event.preventDefault();
      replaceSelection('', false, true);
    }
  });
  editor.addEventListener('keydown', event => { if (event.key === 'Enter') event.preventDefault(); });
  editor.addEventListener('paste', event => {
    event.preventDefault();
    replaceSelection(cleanText(event.clipboardData?.getData('text/plain') || ''));
  });
  editor.addEventListener('compositionstart', () => { composing = true; });
  editor.addEventListener('compositionend', () => { composing = false; buildLetters(getText(), true); });
  editor.addEventListener('input', () => { if (!composing) buildLetters(getText(), true); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden && !document.querySelector('.how-overlay.is-visible'))
      closePanel();
  });
  if ('ResizeObserver' in window) new ResizeObserver(requestPaint).observe(stage);
  else window.addEventListener('resize', requestPaint);

  buildLetters(defaults.text);
  applyColors();
})();

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
  const ink = $('letterpress-ink');
  const underprint = $('letterpress-underprint');
  const paper = $('letterpress-paper');
  const transparent = $('letterpress-transparent');
  const spread = $('letterpress-spread');
  const registration = $('letterpress-register');
  const variation = $('letterpress-variation');
  const randomButton = $('letterpress-randomize');
  const resetButton = $('letterpress-reset');
  const exportButton = $('letterpress-export');
  const note = $('letterpress-note');

  const required = [home, launcher, panel, closeButton, stage, editor, ink,
    underprint, paper, transparent, spread, registration, variation,
    randomButton, resetButton, exportButton, note];
  if (!required.every(Boolean)) return;

  const defaults = {
    text: 'keegan.biz', ink: '#c1272d', underprint: '#fdb913',
    paper: '#ece7d7', spread: 50, registration: 50, variation: 50
  };

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

  function updateEffects() {
    const bleed = Number(spread.value) / 50;
    const shift = Number(registration.value) / 50;
    const jitter = Number(variation.value) / 100;

    editor.querySelectorAll('.design-letter:not(.design-letter--space)')
      .forEach((span, index) => {
        const rand = seeded(hash(span.dataset.char || ' ', index) ^ seed);
        const wiggle = () => rand() * 2 - 1;
        // Baseline: no negative letter-spacing or margins, only slight plate variation.
        span.style.setProperty('--jitter-x', (wiggle() * jitter * .009).toFixed(4) + 'em');
        span.style.setProperty('--jitter-y', (wiggle() * jitter * .012).toFixed(4) + 'em');
        span.style.setProperty('--jitter-angle', (wiggle() * jitter * 1.1).toFixed(3) + 'deg');
        span.style.setProperty('--yellow-x', (shift * (.012 + wiggle() * .006)).toFixed(4) + 'em');
        span.style.setProperty('--yellow-y', (shift * (.016 + wiggle() * .006)).toFixed(4) + 'em');
        span.style.setProperty('--yellow-scale', (1 + shift * .010).toFixed(4));
        span.style.setProperty('--red-scale', (1 + bleed * .009).toFixed(4));
        span.style.setProperty('--underprint-opacity', clamp(.77 + wiggle() * .08, .60, .90).toFixed(3));
      });

    stage.querySelectorAll('filter[id^="letterpress-"]').forEach(filter => {
      const red = filter.id.includes('-red-');
      const blur = filter.querySelector('feGaussianBlur[in="SourceAlpha"]');
      const displacement = filter.querySelector('feDisplacementMap');
      if (blur) {
        if (!blur.hasAttribute('data-default'))
          blur.setAttribute('data-default', blur.getAttribute('stdDeviation'));
        const value = Number(blur.getAttribute('data-default'));
        blur.setAttribute('stdDeviation', (value * (red ? .28 + bleed * .72 : .75 + bleed * .25)).toFixed(3));
      }
      if (displacement) {
        if (!displacement.hasAttribute('data-default'))
          displacement.setAttribute('data-default', displacement.getAttribute('scale'));
        const value = Number(displacement.getAttribute('data-default'));
        displacement.setAttribute('scale', (value * (.50 + jitter)).toFixed(3));
      }
    });
  }

  function fitType() {
    if (stage.clientWidth < 30) return;
    const availableWidth = Math.max(50, stage.clientWidth - 32);
    const availableHeight = Math.max(60, stage.clientHeight - 24);
    let size = Math.min(150, stage.clientWidth * .28);
    editor.style.fontSize = size + 'px';
    for (let i = 0; i < 8; i++) {
      const rect = editor.getBoundingClientRect();
      if (rect.width <= availableWidth && rect.height <= availableHeight) break;
      const factor = Math.min(availableWidth / Math.max(1, rect.width),
        availableHeight / Math.max(1, rect.height));
      size = Math.max(11, size * Math.min(.98, factor * .97));
      editor.style.fontSize = size + 'px';
    }
  }

  function paint() {
    paintScheduled = false;
    if (panel.hidden) return;
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
    requestAnimationFrame(() => {
      editor.focus({ preventScroll: true });
      restoreSelection(getText().length);
    });
  }

  function reset() {
    seed = 0;
    ink.value = defaults.ink;
    underprint.value = defaults.underprint;
    paper.value = defaults.paper;
    spread.value = defaults.spread;
    registration.value = defaults.registration;
    variation.value = defaults.variation;
    transparent.checked = false;
    buildLetters(defaults.text);
    note.textContent = 'click the word to edit';
    requestPaint();
  }

  function randomize() {
    seed = (seed + 1 + random(1, 999999)) >>> 0;
    spread.value = String(random(24, 78));
    registration.value = String(random(18, 82));
    variation.value = String(random(24, 85));
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
      ctx.font = `700 ${size}px Helvetica, Arial, sans-serif`;
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
      draw(underprint.value, num('--underprint-opacity', .78),
        num('--yellow-x', .014) * size, num('--yellow-y', .015) * size, size * .018);
      draw(ink.value, .92, 0, 0, size * .022 * Number(spread.value) / 50);
      draw(ink.value, 1, 0, 0, 0);
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
  exportButton.addEventListener('click', savePng);
  [ink, underprint, paper, spread, registration, variation, transparent]
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

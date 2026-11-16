/* The editable print word and Celtic knot from the earlier design page. */
(() => {
  'use strict';

  const home = document.querySelector('.home');
  const experiments = {
    type: {
      launcher: document.getElementById('type-launcher'),
      panel: document.getElementById('type-panel'),
      close: document.getElementById('type-close')
    },
    knots: {
      launcher: document.getElementById('knots-launcher'),
      panel: document.getElementById('knots-panel'),
      close: document.getElementById('knots-close')
    }
  };
  if (!home || Object.values(experiments).some(({ launcher, panel, close }) => !launcher || !panel || !close)) return;

  let current = null;
  const closeExperiment = (restoreFocus = true) => {
    if (!current) return;
    const { panel, launcher } = experiments[current];
    if (current === 'knots') { visible = false; stopKnot(); }
    panel.classList.remove('is-open');
    panel.hidden = true;
    launcher.setAttribute('aria-expanded', 'false');
    home.classList.remove('misc-experiment-open');
    const previouslyOpen = current;
    current = null;
    if (restoreFocus) experiments[previouslyOpen].launcher.focus();
  };

  const openExperiment = (name) => {
    if (current === name) return;
    closeExperiment(false);
    const chessPanel = document.getElementById('chess-panel');
    const sportsPanel = document.getElementById('sports-panel');
    if (chessPanel && !chessPanel.hidden) document.getElementById('chess-close')?.click();
    if (sportsPanel && !sportsPanel.hidden) document.getElementById('sports-close')?.click();

    const { panel, launcher, close } = experiments[name];
    current = name;
    home.classList.add('misc-experiment-open');
    panel.hidden = false;
    panel.classList.add('is-open');
    launcher.setAttribute('aria-expanded', 'true');
    (name === 'type' ? document.getElementById('misc-type-word') : close).focus({ preventScroll: true });
  };

  Object.entries(experiments).forEach(([name, { launcher, close }]) => {
    launcher.addEventListener('click', () => openExperiment(name));
    close.addEventListener('click', () => closeExperiment());
  });
  ['chess-launcher', 'sports-launcher'].forEach((id) => {
    document.getElementById(id)?.addEventListener('click', () => closeExperiment(false));
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && current) closeExperiment();
  });

  /* Restore the real editable caret after rebuilding the ink plates. */
  const word = document.getElementById('misc-type-word');
  const initialText = 'design';
  const variants = { d: 'a', e: 'b', s: 'c', i: 'a', g: 'c', n: 'b' };
  let composing = false;
  let restoring = false;

  const normalizeText = (text) => String(text ?? '').replace(/\u00a0/g, ' ').replace(/[\r\n]+/g, ' ').slice(0, 80);
  const caretPosition = () => {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount || !word.contains(selection.anchorNode)) return word.textContent.length;
    const before = selection.getRangeAt(0).cloneRange();
    before.selectNodeContents(word);
    before.setEnd(selection.anchorNode, selection.anchorOffset);
    return before.toString().length;
  };
  const moveCaret = (position) => {
    if (document.activeElement !== word) return;
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    const walker = document.createTreeWalker(word, NodeFilter.SHOW_TEXT);
    let remaining = position;
    let node;
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
    range.selectNodeContents(word);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const makeLetter = (character, index) => {
    const letter = document.createElement('span');
    letter.className = 'misc-type-letter';
    if (character === ' ') letter.classList.add('misc-type-space');
    const seed = ((character.codePointAt(0) || 0) * 37 + index * 61 + 17) >>> 0;
    const variation = variants[character.toLowerCase()] || ['a', 'b', 'c'][seed % 3];
    const signed = (shift, scale) => (((seed >>> shift) & 15) / 15 - .5) * scale;
    letter.dataset.variant = variation;
    letter.dataset.char = character;
    letter.textContent = character === ' ' ? '\u00a0' : character;
    letter.style.setProperty('--type-x', `${signed(3, .01).toFixed(3)}em`);
    letter.style.setProperty('--type-y', `${signed(7, .009).toFixed(3)}em`);
    letter.style.setProperty('--type-sx', (1.006 + ((seed >>> 5) & 7) * .0018).toFixed(4));
    letter.style.setProperty('--type-yellow-x', `${signed(9, .04).toFixed(3)}em`);
    letter.style.setProperty('--type-yellow-y', `${(.004 + ((seed >>> 2) & 7) * .0025).toFixed(3)}em`);
    letter.style.setProperty('--type-yellow-opacity', (.68 + ((seed >>> 6) & 7) * .022).toFixed(3));
    letter.style.setProperty('--type-yellow-sx', (1.018 + ((seed >>> 10) & 7) * .0017).toFixed(4));
    letter.style.setProperty('--type-red-x', `${signed(12, .01).toFixed(3)}em`);
    letter.style.setProperty('--type-red-y', `${signed(15, .008).toFixed(3)}em`);
    letter.style.setProperty('--type-red-sx', (1.015 + ((seed >>> 13) & 7) * .0022).toFixed(4));
    letter.style.setProperty('--type-red-opacity', (.91 + ((seed >>> 19) & 3) * .025).toFixed(3));
    return letter;
  };

  const renderWord = (text, offset = 0) => {
    const normalized = normalizeText(text);
    const fragment = document.createDocumentFragment();
    Array.from(normalized).forEach((char, index) => fragment.appendChild(makeLetter(char, index)));
    restoring = true;
    word.replaceChildren(fragment);
    restoring = false;
    word.dataset.value = normalized;
    requestAnimationFrame(() => moveCaret(Math.min(offset, normalized.length)));
  };
  const normalizeWord = () => {
    if (composing || restoring) return;
    const offset = caretPosition();
    renderWord(word.textContent, offset);
  };

  word.addEventListener('beforeinput', (event) => {
    if (['insertParagraph', 'insertLineBreak'].includes(event.inputType) || event.inputType?.startsWith('format')) event.preventDefault();
  });
  word.addEventListener('keydown', (event) => { if (event.key === 'Enter') event.preventDefault(); });
  word.addEventListener('paste', (event) => {
    event.preventDefault();
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;
    const range = selection.getRangeAt(0);
    if (!word.contains(range.commonAncestorContainer)) return;
    range.deleteContents();
    const text = document.createTextNode(normalizeText(event.clipboardData?.getData('text/plain')));
    range.insertNode(text);
    range.setStartAfter(text);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    normalizeWord();
  });
  word.addEventListener('compositionstart', () => { composing = true; });
  word.addEventListener('compositionend', () => { composing = false; normalizeWord(); });
  word.addEventListener('input', normalizeWord);
  document.getElementById('misc-type-reset').addEventListener('click', () => {
    word.focus();
    renderWord(initialText, initialText.length);
  });
  renderWord(initialText);

  /* Reuse the five original, hand-drawn knot files from /assets/home/. */
  const knot = document.getElementById('misc-knot');
  const knotImages = Array.from(knot.querySelectorAll('img'));
  const paths = [1, 2, 3, 4, 5].map((n) => `/assets/home/knot_smooth_svg${n}.svg`);
  const cachedKnots = paths.map((path) => { const image = new Image(); image.src = path; return image; });
  const colors = ['black', 'red', 'green', 'yellow'];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let currentKnot = Math.floor(Math.random() * paths.length);
  let currentColor = 0;
  let timer = null;
  let hovering = false;
  let visible = false;

  const paintKnot = () => {
    const source = paths[currentKnot];
    knotImages.forEach((image) => { if (image.getAttribute('src') !== source) image.src = source; });
    knot.dataset.color = colors[currentColor];
  };
  const stepKnot = () => {
    currentKnot = (currentKnot + 1) % paths.length;
    currentColor = (currentColor + 1) % colors.length;
    paintKnot();
  };
  const settleKnot = () => {
    const next = (currentKnot + 1 + Math.floor(Math.random() * (paths.length - 1))) % paths.length;
    currentKnot = next;
    currentColor = Math.floor(Math.random() * colors.length);
    paintKnot();
    knot.classList.remove('is-animating');
  };
  const stopKnot = () => { window.clearTimeout(timer); timer = null; knot.classList.remove('is-animating'); };
  const hoverLoop = () => {
    if (!hovering || !visible || reduceMotion.matches) return;
    knot.classList.add('is-animating');
    stepKnot();
    timer = window.setTimeout(hoverLoop, 32 + Math.random() * 26);
  };
  const scheduleIdle = () => {
    stopKnot();
    if (!visible || hovering || reduceMotion.matches) return;
    timer = window.setTimeout(() => {
      let count = 0;
      const burst = () => {
        if (!visible || hovering || reduceMotion.matches) { stopKnot(); return; }
        knot.classList.add('is-animating');
        stepKnot();
        count += 1;
        if (count < 16) timer = window.setTimeout(burst, 30 + Math.random() * 28);
        else { settleKnot(); scheduleIdle(); }
      };
      burst();
    }, 30000 + Math.random() * 12000);
  };
  knot.addEventListener('pointerenter', (event) => {
    if (event.pointerType === 'touch' || reduceMotion.matches) return;
    hovering = true;
    stopKnot();
    hoverLoop();
  });
  knot.addEventListener('pointerleave', () => {
    hovering = false;
    stopKnot();
    settleKnot();
    scheduleIdle();
  });
  document.getElementById('misc-knot-randomize').addEventListener('click', () => {
    stopKnot();
    settleKnot();
    scheduleIdle();
  });
  reduceMotion.addEventListener?.('change', () => { stopKnot(); scheduleIdle(); });
  const originalOpen = experiments.knots.launcher;
  originalOpen.addEventListener('click', () => { visible = true; scheduleIdle(); });
  experiments.knots.close.addEventListener('click', () => { visible = false; stopKnot(); });
  ['chess-launcher', 'sports-launcher', 'type-launcher'].forEach((id) => {
    document.getElementById(id)?.addEventListener('click', () => { visible = false; stopKnot(); });
  });
  paintKnot();
})();

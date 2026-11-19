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
  const fontSearch = $('letterpress-font-search');
  const ink = $('letterpress-ink');
  const inkEnabled = $('letterpress-ink-enabled');
  const underprint = $('letterpress-underprint');
  const underprintEnabled = $('letterpress-underprint-enabled');
  const paper = $('letterpress-paper');
  const transparent = $('letterpress-transparent');
  const underline = $('letterpress-underline');
  const effects = {
    overlap: $('letterpress-overlap'),
    spread: $('letterpress-spread'),
    register: $('letterpress-register'),
    roughness: $('letterpress-roughness'),
    underprintStrength: $('letterpress-underprint-strength'),
    variation: $('letterpress-variation'),
    size: $('letterpress-size'),
    skew: $('letterpress-skew'),
    stretch: $('letterpress-stretch'),
    warp: $('letterpress-warp'),
    noise: $('letterpress-noise'),
    texture: $('letterpress-texture'),
    underlineUniformity: $('letterpress-underline-uniformity'),
    underlineWeight: $('letterpress-underline-weight'),
    underlineCurve: $('letterpress-underline-curve'),
    pressure: $('letterpress-pressure'),
    pooling: $('letterpress-pooling')
  };
  const effectOutputs = Object.fromEntries(Object.entries(effects).map(([key, element]) =>
    [key, $(element.id + '-value')]));
  const randomButton = $('letterpress-randomize');
  const resetButton = $('letterpress-reset');
  const exportButton = $('letterpress-export');
  const note = $('letterpress-note');

  const required = [home, launcher, panel, closeButton, stage, editor, fontSelect, fontSearch, ink,
    inkEnabled, underprint, underprintEnabled,
    paper, transparent, underline, ...Object.values(effects),
    ...Object.values(effectOutputs), randomButton, resetButton, exportButton, note];
  if (!required.every(Boolean)) return;

  const svgNamespace = 'http://www.w3.org/2000/svg';
  const underlineSvg = document.createElementNS(svgNamespace, 'svg');
  underlineSvg.classList.add('letterpress-underline-art');
  underlineSvg.setAttribute('aria-hidden', 'true');
  const underlineGroup = document.createElementNS(svgNamespace, 'g');
  underlineSvg.append(underlineGroup);
  stage.insertBefore(underlineSvg, editor);

  const defaults = {
    text: 'keegan.biz', font: 'helvetica', ink: '#c1272d', underprint: '#fdb913',
    paper: '#ece7d7', inkEnabled: true,
    underprintEnabled: true, underline: false, effects: {
      overlap: 50, spread: 50, register: 50, roughness: 50,
      underprintStrength: 50, variation: 50, size: 0, skew: 0,
      stretch: 0, warp: 0, noise: 0, texture: 0,
      underlineUniformity: 100, underlineWeight: 40, underlineCurve: 0,
      pressure: 50, pooling: 0
    }
  };

  // All Latin-compatible open-source families served by Fontsource are
  // discoverable from the live catalogue. The six original system faces are
  // always available, including when a visitor is offline.
  const fontChoices = {
    helvetica: { family: 'Helvetica, Arial, sans-serif', weight: 700, label: 'Helvetica' },
    georgia: { family: 'Georgia, "Times New Roman", serif', weight: 700, label: 'Georgia' },
    baskerville: { family: 'Baskerville, "Palatino Linotype", Georgia, serif', weight: 700, label: 'Baskerville' },
    impact: { family: 'Impact, "Arial Narrow", sans-serif', weight: 400, label: 'Impact' },
    trebuchet: { family: '"Trebuchet MS", "Lucida Grande", Arial, sans-serif', weight: 700, label: 'Trebuchet' },
    bodoni: { family: '"Bodoni 72", "Bodoni MT", "Times New Roman", serif', weight: 700, label: 'Bodoni' }
  };
  const starterFonts = [
    'Alegreya', 'Archivo', 'Archivo Black', 'Arimo', 'Barlow', 'Bebas Neue',
    'Bitter', 'Bodoni Moda', 'Cabin', 'Cardo', 'Caveat', 'Cinzel', 'Cormorant Garamond',
    'DM Sans', 'DM Serif Display', 'Dosis', 'EB Garamond', 'Exo 2', 'Figtree',
    'Fira Sans', 'Fraunces', 'Gabarito', 'Gelasio', 'Great Vibes', 'IBM Plex Mono',
    'IBM Plex Sans', 'IBM Plex Serif', 'Inconsolata', 'Inter', 'Josefin Sans',
    'Karla', 'Lato', 'Libre Baskerville', 'Libre Franklin', 'Lobster', 'Lora',
    'Manrope', 'Merriweather', 'Montserrat', 'Mulish', 'Nanum Gothic',
    'Noto Sans', 'Noto Serif', 'Nunito Sans', 'Old Standard TT', 'Oswald',
    'Outfit', 'Overpass', 'Pacifico', 'Permanent Marker', 'Playfair Display',
    'Plus Jakarta Sans', 'Poppins', 'PT Sans', 'PT Serif', 'Quicksand',
    'Raleway', 'Roboto', 'Roboto Condensed', 'Roboto Slab', 'Rubik',
    'Satisfy', 'Source Sans 3', 'Space Grotesk', 'Space Mono', 'Spectral',
    'Syne', 'Teko', 'Ubuntu', 'Urbanist', 'Work Sans', 'Zilla Slab'
  ];
  function fontId(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  for (const name of starterFonts) {
    const id = fontId(name);
    fontChoices['web:' + id] = { web: true, id, label: name, weight: 700, category: 'sans-serif' };
  }
  // No unsupported or awkward typefaces get introduced into the letterpress tool.
  const excludedFontIds = new Set(['instrument-serif']);
  const excludedFontPattern = /\bguide(?:s)?\b|\bunderline\b/i;
  function isExcludedFont(faceLike) {
    if (!faceLike) return true;
    const id = String(faceLike.id || '');
    const label = String(faceLike.label || faceLike.family || '');
    return excludedFontIds.has(id) || excludedFontPattern.test(id) || excludedFontPattern.test(label);
  }
  let fontCatalogPromise = null;
  let fontLoadSerial = 0;
  function setFontLoading(isLoading) {
    stage.classList.toggle('is-loading-font', isLoading);
  }
  function rebuildFontList() {
    const selected = fontSelect.value || defaults.font;
    const term = fontSearch.value.trim().toLocaleLowerCase();
    const systemGroup = document.createElement('optgroup');
    systemGroup.label = 'System';
    const libraryGroup = document.createElement('optgroup');
    libraryGroup.label = 'Font library';
    for (const [key, face] of Object.entries(fontChoices)) {
      if (face.web && isExcludedFont(face)) continue;
      if (term && !face.label.toLocaleLowerCase().includes(term) && key !== selected) continue;
      const option = document.createElement('option');
      option.value = key;
      option.textContent = face.label;
      (face.web ? libraryGroup : systemGroup).append(option);
    }
    const sorter = (a,b) => a.label.localeCompare(b.label, 'en', {sensitivity:'base'});
    // Recreate in alphabetical order for efficient browser type-to-jump.
    for (const group of [systemGroup, libraryGroup]) {
      const options = Array.from(group.children).sort((a,b) => sorter({label:a.textContent},{label:b.textContent}));
      group.replaceChildren(...options);
    }
    fontSelect.replaceChildren(systemGroup, libraryGroup);
    fontSelect.value = selected;
    if (!fontSelect.value) fontSelect.value = defaults.font;
  }
  async function loadFontCatalog() {
    if (fontCatalogPromise) return fontCatalogPromise;
    fontCatalogPromise = (async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      try {
        const response = await fetch('https://api.fontsource.org/v1/fonts?subsets=latin',
          { signal: controller.signal, mode:'cors', cache:'force-cache' });
        if (!response.ok) throw Error('Font catalogue unavailable');
        const catalog = await response.json();
        if (!Array.isArray(catalog)) throw Error('Invalid font catalogue');
        for (const record of catalog) {
          if (!record || !/^[a-z0-9-]+$/.test(record.id || '') ||
              !record.family || isExcludedFont({ id: record.id, label: record.family })) continue;
          if (!record.subsets?.includes('latin')) continue;
          const key = 'web:' + record.id;
          const weights = Array.isArray(record.weights) ? record.weights.map(Number) : [];
          const preferredWeight = weights.length
            ? weights.slice().sort((a,b) => Math.abs(a-700)-Math.abs(b-700))[0] : 400;
          fontChoices[key] = {
            ...fontChoices[key], web:true, id: record.id, label: record.family,
            weight:preferredWeight, category:record.category || 'sans-serif'
          };
        }
        rebuildFontList();
      } catch (error) {
        // A readable, usable font picker is still present offline.
        console.info('Using the available font list:', error);
      } finally { clearTimeout(timeout); }
    })();
    return fontCatalogPromise;
  }

  const fontPromises = new Map();
  function chosenFont() { return fontChoices[fontSelect.value] || fontChoices.helvetica; }
  function renderedFont() {
    const face = chosenFont();
    if (face.web) return face.loaded
      ? { family: '"' + face.alias + '", Arial, sans-serif', weight: face.weight }
      : { family: 'Helvetica, Arial, sans-serif', weight: 700 };
    return face;
  }
  function closestVariant(details, wanted) {
    const variants = details.variants || {};
    const weights = Object.keys(variants).map(Number).filter(Number.isFinite)
      .sort((a,b) => Math.abs(a-wanted)-Math.abs(b-wanted));
    for (const weight of weights) {
      const styles = variants[String(weight)] || {};
      const normal = styles.normal || Object.values(styles)[0] || {};
      const section = normal.latin || normal['latin-ext'] || Object.values(normal)[0];
      const url = section?.url?.woff2 || section?.url?.woff;
      if (url && /^https:\/\//.test(url)) return {url, weight, format: section?.url?.woff2 ? 'woff2' : 'woff', woffUrl: section?.url?.woff || null};
    }
    throw Error('Font has no compatible web file');
  }
  async function ensureFont(face) {
    if (!face?.web) return;
    if (face.loaded) return;
    if (fontPromises.has(face.id)) return fontPromises.get(face.id);
    const pending = (async () => {
      const response = await fetch('https://api.fontsource.org/v1/fonts/' + face.id,
        {mode: 'cors', cache: 'force-cache'});
      if (!response.ok) throw Error('Font metadata unavailable');
      const details = await response.json();
      const {url, weight, format, woffUrl} = closestVariant(details, face.weight);
      const fontResponse = await fetch(url, {mode:'cors', cache:'force-cache'});
      if (!fontResponse.ok) throw Error('Font file unavailable');
      const binary = await fontResponse.arrayBuffer();
      if (!binary.byteLength || binary.byteLength > 4000000) throw Error('Unexpected font file size');
      const alias = 'letterpress-web-' + face.id;
      const fontFace = new FontFace(alias, binary, {style:'normal', weight:String(weight)});
      await fontFace.load();
      document.fonts.add(fontFace);
      face.alias = alias;
      face.weight = weight;
      face.binary = binary;
      face.format = format;
      face.woffUrl = woffUrl;
      face.loaded = true;
      kerningCache.clear();
      if (chosenFont().id === face.id) requestPaint();
    })();
    fontPromises.set(face.id, pending);
    try { await pending; }
    catch (error) { fontPromises.delete(face.id); throw error; }
  }
  function applyFont() {
    const face = chosenFont();
    const selected = renderedFont();
    editor.style.fontFamily = selected.family;
    editor.style.fontWeight = String(selected.weight);

    if (!face.web || face.loaded || face.failed) {
      setFontLoading(false);
      return;
    }
    setFontLoading(true);
    const ticket = ++fontLoadSerial;
    note.textContent = 'loading…';
    // Attach a completion handler even if another caller started this load.
    void ensureFont(face).then(() => {
      if (ticket !== fontLoadSerial) return;
      setFontLoading(false);
      note.textContent = 'click the word to edit';
      requestPaint();
    }).catch(error => {
      face.failed = true;
      if (ticket !== fontLoadSerial) return;
      console.warn('Font could not be loaded:', face.label, error);
      setFontLoading(false);
      note.textContent = 'font unavailable; showing Helvetica';
      requestPaint();
    });
  }
  rebuildFontList();

  let seed = 0;
  let composing = false;
  let paintScheduled = false;
  const cleanText = value => String(value || '')
    .replace(/\u00a0/g, ' ').replace(/[\r\n]+/g, ' ').slice(0, 32);
  const getText = () => cleanText(editor.textContent);
  const clamp = (x, min, max) => Math.max(min, Math.min(max, x));
  const random = (min, max) => Math.round(min + Math.random() * (max - min));
  const hexToRgbString = hex => {
    const value = String(hex || '').replace('#', '');
    if (!/^[0-9a-f]{6}$/i.test(value)) return '0 0 0';
    return [0, 2, 4].map(index => parseInt(value.slice(index, index + 2), 16)).join(' ');
  };
  const hash = (ch, index) => (((ch.codePointAt(0) || 0) * 37) + index * 61 + 17) >>> 0;
  const seeded = n => () => {
    n ^= n << 13; n ^= n >>> 17; n ^= n << 5;
    return (n >>> 0) / 4294967296;
  };
  // Several of the more extreme effects should usually stay subtle, with
  // stronger distortion appearing only occasionally. The first 10% of the
  // range behaves like a short flat band; beyond that, values taper off so
  // low magnitudes are common and near-maximum magnitudes are rare.
  function weightedMagnitude(rand, amount, options = {}) {
    const normalized = clamp(amount, 0, 1);
    if (normalized <= 0) return 0;
    const flatBand = clamp(options.flatBand ?? 0.10, 0, 1);
    const flatChance = clamp(options.flatChance ?? 0.36, 0, 1);
    const tailPower = options.tailPower ?? 3.4;
    const outlierChance = clamp((options.outlierChance ?? 0.05) * (.35 + normalized * .9), 0, 1);
    const outlierPower = options.outlierPower ?? 0.42;
    const zeroChance = clamp((options.zeroChance ?? 0.16) * (1.08 - normalized * (options.zeroFalloff ?? 0.55)), 0.02, 0.34);
    if (rand() < zeroChance) return 0;
    let sample;
    if (rand() < flatChance) sample = rand() * flatBand;
    else sample = flatBand + (1 - flatBand) * (rand() ** tailPower);
    if (rand() < outlierChance) {
      sample = Math.max(sample, flatBand + (1 - flatBand) * (rand() ** outlierPower));
    }
    return normalized * clamp(sample, 0, 1);
  }
  function signedWeighted(rand, amount, options = {}) {
    const magnitude = weightedMagnitude(rand, amount, options);
    if (!magnitude) return 0;
    return (rand() < 0.5 ? -1 : 1) * magnitude;
  }
  function signedWeightedNonZero(rand, amount, options = {}, minimum = .12) {
    if (amount <= 0) return 0;
    const magnitude = weightedMagnitude(rand, amount, { ...options, zeroChance: 0 });
    const floor = Math.min(1, Math.max(0, minimum * amount));
    return (rand() < 0.5 ? -1 : 1) * Math.max(floor, magnitude || floor);
  }
  function balancedSigns(count, rng) {
    if (count <= 1) return [rng() < .5 ? -1 : 1];
    const signs = [];
    for (let i = 0; i < count; i++) signs.push(i < Math.ceil(count / 2) ? -1 : 1);
    for (let i = signs.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [signs[i], signs[j]] = [signs[j], signs[i]];
    }
    return signs;
  }

  // Randomize picks the SLIDER level here, rather than uniformly sampling a
  // middle-heavy range and only tapering the effect per letter. Zero is the
  // single most likely value; 1..10 form an equally likely flat band, followed
  // by an exponentially declining tail. A small outlier branch occasionally
  // produces a genuinely strong print. No value above 100 can occur.
  const lowBiasProfiles = Object.freeze({
    variation: { decay: .045, rare: .013 },
    size:      { decay: .051, rare: .012 },
    skew:      { decay: .057, rare: .010 },
    stretch:   { decay: .050, rare: .012 },
    warp:      { decay: .064, rare: .009 },
    noise:     { decay: .094, rare: .004 },
    texture:   { decay: .060, rare: .009 },
    underlineCurve: { decay: .054, rare: .012 }
  });
  function lowBiasedSetting(name, rng = Math.random) {
    const { decay, rare } = lowBiasProfiles[name];
    const roll = rng();
    if (roll < .11) return 0;
    if (roll < .60) return 1 + Math.floor(rng() * 10);
    if (roll > 1 - rare) return 70 + Math.floor(rng() * 31);
    // A truncated exponential across 11..100. This gives a smooth falling
    // probability instead of accidentally clustering around 50.
    const r = rng();
    const limit = 1 - Math.exp(-decay * 90);
    const value = 11 + Math.floor(-Math.log(1 - r * limit) / decay);
    return clamp(value, 11, 100);
  }

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
    stage.style.setProperty('--lp-face-rgb', hexToRgbString(ink.value));
    stage.style.setProperty('--lp-underprint', underprint.value);
    stage.style.setProperty('--lp-underprint-rgb', hexToRgbString(underprint.value));
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
    const face = renderedFont();
    kerningContext.font = `${face.weight} 1000px ${face.family}`;
    const key = `${fontSelect.value}:${chosenFont().loaded ? 'ready' : 'fallback'}:${a}${b}`;
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
    const showFirstInk = inkEnabled.checked;
    const showSecondInk = underprintEnabled.checked;
    editor.classList.remove('is-underlined'); // Underline is drawn only by the independent marker layer.
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
    // Preserve the familiar midpoint, but make the upper half much stronger.
    // At 50 this is equivalent to the prior variation; at 100 it is 9x wider.
    const variationValue = level('variation');
    const variation = variationValue <= 50 ? variationValue / 50
      : 1 + 8 * ((variationValue - 50) / 50) ** 1.35;
    const sizeLevel = level('size') / 100;
    const skewLevel = level('skew') / 100;
    const stretchLevel = level('stretch') / 100;
    const warpLevel = level('warp') / 100;
    const noiseLevel = level('noise') / 100;
    const textureLevel = level('texture') / 100;
    const pressure = level('pressure');
    // At 50 the print is fully opaque. Lower pressure makes both plates
    // lighter together, rather than exposing a differently-colored outline.
    const coverage = pressure < 50 ? .42 + .58 * pressure / 50 : 1;
    const extraDeposit = Math.max(0, pressure - 50) / 50;
    const pooling = level('pooling') / 100;

    // Word-wide effects should look like ONE print. Noise, texture, warp,
    // skew and stretch share an intensity across every glyph. Letter variation
    // and size variation are the two controls intended to vary individuals.
    const wordRng = seeded((seed ^ 0x8492d3f7) >>> 0);
    const stretchDirection = wordRng() < .5 ? -1 : 1;
    const skewDirection = wordRng() < .5 ? -1 : 1;
    const wordStretch = clamp(1 + stretchDirection * (.40 + wordRng() * .28) * stretchLevel, .46, 1.75);
    const wordSkewX = skewDirection * (23 + wordRng() * 9) * skewLevel;
    const wordSkewY = (wordRng() < .5 ? -1 : 1) * (3 + wordRng() * 4) * skewLevel;
    // Shared finish-filter strength, NOT a hit/miss lottery for each glyph.
    // Different glyphs can have different turbulence patterns, but all receive
    // the same degree of distortion, noise and texture.
    const hasFinish = warpLevel > 0 || noiseLevel > 0 || textureLevel > 0;
    stage.querySelectorAll('filter[id^="letterpress-finish-"]').forEach(filter => {
      filter.querySelector('[data-effect="warp"]')?.setAttribute('scale', (warpLevel * 22).toFixed(2));
      filter.querySelector('[data-effect="noise"]')?.setAttribute('scale', (noiseLevel * 9).toFixed(2));
      filter.querySelector('[data-effect="texture"]')?.setAttribute('slope', (textureLevel * .72).toFixed(3));
    });
    // Apply the finish ONCE to the entire word. This produces continuous
    // texture and deformation across every glyph rather than separate islands.
    editor.style.filter = hasFinish ? 'url(#letterpress-finish-a-v1)' : '';
    // Clear per-letter filters from older renders when recalculating.
    stage.querySelectorAll('filter[data-letter-finish]').forEach(node => node.remove());
    const liveLetters = Array.from(editor.querySelectorAll('.design-letter:not(.design-letter--space)'));
    const sizeSignRng = seeded((seed ^ 0x14ab7c29) >>> 0);
    const sizeSigns = balancedSigns(liveLetters.length, sizeSignRng);
    liveLetters
      .forEach((span, index) => {
        const char = span.dataset.char || ' ';
        const letterHash = (hash(char, index) ^ seed) >>> 0;
        const forEffect = name => seeded((letterHash ^ hash(name, index) ^ 0x9e3779b9) >>> 0);
        const wiggle = forEffect('plates');
        const pool = pooling * (.55 + wiggle() * .45);
        const variationOptions = {
          flatBand: .09, flatChance: .34, tailPower: 3.1,
          outlierChance: .105, outlierPower: .25, zeroChance: 0
        };
        const jitterX = signedWeightedNonZero(forEffect('variation-x'), 1, variationOptions, .14);
        const jitterY = signedWeightedNonZero(forEffect('variation-y'), 1, variationOptions, .14);
        const jitterAngle = signedWeightedNonZero(forEffect('variation-angle'), 1, variationOptions, .10);
        span.style.setProperty('--jitter-x', (jitterX * variation * .019).toFixed(4) + 'em');
        span.style.setProperty('--jitter-y', (jitterY * variation * .023).toFixed(4) + 'em');
        span.style.setProperty('--jitter-angle', (jitterAngle * variation * 1.8).toFixed(3) + 'deg');
        // Size variation preserves a glyph's proportions. Every letter is adjusted,
        // with some pushed larger and some smaller when the word has multiple letters.
        const sizeOptions = {
          flatBand: .11, flatChance: .37, tailPower: 3.0,
          outlierChance: .095, outlierPower: .23, zeroChance: 0
        };
        const sizeMagnitude = Math.max(.16, weightedMagnitude(forEffect('size-mag'), 1, sizeOptions));
        const sizeRatio = clamp(1 + sizeLevel * sizeSigns[index] * sizeMagnitude * .52, .50, 1.53);
        const scaleX = clamp(sizeRatio * wordStretch, .26, 2.45);
        const scaleY = sizeRatio;
        span.style.setProperty('--letter-scale-x', scaleX.toFixed(4));
        span.style.setProperty('--letter-scale-y', scaleY.toFixed(4));
        span.style.setProperty('--letter-skew-x', wordSkewX.toFixed(2) + 'deg');
        span.style.setProperty('--letter-skew-y', wordSkewY.toFixed(2) + 'deg');
        // The transform is visual only. Add sidebearings to compensate for the
        // scaled advance width so small letters don't leave huge blank gaps.
        // Each side gets half the change in advance from the natural glyph.
        const fontSize = parseFloat(getComputedStyle(editor).fontSize) || 100;
        const naturalWidth = span.offsetWidth;
        const sidebearing = (scaleX - 1) * (naturalWidth / fontSize) * .5;
        span.style.setProperty('--letter-sidebearing', sidebearing.toFixed(5) + 'em');
        span.classList.remove('has-finish');
        span.style.removeProperty('filter');
        span.style.setProperty('--yellow-x', (shift * (.012 + (wiggle() * 2 - 1) * .006)).toFixed(4) + 'em');
        span.style.setProperty('--yellow-y', (shift * (.016 + (wiggle() * 2 - 1) * .006)).toFixed(4) + 'em');
        span.style.setProperty('--yellow-scale', (1 + shift * .010 + pool * .025).toFixed(4));
        span.style.setProperty('--red-scale', (1 + bleed * .009 + pool * .055 + extraDeposit * .014).toFixed(4));
        span.style.setProperty('--red-scale-y', (1 + bleed * .009 + pool * .032 + extraDeposit * .010).toFixed(4));
        span.style.setProperty('--face-fill-opacity', showFirstInk ? coverage.toFixed(3) : '0');
        span.style.setProperty('--face-plate-opacity', showFirstInk ? coverage.toFixed(3) : '0');
        span.style.setProperty('--underprint-opacity', showSecondInk
          ? clamp((.77 + (wiggle() * 2 - 1) * .08) * secondStrength * coverage, 0, 1).toFixed(3)
          : '0');
        span.style.removeProperty('--letter-face');
        span.style.removeProperty('--red-opacity');
      });

    stage.querySelectorAll('filter[id^="letterpress-"]:not([id^="letterpress-finish-"])').forEach(filter => {
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


  // Underlining is a separate two-ink print, independent of whether the
  // lettering's ink plates are enabled. Both underline plates share the same
  // geometry and finish effects; registration slightly offsets the lower plate.
  // Geometry is stable for a given seed when changing weight or curve.
  function updateUnderline() {
    underlineGroup.replaceChildren();
    if (!underline.checked) return;

    const stageRect = stage.getBoundingClientRect();
    const glyphs = Array.from(editor.querySelectorAll('.design-letter:not(.design-letter--space)'));
    if (!glyphs.length) return;
    const rects = glyphs.map(element => element.getBoundingClientRect());
    const fontSize = parseFloat(getComputedStyle(editor).fontSize) || 100;
    const left = Math.min(...rects.map(rect => rect.left)) - stageRect.left;
    const right = Math.max(...rects.map(rect => rect.right)) - stageRect.left;
    const bottom = Math.max(...rects.map(rect => rect.bottom)) - stageRect.top;
    const width = Math.max(1, right - left);
    const uniformity = level('underlineUniformity') / 100;
    const uneven = 1 - uniformity;
    const curve = level('underlineCurve') / 100;
    const weight = level('underlineWeight') / 100;
    const rng = seeded((seed ^ 0x5f356495) >>> 0);
    const registration = level('register') / 100;
    const baseY = clamp(bottom + fontSize * .055,
      fontSize * .18, stageRect.height - Math.max(5, fontSize * .04));
    // Just as on the letters, the underlying ink shows at the edges.
    // Keep a small visible offset even with registration set to zero.
    const secondDx = fontSize * (.008 + registration * .024);
    const secondDy = fontSize * (.012 + registration * .024);
    const thickness = Math.max(1.2, fontSize * (.017 + weight ** 1.35 * .112)) *
      (1 + level('spread') / 100 * .20 + level('pooling') / 100 * .08);
    const pressure = level('pressure');
    const opacity = (pressure < 50 ? .42 + pressure / 50 * .58 : 1);

    underlineSvg.setAttribute('viewBox', `0 0 ${stageRect.width} ${stageRect.height}`);
    underlineSvg.setAttribute('preserveAspectRatio', 'none');
    const finishEnabled = level('warp') > 0 || level('noise') > 0 || level('texture') > 0;
    underlineGroup.setAttribute('filter', finishEnabled ? 'url(#letterpress-finish-a-v1)' : 'none');

    // Continuous at 100. Lower values progressively introduce gaps, never
    // independent lines under only one arbitrary character.
    const maxPieces = Math.min(Math.max(1, glyphs.length), 8);
    const pieces = 1 + Math.round(uneven * (maxPieces - 1));
    for (let index = 0; index < pieces; index++) {
      const pieceLeft = left + width * index / pieces;
      const pieceRight = left + width * (index + 1) / pieces;
      const gap = pieces === 1 ? 0 : Math.min((pieceRight - pieceLeft) * .30,
        fontSize * uneven * (.025 + rng() * .045));
      const x0 = pieceLeft + (index ? gap : 0);
      const x1 = pieceRight - (index + 1 < pieces ? gap : 0);
      if (x1 <= x0 + 1) continue;
      const segmentW = x1 - x0;
      const segmentY = baseY + (rng() * 2 - 1) * uneven * fontSize * .06;
      const amplitude = curve ** 1.45 * fontSize * .16 + uneven * fontSize * .022;
      const edgeJitter = level('roughness') / 100 * fontSize * .008;
      const jitterPhase = rng() * Math.PI * 2;
      const phase = rng() * Math.PI * 2;
      const waves = 0.7 + width / Math.max(fontSize * 3.6, 120) + rng() * .60;
      const steps = Math.max(8, Math.ceil(segmentW / 11));
      const points = [];
      for (let step = 0; step <= steps; step++) {
        const t = step / steps;
        const x = x0 + t * segmentW;
        const wave = Math.sin(phase + (x - left) / width * Math.PI * 2 * waves) - Math.sin(phase);
        const jitter = edgeJitter * Math.sin(x * .39 + jitterPhase) * .4;
        const y = segmentY + amplitude * wave * .62 + jitter;
        points.push([x, clamp(y, 2, stageRect.height - 2)]);
      }
      // Smooth Catmull–Rom-style cubic interpolation, not angular line joins.
      let data = `M ${points[0][0].toFixed(2)} ${points[0][1].toFixed(2)}`;
      for (let i = 0; i < points.length - 1; i++) {
        const previous = points[Math.max(0, i - 1)];
        const current = points[i];
        const next = points[i + 1];
        const following = points[Math.min(points.length - 1, i + 2)];
        const c1x = current[0] + (next[0] - previous[0]) / 6;
        const c1y = current[1] + (next[1] - previous[1]) / 6;
        const c2x = next[0] - (following[0] - current[0]) / 6;
        const c2y = next[1] - (following[1] - current[1]) / 6;
        data += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)} ${c2x.toFixed(2)} ${c2y.toFixed(2)} ${next[0].toFixed(2)} ${next[1].toFixed(2)}`;
      }
      const segmentThickness = thickness * (1 + (rng() * 2 - 1) * uneven * .22);
      const segmentOpacity = opacity * (1 - rng() * uneven * .16);
      // Add the background plate first, then the foreground plate. The line
      // remains a standalone two-color element even if the lettering toggles
      // disable one of the main text ink plates.
      const secondPath = document.createElementNS(svgNamespace, 'path');
      secondPath.classList.add('underline-second-ink');
      secondPath.setAttribute('d', data);
      secondPath.setAttribute('stroke', underprint.value);
      secondPath.setAttribute('stroke-width', (segmentThickness * 1.08).toFixed(2));
      secondPath.setAttribute('opacity',
        (segmentOpacity * clamp(level('underprintStrength') / 65, 0, 1)).toFixed(3));
      secondPath.setAttribute('transform',
        `translate(${secondDx.toFixed(2)} ${secondDy.toFixed(2)})`);
      secondPath.dataset.dx = secondDx.toFixed(2);
      secondPath.dataset.dy = secondDy.toFixed(2);

      const firstPath = document.createElementNS(svgNamespace, 'path');
      firstPath.classList.add('underline-first-ink');
      firstPath.setAttribute('d', data);
      firstPath.setAttribute('stroke', ink.value);
      firstPath.setAttribute('stroke-width', segmentThickness.toFixed(2));
      firstPath.setAttribute('opacity', segmentOpacity.toFixed(3));
      underlineGroup.append(secondPath, firstPath);
    }
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
    for (let i = 0; i < 14; i++) {
      const stageBounds = stage.getBoundingClientRect();
      const editorBounds = editor.getBoundingClientRect();
      const pieces = Array.from(editor.querySelectorAll('.design-letter:not(.design-letter--space)'));
      const rects = pieces.map(element => element.getBoundingClientRect());
      const left = Math.min(editorBounds.left, ...rects.map(r => r.left));
      const right = Math.max(editorBounds.right, ...rects.map(r => r.right));
      const top = Math.min(editorBounds.top, ...rects.map(r => r.top));
      const bottom = Math.max(editorBounds.bottom, ...rects.map(r => r.bottom));
      const width = right - left, height = bottom - top;
      const padX = Math.max(16, stageBounds.width * .025);
      const padY = 14;
      if (width <= stageBounds.width - 2 * padX &&
          height <= stageBounds.height - 2 * padY &&
          left >= stageBounds.left + padX && right <= stageBounds.right - padX &&
          top >= stageBounds.top + padY && bottom <= stageBounds.bottom - padY) break;
      const factor = Math.min((stageBounds.width - padX * 2) / Math.max(1, width),
        (stageBounds.height - padY * 2) / Math.max(1, height));
      size = Math.max(11, size * Math.min(.96, factor * .95));
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
    updateUnderline();
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
    void loadFontCatalog();
    requestAnimationFrame(() => {
      editor.focus({ preventScroll: true });
      restoreSelection(getText().length);
    });
  }

  function reset() {
    seed = 0;
    fontSearch.value = '';
    fontSelect.value = defaults.font;
    rebuildFontList();
    ink.value = defaults.ink;
    inkEnabled.checked = defaults.inkEnabled;
    underprint.value = defaults.underprint;
    underprintEnabled.checked = defaults.underprintEnabled;
    paper.value = defaults.paper;
    for (const [key, input] of Object.entries(effects)) {
      input.value = defaults.effects[key];
    }
    transparent.checked = false;
    underline.checked = defaults.underline;
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
  // Independently generated 24-bit RGB inks, not a rotating palette.
  // Reject only colors nearly invisible on the current paper, or inks
  // so similar that the second plate becomes indistinguishable.
  function srgb(hex) {
    const values = [1,3,5].map(i => parseInt(hex.slice(i,i+2),16)/255);
    return values.map(v => v <= .04045 ? v/12.92 : ((v+.055)/1.055)**2.4);
  }
  function luminance(hex) {
    const [r,g,b] = srgb(hex);
    return r*.2126 + g*.7152 + b*.0722;
  }
  function contrast(a,b) {
    const x=luminance(a),y=luminance(b);
    return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
  }
  function randomRgb() {
    const rgb = new Uint8Array(3);
    if (window.crypto?.getRandomValues) window.crypto.getRandomValues(rgb);
    else for (let i=0; i<3; i++) rgb[i] = Math.floor(Math.random()*256);
    return '#' + Array.from(rgb, x=>x.toString(16).padStart(2,'0')).join('');
  }
  function randomInk(paperHex, anotherInk, minContrast) {
    let color = randomRgb();
    for (let attempt = 0; attempt < 100; attempt++) {
      if (contrast(color,paperHex) >= minContrast &&
          (!anotherInk || contrast(color,anotherInk) >= 1.32)) return color;
      color = randomRgb();
    }
    return color;
  }
  // Most randomizations use the full 24-bit RGB color space. Occasionally,
  // deliberately sample a vivid high-saturation pair: no fixed palette,
  // so neon pink/green, violet/cyan and other clashing inks remain possible.
  function hsvInk(hue, saturation, value) {
    const chroma = value * saturation;
    const x = chroma * (1 - Math.abs(((hue % 360) / 60) % 2 - 1));
    const match = value - chroma;
    const channels = hue < 60 ? [chroma,x,0] : hue < 120 ? [x,chroma,0]
      : hue < 180 ? [0,chroma,x] : hue < 240 ? [0,x,chroma]
      : hue < 300 ? [x,0,chroma] : [chroma,0,x];
    return '#' + channels.map(c => Math.round((c + match) * 255)
      .toString(16).padStart(2, '0')).join('');
  }
  function randomInkPair(paperHex) {
    if (Math.random() < .27) {
      for (let tries = 0; tries < 100; tries++) {
        const hue = Math.random() * 360;
        const primary = hsvInk(hue, .82 + Math.random() * .18, .60 + Math.random() * .40);
        // The main ink is readable, but it can be brighter than the usual
        // contrast-restricted combinations. The second plate may be neon.
        if (contrast(primary, paperHex) < 2.05) continue;
        const turn = 72 + Math.random() * 216;
        const secondHue = (hue + (Math.random() < .5 ? turn : -turn) + 360) % 360;
        const second = hsvInk(secondHue, .78 + Math.random() * .22,
          .72 + Math.random() * .28);
        return [primary, second];
      }
    }
    const primary = randomInk(paperHex, null, 3.2);
    return [primary, randomInk(paperHex, primary, 1.6)];
  }
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
      variation: [12, 100], size: [0, 94], skew: [0, 95], stretch: [0, 82],
      warp: [0, 82], noise: [0, 52], texture: [0, 92],
      underlineUniformity: [0, 100], underlineWeight: [10, 85], underlineCurve: [0, 100],
      pressure: [28, 82], pooling: [0, 75]
    };
    for (const [key, input] of Object.entries(effects)) {
      input.value = String(lowBiasProfiles[key]
        ? lowBiasedSetting(key) : random(...ranges[key]));
    }
    // Each new random print also selects a different typeface.
    const otherFonts = Object.keys(fontChoices).filter(key =>
      key !== fontSelect.value && !(fontChoices[key].web && isExcludedFont(fontChoices[key])));
    const nextFont = otherFonts[random(0, otherFonts.length - 1)];
    fontSearch.value = '';
    rebuildFontList();
    fontSelect.value = nextFont;
    // Unbounded RGB color space, subject only to legibility on the chosen paper.
    // The background/paper color is deliberately never modified here.
    const [firstInk, secondInk] = randomInkPair(paper.value);
    ink.value = firstInk;
    underprint.value = secondInk;
    inkEnabled.checked = Math.random() < .94;
    underprintEnabled.checked = Math.random() < .78;
    underline.checked = Math.random() < .20;
    effects.underlineUniformity.value = String(random(18, 100));
    effects.underlineWeight.value = String(random(14, 76));
    effects.underlineCurve.value = String(lowBiasedSetting('underlineCurve'));
    if (!inkEnabled.checked && !underprintEnabled.checked) {
      if (Math.random() < .5) inkEnabled.checked = true;
      else underprintEnabled.checked = true;
    }
    buildLetters(nextWord());
    note.textContent = 'click the word to edit';
    requestPaint();
  }

  // Embed the selected web font inside the exported SVG. An exported SVG
  // image cannot inherit fonts loaded by the surrounding web page.
  function fontBase64(face) {
    if (face.base64) return face.base64;
    const bytes = new Uint8Array(face.binary);
    const parts = [];
    for (let i = 0; i < bytes.length; i += 8192)
      parts.push(String.fromCharCode(...bytes.subarray(i, i+8192)));
    face.base64 = btoa(parts.join(''));
    return face.base64;
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
    // The underline is composited directly into the final PNG below.
    clone.querySelector('.letterpress-underline-art')?.remove();
    clone.style.width = width + 'px';
    clone.style.height = height + 'px';
    const paperOverride = transparent.checked
      ? 'background:transparent!important;' : '';
    const overrides = '#letterpress-preview{min-height:0!important;width:' + width +
      'px!important;height:' + height + 'px!important;' + paperOverride + '}';
    const face = chosenFont();
    const embeddedFont = (face.web && face.loaded && face.binary)
      ? '@font-face{font-family:"' + face.alias + '";src:url("data:font/' + face.format + ';base64,' +
        fontBase64(face) + '") format("' + face.format + '");font-weight:' + face.weight + ';font-style:normal;}'
      : '';
    const safeCSS = (embeddedFont + '\n' + stylesheet + '\n' + overrides)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px;height:${height}px;--red:#c1272d;--green:#006a44;--paper:#ece7d7"><style>${safeCSS}</style>${clone.outerHTML}</div></foreignObject></svg>`;
    const image = new Image();
    const loaded = new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(Error('Print rasterization unavailable'));
    });
    image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    await loaded;
    // At least 5,600 pixels wide on desktop. Rasterize the *vector SVG*
    // at output size, rather than enlarging a small preview bitmap.
    const ratio = Math.min(12, Math.max(7, Math.ceil(5600 / width)));
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
    const width = Math.round(stage.clientWidth);
    const height = Math.round(stage.clientHeight);
    const ratio = Math.min(12, Math.max(7, Math.ceil(5600 / width)));
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
      const selectedFont = renderedFont();
      ctx.font = `${selectedFont.weight} ${size}px ${selectedFont.family}`;
      ctx.textBaseline = 'alphabetic';
      const draw = (color, alpha, dx, dy, blur) => {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = blur;
        const px = x + rect.width * .5, py = y - size * .4;
        ctx.translate(px, py);
        const rot = parseFloat(css.getPropertyValue('--jitter-angle')) || 0;
        const skewX = (parseFloat(css.getPropertyValue('--letter-skew-x')) || 0) * Math.PI / 180;
        const skewY = (parseFloat(css.getPropertyValue('--letter-skew-y')) || 0) * Math.PI / 180;
        ctx.rotate(rot * Math.PI / 180);
        ctx.transform(1, Math.tan(skewY), Math.tan(skewX), 1, 0, 0);
        ctx.scale(num('--letter-scale-x', 1), num('--letter-scale-y', 1));
        ctx.fillText(char, x + dx - px, y + dy - py);
        ctx.restore();
      };
      const faceOpacity = num('--face-fill-opacity', 1);
      const facePlateOpacity = num('--face-plate-opacity', 1);
      draw(underprint.value, num('--underprint-opacity', .78),
        num('--yellow-x', .014) * size, num('--yellow-y', .015) * size, size * .018);
      draw(ink.value, facePlateOpacity, 0, 0, size * .022 * level('spread') / 50);
      draw(ink.value, faceOpacity, 0, 0, 0);
    });
    return canvas;
  }

  // The word rasterizer does not reliably retain a nested SVG underline.
  // Add the same path geometry to the final output at its full pixel density.
  function renderUnderlineToCanvas(canvas) {
    if (!underline.checked) return;
    const paths = underlineGroup.querySelectorAll('path');
    if (!paths.length) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.save();
    ctx.setTransform(canvas.width / Math.max(1, stage.clientWidth), 0, 0,
      canvas.height / Math.max(1, stage.clientHeight), 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const mark of paths) {
      ctx.save();
      ctx.globalAlpha = Number(mark.getAttribute('opacity') || 1);
      ctx.strokeStyle = mark.getAttribute('stroke') || ink.value;
      ctx.lineWidth = Number(mark.getAttribute('stroke-width') || 2);
      ctx.translate(Number(mark.dataset.dx || 0), Number(mark.dataset.dy || 0));
      ctx.stroke(new Path2D(mark.getAttribute('d') || ''));
      ctx.restore();
    }
    ctx.restore();
  }

  async function savePng() {
    if (!getText().trim()) {
      note.textContent = 'type a word first';
      editor.focus();
      return;
    }
    exportButton.disabled = true;
    try {
      const face = chosenFont();
      if (face.web) {
        try { await ensureFont(face); }
        catch (error) { console.warn('Web font unavailable; exporting displayed fallback', error); }
      }
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      paint();
      let canvas;
      try { canvas = await exactPrintCanvas(); }
      catch (error) { console.warn('Using compatible PNG export:', error); canvas = fallbackCanvas(); }
      renderUnderlineToCanvas(canvas);
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
      note.textContent = `png ready · ${canvas.width} × ${canvas.height} px`;
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
  fontSelect.addEventListener('change', () => {
    kerningCache.clear();
    note.textContent = 'click the word to edit';
    requestPaint();
  });
  fontSearch.addEventListener('input', rebuildFontList);
  fontSearch.addEventListener('keydown', event => {
    if (event.key === 'Enter' && fontSelect.options.length) {
      // Pick the first matching font without leaving the search field.
      const matches = Array.from(fontSelect.options).filter(option => !option.disabled);
      const next = matches.find(option => option.value !== fontSelect.value) || matches[0];
      if (next) { fontSelect.value = next.value; requestPaint(); }
      event.preventDefault();
    }
  });
  exportButton.addEventListener('click', savePng);
  [ink, inkEnabled, underprint, underprintEnabled,
    paper, transparent, underline, ...Object.values(effects)]
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

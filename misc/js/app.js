(() => {
  const stage = document.getElementById('ornament-stage');
  const speciesSelect = document.getElementById('species-select');
  const structureSelect = document.getElementById('structure-select');
  const paletteSelect = document.getElementById('palette-select');
  const wearRange = document.getElementById('wear-range');
  const wearValue = document.getElementById('wear-value');
  const animateToggle = document.getElementById('animate-toggle');
  const generateBtn = document.getElementById('generate-btn');
  const replayBtn = document.getElementById('replay-btn');
  const downloadBtn = document.getElementById('download-svg-btn');
  const artCaption = document.getElementById('art-caption');
  const artState = document.getElementById('art-state');

  const state = {
    species: 'bramble',
    structure: 'arch',
    palette: 'site',
    wear: 18,
    animate: true,
    currentKey: 'bramble-arch'
  };

  const compositions = {
    'bramble-arch': { label: 'bramble / arch study', fn: buildBrambleArch },
    'holly-spray': { label: 'holly / spray study', fn: buildHollySpray },
    'oak-roundel': { label: 'oak / roundel study', fn: buildOakRoundel },
    'fern-upright': { label: 'fern / upright study', fn: buildFernUpright }
  };

  const combos = {
    bramble: 'bramble-arch',
    holly: 'holly-spray',
    oak: 'oak-roundel',
    fern: 'fern-upright'
  };

  function rotPoint(x, y, cx, cy, angle) {
    const r = angle * Math.PI / 180;
    const dx = x - cx;
    const dy = y - cy;
    return {
      x: cx + dx * Math.cos(r) - dy * Math.sin(r),
      y: cy + dx * Math.sin(r) + dy * Math.cos(r)
    };
  }

  function leafPath(x, y, w, h, angle = 0) {
    const cx = x;
    const cy = y;
    const pts = [
      rotPoint(cx, cy - h / 2, cx, cy, angle),
      rotPoint(cx + w / 2, cy - h / 6, cx, cy, angle),
      rotPoint(cx + w * 0.43, cy + h / 4, cx, cy, angle),
      rotPoint(cx, cy + h / 2, cx, cy, angle),
      rotPoint(cx - w * 0.43, cy + h / 4, cx, cy, angle),
      rotPoint(cx - w / 2, cy - h / 6, cx, cy, angle)
    ];
    return `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)} C ${pts[1].x.toFixed(1)} ${pts[1].y.toFixed(1)}, ${pts[2].x.toFixed(1)} ${pts[2].y.toFixed(1)}, ${pts[3].x.toFixed(1)} ${pts[3].y.toFixed(1)} C ${pts[4].x.toFixed(1)} ${pts[4].y.toFixed(1)}, ${pts[5].x.toFixed(1)} ${pts[5].y.toFixed(1)}, ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)} Z`;
  }

  function veinPath(x, y, h, angle = 0) {
    const top = rotPoint(x, y - h * 0.42, x, y, angle);
    const bottom = rotPoint(x, y + h * 0.42, x, y, angle);
    return `M ${top.x.toFixed(1)} ${top.y.toFixed(1)} L ${bottom.x.toFixed(1)} ${bottom.y.toFixed(1)}`;
  }

  function hollyPath(x, y, w, h, angle = 0) {
    const local = [
      [0, -0.5], [0.16, -0.34], [0.38, -0.31], [0.23, -0.12], [0.5, 0.0], [0.23, 0.12],
      [0.4, 0.33], [0.12, 0.32], [0, 0.5], [-0.12, 0.32], [-0.4, 0.33], [-0.23, 0.12],
      [-0.5, 0.0], [-0.23, -0.12], [-0.38, -0.31], [-0.16, -0.34]
    ];
    const pts = local.map(([px, py]) => rotPoint(x + px * w, y + py * h, x, y, angle));
    return `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)} ` + pts.slice(1).map(p => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z';
  }

  function oakPath(x, y, w, h, angle = 0) {
    const local = [
      [0, -0.5], [0.19, -0.42], [0.3, -0.28], [0.42, -0.2], [0.34, -0.02], [0.5, 0.09],
      [0.28, 0.17], [0.34, 0.35], [0.12, 0.29], [0, 0.5], [-0.12, 0.29], [-0.34, 0.35],
      [-0.28, 0.17], [-0.5, 0.09], [-0.34, -0.02], [-0.42, -0.2], [-0.3, -0.28], [-0.19, -0.42]
    ];
    const pts = local.map(([px, py]) => rotPoint(x + px * w, y + py * h, x, y, angle));
    return `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)} ` + pts.slice(1).map(p => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z';
  }

  function berryCluster(cx, cy, r = 4, count = 6, spread = 10, delay = 0) {
    let out = '';
    const coords = [
      [0, 0], [0.7, -0.4], [-0.6, -0.35], [0.55, 0.45], [-0.5, 0.4], [0, -0.75],
      [0, 0.75]
    ];
    coords.slice(0, count).forEach((pair, i) => {
      out += `<circle class="berry-shape" data-pop style="--delay:${delay + i * 55}ms" cx="${(cx + pair[0] * spread).toFixed(1)}" cy="${(cy + pair[1] * spread).toFixed(1)}" r="${r}" />`;
    });
    return out;
  }

  function leafGroup({ x, y, w, h, angle = 0, type = 'oval', delay = 0 }) {
    const d = type === 'holly' ? hollyPath(x, y, w, h, angle) : type === 'oak' ? oakPath(x, y, w, h, angle) : leafPath(x, y, w, h, angle);
    const vein = veinPath(x, y, h, angle);
    return `
      <g data-grow style="--delay:${delay}ms">
        <path class="leaf-shape ink-outlines" d="${d}" />
        <path class="leaf-vein ink-outlines" stroke-width="1.15" d="${vein}" />
      </g>`;
  }

  function stemPath(d, width = 8, delay = 0, fill = false) {
    if (fill) {
      return `<path class="stem-fill ink-outlines" data-draw style="--dur:1200ms; --delay:${delay}ms" stroke-width="1.1" d="${d}" />`;
    }
    return `<path class="twig-line ink-outlines" data-draw style="--dur:900ms; --delay:${delay}ms" stroke-width="${width}" d="${d}" />`;
  }

  function defs() {
    return `
      <defs>
        <filter id="roughen" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="1" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.7" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>`;
  }

  function wrapSvg(inner, viewBox, palette, wear) {
    const redOpacity = Math.min(0.08 + wear * 0.0022, 0.25).toFixed(3);
    const greenOpacity = Math.min(0.05 + wear * 0.0018, 0.22).toFixed(3);
    const yShift = Math.max(1, Math.round(wear * 0.04));
    return `
      <svg class="ornament-svg palette-${palette} ${state.animate ? 'is-animated' : ''}" viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Illuminated botanical ornament">
        ${defs()}
        <g class="bleed-red" transform="translate(${Math.max(1, Math.round(wear * 0.03))}, ${yShift})" opacity="${redOpacity}">${inner}</g>
        <g class="bleed-green" transform="translate(${-Math.max(1, Math.round(wear * 0.02))}, 1)" opacity="${greenOpacity}">${inner}</g>
        <g class="ink-lines">${inner}</g>
      </svg>`;
  }

  function buildBrambleArch() {
    let inner = '';
    inner += stemPath('M 165 935 C 178 850, 198 750, 234 648 C 270 546, 324 432, 404 320 C 486 206, 572 126, 654 86', 18);
    inner += stemPath('M 260 838 C 292 796, 338 770, 408 756 C 472 742, 548 744, 625 772', 6, 160);
    inner += stemPath('M 196 668 C 238 640, 298 618, 356 588 C 420 555, 468 514, 516 456', 5, 240);
    inner += stemPath('M 308 488 C 346 455, 396 430, 440 410', 4, 360);
    inner += stemPath('M 246 760 C 220 700, 198 650, 136 604', 4, 200);
    inner += stemPath('M 454 240 C 420 198, 390 152, 366 112', 4, 240);
    inner += stemPath('M 510 458 C 558 432, 606 396, 640 352', 4, 300);

    const leaves = [
      [152, 878, 34, 72, -18],[218, 820, 34, 72, -16],[281, 750, 38, 82, 8],[340, 706, 36, 76, -20],
      [316, 637, 36, 74, 18],[402, 590, 40, 84, -12],[450, 548, 34, 72, 24],[520, 500, 34, 74, -10],
      [576, 446, 34, 74, 22],[612, 384, 34, 74, 18],[635, 306, 32, 68, 30],[594, 196, 34, 72, 44],
      [534, 122, 32, 68, 14],[229, 662, 30, 62, -34],[168, 618, 30, 64, -44],[503, 766, 34, 74, 44],[566, 760, 32, 68, -10],
      [375, 754, 30, 62, -24],[398, 430, 28, 58, 36],[442, 412, 28, 58, -6],[389, 174, 26, 54, -24]
    ];
    leaves.forEach((vals, i) => inner += leafGroup({ x: vals[0], y: vals[1], w: vals[2], h: vals[3], angle: vals[4], delay: 600 + i * 45 }));
    inner += berryCluster(106, 604, 3.8, 6, 8, 1400);
    inner += berryCluster(626, 773, 3.8, 6, 8, 1460);
    inner += berryCluster(515, 455, 3.8, 6, 8, 1520);
    inner += berryCluster(361, 108, 3.8, 5, 8, 1580);
    return { viewBox: '0 0 760 980', inner };
  }

  function buildHollySpray() {
    let inner = '';
    inner += stemPath('M 98 728 C 160 684, 248 640, 330 584 C 432 514, 530 418, 640 248', 11);
    inner += stemPath('M 220 644 C 250 704, 290 772, 334 874', 5, 160);
    inner += stemPath('M 342 576 C 300 496, 262 406, 240 302', 5, 220);
    inner += stemPath('M 470 454 C 556 474, 646 490, 722 504', 5, 260);
    inner += stemPath('M 482 446 C 520 382, 560 320, 618 254', 4, 320);
    inner += stemPath('M 372 558 C 420 620, 470 684, 522 778', 4, 360);

    const leaves = [
      [140, 697, 32, 56, -35],[208, 664, 32, 60, 16],[286, 624, 36, 62, -18],[360, 572, 36, 64, 18],
      [430, 520, 34, 60, -6],[508, 446, 40, 74, 18],[565, 374, 34, 62, 12],[620, 290, 32, 60, 30],
      [314, 784, 34, 62, 4],[344, 860, 34, 62, -10],[252, 420, 34, 60, -26],[240, 332, 36, 64, -6],
      [602, 482, 32, 58, -12],[684, 500, 28, 54, 12],[476, 690, 36, 62, -24],[520, 770, 34, 60, 10]
    ];
    leaves.forEach((vals, i) => inner += leafGroup({ x: vals[0], y: vals[1], w: vals[2], h: vals[3], angle: vals[4], type: 'holly', delay: 580 + i * 42 }));
    inner += berryCluster(214, 658, 4.5, 7, 10, 1280);
    inner += berryCluster(626, 258, 4.5, 6, 9, 1350);
    inner += berryCluster(685, 505, 4.5, 5, 8, 1410);
    inner += berryCluster(515, 778, 4.5, 5, 8, 1470);
    return { viewBox: '0 0 780 980', inner };
  }

  function buildOakRoundel() {
    let inner = '';
    inner += `<circle class="twig-line ink-outlines" data-draw style="--dur:950ms" stroke-width="4" cx="372" cy="420" r="216" fill="none" />`;
    inner += stemPath('M 372 906 C 380 826, 388 736, 386 662 C 384 564, 378 498, 372 420 C 366 340, 364 286, 372 206', 12, 140);
    inner += stemPath('M 372 546 C 312 540, 262 532, 206 504', 5, 300);
    inner += stemPath('M 372 398 C 438 392, 496 376, 548 344', 5, 360);
    inner += stemPath('M 372 296 C 326 250, 292 214, 242 198', 4, 420);
    inner += stemPath('M 386 668 C 448 684, 512 728, 558 786', 4, 470);

    const leaves = [
      [372, 166, 48, 88, 0],[430, 250, 46, 84, 42],[502, 342, 46, 84, 80],[544, 448, 48, 88, 90],
      [508, 572, 48, 88, 124],[432, 650, 44, 82, 164],[370, 714, 44, 82, 180],[308, 650, 42, 80, -164],
      [236, 570, 42, 80, -124],[202, 462, 46, 84, -92],[226, 338, 44, 82, -68],[276, 240, 42, 78, -42],
      [314, 390, 34, 62, -25],[470, 454, 34, 62, 24],[328, 544, 34, 62, -22],[448, 584, 34, 62, 22]
    ];
    leaves.forEach((vals, i) => inner += leafGroup({ x: vals[0], y: vals[1], w: vals[2], h: vals[3], angle: vals[4], type: 'oak', delay: 560 + i * 52 }));
    inner += `<circle class="gold-dot" data-pop style="--delay:1480ms" cx="554" cy="780" r="5" />`;
    inner += `<circle class="gold-dot" data-pop style="--delay:1520ms" cx="239" cy="196" r="5" />`;
    return { viewBox: '0 0 760 980', inner };
  }

  function buildFernUpright() {
    let inner = '';
    inner += stemPath('M 372 934 C 366 790, 356 640, 358 492 C 360 362, 378 254, 440 96', 9);
    inner += stemPath('M 346 730 C 302 702, 254 676, 200 660 C 162 648, 132 642, 98 642', 4, 120);
    inner += stemPath('M 356 610 C 286 592, 218 560, 160 514', 4, 180);
    inner += stemPath('M 370 512 C 288 470, 232 430, 174 372', 4, 240);
    inner += stemPath('M 380 428 C 470 398, 552 348, 640 278', 4, 300);
    inner += stemPath('M 392 578 C 474 572, 556 534, 638 458', 4, 360);

    const fernLeaflets = [];
    for (let i = 0; i < 11; i++) {
      fernLeaflets.push([302 - i * 16, 790 - i * 34, 22, 52, -66]);
      fernLeaflets.push([405 + i * 16, 776 - i * 36, 22, 52, 66]);
    }
    fernLeaflets.push([356, 856, 22, 52, -6], [372, 812, 22, 52, 4], [388, 758, 22, 52, -4]);
    fernLeaflets.forEach((vals, i) => inner += leafGroup({ x: vals[0], y: vals[1], w: vals[2], h: vals[3], angle: vals[4], delay: 470 + i * 30 }));
    inner += `<circle class="gold-dot" data-pop style="--delay:1320ms" cx="98" cy="642" r="4" />`;
    inner += `<circle class="gold-dot" data-pop style="--delay:1380ms" cx="642" cy="278" r="4" />`;
    return { viewBox: '0 0 760 980', inner };
  }

  function chooseKey(species, structure) {
    const direct = `${species}-${structure}`;
    if (compositions[direct]) return direct;
    return combos[species] || 'bramble-arch';
  }

  function render(replay = false) {
    state.species = speciesSelect.value;
    state.structure = structureSelect.value;
    state.palette = paletteSelect.value;
    state.wear = Number(wearRange.value);
    state.animate = animateToggle.checked;
    wearValue.textContent = wearRange.value;

    const key = state.currentKey = chooseKey(state.species, state.structure);
    const composition = compositions[key];
    const built = composition.fn();

    stage.innerHTML = wrapSvg(built.inner, built.viewBox, state.palette, state.wear);
    artCaption.textContent = composition.label;
    artState.textContent = state.animate ? 'growth animation on' : 'static drawing';

    const svg = stage.querySelector('svg');
    const drawables = stage.querySelectorAll('[data-draw]');
    drawables.forEach(el => {
      try {
        const len = el.getTotalLength();
        el.style.setProperty('--path-length', `${len}`);
        const delay = Number((el.style.getPropertyValue('--delay') || '0ms').replace('ms', ''));
        el.style.animationDelay = `${delay}ms`;
      } catch (error) {
        el.style.setProperty('--path-length', '300');
      }
    });

    if (svg && !state.animate) {
      svg.classList.remove('is-animated');
    }

    if (replay && svg && state.animate) {
      const cloned = svg.cloneNode(true);
      stage.innerHTML = '';
      stage.appendChild(cloned);
      stage.querySelectorAll('[data-draw]').forEach(el => {
        try {
          const len = el.getTotalLength();
          el.style.setProperty('--path-length', `${len}`);
          const delay = Number((el.style.getPropertyValue('--delay') || '0ms').replace('ms', ''));
          el.style.animationDelay = `${delay}ms`;
        } catch (error) {
          el.style.setProperty('--path-length', '300');
        }
      });
    }
  }

  function randomise() {
    const keys = Object.keys(compositions);
    const currentIndex = keys.indexOf(state.currentKey);
    const nextKey = keys[(currentIndex + 1) % keys.length];
    const [species, structure] = nextKey.split('-');
    speciesSelect.value = species;
    structureSelect.value = structure;
    state.currentKey = nextKey;
    render();
  }

  function downloadCurrentSvg() {
    const svg = stage.querySelector('svg');
    if (!svg) return;
    const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${state.currentKey}.svg`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  [speciesSelect, structureSelect, paletteSelect].forEach(el => el.addEventListener('change', () => render()));
  wearRange.addEventListener('input', () => {
    wearValue.textContent = wearRange.value;
    render();
  });
  animateToggle.addEventListener('change', () => render());
  generateBtn.addEventListener('click', randomise);
  replayBtn.addEventListener('click', () => render(true));
  downloadBtn.addEventListener('click', downloadCurrentSvg);

  render();
})();

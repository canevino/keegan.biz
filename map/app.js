(() => {
  'use strict';
  const c = window.AT_MAP_CONFIG;
  const $ = id => document.getElementById(id);
  if (!window.L || !c) {
    $('map').textContent = 'Map unavailable. Check the connection and map files.';
    return;
  }

  const mobile = window.matchMedia('(max-width: 700px)');
  const initial = mobile.matches ? c.mobileView : c.desktopView;

  const map = L.map('map', {
    zoomControl: false,
    minZoom: c.minZoom,
    maxZoom: c.maxZoom,
    zoomSnap: 1,
    zoomDelta: 1,
    maxBounds: c.navigationBounds,
    maxBoundsViscosity: 1.0,
    preferCanvas: true,
    wheelPxPerZoomLevel: 95
  });
  L.control.zoom({ position: 'topright' }).addTo(map);

  // Place the live Leaflet scale bar inside the permanent key rather than on the map.
  const scale = L.control.scale({ position: 'bottomleft', metric: true, imperial: true, maxWidth: 115 }).addTo(map);
  $('scale-host').appendChild(scale.getContainer());

  function parseHash() {
    const match = location.hash.match(/^#view=(\d{1,2})\/(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/);
    if (!match) return null;
    const zoom = Number(match[1]);
    const lat = Number(match[2]);
    const lng = Number(match[3]);
    if (![zoom, lat, lng].every(Number.isFinite) || Math.abs(lat) > 85 || Math.abs(lng) > 180) return null;
    return { zoom: Math.max(c.minZoom, Math.min(c.maxZoom, zoom)), center: [lat, lng] };
  }

  const sharedView = parseHash();
  map.setView(sharedView ? sharedView.center : initial.center, sharedView ? sharedView.zoom : initial.zoom, { animate: false });

  // Hard-limit panning to the actual exported region. This also constrains
  // restored #view URLs, including old links centered outside the map.
  map.setMaxBounds(L.latLngBounds(c.navigationBounds));
  map.panInsideBounds(c.navigationBounds, { animate: false });

  const commonTiles = {
    minZoom: c.minZoom,
    maxZoom: c.maxZoom,
    minNativeZoom: c.tilesMinZoom,
    maxNativeZoom: c.tilesMaxZoom,
    noWrap: true,
    bounds: c.navigationBounds,
    updateWhenZooming: false,
    attribution: c.attribution,
    className: 'qgis-tiles'
  };
  const nativeTiles = L.tileLayer(c.tileUrl, commonTiles);

  // Leaflet displays 256px tiles over 256 CSS pixels by default. On Retina
  // displays, existing higher-zoom QGIS tiles can give a sharper result:
  // four z+1 images at 128 CSS pixels each. Never request a nonexistent z16.
  const retinaCapable = !!c.useRetinaTiles && window.devicePixelRatio > 1.25;
  const retinaTiles = retinaCapable ? L.tileLayer(c.tileUrl, {
    ...commonTiles,
    maxZoom: c.maxZoom - 1,
    maxNativeZoom: c.tilesMaxZoom - 1,
    tileSize: 128,
    zoomOffset: 1,
    attribution: c.attribution
  }) : null;
  let activeTiles = null;
  function syncTiles() {
    const desired = retinaTiles && map.getZoom() < c.maxZoom
      ? retinaTiles : nativeTiles;
    if (desired === activeTiles) return;
    desired.addTo(map);
    if (activeTiles) map.removeLayer(activeTiles);
    activeTiles = desired;
  }
  [nativeTiles, retinaTiles].filter(Boolean).forEach(layer => {
    layer.on('tileerror', event => {
      console.warn('QGIS XYZ tile missing:', event.coords);
    });
  });
  map.on('zoomend', syncTiles);
  syncTiles();

  let toastTimeout;
  function toast(message) {
    const element = $('toast');
    element.textContent = message;
    element.classList.add('visible');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => element.classList.remove('visible'), 2400);
  }

  // Paper lives INSIDE Leaflet as map tiles, not as a fixed viewport CSS image.
  // Every tile gets a repeat pattern registered against the XYZ global pixel
  // grid: the grain pans with the cartography and grows as the user zooms in.
  // Use only textures already hosted under /assets/home/ on keegan.biz.
  map.createPane('paperBelow');
  map.getPane('paperBelow').style.zIndex = '150';
  map.getPane('paperBelow').style.pointerEvents = 'none';
  map.createPane('paperAbove');
  map.getPane('paperAbove').style.zIndex = '360';
  map.getPane('paperAbove').style.pointerEvents = 'none';

  function offset(value, period) {
    return -(((value % period) + period) % period);
  }
  const PaperTiles = L.GridLayer.extend({
    createTile(coords) {
      const tile = L.DomUtil.create('div',
        'geo-paper-tile ' + (this.options.paperTop ? 'paper-top' : 'paper-bottom'));
      const zScale = Math.pow(2, coords.z - 10);
      // Scale in map units while keeping texture uploads GPU-friendly.
      const width1 = Math.min(1150 * zScale, 4800);
      const height1 = width1 * 1365 / 2048;
      const width2 = Math.min(790 * zScale, 3600);
      const height2 = width2 * 1365 / 2048;
      const worldX = (coords.x - 302 * zScale) * 256;
      const worldY = (coords.y - 378 * zScale) * 256;
      tile.style.setProperty('--texture-size-1', width1 + 'px ' + height1 + 'px');
      tile.style.setProperty('--texture-size-2', width2 + 'px ' + height2 + 'px');
      tile.style.setProperty('--texture-pos-1', offset(worldX, width1) + 'px ' + offset(worldY, height1) + 'px');
      tile.style.setProperty('--texture-pos-2', offset(worldX, width2) + 'px ' + offset(worldY, height2) + 'px');
      return tile;
    }
  });
  const paperOptions = {
    minZoom: c.minZoom, maxZoom: c.maxZoom, tileSize: 256,
    noWrap: true, updateWhenZooming: false, keepBuffer: 3
  };
  new PaperTiles({...paperOptions, pane: 'paperBelow', paperTop: false}).addTo(map);
  new PaperTiles({...paperOptions, pane: 'paperAbove', paperTop: true}).addTo(map);

  // ONE continuous geographic fade across the entire viewport.
  // The old implementation drew one canvas per XYZ tile; this produced square
  // patches during pan/zoom and revealed the underlying QGIS export edges.
  // Here a single overlaid DIV uses a CSS mask with four gradient stops.
  // Its position is calculated using projected geographic endpoints, and
  // refreshed on pan/zoom so the diagonal stays attached to the trail.
  // No generated image or corridor-veil.png is used.
  const diagonal = c.diagonalFade;
  if (diagonal && diagonal.northEast && diagonal.southWest) {
    const fade = L.DomUtil.create('div', 'geographic-fade', map.getContainer());
    fade.setAttribute('aria-hidden', 'true');
    const texAnchor = L.latLng(42.0, -73.45);
    let pendingFadeFrame = 0;

    function syncContinuousFade() {
      pendingFadeFrame = 0;
      const zoom = map.getZoom();
      const strengths = diagonal.opacityByZoom || {};
      const strength = Object.prototype.hasOwnProperty.call(strengths, zoom)
        ? Number(strengths[zoom]) : 0;
      if (!(strength > 0)) {
        fade.style.display = 'none';
        return;
      }
      fade.style.display = 'block';
      fade.style.opacity = String(Math.max(0, Math.min(1, strength)));

      const size = map.getSize();
      const a = map.latLngToContainerPoint(diagonal.northEast);
      const b = map.latLngToContainerPoint(diagonal.southWest);
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy);
      if (len < 1 || !size.x || !size.y) return;

      // Unit normal to the geographic diagonal in VIEWPORT pixel coordinates.
      const nx = -dy / len;
      const ny = dx / len;
      // CSS gradient 0deg goes UP and 90deg goes RIGHT.
      const cssAngle = (Math.atan2(nx, -ny) * 180 / Math.PI + 360) % 360;
      const gradientLength = Math.abs(nx * size.x) + Math.abs(ny * size.y);
      const centreOffset = nx * (a.x - size.x / 2) + ny * (a.y - size.y / 2);
      const centre = 50 + (centreOffset / gradientLength) * 100;

      const midLat = (diagonal.northEast[0] + diagonal.southWest[0]) / 2;
      const pixelsPerKm = 256 * Math.pow(2, zoom) /
        (40075.016686 * Math.cos(midLat * Math.PI / 180));
      const inner = Math.max(0, diagonal.clearHalfWidthKm) * pixelsPerKm /
        gradientLength * 100;
      const outer = inner + Math.max(1, diagonal.featherKm) * pixelsPerKm /
        gradientLength * 100;
      const pct = n => `${n.toFixed(4)}%`;
      // The mask reveals the PAPER overlay only outside the diagonal band.
      // Using a SINGLE gradient eliminates tile-square edges completely.
      const mask = `linear-gradient(${cssAngle.toFixed(4)}deg, ` +
        `#000 ${pct(centre - outer)}, ` +
        `transparent ${pct(centre - inner)}, ` +
        `transparent ${pct(centre + inner)}, ` +
        `#000 ${pct(centre + outer)})`;
      fade.style.maskImage = mask;
      fade.style.webkitMaskImage = mask;

      // Both paper textures are registered to one fixed geographic anchor.
      // Their position changes with map pan/zoom, not browser-window scrolling.
      const textureOrigin = map.latLngToContainerPoint(texAnchor);
      const scale = Math.pow(2, zoom - 10);
      const s1 = Math.min(1150 * scale, 4800);
      const s2 = Math.min(790 * scale, 3600);
      fade.style.setProperty('--fade-paper-size-1', `${s1}px`);
      fade.style.setProperty('--fade-paper-size-2', `${s2}px`);
      fade.style.setProperty('--fade-paper-x', `${textureOrigin.x}px`);
      fade.style.setProperty('--fade-paper-y', `${textureOrigin.y}px`);
    }
    function scheduleFade() {
      if (pendingFadeFrame) return;
      pendingFadeFrame = window.requestAnimationFrame(syncContinuousFade);
    }
    map.on('move zoom zoomend resize', scheduleFade);
    scheduleFade();
  }

  function currentViewLink() {
    const center = map.getCenter();
    return `${location.origin}${location.pathname}${location.search}#view=${map.getZoom()}/${center.lat.toFixed(5)}/${center.lng.toFixed(5)}`;
  }
  let firstMove = true;
  map.on('moveend', () => {
    if (firstMove && !sharedView) { firstMove = false; return; }
    firstMove = false;
    if (history.replaceState && location.protocol !== 'file:') {
      history.replaceState(null, '', currentViewLink());
    }
  });

  const measurementPoints = [];
  const pointsLayer = L.layerGroup().addTo(map);
  const lineLayer = L.polyline([], { color: '#c1272d', weight: 3, dashArray: '7, 6' }).addTo(map);
  let measuring = false;

  function updateMeasurement() {
    lineLayer.setLatLngs(measurementPoints);
    pointsLayer.clearLayers();
    measurementPoints.forEach((point, index) => {
      L.circleMarker(point, {
        radius: 4,
        color: '#c1272d',
        weight: 2,
        fillColor: '#ece7d7',
        fillOpacity: 1
      }).bindTooltip(`Point ${index + 1}`).addTo(pointsLayer);
    });
    let metres = 0;
    for (let i = 1; i < measurementPoints.length; i++) {
      metres += measurementPoints[i - 1].distanceTo(measurementPoints[i]);
    }
    $('measurement-value').textContent = (metres / 1609.344).toFixed(2);
    $('undo-measure').disabled = measurementPoints.length === 0;
    $('clear-measure').disabled = measurementPoints.length === 0;
  }

  function setMeasuring(on) {
    measuring = on;
    document.body.classList.toggle('is-measuring', on);
    $('measure-button').classList.toggle('active', on);
    $('measure-button').setAttribute('aria-pressed', String(on));
    $('measure-button').textContent = on ? 'Finish' : 'Measure';
    $('measure-actions').hidden = !on && !measurementPoints.length;
    if (on) {
      map.doubleClickZoom.disable();
      toast('Click or tap the map to measure');
    } else {
      map.doubleClickZoom.enable();
    }
  }

  $('measure-button').addEventListener('click', () => setMeasuring(!measuring));
  $('undo-measure').addEventListener('click', () => {
    measurementPoints.pop();
    updateMeasurement();
    $('measure-actions').hidden = !measuring && !measurementPoints.length;
  });
  $('clear-measure').addEventListener('click', () => {
    measurementPoints.length = 0;
    updateMeasurement();
    $('measure-actions').hidden = !measuring;
  });
  map.on('click', event => {
    if (!measuring) return;
    measurementPoints.push(event.latlng);
    updateMeasurement();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && measuring) setMeasuring(false);
  });
  updateMeasurement();
})();

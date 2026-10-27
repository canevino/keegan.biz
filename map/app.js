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
  map.createPane('terrainVeil');
  map.getPane('terrainVeil').style.zIndex = '350';
  map.getPane('terrainVeil').style.pointerEvents = 'none';
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

  // A single geographic diagonal from the upper-right (north-east) to the
  // lower-left (south-west). At each zoom, canvas tiles calculate distance to
  // this line in Web Mercator world pixels; the outer parts of the old QGIS
  // export fade into cream. There is NO stored/generated image-mask file.
  // Because these are Leaflet GridLayer tiles, the fade pans and zooms with
  // the cartography, and stays aligned across tile boundaries.
  const diagonal = c.diagonalFade;
  if (diagonal && diagonal.northEast && diagonal.southWest) {
    const DiagonalFadeTiles = L.GridLayer.extend({
      createTile(coords) {
        const canvas = L.DomUtil.create('canvas', 'diagonal-fade-tile');
        const size = this.getTileSize();
        const w = size.x, h = size.y;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: false });
        if (!ctx) return canvas;

        // Leaflet/Web Mercator tile-pixel coordinates, same as the QGIS XYZ tiles.
        const a = L.CRS.EPSG3857.latLngToPoint(L.latLng(diagonal.northEast), coords.z);
        const b = L.CRS.EPSG3857.latLngToPoint(L.latLng(diagonal.southWest), coords.z);
        const dx = b.x - a.x, dy = b.y - a.y;
        const len2 = dx * dx + dy * dy;
        if (!len2) return canvas;

        const middleLat = (diagonal.northEast[0] + diagonal.southWest[0]) / 2;
        // Mercator pixels per ground km at the corridor's mid-latitude.
        const pixelsPerKm = (256 * Math.pow(2, coords.z)) /
          (40075.016686 * Math.cos(middleLat * Math.PI / 180));
        const inner = Math.max(0, diagonal.clearHalfWidthKm) * pixelsPerKm;
        const feather = Math.max(0.1, diagonal.featherKm) * pixelsPerKm;
        const outer = inner + feather;
        const originX = coords.x * w, originY = coords.y * h;

        // Skip rasterizing completely transparent tiles in the central strip.
        // The squared-distance calculation also rounds the far ends of the fade.
        const image = ctx.createImageData(w, h);
        const data = image.data;
        let hasColor = false;
        for (let y = 0; y < h; y++) {
          const wy = originY + y + 0.5;
          for (let x = 0; x < w; x++) {
            const wx = originX + x + 0.5;
            const along = Math.max(0, Math.min(1,
              ((wx - a.x) * dx + (wy - a.y) * dy) / len2));
            const offX = wx - (a.x + dx * along);
            const offY = wy - (a.y + dy * along);
            const distance = Math.sqrt(offX * offX + offY * offY);
            if (distance <= inner) continue;
            const t = Math.min(1, (distance - inner) / feather);
            // Smoothstep keeps both edges of the feather visually seamless.
            const alpha = Math.round(255 * t * t * (3 - 2 * t));
            if (alpha === 0) continue;
            hasColor = true;
            const p = (y * w + x) * 4;
            data[p] = 236;
            data[p + 1] = 231;
            data[p + 2] = 215;
            data[p + 3] = alpha;
          }
        }
        if (hasColor) ctx.putImageData(image, 0, 0);
        return canvas;
      }
    });
    const fadedTiles = new DiagonalFadeTiles({
      pane: 'terrainVeil', tileSize: 256,
      minZoom: c.minZoom, maxZoom: c.maxZoom,
      noWrap: true, updateWhenZooming: false, keepBuffer: 2
    }).addTo(map);
    const fadePane = map.getPane('terrainVeil');
    function syncDiagonalFade() {
      const strengths = diagonal.opacityByZoom || {};
      const strength = strengths[map.getZoom()] ?? 0;
      fadePane.style.opacity = String(strength);
      if (strength > 0) {
        if (!map.hasLayer(fadedTiles)) fadedTiles.addTo(map);
      } else if (map.hasLayer(fadedTiles)) {
        map.removeLayer(fadedTiles);
      }
    }
    map.on('zoomend', syncDiagonalFade);
    syncDiagonalFade();
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

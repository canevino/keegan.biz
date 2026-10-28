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

  // Use one native QGIS tile layer at every zoom. Switching between tile
  // layers can create temporary patchwork while the replacement loads.
  // Tile images are not blended, masked, or overlaid with texture graphics.
  const qgisTiles = L.tileLayer(c.tileUrl, {
    minZoom: c.minZoom,
    maxZoom: c.maxZoom,
    minNativeZoom: c.tilesMinZoom,
    maxNativeZoom: c.tilesMaxZoom,
    noWrap: true,
    bounds: c.navigationBounds,
    updateWhenZooming: false,
    attribution: c.attribution,
    className: 'qgis-tiles'
  });
  qgisTiles.on('tileerror', event => {
    console.warn('QGIS tile not found:', event.coords);
  });
  qgisTiles.addTo(map);

  let toastTimeout;
  function toast(message) {
    const element = $('toast');
    element.textContent = message;
    element.classList.add('visible');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => element.classList.remove('visible'), 2400);
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

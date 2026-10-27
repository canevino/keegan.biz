(() => {
  'use strict';
  const c = window.AT_MAP_CONFIG;
  const $ = id => document.getElementById(id);
  if (!window.L || !c) {
    $('map').textContent = 'Map unavailable. Please check the connection and map files.';
    return;
  }

  const mobile = window.matchMedia('(max-width: 700px)');
  const initial = mobile.matches ? c.mobileView : c.desktopView;
  const map = L.map('map', {
    zoomControl: false, minZoom: c.minZoom, maxZoom: c.maxZoom,
    zoomSnap: 1, zoomDelta: 1,
    maxBounds: c.navigationBounds,
    maxBoundsViscosity: 0.8,
    preferCanvas: true,
    wheelPxPerZoomLevel: 95
  });
  L.control.zoom({ position: 'topright' }).addTo(map);
  L.control.scale({ position: 'bottomright', metric: true, imperial: true, maxWidth: 125 }).addTo(map);

  function parseHash() {
    const match = location.hash.match(/^#view=(\d{1,2})\/(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/);
    if (!match) return null;
    const zoom = Number(match[1]), lat = Number(match[2]), lng = Number(match[3]);
    if (![zoom, lat, lng].every(Number.isFinite) || Math.abs(lat) > 85 || Math.abs(lng) > 180) return null;
    return { zoom: Math.max(c.minZoom, Math.min(c.maxZoom, zoom)), center: [lat, lng] };
  }
  const saved = parseHash();
  map.setView(saved ? saved.center : initial.center, saved ? saved.zoom : initial.zoom, { animate: false });

  const tiles = L.tileLayer(c.tileUrl, {
    minZoom: c.tilesMinZoom,
    maxZoom: c.maxZoom,
    minNativeZoom: c.tilesMinZoom,
    maxNativeZoom: c.tilesMaxZoom,
    noWrap: true,
    updateWhenZooming: false,
    attribution: c.attribution,
    className: 'qgis-tiles'
  }).addTo(map);
  let hadTileError = false;
  tiles.on('tileerror', () => {
    if (!hadTileError) { hadTileError = true; toast('PNG tile missing. Upload your new 9–15 export to map/tiles/base/.'); }
  });

  let toastTimeout;
  function toast(message) {
    const toastEl = $('toast');
    toastEl.textContent = message;
    toastEl.classList.add('visible');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toastEl.classList.remove('visible'), 3400);
  }

  /* The PNG map sits on the existing paper textures. At zooms 9–10,
     feather only the remote edges of the existing long QGIS export. The
     mask follows projected map coordinates as Leaflet pans and zooms. */
  const tilePane = map.getPane('tilePane');
  function updateSoftEdge() {
    const z = map.getZoom();
    if (z > c.fadeThroughZoom) {
      tilePane.style.maskImage = 'none';
      tilePane.style.webkitMaskImage = 'none';
      return;
    }
    const center = map.latLngToLayerPoint(c.fadeCenter);
    const low = map.latLngToLayerPoint(c.fadeBounds[0]);
    const high = map.latLngToLayerPoint(c.fadeBounds[1]);
    const w = Math.abs(high.x - low.x);
    const h = Math.abs(high.y - low.y);
    // A generous ellipse keeps the entire AT visible; only its distant
    // surroundings gradually transition to the cream canvas.
    const rx = Math.max(z === 9 ? 275 : 480, w * (z === 9 ? 1.20 : 1.13));
    const ry = Math.max(z === 9 ? 380 : 690, h * (z === 9 ? 1.18 : 1.12));
    const inner = z === 9 ? '77%' : '84%';
    const mask = `radial-gradient(ellipse ${Math.round(rx)}px ${Math.round(ry)}px at ${Math.round(center.x)}px ${Math.round(center.y)}px, black 0%, black ${inner}, transparent 100%)`;
    tilePane.style.maskImage = mask;
    tilePane.style.webkitMaskImage = mask;
  }
  map.on('move zoom resize', updateSoftEdge);
  updateSoftEdge();

  function viewLink() {
    const center = map.getCenter();
    return `${location.origin}${location.pathname}${location.search}#view=${map.getZoom()}/${center.lat.toFixed(5)}/${center.lng.toFixed(5)}`;
  }
  let firstMove = true;
  map.on('moveend', () => {
    // Keep the opening link clean until the user actually explores the map.
    if (firstMove && !saved) { firstMove = false; return; }
    firstMove = false;
    if (history.replaceState && location.protocol !== 'file:') history.replaceState(null, '', viewLink());
  });
  $('copy-link').addEventListener('click', async () => {
    const url = viewLink();
    try { await navigator.clipboard.writeText(url); toast('Map link copied'); }
    catch { window.prompt('Copy the map link:', url); }
  });
  $('recenter').addEventListener('click', () => {
    const v = mobile.matches ? c.mobileView : c.desktopView;
    map.setView(v.center, v.zoom);
  });

  const key = $('key-panel');
  const keyBtn = $('key-button');
  function showKey(open) {
    key.hidden = !open;
    keyBtn.setAttribute('aria-expanded', String(open));
    keyBtn.classList.toggle('active', open);
    if (open) { setMeasuring(false); $('close-key').focus(); }
  }
  keyBtn.addEventListener('click', () => showKey(key.hidden));
  $('close-key').addEventListener('click', () => { showKey(false); keyBtn.focus(); });

  const points = [];
  const markers = L.layerGroup().addTo(map);
  const line = L.polyline([], { color: '#c1272d', weight: 3, dashArray: '7, 6' }).addTo(map);
  let measuring = false;
  function updateMeasurement() {
    line.setLatLngs(points);
    markers.clearLayers();
    points.forEach((p, i) => L.circleMarker(p, {
      radius: 4, color: '#c1272d', weight: 2, fillColor: '#ece7d7', fillOpacity: 1
    }).bindTooltip(`Point ${i + 1}`).addTo(markers));
    let metres = 0;
    for (let i = 1; i < points.length; i++) metres += points[i - 1].distanceTo(points[i]);
    $('measurement-value').textContent = (metres / 1609.344).toFixed(2);
  }
  function setMeasuring(on) {
    measuring = on;
    $('measure-panel').hidden = !on;
    $('measure-button').classList.toggle('active', on);
    $('measure-button').setAttribute('aria-pressed', String(on));
    document.body.classList.toggle('is-measuring', on);
    if (on) {
      key.hidden = true;
      keyBtn.classList.remove('active');
      keyBtn.setAttribute('aria-expanded', 'false');
      map.doubleClickZoom.disable();
      toast('Click the map to add measuring points');
    } else {
      map.doubleClickZoom.enable();
    }
  }
  $('measure-button').addEventListener('click', () => setMeasuring(!measuring));
  $('close-measure').addEventListener('click', () => setMeasuring(false));
  $('undo-measure').addEventListener('click', () => { points.pop(); updateMeasurement(); });
  $('clear-measure').addEventListener('click', () => { points.length = 0; updateMeasurement(); });
  map.on('click', e => { if (!measuring) return; points.push(e.latlng); updateMeasurement(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { showKey(false); setMeasuring(false); }
  });
})();

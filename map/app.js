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

  // Soft-edged print area at the furthest-out zoom. Mask each actual tile
  // image (not Leaflet's zero-sized tile pane), preventing the blank-map issue
  // caused by pane-level masks. The feather follows geographic coordinates.
  const mapWrap = $('map-wrap');
  let overviewFrame = 0;
  function updateOverviewTreatment() {
    mapWrap.classList.toggle('is-overview', map.getZoom() === c.minZoom);
    const images = map.getContainer().querySelectorAll('img.leaflet-tile.qgis-tiles');
    if (map.getZoom() !== c.minZoom) {
      images.forEach(image => {
        image.style.maskImage = '';
        image.style.webkitMaskImage = '';
        image.style.maskComposite = '';
        image.style.webkitMaskComposite = '';
      });
      return;
    }
    const extent = L.latLngBounds(c.overviewPlateBounds || c.navigationBounds);
    const nw = map.latLngToContainerPoint(extent.getNorthWest());
    const se = map.latLngToContainerPoint(extent.getSouthEast());
    const rect = map.getContainer().getBoundingClientRect();
    const feather = Math.min(c.overviewFeatherPixels || 75, Math.abs(se.x-nw.x)/3, Math.abs(se.y-nw.y)/3);
    const px = n => Math.round(n * 10) / 10 + 'px';
    images.forEach(image => {
      const box = image.getBoundingClientRect();
      if (!box.width || !box.height) return;
      const x = box.left - rect.left;
      const y = box.top - rect.top;
      const l = nw.x - x, r = se.x - x, t = nw.y - y, b = se.y - y;
      const horizontal = `linear-gradient(to right, transparent ${px(l)}, black ${px(l+feather)}, black ${px(r-feather)}, transparent ${px(r)})`;
      const vertical = `linear-gradient(to bottom, transparent ${px(t)}, black ${px(t+feather)}, black ${px(b-feather)}, transparent ${px(b)})`;
      image.style.maskImage = horizontal + ', ' + vertical;
      image.style.webkitMaskImage = horizontal + ', ' + vertical;
      image.style.maskComposite = 'intersect';
      image.style.webkitMaskComposite = 'source-in';
    });
  }
  function scheduleOverviewTreatment() {
    cancelAnimationFrame(overviewFrame);
    overviewFrame = requestAnimationFrame(updateOverviewTreatment);
  }
  map.on('zoomend moveend resize', scheduleOverviewTreatment);
  [nativeTiles, retinaTiles].filter(Boolean).forEach(layer => {
    layer.on('tileload load', scheduleOverviewTreatment);
  });
  scheduleOverviewTreatment();

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

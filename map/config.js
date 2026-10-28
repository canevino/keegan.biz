/* keegan.biz/map — one QGIS tile layer, no paper textures or fade overlays. */
window.AT_MAP_CONFIG = {
  desktopView: { center: [41.88, -73.40], zoom: 10 },
  mobileView: { center: [41.88, -73.40], zoom: 11 },
  minZoom: 10,
  maxZoom: 15,
  tilesMinZoom: 9,
  tilesMaxZoom: 15,
  tileUrl: './tiles/base/{z}/{x}/{y}.png',
  navigationBounds: [[41.40, -73.86], [42.36, -72.98]],
  attribution: 'Map compiled in QGIS'
};

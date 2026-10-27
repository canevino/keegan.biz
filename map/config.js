/* keegan.biz/map — QGIS transparent PNG tile edition.
   Tiles are uploaded separately to map/tiles/base/{z}/{x}/{y}.png.
   The paper textures already live in /assets/home/ and are NOT bundled here. */
window.AT_MAP_CONFIG = {
  desktopView: { center: [41.867, -73.3626], zoom: 10 },
  mobileView:  { center: [41.867, -73.3626], zoom: 9 },

  // Never zoom beyond the highest exported PNG level.
  minZoom: 9,
  maxZoom: 15,
  tilesMinZoom: 9,
  tilesMaxZoom: 15,
  tileUrl: './tiles/base/{z}/{x}/{y}.png',

  // Keep navigation near the northwest Connecticut / AT corridor.
  navigationBounds: [[41.10, -74.55], [42.65, -72.35]],

  // At overview scales only, softly feather the OUTER edges of the raster.
  // These do not edit the actual tile files.
  fadeCenter: [41.875, -73.41],
  fadeBounds: [[41.44, -73.81], [42.31, -73.035]],
  fadeThroughZoom: 10,

  attribution: 'Map compiled in QGIS · Verify conditions and regulations locally'
};

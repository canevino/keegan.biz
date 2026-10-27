/* keegan.biz/map — QGIS PNG tiles + map-attached paper + procedural diagonal fade.
   Replace only the four page files. NO veil PNG, no extra assets required.
   Keep /map/tiles/base and /assets/home as they are. */
window.AT_MAP_CONFIG = {
  desktopView: { center: [41.88, -73.40], zoom: 10 },
  mobileView: { center: [41.88, -73.40], zoom: 11 },

  // Do not shrink the entire map to a tiny island at zoom 9.
  minZoom: 10,
  maxZoom: 15,
  tilesMinZoom: 9,
  tilesMaxZoom: 15,
  tileUrl: './tiles/base/{z}/{x}/{y}.png',

  // Strict north/south/east/west navigation boundary of the exported map.
  navigationBounds: [[41.40, -73.86], [42.36, -72.98]],

  // On high-density screens use z+1 tiles at map zooms 10–14.
  // At zoom 15 use native z15 tiles (there is no z16 export).
  useRetinaTiles: true,

  // NE to SW diagonal, roughly following the trail across the map.
  // The central strip is fully visible. Beyond it, the map softly fades
  // into cream paper. Coordinates are [latitude, longitude].
  // Adjust endpoints / widths here if you want a wider or narrower strip.
  diagonalFade: {
    northEast: [42.47, -73.06],
    southWest: [41.25, -73.88],
    clearHalfWidthKm: 20,
    featherKm: 13,
    // At z10–11 this is fully active; on closer views it eases away.
    opacityByZoom: { 10: 1, 11: 1, 12: 0.78, 13: 0.35, 14: 0, 15: 0 }
  },
  attribution: 'Map compiled in QGIS'
};

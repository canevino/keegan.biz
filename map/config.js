/* keegan.biz/map — transparent QGIS XYZ PNG tiles, zoom 9–15.
   Only these four files need replacing. Keep /map/tiles/base/ and /assets/home/.
   Bounds derived from the exported 14-level tile coverage, with small padding.
   Geographic bounds restrict navigation; the source map has irregular edges. */
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

  fadeThroughZoom: 10,
  attribution: 'Map compiled in QGIS'
};

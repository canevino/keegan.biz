/* keegan.biz/map — XYZ transparent PNG tiles from QGIS.
   Keep tiles at map/tiles/base/{z}/{x}/{y}.png and textures in /assets/home/.
   No additional GeoJSON layers are required. */
window.AT_MAP_CONFIG = {
  desktopView: { center: [41.867, -73.3626], zoom: 10 },
  mobileView:  { center: [41.867, -73.3626], zoom: 10 },

  // QGIS directory export: levels 9 through 15, 256x256 PNG, standard XYZ.
  minZoom: 9,
  maxZoom: 15,
  tilesMinZoom: 9,
  tilesMaxZoom: 15,
  tileUrl: './tiles/base/{z}/{x}/{y}.png',

  // Allows north-south exploration without wandering far outside the export.
  navigationBounds: [[41.08, -74.45], [42.60, -72.45]],

  // Only a faint screen-edge cream vignette at the two overview levels.
  // No mask is applied to the tile layer, so zoom 9 can never be hidden by it.
  fadeThroughZoom: 10,

  attribution: 'Map compiled in QGIS'
};

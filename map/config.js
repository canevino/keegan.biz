/*
 * Edit this file when you add QGIS exports.
 * Layers with ready:false are shown as unavailable (no broken/imaginary data).
 * Actual tile extent confirmed from the supplied QGIS XYZ images.
 */
window.AT_MAP_CONFIG = {
  title: 'Northwest Connecticut hiking map',
  startCenter: [41.875, -73.42],
  // Fit the long, north–south exported QGIS map into the initial viewport.
  initialBounds: [[41.4427, -73.81], [42.3099, -73.035]],
  startZoom: 11,
  maxZoom: 16,
  minZoom: 9,
  // Initial QGIS export: zoom 9–14. These settings match the instructions.
  qgisBase: {
    ready: true,
    url: './tiles/base/{z}/{x}/{y}.jpg',
    minNativeZoom: 9,
    maxNativeZoom: 14,
    bounds: [[41.4, -73.86], [42.57, -72.40]],
    attribution: 'Map exported from QGIS · Check underlying data source credits.'
  },
  // Keep the same CRS (EPSG:3857), tile grid, tile extent, and zoom range for each
  // separately exported QGIS raster overlay. Transparent overlays must be PNG.
  layers: [
    {id: 'trails', label: 'AT & nearby trails', type: 'tiles', ready: false,
     url: './tiles/trails/{z}/{x}/{y}.png', minNativeZoom: 9, maxNativeZoom: 14,
     initiallyVisible: true, attribution: ''},
    {id: 'fishing', label: 'Fishing spots', type: 'geojson', ready: false,
     url: './data/fishing_spots.geojson', style: 'fishing', initiallyVisible: true},
    {id: 'camps', label: 'Camps & shelters', type: 'geojson', ready: false,
     url: './data/camps.geojson', style: 'camp', initiallyVisible: true},
    {id: 'peaks', label: 'Peaks', type: 'geojson', ready: false,
     url: './data/peaks.geojson', style: 'peak', initiallyVisible: true},
    {id: 'pois', label: 'Other places', type: 'geojson', ready: false,
     url: './data/pois.geojson', style: 'poi', initiallyVisible: false}
  ],
  // Update this with exact acknowledgements for QGIS / OSM / external data sources.
  dataCredit: 'Map compiled in QGIS. Verify data source attribution, regulations, and conditions.'
};

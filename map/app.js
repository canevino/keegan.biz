(() => {
  'use strict';
  const config = window.AT_MAP_CONFIG;
  if (!window.L || !config) {
    const el = document.getElementById('map');
    if (el) el.textContent = 'Map failed to load. Check network access to Leaflet and local config.js.';
    return;
  }
  const $ = (id) => document.getElementById(id);
  const map = L.map('map', {
    zoomControl: false, zoomSnap: 1, minZoom: config.minZoom,
    maxZoom: config.maxZoom, preferCanvas: true
  });
  L.control.zoom({position:'topright'}).addTo(map);
  L.control.scale({position:'bottomright', imperial:true, metric:true, maxWidth:135}).addTo(map);

  function parseView() {
    const match = window.location.hash.match(/^#view=(\d{1,2})\/(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/);
    if (!match) return null;
    const zoom = +match[1], lat = +match[2], lon = +match[3];
    if (!Number.isFinite(zoom) || !Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat)>85 || Math.abs(lon)>180) return null;
    return {zoom: Math.max(config.minZoom, Math.min(config.maxZoom,zoom)),lat,lon};
  }
  const fromHash = parseView();
  if (fromHash) map.setView([fromHash.lat,fromHash.lon],fromHash.zoom);
  else if (config.initialBounds) map.fitBounds(config.initialBounds, {padding:[18,18]});
  else map.setView(config.startCenter, config.startZoom);

  const isQgis = config.qgisBase.ready === true;
  const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    minZoom:0, maxZoom:19, maxNativeZoom:19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>'
  });
  const base = isQgis ? L.tileLayer(config.qgisBase.url, {
    minZoom: config.qgisBase.minNativeZoom,
    minNativeZoom: config.qgisBase.minNativeZoom,
    maxNativeZoom: config.qgisBase.maxNativeZoom,
    maxZoom: config.maxZoom,
    bounds: config.qgisBase.bounds || undefined,
    noWrap:true,
    attribution:config.qgisBase.attribution||'',
    updateWhenZooming:false
  }) : osm;
  base.addTo(map);
  if (isQgis) {
    let failed = 0;
    base.on('tileerror',()=>{
      failed++;
      if (failed === 1) toast('A map tile did not load. Check /map/tiles/base/ on GitHub.');
    });
  }
  $('base-label').textContent = isQgis ? 'QGIS map (raster tiles)' : 'OpenStreetMap (preview)';
  $('preview-notice').hidden = isQgis;
  $('map-mode').hidden = isQgis;
  $('data-credit').textContent = config.dataCredit || 'Map data: see project sources';

  let toastTimer;
  function toast(message) {
    const el = $('toast');
    el.textContent = message;
    el.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('visible'), 3000);
  }

  function safe(s) { return String(s).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
  function styleFeature(feature, mode) {
    const p = feature.properties || {};
    if (mode === 'fishing') {
      const text = String(p.rules || p.rule || p.regulation || p.category || p.type || '').toLowerCase();
      const release = text.includes('release') || text.includes('no keep');
      const keep = !release && text.includes('keep');
      // Unknown fishing categories are deliberately neutral, not assumed to permit keeping fish.
      return {radius:6, color:release || keep ? '#3a7da2' : '#777c78', weight:2, fillColor:release ? '#ffffff' : keep ? '#3a7da2' : '#ffffff', fillOpacity:1};
    }
    if (mode === 'camp') return {radius:5,color:'#68675d',weight:1.5,fillColor:'#8d8a7b',fillOpacity:1};
    if (mode === 'peak') return {radius:6,color:'#6b473a',weight:1.5,fillColor:'#6b473a',fillOpacity:1};
    return {radius:6,color:'#687d23',weight:1.5,fillColor:'#cbd42e',fillOpacity:1};
  }
  function popup(feature) {
    const p = feature.properties || {};
    const title = p.name || p.Name || p.NAME || p.title || 'Map feature';
    let lines = [];
    // Only show concise, readily interpretable fields, and escape supplied data.
    for (const key of ['type','category','rule','rules','regulation','description','notes','elevation','ele']) {
      if (p[key] !== null && p[key] !== undefined && String(p[key]).trim()) {
        lines.push(`<p><strong>${safe(key)}:</strong> ${safe(p[key])}</p>`);
      }
    }
    return `<div class="feature-popup"><h3>${safe(title)}</h3>${lines.join('')}</div>`;
  }
  const overlayRows = $('layer-controls');
  const loadedLayers = new Map();
  config.layers.forEach((item) => {
    const label = document.createElement('label');
    label.className = 'layer-row' + (item.ready ? '' : ' unavailable');
    const input = document.createElement('input');
    input.type = 'checkbox'; input.checked = !!item.ready && !!item.initiallyVisible;
    input.disabled = !item.ready;
    input.setAttribute('aria-label',`Show ${item.label}`);
    const name = document.createElement('span'); name.textContent = item.label;
    label.append(input,name);
    if (!item.ready) { const status=document.createElement('span');status.className='status';status.textContent='Not loaded';label.append(status); }
    overlayRows.append(label);
    if (!item.ready) return;

    if (item.type === 'tiles') {
      const lyr = L.tileLayer(item.url, {
        minZoom:item.minNativeZoom, minNativeZoom:item.minNativeZoom,
        maxNativeZoom:item.maxNativeZoom, maxZoom:config.maxZoom,
        opacity: 1, noWrap:true, bounds:item.bounds||undefined,
        attribution:item.attribution||'', updateWhenZooming:false
      });
      loadedLayers.set(item.id,lyr);
      if (input.checked) lyr.addTo(map);
    } else if(item.type === 'geojson') {
      fetch(item.url).then(r => {if (!r.ok) throw Error(`HTTP ${r.status}`);return r.json();}).then(data => {
        const lyr = L.geoJSON(data, {
          pointToLayer:(feature,latlng) => item.style === 'peak'
            ? L.marker(latlng, {icon:L.divIcon({className:'peak-marker',html:'<span></span>',iconSize:[20,20],iconAnchor:[10,10]})})
            : L.circleMarker(latlng, styleFeature(feature,item.style)),
          style:(feature) => ({color:'#7c6852',weight:2}),
          onEachFeature:(feature,layer) => layer.bindPopup(popup(feature))
        });
        loadedLayers.set(item.id,lyr);
        if (input.checked) lyr.addTo(map);
      }).catch(() => {
        input.disabled=true;input.checked=false;label.classList.add('unavailable');
        const status=document.createElement('span');status.className='status';status.textContent='File missing';label.append(status);
      });
    }
    input.addEventListener('change',() => {
      const lyr=loadedLayers.get(item.id);
      if (!lyr) return toast('Layer is still loading');
      if (input.checked) lyr.addTo(map); else map.removeLayer(lyr);
    });
  });
  $('layer-count').textContent = `${config.layers.filter(x=>x.ready).length} available`;

  function setSidebar(open) {
    document.body.classList.toggle('is-sidebar-closed',!open);
    $('toggle-sidebar').setAttribute('aria-expanded',String(open));
    window.setTimeout(()=>map.invalidateSize({pan:false}),180);
  }
  const mobile=window.matchMedia('(max-width:720px)');
  setSidebar(!mobile.matches);
  $('toggle-sidebar').addEventListener('click',()=>setSidebar(document.body.classList.contains('is-sidebar-closed')));
  $('close-sidebar').addEventListener('click',()=>setSidebar(false));

  const measurePoints=[];
  const measureLine=L.polyline([], {color:'#343632',weight:3,dashArray:'7 6'}).addTo(map);
  const pointMarkers=L.layerGroup().addTo(map);
  let measuring=false;
  function updateMeasure() {
    measureLine.setLatLngs(measurePoints);
    pointMarkers.clearLayers();
    measurePoints.forEach((ll,i) => L.circleMarker(ll,{radius:4,color:'#343632',weight:2,fillColor:'#e4ff00',fillOpacity:1}).bindTooltip(`Point ${i+1}`).addTo(pointMarkers));
    let distance=0;
    for(let i=1;i<measurePoints.length;i++) distance+=measurePoints[i-1].distanceTo(measurePoints[i]);
    $('measurement-value').textContent=(distance/1609.344).toFixed(2);
  }
  function setMeasuring(on) {
    measuring=on;
    $('measure-panel').hidden=!on;
    $('measure-button').classList.toggle('is-active',on);
    $('measure-button').setAttribute('aria-pressed',String(on));
    document.body.classList.toggle('measuring',on);
    if (on) { map.doubleClickZoom.disable(); if(mobile.matches) setSidebar(false);toast('Tap the map to add measuring points'); }
    else {map.doubleClickZoom.enable();}
  }
  $('measure-button').addEventListener('click',()=>setMeasuring(!measuring));
  $('close-measure').addEventListener('click',()=>setMeasuring(false));
  $('undo-measure').addEventListener('click',()=>{measurePoints.pop();updateMeasure();});
  $('clear-measure').addEventListener('click',()=>{measurePoints.length=0;updateMeasure();});
  map.on('click',event=>{if (!measuring)return;measurePoints.push(event.latlng);updateMeasure();});

  function viewUrl() {
    const center=map.getCenter();
    return `${window.location.origin}${window.location.pathname}${window.location.search}#view=${map.getZoom()}/${center.lat.toFixed(5)}/${center.lng.toFixed(5)}`;
  }
  map.on('moveend zoomend',()=>{
    const c=map.getCenter();
    $('coordinates').textContent=`${Math.abs(c.lat).toFixed(5)}° N, ${Math.abs(c.lng).toFixed(5)}° W · z${map.getZoom()}`;
    if (window.history && window.history.replaceState && window.location.protocol !== 'file:') {
      window.history.replaceState(null,'',viewUrl());
    }
  });
  const center=map.getCenter();
  $('coordinates').textContent=`${center.lat.toFixed(5)}° N, ${Math.abs(center.lng).toFixed(5)}° W · z${map.getZoom()}`;
  $('copy-link').addEventListener('click',async()=>{
    const url=viewUrl();
    try {await navigator.clipboard.writeText(url);toast('Map view link copied');}
    catch {window.prompt('Copy this link:',url);}
  });
  $('recenter').addEventListener('click',()=>config.initialBounds ? map.fitBounds(config.initialBounds,{padding:[18,18]}) : map.setView(config.startCenter,config.startZoom));
  let positionMarker;
  $('locate').addEventListener('click',()=>{
    if (!navigator.geolocation) return toast('Location unavailable in this browser');
    toast('Requesting your location…');
    navigator.geolocation.getCurrentPosition((position)=>{
      const ll=[position.coords.latitude,position.coords.longitude];
      if(positionMarker) map.removeLayer(positionMarker);
      positionMarker=L.circleMarker(ll,{radius:7,color:'#124673',weight:3,fillColor:'#68b5df',fillOpacity:1}).addTo(map).bindPopup('Your approximate location');
      map.setView(ll,Math.max(13,map.getZoom()));
    },()=>toast('Location permission denied or unavailable'),{enableHighAccuracy:false,timeout:10000,maximumAge:60000});
  });
})();

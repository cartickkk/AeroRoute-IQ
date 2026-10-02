let mapInstance = null;
let hotspotLayerGroup = null;
let fastestRouteLayer = null;
let greenRouteLayer = null;
let incidentMarkerGroup = null;

function initMap() {
  mapInstance = L.map('map', {
    zoomControl: false
  }).setView(CONFIG.DEFAULT_CENTER, CONFIG.DEFAULT_ZOOM);

  L.control.zoom({ position: 'topright' }).addTo(mapInstance);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '© OpenStreetMap contributors | AeroRoute IQ'
  }).addTo(mapInstance);

  hotspotLayerGroup = L.layerGroup().addTo(mapInstance);
  incidentMarkerGroup = L.layerGroup().addTo(mapInstance);

  renderHotspots(CONFIG.INITIAL_HOTSPOTS);
}

function renderHotspots(hotspots) {
  hotspotLayerGroup.clearLayers();

  hotspots.forEach(spot => {
    const circle = L.circle(spot.coords, {
      color: '#f43f5e',
      fillColor: '#f43f5e',
      fillOpacity: 0.28,
      radius: spot.radius,
      weight: 1.5
    });

    circle.bindPopup(`
      <div style="font-family:sans-serif;font-size:12px;">
        <strong style="color:#f43f5e;">⚠️️ AQI Hotspot: ${spot.name}</strong><br/>
        <span>Real-time AQI: <b>${spot.aqi}</b> (Severe Plume)</span>
      </div>
    `);

    hotspotLayerGroup.addLayer(circle);
  });
}

function renderRoutes(fastest, green) {
  if (fastestRouteLayer) mapInstance.removeLayer(fastestRouteLayer);
  if (greenRouteLayer) mapInstance.removeLayer(greenRouteLayer);

  // Red dashed line for fastest (polluted) route
  fastestRouteLayer = L.polyline(fastest.path, {
    color: '#f43f5e',
    weight: 4,
    opacity: 0.85,
    dashArray: '6, 8'
  }).addTo(mapInstance).bindPopup(`<b>Fastest Artery:</b> ${fastest.durationMin} min | AQI: ${fastest.meanAqi}`);

  // Cyan glowing solid line for green route
  greenRouteLayer = L.polyline(green.path, {
    color: '#00f2fe',
    weight: 5,
    opacity: 0.95
  }).addTo(mapInstance).bindPopup(`<b>AeroRoute Clean Corridor:</b> ${green.durationMin} min | AQI: ${green.meanAqi}`);

  // Fit bounds to show both complete routes
  const group = new L.featureGroup([fastestRouteLayer, greenRouteLayer]);
  mapInstance.fitBounds(group.getBounds().pad(0.2));
}

function addIncidentMarker(latlng, typeLabel) {
  const marker = L.circleMarker(latlng, {
    radius: 9,
    fillColor: '#f59e0b',
    color: '#ffffff',
    weight: 2,
    fillOpacity: 0.9
  }).addTo(incidentMarkerGroup);

  marker.bindPopup(`<b>Incident:</b> ${typeLabel}<br/>Impact: +45 AQI Dispersion`).openPopup();
}
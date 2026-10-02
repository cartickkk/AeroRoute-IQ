let mapInstance = null;
let hotspotLayerGroup = null;
let fastestRouteLayer = null;
let greenRouteLayer = null;
let incidentMarkerGroup = null;

// Dynamic microclimate classifier matched to the dashboard legend
function getAqiTheme(aqi) {
  if (aqi <= 50) {
    return { color: '#10b981', label: 'Good (Clean Eco-Buffer)' };
  } else if (aqi <= 100) {
    return { color: '#f59e0b', label: 'Moderate Microclimate' };
  } else if (aqi <= 200) {
    return { color: '#ef4444', label: 'Poor (High Exposure)' };
  } else {
    return { color: '#8b5cf6', label: 'Severe Industrial Plume' };
  }
}

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
  if (!hotspotLayerGroup) return;
  hotspotLayerGroup.clearLayers();

  hotspots.forEach(spot => {
    const theme = getAqiTheme(spot.aqi);

    const circle = L.circle(spot.coords, {
      color: theme.color,
      fillColor: theme.color,
      fillOpacity: 0.32,
      radius: spot.radius,
      weight: 2
    });

    circle.bindPopup(`
      <div style="font-family: inherit; font-size: 13px; line-height: 1.4;">
        <strong style="color: ${theme.color};">📍 ${spot.name}</strong><br/>
        <span>Category: <b>${theme.label}</b></span><br/>
        <span>Real-time AQI: <b>${spot.aqi}</b></span><br/>
        <span>Impact Buffer: <b>${spot.radius}m</b></span>
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
    color: '#ef4444',
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
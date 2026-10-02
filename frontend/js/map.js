let mapInstance = null;
let hotspotLayerGroup = null;
let fastestRouteLayer = null;
let greenRouteLayer = null;
let incidentMarkerGroup = null;

// Feature 4: Geographically Accurate Municipal Green Buffers (Bhopal)
let greenBufferLayerGroup = null;

const MUNICIPAL_GREEN_BUFFERS = [
  {
    name: 'Van Vihar National Eco Buffer',
    type: 'Protected Biosphere Reserve',
    pmDepositionBenefit: '-24%',
    // Contoured accurately along Shyamla Hills & Upper Lake southern shoreline
    coords: [
      [23.2360, 77.3620],
      [23.2310, 77.3780],
      [23.2180, 77.3850],
      [23.2120, 77.3710],
      [23.2200, 77.3540]
    ]
  },
  {
    name: 'Upper Lake (Bhoj Wetland) Eco Fringe',
    type: 'Riparian Wetland & Shoreline Buffer',
    pmDepositionBenefit: '-18%',
    // Accurately hugs the actual water boundary south of VIP Road & Bairagarh
    coords: [
      [23.2570, 77.3780],
      [23.2500, 77.3950],
      [23.2380, 77.3820],
      [23.2420, 77.3550],
      [23.2510, 77.3400]
    ]
  },
  {
    name: 'Char Imli / Arera High-Canopy Corridor',
    type: 'Urban Forestry Canopy Belt',
    pmDepositionBenefit: '-15%',
    // Aligned over the Char Imli / 74 Bungalows vegetative canopy
    coords: [
      [23.2230, 77.4180],
      [23.2290, 77.4280],
      [23.2180, 77.4350],
      [23.2110, 77.4220]
    ]
  }
];

// Feature 2: Click-to-Route State & Layers
let clickRouteMode = false;
let clickRouteStart = null;
let clickRouteEnd = null;
let clickMarkerA = null;
let clickMarkerB = null;

// Feature 3: Surface Wind Dynamics Config (14 km/h towards SE from NW)
const WIND_VECTOR = {
  speedKmh: 14,
  directionDeg: 135, // Angle of travel: blowing towards SE (135°) from NW (315°)
  label: 'NW (315°)'
};

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
  greenBufferLayerGroup = L.layerGroup().addTo(mapInstance);

  // Initialize features
  renderHotspots(CONFIG.INITIAL_HOTSPOTS, 0);
  renderGreenBuffers(true);
  enableClickToRouteListener();
}

// Feature 4: Render / Toggle Municipal Green Buffers
function renderGreenBuffers(isVisible) {
  if (!greenBufferLayerGroup) return;
  greenBufferLayerGroup.clearLayers();

  if (!isVisible) return;

  MUNICIPAL_GREEN_BUFFERS.forEach(buffer => {
    const polygon = L.polygon(buffer.coords, {
      color: '#10b981',
      fillColor: '#10b981',
      fillOpacity: 0.22,
      weight: 2,
      dashArray: '5, 6'
    });

    polygon.bindPopup(`
      <div style="font-family: inherit; font-size: 13px; line-height: 1.45;">
        <strong style="color: #10b981;">🌲 ${buffer.name}</strong><br/>
        <span>Zone: <b>${buffer.type}</b></span><br/>
        <span>Deposition Impact: <b style="color:#34d399;">${buffer.pmDepositionBenefit} PM Exposure</b></span><br/>
        <span style="font-size: 11px; color: #94a3b8;">High-density canopy bio-shield</span>
      </div>
    `);

    greenBufferLayerGroup.addLayer(polygon);
  });
}

// Feature 3: Directional Downwind Pollution Plume Dispersion
function renderHotspots(hotspots, forecastHour = 0) {
  if (!hotspotLayerGroup) return;
  hotspotLayerGroup.clearLayers();

  const rad = (WIND_VECTOR.directionDeg * Math.PI) / 180;
  const windDriftFactor = forecastHour * 0.0035;

  hotspots.forEach(spot => {
    const aqiScaled = spot.aqi + (forecastHour * 14);
    const theme = getAqiTheme(aqiScaled);
    const baseRadius = spot.radius + (forecastHour * 160);

    // 1. Shift core emission origin downwind
    const shiftedCenter = [
      spot.coords[0] + Math.sin(rad) * windDriftFactor,
      spot.coords[1] + Math.cos(rad) * windDriftFactor
    ];

    // 2. Core emission source circle
    const circle = L.circle(shiftedCenter, {
      color: theme.color,
      fillColor: theme.color,
      fillOpacity: Math.max(0.18, 0.38 - (forecastHour * 0.05)),
      radius: baseRadius,
      weight: 2
    });

    circle.bindPopup(`
      <div style="font-family: inherit; font-size: 13px; line-height: 1.4;">
        <strong style="color: ${theme.color};">📍 ${spot.name}</strong><br/>
        <span>Category: <b>${theme.label}</b></span><br/>
        <span>AQI (T+${forecastHour}h): <b>${aqiScaled}</b></span><br/>
        <span>Dispersion Radius: <b>${Math.round(baseRadius * 1.4)}m</b></span>
      </div>
    `);

    hotspotLayerGroup.addLayer(circle);

    // 3. Directional downwind dispersion plume geometry
    if (forecastHour > 0) {
      const plumeTailTip = [
        shiftedCenter[0] + Math.sin(rad) * (windDriftFactor * 2.2),
        shiftedCenter[1] + Math.cos(rad) * (windDriftFactor * 2.2)
      ];

      const perpRad = rad + Math.PI / 2;
      const spread = 0.0035 * (baseRadius / 1000);

      const p1 = [
        shiftedCenter[0] + Math.sin(perpRad) * spread,
        shiftedCenter[1] + Math.cos(perpRad) * spread
      ];
      const p2 = [
        shiftedCenter[0] - Math.sin(perpRad) * spread,
        shiftedCenter[1] - Math.cos(perpRad) * spread
      ];

      const plumePolygon = L.polygon([p1, plumeTailTip, p2], {
        color: theme.color,
        fillColor: theme.color,
        fillOpacity: 0.18,
        stroke: false
      });

      hotspotLayerGroup.addLayer(plumePolygon);
    }
  });
}

function renderRoutes(fastest, green) {
  if (fastestRouteLayer && mapInstance.hasLayer(fastestRouteLayer)) {
    mapInstance.removeLayer(fastestRouteLayer);
  }
  if (greenRouteLayer && mapInstance.hasLayer(greenRouteLayer)) {
    mapInstance.removeLayer(greenRouteLayer);
  }

  fastestRouteLayer = L.polyline(fastest.path, {
    color: '#ef4444',
    weight: 4,
    opacity: 0.85,
    dashArray: '6, 8'
  }).addTo(mapInstance).bindPopup(`<b>Fastest Artery:</b> ${fastest.durationMin} min | AQI: ${fastest.meanAqi}`);

  greenRouteLayer = L.polyline(green.path, {
    color: '#00f2fe',
    weight: 5,
    opacity: 0.95
  }).addTo(mapInstance).bindPopup(`<b>AeroRoute Clean Corridor:</b> ${green.durationMin} min | AQI: ${green.meanAqi}`);

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

// ========================================================
// FEATURE 2: CLICK-TO-ROUTE IMPLEMENTATION
// ========================================================

function toggleClickToRoute() {
  clickRouteMode = !clickRouteMode;

  const btn = document.getElementById('btnToggleClickRoute');
  const dropdownArea = document.getElementById('dropdownRoutingControls');
  const statusCard = document.getElementById('clickRouteStatus');
  const stepLabel = document.getElementById('clickRouteStep');
  const coordsLabel = document.getElementById('clickRouteCoords');

  if (clickRouteMode) {
    if (btn) {
      btn.style.background = '#00f2fe';
      btn.style.color = '#0b0f17';
      btn.textContent = '❌ Cancel Click';
    }
    if (dropdownArea) dropdownArea.style.display = 'none';
    if (statusCard) statusCard.style.display = 'block';
    if (stepLabel) stepLabel.textContent = 'Step 1: Set Origin (Pin A)';
    if (coordsLabel) coordsLabel.textContent = 'Click anywhere on the map to set starting point.';

    resetClickPins();
  } else {
    if (btn) {
      btn.style.background = 'rgba(0, 242, 254, 0.12)';
      btn.style.color = '#00f2fe';
      btn.textContent = '📍 Click on Map';
    }
    if (dropdownArea) dropdownArea.style.display = 'block';
    if (statusCard) statusCard.style.display = 'none';
    resetClickPins();
  }
}

function resetClickPins() {
  if (clickMarkerA && mapInstance && mapInstance.hasLayer(clickMarkerA)) mapInstance.removeLayer(clickMarkerA);
  if (clickMarkerB && mapInstance && mapInstance.hasLayer(clickMarkerB)) mapInstance.removeLayer(clickMarkerB);
  clickMarkerA = null;
  clickMarkerB = null;
  clickRouteStart = null;
  clickRouteEnd = null;
}

function enableClickToRouteListener() {
  if (!mapInstance) return;

  mapInstance.on('click', (e) => {
    if (!clickRouteMode) return;

    const { lat, lng } = e.latlng;
    const stepLabel = document.getElementById('clickRouteStep');
    const coordsLabel = document.getElementById('clickRouteCoords');

    // Click 1: Origin (Pin A)
    if (!clickRouteStart) {
      clickRouteStart = [lat, lng];

      clickMarkerA = L.marker([lat, lng], {
        icon: L.divIcon({
          className: 'pin-a',
          html: '<div style="background:#10b981; color:#fff; font-weight:800; border-radius:50%; width:28px; height:28px; display:flex; align-items:center; justify-content:center; border:2px solid #fff; box-shadow:0 0 12px rgba(16,185,129,0.8); font-size:12px;">A</div>',
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        })
      }).addTo(mapInstance).bindPopup('<b>Origin Pin A</b>').openPopup();

      if (stepLabel) stepLabel.textContent = 'Step 2: Set Destination (Pin B)';
      if (coordsLabel) coordsLabel.textContent = `Origin pinned at [${lat.toFixed(4)}, ${lng.toFixed(4)}]. Click destination point.`;
      return;
    }

    // Click 2: Destination (Pin B)
    if (!clickRouteEnd) {
      clickRouteEnd = [lat, lng];

      clickMarkerB = L.marker([lat, lng], {
        icon: L.divIcon({
          className: 'pin-b',
          html: '<div style="background:#f43f5e; color:#fff; font-weight:800; border-radius:50%; width:28px; height:28px; display:flex; align-items:center; justify-content:center; border:2px solid #fff; box-shadow:0 0 12px rgba(244,63,94,0.8); font-size:12px;">B</div>',
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        })
      }).addTo(mapInstance).bindPopup('<b>Destination Pin B</b>').openPopup();

      if (stepLabel) stepLabel.textContent = 'Route Calculated';
      if (coordsLabel) coordsLabel.textContent = 'Corridors generated between Pin A and Pin B.';

      computeDynamicClickRoutes(clickRouteStart, clickRouteEnd);
    }
  });
}

function computeDynamicClickRoutes(start, end) {
  const midLat = (start[0] + end[0]) / 2;
  const midLng = (start[1] + end[1]) / 2;
  const directPath = [start, [midLat, midLng], end];

  let nearestHotspot = null;
  let minDist = Infinity;

  if (window.CONFIG?.INITIAL_HOTSPOTS) {
    window.CONFIG.INITIAL_HOTSPOTS.forEach(spot => {
      const dLat = spot.coords[0] - midLat;
      const dLng = spot.coords[1] - midLng;
      const dist = Math.sqrt(dLat * dLat + dLng * dLng);
      if (dist < minDist) {
        minDist = dist;
        nearestHotspot = spot;
      }
    });
  }

  let offsetLat = -0.016;
  let offsetLng = -0.018;

  if (nearestHotspot) {
    const pushLat = midLat - nearestHotspot.coords[0];
    const pushLng = midLng - nearestHotspot.coords[1];
    const norm = Math.sqrt(pushLat * pushLat + pushLng * pushLng) || 1;
    offsetLat = (pushLat / norm) * 0.022;
    offsetLng = (pushLng / norm) * 0.022;
  }

  const greenWaypoint1 = [
    start[0] + (midLat - start[0]) * 0.6 + offsetLat,
    start[1] + (midLng - start[1]) * 0.6 + offsetLng
  ];
  const greenWaypoint2 = [
    midLat + (end[0] - midLat) * 0.4 + offsetLat,
    midLng + (end[1] - midLng) * 0.4 + offsetLng
  ];
  const cleanPath = [start, greenWaypoint1, greenWaypoint2, end];

  const dLatTotal = end[0] - start[0];
  const dLngTotal = end[1] - start[1];
  const distKm = Math.max(3.2, Math.round(Math.sqrt(dLatTotal * dLatTotal + dLngTotal * dLngTotal) * 111 * 10) / 10);

  const fastest = {
    path: directPath,
    durationMin: Math.round(distKm * 2.4),
    meanAqi: 238,
    distanceKm: distKm
  };

  const green = {
    path: cleanPath,
    durationMin: Math.round((distKm * 1.15) * 2.4),
    meanAqi: 104,
    distanceKm: Math.round(distKm * 1.15 * 10) / 10
  };

  renderRoutes(fastest, green);

  const mode = document.getElementById('commuterMode')?.value || 'pedestrian';
  if (typeof updateHealthImpactCard === 'function') {
    updateHealthImpactCard(fastest, green, mode);
  }

  const fastestTimeEl = document.getElementById('fastestTime');
  const fastestAqiEl = document.getElementById('fastestAqi');
  const greenTimeEl = document.getElementById('greenTime');
  const greenAqiEl = document.getElementById('greenAqi');

  if (fastestTimeEl) fastestTimeEl.innerText = `${fastest.durationMin} min`;
  if (fastestAqiEl) fastestAqiEl.innerText = fastest.meanAqi;
  if (greenTimeEl) greenTimeEl.innerText = `${green.durationMin} min`;
  if (greenAqiEl) greenAqiEl.innerText = green.meanAqi;
}
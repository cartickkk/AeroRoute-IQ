// Auth Guard: Verify Supabase Session
async function checkAuthSession() {
  const client = window.supabaseClient || window.supabase;
  if (client && client.auth) {
    try {
      const { data: { session } } = await client.auth.getSession();
      if (!session) {
        window.location.replace(`${window.location.origin}/login.html`);
      }
    } catch (err) {
      console.warn('Auth guard verification bypassed:', err);
    }
  }
}
checkAuthSession();

// Ventilation Rates & Vehicle Infiltration Filter Factors
const RESPIRATION_MODES = {
  pedestrian: { label: 'Pedestrian', ventilationLpm: 28, filterFactor: 1.0 },
  cyclist: { label: 'Cyclist', ventilationLpm: 45, filterFactor: 1.0 },
  vehicle: { label: 'Closed Car / EV', ventilationLpm: 12, filterFactor: 0.35 }
};

let lastComputedRoutes = null;

// Compute and render the Respiration & Health Impact card
function updateHealthImpactCard(fastest, green, modeKey = 'pedestrian') {
  if (!fastest || !green) return;
  lastComputedRoutes = { fastest, green };

  const mode = RESPIRATION_MODES[modeKey] || RESPIRATION_MODES.pedestrian;
  const ventRate = mode.ventilationLpm;
  const filter = mode.filterFactor;

  // Derive PM2.5 (ug/m3) estimate from mean AQI
  const pmFastest = (fastest.meanAqi || 200) * 0.75;
  const pmGreen = (green.meanAqi || 100) * 0.75;

  const durationFastest = fastest.durationMin || 18;
  const durationGreen = green.durationMin || 21;

  // Inhaled Dose (ug) = (ug/m3) * (L/min / 1000) * duration(min) * filterFactor
  const fastestDoseUg = (pmFastest * (ventRate / 1000) * durationFastest * filter).toFixed(1);
  const greenDoseUg = (pmGreen * (ventRate / 1000) * durationGreen * filter).toFixed(1);

  const avertedUg = Math.max(0, (fastestDoseUg - greenDoseUg)).toFixed(1);
  const fastestCigs = (fastestDoseUg / 22).toFixed(1);
  const greenCigs = (greenDoseUg / 22).toFixed(1);
  const cigarettesSaved = (avertedUg / 22).toFixed(1);

  // Update DOM Elements
  const ventEl = document.getElementById('ventilationRateVal');
  const avertedEl = document.getElementById('pmAvertedVal');
  const equivTextEl = document.getElementById('cigaretteEquivText');

  const fastestDosageEl = document.getElementById('fastestDosage');
  const fastestCigEl = document.getElementById('fastestCigarettes');
  const greenDosageEl = document.getElementById('greenDosage');
  const greenCigEl = document.getElementById('greenCigarettes');

  if (ventEl) ventEl.textContent = `${ventRate} L/min`;
  if (avertedEl) avertedEl.textContent = `${avertedUg} µg`;

  if (fastestDosageEl) fastestDosageEl.innerText = `Inhaled: ${fastestDoseUg} µg`;
  if (fastestCigEl) fastestCigEl.innerText = `≈ ${fastestCigs} cigarettes`;

  const percentReduction = Math.round(((fastestDoseUg - greenDoseUg) / (fastestDoseUg || 1)) * 100);
  if (greenDosageEl) greenDosageEl.innerText = `-${Math.max(0, percentReduction)}% Inhalation`;
  if (greenCigEl) greenCigEl.innerText = `≈ ${greenCigs} cigarettes`;

  if (equivTextEl) {
    equivTextEl.innerHTML = `Choosing <b>AeroRoute</b> prevents inhaling an estimated <b>${avertedUg} µg</b> of toxic PM<sub>2.5</sub>, equivalent to smoking <b>${cigarettesSaved} fewer cigarettes</b>.`;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Initialize Map
  if (typeof initMap === 'function') {
    initMap();
  }

  // 2. Operator Logout
  const btnLogout = document.getElementById('btnLogout');
  if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
      const client = window.supabaseClient || window.supabase;
      if (client && client.auth) {
        await client.auth.signOut();
      }
      window.location.replace(`${window.location.origin}/login.html`);
    });
  }

  // 3. Load Ribbon Metrics
  try {
    if (typeof API !== 'undefined' && API.getCityStatus) {
      const status = await API.getCityStatus();
      if (status) {
        const cityAqiEl = document.getElementById('cityAqiDisplay');
        const cityPmEl = document.getElementById('cityPmDisplay');
        const hotspotEl = document.getElementById('hotspotCountDisplay');

        if (cityAqiEl) cityAqiEl.innerText = `${status.cityAqi} • Poor`;
        if (cityPmEl) cityPmEl.innerText = `${status.peakPm25} µg/m³`;
        if (hotspotEl) hotspotEl.innerText = `${status.activeHotspots} Active`;
      }
    }
  } catch (err) {
    console.warn('Failed to load city status ribbon metrics:', err);
  }

  // 4. Commuter Mode Selector Change Listener
  const modeSelector = document.getElementById('commuterMode');
  if (modeSelector) {
    modeSelector.addEventListener('change', (e) => {
      const selectedMode = e.target.value;
      if (lastComputedRoutes) {
        updateHealthImpactCard(lastComputedRoutes.fastest, lastComputedRoutes.green, selectedMode);
      }
    });
  }

  // 5. Feature 2: Attach Click-to-Route Mode Button
  const btnToggleClick = document.getElementById('btnToggleClickRoute');
  if (btnToggleClick) {
    btnToggleClick.addEventListener('click', () => {
      if (typeof toggleClickToRoute === 'function') {
        toggleClickToRoute();
      } else {
        console.warn('toggleClickToRoute not defined in map.js');
      }
    });
  }

  // 6. Compute Clean Route Button
  const btnCompute = document.getElementById('btnComputeRoutes');
  if (btnCompute) {
    btnCompute.addEventListener('click', async () => {
      btnCompute.disabled = true;
      btnCompute.innerHTML = '<span>Computing cleanest corridor...</span>';

      const origin = document.getElementById('originSelect')?.value || 'bhopal_station';
      const dest = document.getElementById('destSelect')?.value || 'sirt_bhopal';
      const mode = document.getElementById('commuterMode')?.value || 'pedestrian';

      try {
        const result = await API.computeRoutes(origin, dest, mode);
        if (typeof renderRoutes === 'function') {
          renderRoutes(result.fastest, result.green);
        }

        // Update Standard Time & Mean AQI Metrics
        const fastestTimeEl = document.getElementById('fastestTime');
        const fastestAqiEl = document.getElementById('fastestAqi');
        const greenTimeEl = document.getElementById('greenTime');
        const greenAqiEl = document.getElementById('greenAqi');

        if (fastestTimeEl) fastestTimeEl.innerText = `${result.fastest.durationMin} min`;
        if (fastestAqiEl) fastestAqiEl.innerText = result.fastest.meanAqi;
        if (greenTimeEl) greenTimeEl.innerText = `${result.green.durationMin} min`;
        if (greenAqiEl) greenAqiEl.innerText = result.green.meanAqi;

        // Update Biological Respiration & Health Impact
        updateHealthImpactCard(result.fastest, result.green, mode);

      } catch (err) {
        console.error('Route computation failed:', err);
      } finally {
        btnCompute.disabled = false;
        btnCompute.innerHTML = `<span>Compute Clean Route</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;
      }
    });
  }

  // 7. Report Incident Button -> Dispatches to Make.com & Telegram
  const btnReport = document.getElementById('btnReportIncident');
  if (btnReport) {
    btnReport.addEventListener('click', async () => {
      const activeMap = (typeof mapInstance !== 'undefined') ? mapInstance : ((typeof map !== 'undefined') ? map : null);
      const center = (activeMap && typeof activeMap.getCenter === 'function') 
        ? activeMap.getCenter() 
        : { lat: 23.2599, lng: 77.4126 };

      const select = document.getElementById('incidentType');
      const label = select ? select.options[select.selectedIndex].text : 'Open Municipal Waste Burning';

      const locationStr = `${center.lat.toFixed(4)}° N, ${center.lng.toFixed(4)}° E`;
      const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

      const originalText = btnReport.textContent;
      btnReport.disabled = true;
      btnReport.textContent = 'Broadcasting Incident...';

      try {
        const webhookUrl = window.CONFIG?.MAKE_WEBHOOK_URL;
        if (!webhookUrl) {
          throw new Error('MAKE_WEBHOOK_URL not configured in config.js');
        }

        // Automated dispatch to Make.com
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            incidentType: label,
            location: locationStr,
            timestamp: timeStr
          })
        });

        if (!response.ok) {
          throw new Error(`Webhook returned HTTP status ${response.status}`);
        }

        // Render incident marker on map
        if (typeof addIncidentMarker === 'function') {
          addIncidentMarker(center, label);
        } else if (typeof L !== 'undefined' && activeMap) {
          L.circle([center.lat, center.lng], {
            color: '#ef4444',
            fillColor: '#ef4444',
            fillOpacity: 0.45,
            radius: 800
          }).addTo(activeMap).bindPopup(`<b>⚠️ Reported:</b> ${label}`).openPopup();
        }

        alert(`🚨 Incident Broadcast Sent!\n\nHazard: ${label}\nLocation: ${locationStr}\n\nAutomated dispatch sent to Telegram channel.`);
      } catch (err) {
        console.error('Make.com Incident Dispatch Error:', err);
        if (typeof addIncidentMarker === 'function') {
          addIncidentMarker(center, label);
        }
        alert(`Incident registered locally as "${label}". (Webhook notice: ${err.message})`);
      } finally {
        btnReport.disabled = false;
        btnReport.textContent = originalText;
      }
    });
  }

  // 8. Feature 4: Municipal Green Buffer Layer Toggle
  const toggleBuffers = document.getElementById('toggleGreenBuffers');
  if (toggleBuffers) {
    toggleBuffers.addEventListener('change', (e) => {
      if (typeof renderGreenBuffers === 'function') {
        renderGreenBuffers(e.target.checked);
      } else {
        console.warn('renderGreenBuffers not defined in map.js');
      }
    });
  }

  // 9. Feature 3: 3-Hour Forecast Slider with Vector Plume Dispersion
  const slider = document.getElementById('timeForecastSlider');
  const sliderLabel = document.getElementById('forecastHourLabel');
  const windSpeedEl = document.getElementById('windSpeedDisplay');

  if (slider && sliderLabel) {
    slider.addEventListener('input', (e) => {
      const hr = parseInt(e.target.value);
      sliderLabel.innerText = hr === 0 ? 'Now (T+0)' : `T+${hr} Hours`;

      // Update wind speed display dynamically with forecast hour
      if (windSpeedEl) {
        const dynamicWindSpeed = 14 + (hr * 3);
        windSpeedEl.innerText = `${dynamicWindSpeed} km/h`;
      }

      // Call vector dispersion engine in map.js
      if (window.CONFIG?.INITIAL_HOTSPOTS && typeof renderHotspots === 'function') {
        renderHotspots(window.CONFIG.INITIAL_HOTSPOTS, hr);
      }
    });
  }
});
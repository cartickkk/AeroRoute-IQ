// Auth Guard: Verify Supabase Session
async function checkAuthSession() {
  const client = window.supabaseClient || window.supabase;
  if (client && client.auth) {
    try {
      const { data: { session } } = await client.auth.getSession();
      if (!session) {
        window.location.href = 'login.html';
      }
    } catch (err) {
      console.warn('Auth guard verification bypassed:', err);
    }
  }
}
checkAuthSession();

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
      window.location.href = 'login.html';
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

  // 4. Compute Clean Route Button
  const btnCompute = document.getElementById('btnComputeRoutes');
  if (btnCompute) {
    btnCompute.addEventListener('click', async () => {
      btnCompute.disabled = true;
      btnCompute.innerHTML = 'Computing cleanest corridor...';

      const origin = document.getElementById('originSelect')?.value || 'bhopal_station';
      const dest = document.getElementById('destSelect')?.value || 'sirt_bhopal';
      const mode = document.getElementById('commuterMode')?.value || 'pedestrian';

      try {
        const result = await API.computeRoutes(origin, dest, mode);
        if (typeof renderRoutes === 'function') {
          renderRoutes(result.fastest, result.green);
        }

        // Update Analytics Card
        const fastestTimeEl = document.getElementById('fastestTime');
        const fastestAqiEl = document.getElementById('fastestAqi');
        const greenTimeEl = document.getElementById('greenTime');
        const greenAqiEl = document.getElementById('greenAqi');

        if (fastestTimeEl) fastestTimeEl.innerText = `${result.fastest.durationMin} min`;
        if (fastestAqiEl) fastestAqiEl.innerText = result.fastest.meanAqi;
        if (greenTimeEl) greenTimeEl.innerText = `${result.green.durationMin} min`;
        if (greenAqiEl) greenAqiEl.innerText = result.green.meanAqi;

        // Inhalation Dosage & Cigarette Equivalence (if available in payload)
        const fastestDosageEl = document.getElementById('fastestDosage');
        const fastestCigEl = document.getElementById('fastestCigarettes');
        const greenDosageEl = document.getElementById('greenDosage');
        const greenCigEl = document.getElementById('greenCigarettes');

        if (fastestDosageEl && result.fastest.inhaledUg) fastestDosageEl.innerText = `Inhaled: ${result.fastest.inhaledUg} µg`;
        if (fastestCigEl && result.fastest.cigarettesEq) fastestCigEl.innerText = `≈ ${result.fastest.cigarettesEq} cigarettes`;
        if (greenDosageEl && result.green.inhaledUg) greenDosageEl.innerText = `Inhaled: ${result.green.inhaledUg} µg`;
        if (greenCigEl && result.green.cigarettesEq) greenCigEl.innerText = `≈ ${result.green.cigarettesEq} cigarettes`;

      } catch (err) {
        console.error('Route computation failed:', err);
      } finally {
        btnCompute.disabled = false;
        btnCompute.innerHTML = `<span>Compute Clean Route</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;
      }
    });
  }

  // 5. Report Incident Button -> Dispatches to Make.com & Telegram
  const btnReport = document.getElementById('btnReportIncident');
  if (btnReport) {
    btnReport.addEventListener('click', async () => {
      // Determine map coordinates
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
        // Fallback: still show marker locally if offline or webhook fails
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

  // 6. 3-Hour Forecast Slider
  const slider = document.getElementById('timeForecastSlider');
  const sliderLabel = document.getElementById('forecastHourLabel');

  if (slider && sliderLabel) {
    slider.addEventListener('input', (e) => {
      const hr = parseInt(e.target.value);
      sliderLabel.innerText = hr === 0 ? 'Now (T+0)' : `T+${hr} Hours`;

      if (window.CONFIG?.INITIAL_HOTSPOTS && typeof renderHotspots === 'function') {
        const shifted = window.CONFIG.INITIAL_HOTSPOTS.map(h => ({
          ...h,
          radius: h.radius + (hr * 180),
          aqi: h.aqi + (hr * 14)
        }));
        renderHotspots(shifted);
      }
    });
  }
});
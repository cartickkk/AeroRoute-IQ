// Automatically detect environment: use local Flask port locally, or relative path on Vercel
const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname === ''
);

const CONFIG = {
  API_BASE_URL: isLocalhost ? 'http://127.0.0.1:5000/api' : '/api',
  DEFAULT_CENTER: [23.2599, 77.4126], // Bhopal City Center
  DEFAULT_ZOOM: 13,

  // Supabase Configuration
  SUPABASE_URL: 'https://lajeqjtepahrefdngyjs.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhamVxanRlcGFocmVmZG5neWpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5MTIzODQsImV4cCI6MjEwNjQ4ODM4NH0.PYQzAe48tbOCJeUr-s9LyoAAVlVi7RKwvDue8EAHCLU',

  // Make.com Webhook Endpoint for Emergency Incident Broadcast
  MAKE_WEBHOOK_URL: 'https://hook.us2.make.com/wkxe0o4hs4kwfymqbyxabw4q4cpy0mcy',

  // Landmark coordinate registry
  NODES: {
    bhopal_station: { name: 'Bhopal Railway Station', coords: [23.2687, 77.4168] },
    mp_nagar: { name: 'MP Nagar Zone-1', coords: [23.2332, 77.4338] },
    new_market: { name: 'New Market Commercial Hub', coords: [23.2384, 77.4018] },
    arera_colony: { name: 'Arera Colony E-8', coords: [23.2081, 77.4361] },
    sirt_bhopal: { name: 'SIRT Campus (Ayodhya Bypass)', coords: [23.2842, 77.4721] },
    bhopal_aiims: { name: 'AIIMS Bhopal', coords: [23.2062, 77.4608] },
    van_vihar: { name: 'Van Vihar Eco Buffer', coords: [23.2268, 77.3683] },
    bhel_industrial: { name: 'BHEL Industrial Zone', coords: [23.2530, 77.4715] }
  },

  // Multi-tier Microclimate Hotspots across all AQI Categories
  INITIAL_HOTSPOTS: [
    // 1. Good (0-50) - Green
    { id: 1, name: 'Van Vihar Eco-Buffer & Upper Lake', coords: [23.2268, 77.3683], aqi: 42, radius: 1100 },
    { id: 2, name: 'Manuabhan Tekri Hilltop Air Shed', coords: [23.2980, 77.3750], aqi: 36, radius: 950 },

    // 2. Moderate (51-100) - Amber / Yellow
    { id: 3, name: 'Arera Colony E-8 Residential Green Belt', coords: [23.2081, 77.4361], aqi: 76, radius: 900 },
    { id: 4, name: 'Shahpura Lake Catchment & Park', coords: [23.1950, 77.4260], aqi: 68, radius: 850 },

    // 3. Poor (101-200) - Red
    { id: 5, name: 'New Market Commercial Hub', coords: [23.2384, 77.4018], aqi: 158, radius: 850 },
    { id: 6, name: 'Ayodhya Bypass Construction Corridor', coords: [23.2790, 77.4590], aqi: 182, radius: 900 },

    // 4. Severe (201+) - Purple
    { id: 7, name: 'Hamidia Road Diesel Transit Corridor', coords: [23.2641, 77.4082], aqi: 285, radius: 1050 },
    { id: 8, name: 'Govindpura Industrial Flaring & Boiler Zone', coords: [23.2482, 77.4521], aqi: 254, radius: 1150 }
  ]
};

// Expose globally so other modules can consume CONFIG seamlessly
window.CONFIG = CONFIG;
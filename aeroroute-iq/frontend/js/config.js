const CONFIG = {
  API_BASE_URL: 'http://127.0.0.1:5000/api',
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

  // Initial pollution hotspots
  INITIAL_HOTSPOTS: [
    { id: 1, name: 'Hamidia Road Diesel Junction', coords: [23.2641, 77.4082], aqi: 280, radius: 950 },
    { id: 2, name: 'Govindpura Industrial Flaring', coords: [23.2482, 77.4521], aqi: 245, radius: 1100 },
    { id: 3, name: 'Ayodhya Bypass Construction Corridor', coords: [23.2790, 77.4590], aqi: 220, radius: 800 },
    { id: 4, name: 'ISBT Commercial Bus Depot', coords: [23.2291, 77.4412], aqi: 260, radius: 850 }
  ]
};

// Expose globally so other modules can consume CONFIG seamlessly
window.CONFIG = CONFIG;
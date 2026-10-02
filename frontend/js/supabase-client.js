// Supabase Client Initialization
(function initSupabase() {
  // Pull credentials from global CONFIG if available, fallback to defaults
  const SUPABASE_URL = window.CONFIG?.SUPABASE_URL || "https://lajeqjtepahrefdngyjs.supabase.co";
  const SUPABASE_ANON_KEY = window.CONFIG?.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhamVxanRlcGFocmVmZG5neWpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5MTIzODQsImV4cCI6MjEwNjQ4ODM4NH0.PYQzAe48tbOCJeUr-s9LyoAAVlVi7RKwvDue8EAHCLU";

  // Check for the official Supabase UMD library on the window object
  const supabaseLib = window.supabase;

  if (supabaseLib && typeof supabaseLib.createClient === 'function') {
    const client = supabaseLib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Bind to window.supabaseClient so auth.js and app.js can consume it reliably
    window.supabaseClient = client;
    console.log("✅ Supabase client initialized successfully.");
  } else if (!window.supabaseClient) {
    console.error("❌ Supabase SDK not detected. Make sure the Supabase CDN script tag is placed before supabase-client.js in your HTML head.");
  }
})();
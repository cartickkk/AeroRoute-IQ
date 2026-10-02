const API = {
  async getCityStatus() {
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/status`, { signal: AbortSignal.timeout(1200) });
      if (!res.ok) throw new Error();
      return await res.json();
    } catch {
      return { cityAqi: 218, peakPm25: 168, activeHotspots: 4 };
    }
  },

  async computeRoutes(originKey, destKey, commuterMode) {
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin: originKey, destination: destKey, mode: commuterMode }),
        signal: AbortSignal.timeout(1500)
      });
      if (!res.ok) throw new Error();
      return await res.json();
    } catch {
      // Standalone fallback generator
      const origin = CONFIG.NODES[originKey].coords;
      const dest = CONFIG.NODES[destKey].coords;
      
      const midLat = (origin[0] + dest[0]) / 2;
      const midLng = (origin[1] + dest[1]) / 2;

      // Fastest path passes straight through urban center
      const fastestPath = [origin, [midLat + 0.003, midLng + 0.002], dest];
      // Clean path arcs around pollution corridor
      const cleanPath = [origin, [midLat - 0.015, midLng - 0.012], dest];

      return {
        fastest: { path: fastestPath, durationMin: 18, meanAqi: 235 },
        green: { path: cleanPath, durationMin: 22, meanAqi: 114, inhalationReduction: 38 }
      };
    }
  }
};
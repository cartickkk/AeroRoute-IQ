# 🍃 AeroRoute IQ

> **Theme 2: Rising Urban AQI Mitigation**  
> *Developed for Techfest Zonals by Team AeroNova*

AeroRoute IQ is an urban air quality navigation and exposure intelligence dashboard. It transitions urban mobility from basic travel-time optimization to health-prioritized clean corridor routing, calculating live particulate inhalation dosage, forward predictive dispersion, and automated emergency incident broadcasting.

---

## 🚀 Core Features

- **🧭 Clean Corridor Routing:** Evaluates fast, high-exposure vehicular arteries against health-optimized corridors using real-time inhalation dosage ($\mu\text{g}$) and cigarette equivalence metrics.
- **🗺️ Bhopal Spatial Mesh:** Interactive Leaflet GIS interface displaying key nodes (Bhopal Station, MP Nagar, SIRT Campus, AIIMS) and active pollution hotspots.
- **⏳ 3-Hour Predictive Dispersion:** Temporal simulation adjusting particulate radius based on ambient wind patterns and traffic density shifts.
- **🚨 Automated Incident Dispatch:** Hyperlocal incident reporting integrated via **Make.com webhooks** with alerts transmitted directly to an emergency **Telegram channel**.
- **🔐 Operator Access Control:** Protected authentication layer backed by **Supabase Auth** with session verification, password recovery, and secure state handling.

---

## 🛠️ Architecture & Tech Stack

| Component | Stack |
| :--- | :--- |
| **Frontend** | HTML5, CSS3, Modern ES6+ JavaScript |
| **Mapping Engine** | Leaflet.js, OpenStreetMap CartoDB Tiles |
| **Backend API** | Python, Flask, Flask-CORS |
| **Authentication & Store** | Supabase Auth (UMD SDK) |
| **Automation Flow** | Make.com Webhooks $\rightarrow$ Telegram Bot API |

---

## 📁 Repository Structure

```text
├── backend/
│   ├── app.py                # Flask API routes (/api/status, /api/routes)
│   ├── aqi_engine.py         # Route calculation & exposure heuristics
│   ├── data_loader.py        # Hotspot datasets & node registries
│   └── requirements.txt      # Python dependencies
├── frontend/
│   ├── css/
│   │   ├── auth.css          # Login & authentication view styles
│   │   ├── components.css    # Cards, sliders, and form components
│   │   └── style.css         # Global layout and map container styles
│   ├── js/
│   │   ├── api.js            # API client methods
│   │   ├── app.js            # Dashboard UI controller & Make.com triggers
│   │   ├── auth.js           # Supabase auth & recovery workflows
│   │   ├── config.js         # Spatial nodes, hotspots & webhook endpoints
│   │   ├── map.js            # Leaflet layer setup & route polylines
│   │   └── supabase-client.js# Client instance initialization
│   ├── index.html            # Main dashboard & map viewport
│   └── login.html            # Operator login & authentication portal
├── .gitignore
└── README.md
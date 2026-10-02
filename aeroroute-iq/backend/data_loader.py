"""
Data loader and mock sensor telemetry registry for AeroRoute IQ.
"""

# Bhopal City Node Registry
CITY_NODES = {
    "bhopal_station": {"name": "Bhopal Railway Station", "coords": (23.2687, 77.4168)},
    "mp_nagar": {"name": "MP Nagar Zone-1", "coords": (23.2332, 77.4338)},
    "new_market": {"name": "New Market Commercial Hub", "coords": (23.2384, 77.4018)},
    "arera_colony": {"name": "Arera Colony E-8", "coords": (23.2081, 77.4361)},
    "sirt_bhopal": {"name": "SIRT Campus (Ayodhya Bypass)", "coords": (23.2842, 77.4721)},
    "bhopal_aiims": {"name": "AIIMS Bhopal", "coords": (23.2062, 77.4608)},
    "van_vihar": {"name": "Van Vihar Eco Buffer", "coords": (23.2268, 77.3683)},
    "bhel_industrial": {"name": "BHEL Industrial Zone", "coords": (23.2530, 77.4715)},
}

# Real-time simulated microclimate hotspots
ACTIVE_HOTSPOTS = [
    {
        "id": 1,
        "name": "Hamidia Road Diesel Junction",
        "coords": (23.2641, 77.4082),
        "aqi": 280,
        "radius_meters": 950,
        "source": "Heavy Commercial Traffic"
    },
    {
        "id": 2,
        "name": "Govindpura Industrial Flaring",
        "coords": (23.2482, 77.4521),
        "aqi": 245,
        "radius_meters": 1100,
        "source": "Boiler & Metal Processing"
    },
    {
        "id": 3,
        "name": "Ayodhya Bypass Construction Corridor",
        "coords": (23.2790, 77.4590),
        "aqi": 220,
        "radius_meters": 800,
        "source": "Particulate Resuspension"
    },
    {
        "id": 4,
        "name": "ISBT Commercial Bus Depot",
        "coords": (23.2291, 77.4412),
        "aqi": 260,
        "radius_meters": 850,
        "source": "Idling Diesel Exhaust"
    }
]

def get_node(node_key: str):
    return CITY_NODES.get(node_key)

def get_all_hotspots():
    return ACTIVE_HOTSPOTS
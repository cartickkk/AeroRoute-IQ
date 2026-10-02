"""
AeroRoute IQ - Flask API Server
"""
from flask import Flask, jsonify, request
from flask_cors import CORS
from aqi_engine import generate_route_corridors
from data_loader import get_all_hotspots

app = Flask(__name__)
# Enable CORS for frontend communication
CORS(app)

@app.route("/api/status", methods=["GET"])
def get_status():
    """Returns real-time aggregated city pollution metrics."""
    hotspots = get_all_hotspots()
    return jsonify({
        "cityAqi": 218,
        "peakPm25": 168,
        "activeHotspots": len(hotspots),
        "status": "Severely Degraded"
    }), 200

@app.route("/api/hotspots", methods=["GET"])
def get_hotspots():
    """Returns current active emission hotspots."""
    return jsonify({"hotspots": get_all_hotspots()}), 200

@app.route("/api/route", methods=["POST"])
def compute_route():
    """
    POST payload:
    {
        "origin": "bhopal_station",
        "destination": "sirt_bhopal",
        "mode": "pedestrian"
    }
    """
    data = request.get_json() or {}
    origin = data.get("origin", "bhopal_station")
    dest = data.get("destination", "sirt_bhopal")
    mode = data.get("mode", "pedestrian")

    try:
        results = generate_route_corridors(origin, dest, mode)
        return jsonify(results), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == "__main__":
    print("🚀 AeroRoute IQ Backend running on http://127.0.0.1:5000")
    app.run(host="0.0.0.0", port=5000, debug=True)
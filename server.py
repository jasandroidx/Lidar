#!/usr/bin/env python3
"""
Pike Terrain Radar Backend Server
Standalone Python standard library HTTP server.
Runs on port 8150.
"""

import os
import sys
import json
import sqlite3
import urllib.request
import urllib.parse
from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path
from datetime import datetime
import xml.etree.ElementTree as ET

BASE_DIR = Path(__file__).resolve().parent
BOT_FLOOR_DIR = BASE_DIR.parent
EXCAVATOR_DIR = BOT_FLOOR_DIR / "bot_a_excavator"
CHIPS_DIR = EXCAVATOR_DIR / "chips"
CANDIDATES_PATH = EXCAVATOR_DIR / "candidates.geojson"
GRID_PATH = BASE_DIR / "grid.geojson"
OVERLAY_INFO_PATH = BASE_DIR / "overlay_info.json"
OVERLAY_PNG_PATH = BASE_DIR / "lrm_overlay.png"
DB_PATH = BASE_DIR / "reviews.db"

OBSIDIAN_VAULT_DIRS = [
    Path("/root/obsidian_vault/Ravenstack/sites"),
    Path("/root/obsidian-vault/Ravenstack/sites"),
    BASE_DIR / "obsidian_sites"
]

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS reviews (
            id TEXT PRIMARY KEY,
            verdict TEXT,
            notes TEXT,
            narrative TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()

def get_reviews():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id, verdict, notes, narrative, updated_at FROM reviews")
    rows = cursor.fetchall()
    conn.close()
    reviews = {}
    for r in rows:
        reviews[r[0]] = {
            "verdict": r[1],
            "notes": r[2],
            "narrative": r[3],
            "updated_at": r[4]
        }
    return reviews

def save_verdict(cand_id, verdict, notes=None):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    cursor.execute("""
        INSERT INTO reviews (id, verdict, notes, updated_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            verdict=excluded.verdict,
            notes=COALESCE(excluded.notes, reviews.notes),
            updated_at=excluded.updated_at
    """, (cand_id, verdict, notes, now))
    conn.commit()
    conn.close()

def save_narrative(cand_id, narrative):
    if not cand_id:
        return
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    cursor.execute("""
        INSERT INTO reviews (id, narrative, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            narrative=excluded.narrative,
            updated_at=excluded.updated_at
    """, (cand_id, narrative, now))
    conn.commit()
    conn.close()

class RadarRequestHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        # Clean logging format
        print(f"[{self.log_date_time_string()}] {format % args}")

    def send_json(self, data, status=200):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def send_file_response(self, filepath, content_type):
        filepath = Path(filepath)
        if not filepath.exists():
            self.send_error(404, f"File not found: {filepath.name}")
            return
        size = filepath.stat().st_size
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(size))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        with open(filepath, "rb") as f:
            self.wfile.write(f.read())

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        if path == "/api/candidates":
            self.handle_get_candidates()
        elif path == "/api/overlay_info":
            self.handle_get_overlay_info()
        elif path == "/api/lrm_overlay.png":
            self.send_file_response(OVERLAY_PNG_PATH, "image/png")
        elif path == "/api/grid":
            self.send_file_response(GRID_PATH, "application/json")
        elif path.startswith("/api/chips/"):
            chip_name = path[len("/api/chips/"):]
            chip_file = CHIPS_DIR / chip_name
            if chip_file.exists():
                self.send_file_response(chip_file, "image/png")
            else:
                self.send_error(404, "Chip image not found")
        elif path == "/api/plss":
            lat = query.get("lat", [None])[0]
            lon = query.get("lon", [None])[0]
            self.handle_get_plss(lat, lon)
        elif path == "/api/export.gpx":
            self.handle_export_gpx()
        else:
            # Serve static frontend files (e.g. from dist/ or base dir)
            dist_dir = BASE_DIR / "dist"
            target_path = dist_dir / path.lstrip("/") if dist_dir.exists() else BASE_DIR / path.lstrip("/")

            if path in ["/", ""] or not target_path.exists():
                index_file = dist_dir / "index.html" if dist_dir.exists() else BASE_DIR / "index.html"
                self.send_file_response(index_file, "text/html")
            else:
                ext = target_path.suffix.lower()
                content_type = "text/plain"
                if ext in [".html", ".htm"]:
                    content_type = "text/html"
                elif ext == ".js":
                    content_type = "application/javascript"
                elif ext == ".css":
                    content_type = "text/css"
                elif ext == ".json":
                    content_type = "application/json"
                elif ext == ".png":
                    content_type = "image/png"
                elif ext in [".jpg", ".jpeg"]:
                    content_type = "image/jpeg"
                elif ext == ".svg":
                    content_type = "image/svg+xml"
                self.send_file_response(target_path, content_type)

    def handle_get_candidates(self):
        if not CANDIDATES_PATH.exists():
            self.send_json({"type": "FeatureCollection", "features": []})
            return

        try:
            with open(CANDIDATES_PATH, "r", encoding="utf-8") as f:
                geojson = json.load(f)
        except Exception as e:
            self.send_json({"error": f"Failed to read candidates: {str(e)}"}, status=500)
            return

        reviews = get_reviews()
        for feature in geojson.get("features", []):
            props = feature.get("properties", {})
            cand_id = props.get("id") or feature.get("id")
            if cand_id and cand_id in reviews:
                rev = reviews[cand_id]
                props["verdict"] = rev["verdict"]
                props["notes"] = rev["notes"]
                props["narrative"] = rev["narrative"]
                props["updated_at"] = rev["updated_at"]
            else:
                props["verdict"] = props.get("verdict", "unreviewed")
            feature["properties"] = props

        self.send_json(geojson)

    def handle_get_overlay_info(self):
        if OVERLAY_INFO_PATH.exists():
            with open(OVERLAY_INFO_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
            self.send_json(data)
        else:
            self.send_json({"bounds": [[38.3950, -87.2350], [38.4150, -87.2050]]})

    def handle_get_plss(self, lat, lon):
        if not lat or not lon:
            self.send_json({"error": "Missing lat or lon parameter"}, status=400)
            return

        plss_str = "Sec. 30, T1S R7W"  # Fallback
        try:
            url = f"https://gis.blm.gov/arcgis/rest/services/Cadastral/BLM_Natl_PLSS_CadNSDI/MapServer/2/query?geometry={lon},{lat}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=*&returnGeometry=false&f=json"
            req = urllib.request.Request(url, headers={"User-Agent": "PikeTerrainRadar/1.0"})
            with urllib.request.urlopen(req, timeout=4.0) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                features = data.get("features", [])
                if features:
                    attrs = features[0].get("attributes", {})
                    sec = attrs.get("FRSTDIVNO") or attrs.get("SECTION") or "30"
                    twn = attrs.get("TWNSHPNO") or attrs.get("TOWNSHIP") or "1S"
                    rng = attrs.get("RANGENO") or attrs.get("RANGE") or "7W"
                    plss_str = f"Sec. {sec}, T{twn} R{rng}"
        except Exception as e:
            print(f"PLSS spatial query fallback (timeout or offline): {e}")

        self.send_json({"plss": plss_str, "lat": lat, "lon": lon})

    def handle_export_gpx(self):
        reviews = get_reviews()
        if not CANDIDATES_PATH.exists():
            self.send_error(404, "Candidates file missing")
            return

        with open(CANDIDATES_PATH, "r", encoding="utf-8") as f:
            geojson = json.load(f)

        gpx = ET.Element("gpx", version="1.1", creator="Pike Terrain Radar", xmlns="http://www.topografix.com/GPX/1/1")

        for feature in geojson.get("features", []):
            props = feature.get("properties", {})
            cand_id = props.get("id") or feature.get("id")
            rev = reviews.get(cand_id, {})
            verdict = rev.get("verdict") or props.get("verdict", "unreviewed")

            if verdict in ["confirmed", "walkover"]:
                coords = feature.get("geometry", {}).get("coordinates", [0, 0])
                lon, lat = coords[0], coords[1]
                wpt = ET.SubElement(gpx, "wpt", lat=str(lat), lon=str(lon))
                name = ET.SubElement(wpt, "name")
                name.text = f"{cand_id} ({verdict.upper()}) - {props.get('type', 'ANOMALY')}"
                desc = ET.SubElement(wpt, "desc")
                desc.text = rev.get("notes") or props.get("description", "")

        body = ET.tostring(gpx, encoding="utf-8", xml_declaration=True)
        self.send_response(200)
        self.send_header("Content-Type", "application/gpx+xml")
        self.send_header("Content-Disposition", 'attachment; filename="pike_radar_export.gpx"')
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        length = int(self.headers.get("Content-Length", 0))
        post_data = self.rfile.read(length) if length > 0 else b""

        try:
            body = json.loads(post_data.decode("utf-8")) if post_data else {}
        except Exception:
            body = {}

        if path == "/api/verdict":
            cand_id = body.get("id")
            verdict = body.get("verdict")
            notes = body.get("notes", "")
            if not cand_id or not verdict:
                self.send_json({"error": "Missing id or verdict"}, status=400)
                return
            save_verdict(cand_id, verdict, notes)
            self.send_json({"status": "success", "id": cand_id, "verdict": verdict})
        elif path == "/api/narrative":
            cand_id = body.get("id")
            section = body.get("section", "Sec. 30, T1S R7W")
            anomaly_type = body.get("type", "CELLAR_HOLE")
            goodspeed = body.get("goodspeed_notes", "Pioneer homestead site recorded in Goodspeed 1885 history.")

            narrative = self.generate_narrative(section, anomaly_type, goodspeed)
            if cand_id:
                save_narrative(cand_id, narrative)
            self.send_json({"status": "success", "id": cand_id, "narrative": narrative})
        elif path == "/api/export_obsidian":
            self.handle_export_obsidian(body)
        else:
            self.send_error(404, "Endpoint not found")

    def generate_narrative(self, section, anomaly_type, goodspeed):
        prompt = f"Write a 3-act historical story (Act 1: Clearing, Act 2: Peak, Act 3: Abandonment) for a pioneer {anomaly_type} in Pike County, Indiana ({section}). Historical context: {goodspeed}."

        # Try Ollama first
        try:
            ollama_url = "http://127.0.0.1:11434/api/generate"
            payload = json.dumps({"model": "gemma4", "prompt": prompt, "stream": False}).encode("utf-8")
            req = urllib.request.Request(ollama_url, data=payload, headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=3.0) as resp:
                res_data = json.loads(resp.read().decode("utf-8"))
                narrative_text = res_data.get("response")
                if narrative_text:
                    return narrative_text
        except Exception as e:
            print(f"Ollama offline/unavailable ({e}), using structured synthesis fallback.")

        # Structured synthesis fallback
        narrative = f"""### Act 1: Clearing (1838–1845)
In the dense hardwood timber of Pike County near {section}, pioneer settlers first notched the oaks and cleared the rich soil. The foundation for this {anomaly_type.replace('_', ' ').lower()} was hand-dug as axes echoed across Patoka township.

### Act 2: Peak Prosperity (1850–1885)
As recorded in Goodspeed’s 1885 History of Pike County: "{goodspeed}" The homestead thrived through the Civil War era, anchored by a hand-dug well, fruit trees, and the bustling road toward Petersburg.

### Act 3: Abandonment & Reclamation (1890–Present)
By the turn of the 20th century, young generations migrated west toward rail hubs. Timber and forest slowly reclaimed the clearing, leaving only the negative-relief LiDAR signature visible beneath the canopy today."""
        return narrative

    def handle_export_obsidian(self, body):
        cand_id = body.get("id", "ANOMALY_001")
        site_name = body.get("title", f"Pike Site {cand_id}")
        verdict = body.get("verdict", "confirmed")
        anomaly_type = body.get("type", "CELLAR_HOLE")
        lat = body.get("lat", 38.4064)
        lon = body.get("lon", -87.2232)
        section = body.get("section", "Sec. 30, T1S R7W")
        notes = body.get("notes", "No notes recorded.")
        narrative = body.get("narrative", "")

        markdown_content = f"""---
id: "{cand_id}"
title: "{site_name}"
verdict: "{verdict}"
type: "{anomaly_type}"
coordinates: [{lat}, {lon}]
section: "{section}"
date_surveyed: "{datetime.utcnow().strftime('%Y-%m-%d')}"
tags: [pike-county, lidar-anomaly, pioneer-history, {verdict}]
---

# {site_name} ({section})

**Coordinates:** `{lat}, {lon}`
**Feature Type:** `{anomaly_type}`
**Survey Verdict:** `{verdict.upper()}`

## Field Notes
{notes}

## Chronicle: What May Have Been
{narrative if narrative else 'Narrative pending field survey.'}
"""

        written_path = None
        for vault_dir in OBSIDIAN_VAULT_DIRS:
            try:
                vault_dir.mkdir(parents=True, exist_ok=True)
                file_path = vault_dir / f"{cand_id}.md"
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(markdown_content)
                written_path = str(file_path)
                break
            except Exception as e:
                print(f"Could not write to {vault_dir}: {e}")

        if written_path:
            self.send_json({"status": "success", "file_path": written_path})
        else:
            self.send_json({"error": "Failed to write Obsidian markdown file"}, status=500)

def run(port=8150):
    init_db()
    server_address = ("0.0.0.0", port)
    httpd = HTTPServer(server_address, RadarRequestHandler)
    print(f"Server starting on http://0.0.0.0:{port}...")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("Server stopping...")
        httpd.server_close()

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8150
    run(port)

# -*- coding: utf-8 -*-
"""
stats_espn.py — Descarga el boxscore de ESPN para cada partido finalizado
del Mundial y lo persiste en webapp/public/estadisticas.json.

Corre incremental: solo descarga partidos cuya clave no existe aún en el JSON.
Incluir en el pipeline después de actualizar.py y exportar_json.py.
"""
import json, os, sys, urllib.request
from datetime import date as date_t, datetime, timedelta
sys.path.insert(0, os.path.dirname(__file__))
from actualizar import TORNEO_INICIO, espn_canon, es_finalizado
try:
    sys.stdout.reconfigure(encoding="utf-8")
except AttributeError:
    pass

BASE    = os.path.join(os.path.dirname(__file__), "..")
DEST    = os.path.join(BASE, "webapp", "public", "estadisticas.json")

ESPN_BOARD   = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates={}"
ESPN_SUMMARY = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary?event={}"

# ESPN stat name → clave en estadisticas.json (debe coincidir con STATS_CFG en EnVivo.jsx)
STAT_KEYS = {
    "possessionPct":  "possessionPct",
    "totalShots":     "totalShots",
    "shotsOnTarget":  "shotsOnTarget",
    "saves":          "saves",
    "wonCorners":     "cornerKicks",   # ESPN usa wonCorners, la webapp espera cornerKicks
    "foulsCommitted": "foulsCommitted",
    "yellowCards":    "yellowCards",
    "redCards":       "redCards",
    "offsides":       "offsides",
}

def _fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    return json.loads(urllib.request.urlopen(req, timeout=20).read())

def _stats_de_partido(event_id):
    """Devuelve {our_key: {A: val, B: val}} o None si ESPN no tiene boxscore."""
    try:
        data = _fetch(ESPN_SUMMARY.format(event_id))
    except Exception as e:
        print(f"    [AVISO] summary {event_id}: {e}")
        return None

    teams = data.get("boxscore", {}).get("teams", [])
    if not teams:
        return None

    raw = {}
    for t in teams:
        side = t.get("homeAway", "")
        raw[side] = {s["name"]: s["displayValue"] for s in t.get("statistics", [])}

    sA, sB = raw.get("home", {}), raw.get("away", {})
    resultado = {}
    for espn_k, our_k in STAT_KEYS.items():
        if espn_k in sA or espn_k in sB:
            resultado[our_k] = {"A": sA.get(espn_k, "0"), "B": sB.get(espn_k, "0")}
    return resultado or None

def main():
    # Cargar JSON existente para updates incrementales
    if os.path.exists(DEST):
        with open(DEST, encoding="utf-8") as f:
            existente = json.load(f)
        partidos = existente.get("partidos", {})
    else:
        partidos = {}

    today = date_t.today()
    current = TORNEO_INICIO
    nuevos = 0

    while current <= today:
        fecha_str = current.strftime("%Y%m%d")
        try:
            data = _fetch(ESPN_BOARD.format(fecha_str))
        except Exception as e:
            print(f"[AVISO] scoreboard {fecha_str}: {e}")
            current += timedelta(days=1)
            continue

        for ev in data.get("events", []):
            comp = ev["competitions"][0]
            if not es_finalizado(ev, comp):
                continue

            teams = {c["homeAway"]: espn_canon(c["team"]["displayName"])
                     for c in comp["competitors"]}
            home, away = teams.get("home"), teams.get("away")
            if not home or not away:
                continue

            key = f"{home}|{away}"
            if key in partidos:
                continue

            print(f"  {home} vs {away} ({current})...")
            stats = _stats_de_partido(ev["id"])
            if stats:
                partidos[key] = stats
                nuevos += 1
            else:
                print(f"    [AVISO] Sin boxscore para {key}")

        current += timedelta(days=1)

    output = {
        "generado": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "partidos": partidos,
    }
    os.makedirs(os.path.dirname(DEST), exist_ok=True)
    with open(DEST, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=1)

    print(f"[OK] estadisticas.json: {len(partidos)} partidos guardados ({nuevos} nuevos).")

if __name__ == "__main__":
    main()

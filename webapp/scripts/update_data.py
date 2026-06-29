#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
update_data.py — Actualiza webapp/public/data.json con resultados de ESPN.
Diseñado para correr en GitHub Actions (sin Excel, sin dependencias externas salvo requests).
Lógica equivalente a modelo/actualizar.py + modelo/exportar_json.py combinados.
"""
import json, os, sys, re
from datetime import datetime, timezone, timedelta

try:
    import requests
except ImportError:
    print("[ERROR] Instala requests: pip install requests")
    sys.exit(1)

# ── Rutas ────────────────────────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT  = os.path.dirname(SCRIPT_DIR)
DATA_JSON  = os.path.join(REPO_ROOT, "public", "data.json")

# ── Traducción ESPN (inglés) → nombre canónico ES del data.json ──────────────
ESPN_A_ES = {
    "Mexico": "México", "South Africa": "Sudáfrica", "South Korea": "Corea del Sur",
    "Czechia": "Chequia", "Czech Republic": "Chequia",
    "Canada": "Canadá", "Bosnia and Herzegovina": "Bosnia y Herzegovina",
    "Qatar": "Qatar", "Switzerland": "Suiza",
    "Brazil": "Brasil", "Morocco": "Marruecos", "Haiti": "Haití",
    "Scotland": "Escocia", "USA": "Estados Unidos", "United States": "Estados Unidos",
    "Paraguay": "Paraguay", "Australia": "Australia", "Turkey": "Turquía",
    "Germany": "Alemania", "Curacao": "Curaçao", "Curaçao": "Curaçao",
    "Netherlands": "Países Bajos", "Japan": "Japón", "Ivory Coast": "Costa de Marfil",
    "Côte d'Ivoire": "Costa de Marfil", "Ecuador": "Ecuador", "Sweden": "Suecia",
    "Tunisia": "Túnez", "Spain": "España", "Cabo Verde": "Cabo Verde",
    "Cape Verde": "Cabo Verde", "Saudi Arabia": "Arabia Saudita",
    "Uruguay": "Uruguay", "Belgium": "Bélgica", "Egypt": "Egipto",
    "Iran": "Irán", "New Zealand": "Nueva Zelanda", "France": "Francia",
    "Senegal": "Senegal", "Iraq": "Irak", "Norway": "Noruega",
    "Argentina": "Argentina", "Algeria": "Argelia", "Austria": "Austria",
    "Jordan": "Jordania", "Portugal": "Portugal", "DR Congo": "RD Congo",
    "Congo DR": "RD Congo", "Democratic Republic of Congo": "RD Congo",
    "England": "Inglaterra", "Croatia": "Croacia", "Ghana": "Ghana",
    "Panama": "Panamá", "Uzbekistan": "Uzbekistán", "Colombia": "Colombia",
    "Ghana": "Ghana",
}

# ── Estados ESPN que indican partido finalizado ───────────────────────────────
_ESTADOS_FINALES = {
    "STATUS_FULL_TIME", "STATUS_FINAL", "STATUS_FINAL_EXTRA_TIME",
    "STATUS_FINAL_AET", "STATUS_FINAL_OVERTIME", "STATUS_AP",
    "STATUS_FT", "STATUS_SHOOTOUT", "STATUS_ABANDONED",
}
_ESTADOS_EN_CURSO = {
    "STATUS_SCHEDULED", "STATUS_IN_PROGRESS",
    "STATUS_HALFTIME", "STATUS_DELAYED", "STATUS_POSTPONED", "STATUS_CANCELED",
}

def es_finalizado(ev, comp):
    """Determina si un partido terminó usando 4 señales (robusto ante ESPN bugs)."""
    tipo   = comp["status"]["type"]
    estado = tipo.get("name", "")
    # Señal 1: ESPN lo marca explícitamente
    if tipo.get("completed", False):
        return True
    # Señal 2: nombre de estado conocido como final
    if estado in _ESTADOS_FINALES:
        return True
    if any(k in estado for k in ("FULL_TIME", "FINAL", "_AET", "SHOOTOUT")):
        return True
    # Señal 3: estado conocido como NO final
    if estado in _ESTADOS_EN_CURSO:
        return False
    # Señal 4: temporal — partido fue hace >3h y tiene marcador
    try:
        ev_dt   = datetime.fromisoformat(ev["date"].replace("Z", "+00:00"))
        elapsed = datetime.now(tz=timezone.utc) - ev_dt
        if elapsed.total_seconds() > 10_800:
            scores = [c.get("score") for c in comp.get("competitors", [])]
            if all(s is not None for s in scores):
                return True
    except Exception:
        pass
    return False

def fetch_espn(fecha_str):
    """Descarga resultados ESPN para la fecha dada (YYYY-MM-DD). Retorna lista de partidos."""
    date_tag = fecha_str.replace("-", "")
    url = (f"https://site.api.espn.com/apis/site/v2/sports/soccer/"
           f"fifa.world/scoreboard?dates={date_tag}")
    try:
        r = requests.get(url, timeout=15)
        r.raise_for_status()
        return r.json().get("events", [])
    except Exception as e:
        print(f"  [WARN] ESPN {fecha_str}: {e}")
        return []

def norm(nombre):
    """Normaliza nombre de equipo a minúsculas sin acentos para comparar."""
    n = nombre.lower()
    for a, b in [("á","a"),("é","e"),("í","i"),("ó","o"),("ú","u"),("ü","u"),("ñ","n"),("ç","c")]:
        n = n.replace(a, b)
    return n

def build_espn_index(events):
    """
    Construye un índice {frozenset({norm_equipo_a, norm_equipo_b}): partido_info}
    desde los eventos de ESPN.
    """
    idx = {}
    for ev in events:
        for comp in ev.get("competitions", []):
            competitors = comp.get("competitors", [])
            if len(competitors) < 2:
                continue
            nombres = []
            scores  = []
            for c in competitors:
                en = c.get("team", {}).get("displayName", "")
                es = ESPN_A_ES.get(en, en)
                nombres.append(es)
                scores.append(c.get("score"))
            key = frozenset(norm(n) for n in nombres)
            idx[key] = {
                "comp":   comp,
                "ev":     ev,
                "nombres": nombres,
                "scores":  scores,
            }
    return idx

def main():
    # Cargar data.json
    with open(DATA_JSON, encoding="utf-8") as f:
        data = json.load(f)

    partidos = data["partidos"]
    hoy      = datetime.now(tz=timezone.utc).date()

    # Agrupar partidos pendientes por fecha
    pendientes_por_fecha = {}
    for p in partidos:
        if "resultado" in p:
            continue
        fecha = p.get("fecha")
        if not fecha:
            continue
        # Solo fechas pasadas o hoy
        try:
            fd = datetime.strptime(str(fecha), "%Y-%m-%d").date()
        except Exception:
            continue
        if fd > hoy:
            continue
        pendientes_por_fecha.setdefault(str(fecha), []).append(p)

    if not pendientes_por_fecha:
        print("[OK] Sin partidos pendientes. data.json está al día.")
        return

    actualizados = 0

    for fecha_str, pds in sorted(pendientes_por_fecha.items()):
        events = fetch_espn(fecha_str)
        if not events:
            print(f"  [{fecha_str}] Sin datos ESPN.")
            continue

        idx = build_espn_index(events)

        for p in pds:
            ea = p.get("equipoA", "")
            eb = p.get("equipoB", "")
            # Ignorar partidos con códigos de seeding no resueltos
            if re.match(r'^[12][A-L]$|^3[A-L](/[A-L])*$|^[WL]\d+$', ea, re.I):
                continue

            key = frozenset([norm(ea), norm(eb)])
            info = idx.get(key)
            if not info:
                print(f"  [{fecha_str}] No encontrado en ESPN: {ea} vs {eb}")
                continue

            comp = info["comp"]
            ev   = info["ev"]

            if not es_finalizado(ev, comp):
                estado = comp["status"]["type"].get("name","?")
                print(f"  [{fecha_str}] {ea} vs {eb} aún no finalizado ({estado})")
                continue

            # Extraer marcador
            nombres  = info["nombres"]
            scores   = info["scores"]
            # competitors[0] = home, competitors[1] = away
            # Necesitamos emparejar con equipoA/equipoB
            complist = comp.get("competitors", [])
            ga = gb = None
            for c in complist:
                en = c.get("team", {}).get("displayName", "")
                es = ESPN_A_ES.get(en, en)
                if norm(es) == norm(ea):
                    ga = c.get("score")
                elif norm(es) == norm(eb):
                    gb = c.get("score")

            if ga is None or gb is None:
                print(f"  [{fecha_str}] No se pudo extraer marcador: {ea} vs {eb}")
                continue

            try:
                ga, gb = int(ga), int(gb)
            except (ValueError, TypeError):
                continue

            # Detectar tipo de definición (penales, prórroga, etc.)
            status_name = comp["status"]["type"].get("name", "")
            if "SHOOTOUT" in status_name or "AP" in status_name:
                definido_por = "penales"
            elif any(k in status_name for k in ("_AET", "EXTRA_TIME", "OVERTIME")):
                definido_por = "prorroga"
            else:
                definido_por = "90"

            p["resultado"] = {
                "golesA":         ga,
                "golesB":         gb,
                "definidoPor":    definido_por,
                "ganadorPenales": None,
            }
            print(f"  [{fecha_str}] {ea} {ga}-{gb} {eb} ({definido_por}) ✓")
            actualizados += 1

    if actualizados > 0:
        data["generado"] = datetime.now().strftime("%Y-%m-%d %H:%M")
        with open(DATA_JSON, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=1)
        print(f"\n[OK] {actualizados} resultado(s) actualizado(s) → data.json guardado.")
    else:
        print("\n[OK] Sin nuevos resultados que agregar.")

if __name__ == "__main__":
    main()

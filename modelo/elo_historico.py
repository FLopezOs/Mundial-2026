# -*- coding: utf-8 -*-
"""
elo_historico.py — Elo encadenado sobre results.csv completo (1872 -> pre-Mundial 2026).
Convenciones eloratings.net (INSTRUCCIONES.md §5.2).

Salidas:
  Data/elo_calculado.csv      -> rating final por selección (pre-torneo, corte 2026-06-10)
  Data/elo_partidos_2018.csv  -> partidos desde 2018-01-01 con Elo vigente pre-partido (insumo de calibrar.py)
"""
import os
import pandas as pd

BASE = os.path.join(os.path.dirname(__file__), "..")
DATA = os.path.join(BASE, "Data")
CORTE = "2026-06-11"  # inicio del Mundial 2026: se excluye del Elo inicial

def k_torneo(t: str) -> int:
    tl = t.lower()
    if tl == "fifa world cup":
        return 60
    continentales = ["copa américa", "uefa euro", "african cup of nations",
                     "afc asian cup", "concacaf championship", "gold cup",
                     "oceania nations cup", "confederations cup"]
    if any(c in tl for c in continentales) and "qualification" not in tl:
        return 50
    if "qualification" in tl:
        return 40
    if "nations league" in tl:
        return 30
    if tl == "friendly":
        return 20
    return 30  # otros torneos

def mult_goles(diff: int) -> float:
    d = abs(diff)
    if d <= 1:
        return 1.0
    if d == 2:
        return 1.5
    if d == 3:
        return 1.75
    return 1.75 + (d - 3) / 8.0

def main():
    r = pd.read_csv(os.path.join(DATA, "results.csv"))
    fn = pd.read_csv(os.path.join(DATA, "former_names.csv"))
    ren = dict(zip(fn["former"], fn["current"]))
    for col in ("home_team", "away_team"):
        r[col] = r[col].replace(ren)
    r = r.dropna(subset=["home_score", "away_score"])
    r = r[r["date"] < CORTE].sort_values("date").reset_index(drop=True)

    elo, pj = {}, {}
    filas_2018 = []
    for row in r.itertuples(index=False):
        a, b = row.home_team, row.away_team
        ea, eb = elo.get(a, 1500.0), elo.get(b, 1500.0)
        local_a = 0 if row.neutral else 1
        dr = (ea + 100 * local_a) - eb
        exp_a = 1.0 / (1.0 + 10 ** (-dr / 400.0))
        ga, gb = int(row.home_score), int(row.away_score)
        s_a = 1.0 if ga > gb else (0.5 if ga == gb else 0.0)
        k = k_torneo(row.tournament)
        g = mult_goles(ga - gb)
        delta = k * g * (s_a - exp_a)
        if row.date >= "2018-01-01":
            filas_2018.append((row.date, a, b, ea, eb, local_a, dr, ga, gb, row.tournament))
        elo[a], elo[b] = ea + delta, eb - delta
        pj[a], pj[b] = pj.get(a, 0) + 1, pj.get(b, 0) + 1

    out = pd.DataFrame(
        [(t, round(e, 1), pj[t]) for t, e in elo.items()],
        columns=["equipo", "elo", "pj"],
    ).sort_values("elo", ascending=False)
    out.to_csv(os.path.join(DATA, "elo_calculado.csv"), index=False)

    pd.DataFrame(
        filas_2018,
        columns=["date", "home_team", "away_team", "elo_home_pre", "elo_away_pre",
                 "local_home", "dr", "home_score", "away_score", "tournament"],
    ).to_csv(os.path.join(DATA, "elo_partidos_2018.csv"), index=False)

    print(f"Partidos procesados: {len(r)} | Equipos: {len(elo)} | Corte: {CORTE}")
    print(out.head(15).to_string(index=False))

if __name__ == "__main__":
    main()

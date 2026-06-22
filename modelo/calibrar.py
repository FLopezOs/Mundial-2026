# -*- coding: utf-8 -*-
"""
calibrar.py — Calibración del modelo de goles (INSTRUCCIONES.md §6).
Insumo: Data/elo_partidos_2018.csv (generado por elo_historico.py).
Salida: Data/calibracion.json (μ, β, fecha, Att/Def/Lambda_Base por selección del Mundial).

Definiciones:
  - Peso temporal: exp(−años_atrás/2); oficial (tournament != Friendly) ×1.5.
  - β: WLS por el origen de la diferencia de goles vs dr (dr incluye +100 de localía).
  - Att_T = Σw·GF_T / Σw·λ_esperado_T   (>1 = anota más de lo esperado)
  - Def_T = Σw·GC_T / Σw·λ_esperado_rival (>1 = recibe más de lo esperado: debilidad defensiva)
  - Lambda_Base = (μ/2)·Att
"""
import json, os
from datetime import date
import numpy as np
import pandas as pd

BASE = os.path.join(os.path.dirname(__file__), "..")
DATA = os.path.join(BASE, "Data")
HOY = date(2026, 6, 12)

WC48 = ["Algeria","Argentina","Australia","Austria","Belgium","Bosnia and Herzegovina",
        "Brazil","Canada","Cape Verde","Colombia","Croatia","Curaçao","Czech Republic",
        "DR Congo","Ecuador","Egypt","England","France","Germany","Ghana","Haiti","Iran",
        "Iraq","Ivory Coast","Japan","Jordan","Mexico","Morocco","Netherlands","New Zealand",
        "Norway","Panama","Paraguay","Portugal","Qatar","Saudi Arabia","Scotland","Senegal",
        "South Africa","South Korea","Spain","Sweden","Switzerland","Tunisia","Turkey",
        "United States","Uruguay","Uzbekistan"]

def main():
    df = pd.read_csv(os.path.join(DATA, "elo_partidos_2018.csv"), parse_dates=["date"])
    anios = (pd.Timestamp(HOY) - df["date"]).dt.days / 365.25
    w = np.exp(-anios / 2) * np.where(df["tournament"] == "Friendly", 1.0, 1.5)
    df["w"] = w

    # μ: media ponderada de goles por partido
    goles = df["home_score"] + df["away_score"]
    mu = float(np.average(goles, weights=w))

    # β: regresión por el origen, diferencia de goles ~ dr
    gd = df["home_score"] - df["away_score"]
    beta = float(np.sum(w * df["dr"] * gd) / np.sum(w * df["dr"] ** 2))

    # Att/Def por equipo (esperados según Elo del momento).
    # Se excluyen partidos con λ esperado degenerado (<0.3: mismatches extremos
    # donde el modelo lineal Δ=β·dr deja de ser válido y sesga los ratios).
    lam_h = (mu + beta * df["dr"]) / 2
    lam_a = (mu - beta * df["dr"]) / 2
    valido = (lam_h > 0.3) & (lam_a > 0.3)
    att, deff = {}, {}
    for t in WC48:
        eh = (df["home_team"] == t) & valido
        ea = (df["away_team"] == t) & valido
        wf = np.concatenate([w[eh], w[ea]])
        gf = np.concatenate([df.loc[eh, "home_score"], df.loc[ea, "away_score"]])
        gc = np.concatenate([df.loc[eh, "away_score"], df.loc[ea, "home_score"]])
        lf = np.concatenate([lam_h[eh], lam_a[ea]])   # λ esperado propio
        lc = np.concatenate([lam_a[eh], lam_h[ea]])   # λ esperado del rival
        att[t] = float(np.clip(np.sum(wf * gf) / np.sum(wf * lf), 0.75, 1.30))
        deff[t] = float(np.clip(np.sum(wf * gc) / np.sum(wf * lc), 0.75, 1.30))

    out = {
        "fecha_calculo": HOY.isoformat(),
        "ventana": "2018-01-01 a 2026-06-10",
        "n_partidos": int(len(df)),
        "mu": round(mu, 4),
        "beta": round(beta, 6),
        "equipos": {t: {"att": round(att[t], 3), "def": round(deff[t], 3),
                        "lambda_base": round(mu / 2 * att[t], 3)} for t in WC48},
    }
    with open(os.path.join(DATA, "calibracion.json"), "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    print(f"n={len(df)} mu={mu:.3f} beta={beta:.5f}")

if __name__ == "__main__":
    main()

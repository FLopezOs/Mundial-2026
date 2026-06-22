import { useState, useEffect, useMemo } from "react";
import Bandera from "./Bandera.jsx";

const STATS_CFG = [
  { key: "possessionPct",  label: "Posesión"  },
  { key: "totalShots",     label: "Tiros"     },
  { key: "shotsOnTarget",  label: "Al arco"   },
  { key: "saves",          label: "Atajadas"  },
  { key: "cornerKicks",    label: "Córners"   },
  { key: "foulsCommitted", label: "Faltas"    },
  { key: "yellowCards",    label: "Amarillas" },
  { key: "redCards",       label: "Rojas"     },
  { key: "offsides",       label: "Offside"   },
];

const ITEMS_RESUMEN = [
  { lbl: "PJ",  key: "pj"  },
  { lbl: "G",   key: "g",  pos: true  },
  { lbl: "E",   key: "e"   },
  { lbl: "P",   key: "pe", neg: true  },
  { lbl: "GF",  key: "gf"  },
  { lbl: "GC",  key: "gc"  },
  { lbl: "DG",  key: "dg"  },
];

/* ── Fila de stat con barras ── */
function StatRow({ label, valA, valB }) {
  const parse = s => parseFloat(String(s ?? "0").replace("%", "")) || 0;
  const a = parse(valA), b = parse(valB);
  const tot = a + b || 1;
  const pA = Math.round(a / tot * 100);
  const pB = 100 - pA;
  return (
    <div className="ev2-stat">
      <span className="ev2-val home">{valA ?? "—"}</span>
      <div className="ev2-bar-col">
        <div className="ev2-bar-track">
          <div className="ev2-bar-home" style={{ width: pA + "%" }} />
          <div className="ev2-bar-away" style={{ width: pB + "%", marginLeft: "auto" }} />
        </div>
        <span className="ev2-stat-lbl">{label}</span>
      </div>
      <span className="ev2-val away">{valB ?? "—"}</span>
    </div>
  );
}

/* ── Cálculo del consolidado de un equipo ── */
function calcularConsolidado(equipo, partidos, statsMap) {
  const ps = partidos.filter(
    p => p.resultado && (p.equipoA === equipo || p.equipoB === equipo)
  );
  let pj = 0, g = 0, e = 0, pe = 0, gf = 0, gc = 0;
  const acumE = {}, acumR = {};
  let nConStats = 0;

  for (const p of ps) {
    const esA = p.equipoA === equipo;
    const r = p.resultado;
    const mg = esA ? r.golesA : r.golesB;
    const rg = esA ? r.golesB : r.golesA;
    pj++; gf += mg; gc += rg;
    if (mg > rg) g++; else if (mg === rg) e++; else pe++;

    const st = statsMap?.[`${p.equipoA}|${p.equipoB}`];
    if (st) {
      const [l, lr] = esA ? ["A", "B"] : ["B", "A"];
      nConStats++;
      for (const key of Object.keys(st)) {
        acumE[key] = (acumE[key] ?? 0) + (parseFloat(String(st[key][l]  ?? "0").replace("%","")) || 0);
        acumR[key] = (acumR[key] ?? 0) + (parseFloat(String(st[key][lr] ?? "0").replace("%","")) || 0);
      }
    }
  }
  const promedios = {};
  if (nConStats > 0) {
    for (const key of Object.keys(acumE))
      promedios[key] = { equipo: acumE[key] / nConStats, rival: acumR[key] / nConStats };
  }
  return { pj, g, e, pe, gf, gc, dg: gf - gc, nConStats, promedios };
}

/* ── Grid de resumen PJ/G/E/P/GF/GC/DG ── */
function Resumen({ c, compact }) {
  const cls = compact ? "pp-summary pp-summary-sm" : "pp-summary";
  const valCls = compact ? "pp-summary-val pp-summary-val-sm" : "pp-summary-val";
  return (
    <div className={cls}>
      {ITEMS_RESUMEN.map(({ lbl, key, pos, neg }) => {
        const v = c[key];
        const extra = pos && v > 0 ? " pp-pos"
                    : neg && v > 0 ? " pp-neg"
                    : key === "dg" && v > 0 ? " pp-pos"
                    : key === "dg" && v < 0 ? " pp-neg"
                    : "";
        const disp = key === "dg" && v > 0 ? `+${v}` : v;
        return (
          <div key={lbl} className="pp-summary-item">
            <span className={valCls + extra}>{disp}</span>
            <span className="pp-summary-lbl">{lbl}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Tarjeta mini para modo comparación ── */
function MiniCard({ equipo, c }) {
  return (
    <div className="ev2-card ended pp-mini-card">
      <div className="ev2-header">
        <Bandera equipo={equipo} ancho={28} />
        <span className="ev2-estado pp-mini-titulo">{equipo}</span>
      </div>
      <Resumen c={c} compact />
    </div>
  );
}

/* ── Vista principal ── */
export default function PorPais({ data }) {
  const [statsMap, setStatsMap] = useState(null);
  const [equipo,   setEquipo]   = useState("");
  const [equipo2,  setEquipo2]  = useState("");

  useEffect(() => {
    fetch(import.meta.env.BASE_URL + "estadisticas.json")
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setStatsMap(d.partidos))
      .catch(() => {});
  }, []);

  /* Bug fix: usar data.equipos (las 48 selecciones reales) en vez de
     extraer nombres de partidos, que incluye placeholders "1A", "W48"… */
  const equipos = useMemo(() =>
    (data?.equipos ?? [])
      .map(e => e.nombre)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, "es")),
    [data]
  );

  const consolidado  = useMemo(() =>
    equipo  && data ? calcularConsolidado(equipo,  data.partidos, statsMap) : null,
    [equipo,  data, statsMap]
  );
  const consolidado2 = useMemo(() =>
    equipo2 && data ? calcularConsolidado(equipo2, data.partidos, statsMap) : null,
    [equipo2, data, statsMap]
  );

  const modoComp = equipo && equipo2;

  return (
    <div className="pp-vista">

      {/* ── Selectores ── */}
      <div className="pp-topbar">
        <h3 className="ev2-hist-titulo">Rendimiento por selección</h3>
        <div className="pp-selects">
          <select
            className="ev2-filtro-select"
            value={equipo}
            onChange={e => setEquipo(e.target.value)}
          >
            <option value="">Elige una selección…</option>
            {equipos.map(eq => <option key={eq} value={eq}>{eq}</option>)}
          </select>

          <span className="pp-vs-label">vs</span>

          <select
            className="ev2-filtro-select"
            value={equipo2}
            onChange={e => setEquipo2(e.target.value)}
          >
            <option value="">— comparar con —</option>
            {equipos.filter(eq => eq !== equipo).map(eq => (
              <option key={eq} value={eq}>{eq}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Sin equipo elegido ── */}
      {!equipo && (
        <div className="ev2-empty">
          <div className="ev2-empty-icon">🌎</div>
          <p className="ev2-empty-msg">Elige una selección</p>
          <p className="ev2-empty-sub">Ver su rendimiento acumulado · o compara dos equipos</p>
        </div>
      )}

      {equipo && !consolidado && (
        <p className="ev2-nodata" style={{ padding: "24px 0" }}>Cargando…</p>
      )}

      {/* ── Modo comparación ── */}
      {modoComp && consolidado && consolidado2 && (() => {
        const c1 = consolidado, c2 = consolidado2;
        const keysConDatos = STATS_CFG.filter(s =>
          c1.promedios[s.key] != null || c2.promedios[s.key] != null
        );
        return (
          <>
            {/* Dos mini-fichas lado a lado */}
            <div className="pp-vs-row">
              <MiniCard equipo={equipo}  c={c1} />
              <span className="pp-vs-sep">VS</span>
              <MiniCard equipo={equipo2} c={c2} />
            </div>

            {/* Barras comparativas */}
            {keysConDatos.length > 0 ? (
              <div className="ev2-card ended" style={{ marginTop: 10 }}>
                <div className="ev2-stats-wrap" style={{ borderTop: "none" }}>
                  <div className="ev2-stats-header">
                    <span className="ev2-stats-team home">{equipo}</span>
                    <span className="ev2-stats-mid">PROM. / PARTIDO</span>
                    <span className="ev2-stats-team away">{equipo2}</span>
                  </div>
                  <div className="ev2-stats">
                    {keysConDatos.map(({ key, label }) => {
                      const vA = c1.promedios[key]?.equipo;
                      const vB = c2.promedios[key]?.equipo;
                      return (
                        <StatRow
                          key={key} label={label}
                          valA={vA != null ? vA.toFixed(1) : "—"}
                          valB={vB != null ? vB.toFixed(1) : "—"}
                        />
                      );
                    })}
                  </div>
                  <p className="pp-nota-pj">
                    {equipo}: {c1.nConStats} pj con datos · {equipo2}: {c2.nConStats} pj con datos
                  </p>
                </div>
              </div>
            ) : (
              <p className="ev2-nodata" style={{ padding: "14px 0" }}>
                Ninguno de los dos equipos tiene estadísticas todavía.
              </p>
            )}
          </>
        );
      })()}

      {/* ── Modo vista simple (un equipo solo) ── */}
      {equipo && !equipo2 && consolidado && (() => {
        const c = consolidado;
        if (c.pj === 0) return (
          <div className="ev2-empty">
            <div className="ev2-empty-icon">⏳</div>
            <p className="ev2-empty-msg">{equipo} aún no ha jugado</p>
            <p className="ev2-empty-sub">Vuelve cuando dispute su primer partido</p>
          </div>
        );
        return (
          <div className="ev2-card ended">
            <div className="ev2-header">
              <Bandera equipo={equipo} ancho={36} />
              <span className="ev2-estado" style={{ marginLeft: 6 }}>{equipo}</span>
            </div>
            <Resumen c={c} compact={false} />
            {c.nConStats > 0 ? (
              <div className="ev2-stats-wrap">
                <div className="ev2-stats-header">
                  <span className="ev2-stats-team home">{equipo}</span>
                  <span className="ev2-stats-mid">
                    PROM. / PARTIDO · {c.nConStats} pj con datos
                  </span>
                  <span className="ev2-stats-team away">Rival prom.</span>
                </div>
                <div className="ev2-stats">
                  {STATS_CFG.filter(s => c.promedios[s.key]).map(({ key, label }) => {
                    const { equipo: vA, rival: vB } = c.promedios[key];
                    return (
                      <StatRow key={key} label={label}
                        valA={vA.toFixed(1)} valB={vB.toFixed(1)} />
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="ev2-nodata" style={{ padding: "14px 0" }}>
                Sin estadísticas disponibles para {equipo} aún.
              </p>
            )}
          </div>
        );
      })()}

    </div>
  );
}

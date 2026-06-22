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

/* ── Fila de stat con barras (reutiliza el mismo layout que EnVivo) ── */
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

/* ── Consolidado de un equipo ── */
function calcularConsolidado(equipo, partidos, statsMap) {
  const psEquipo = partidos.filter(
    p => p.resultado && (p.equipoA === equipo || p.equipoB === equipo)
  );

  let pj = 0, g = 0, e = 0, pe = 0, gf = 0, gc = 0;
  const acumEquipo = {}, acumRival = {};
  let nConStats = 0;

  for (const p of psEquipo) {
    const esA = p.equipoA === equipo;
    const r = p.resultado;
    const miGoles  = esA ? r.golesA : r.golesB;
    const rivGoles = esA ? r.golesB : r.golesA;
    pj++;
    gf += miGoles; gc += rivGoles;
    if (miGoles > rivGoles) g++;
    else if (miGoles === rivGoles) e++;
    else pe++;

    const clave = `${p.equipoA}|${p.equipoB}`;
    const st = statsMap?.[clave];
    if (st) {
      const lado    = esA ? "A" : "B";
      const ladoRiv = esA ? "B" : "A";
      nConStats++;
      for (const key of Object.keys(st)) {
        const val  = parseFloat(String(st[key][lado]    ?? "0").replace("%", "")) || 0;
        const valR = parseFloat(String(st[key][ladoRiv] ?? "0").replace("%", "")) || 0;
        acumEquipo[key] = (acumEquipo[key] ?? 0) + val;
        acumRival[key]  = (acumRival[key]  ?? 0) + valR;
      }
    }
  }

  const promedios = {};
  if (nConStats > 0) {
    for (const key of Object.keys(acumEquipo)) {
      promedios[key] = {
        equipo: acumEquipo[key] / nConStats,
        rival:  acumRival[key]  / nConStats,
      };
    }
  }

  return { pj, g, e, pe, gf, gc, nConStats, promedios };
}

/* ── Vista principal ── */
export default function PorPais({ data }) {
  const [statsMap, setStatsMap] = useState(null);
  const [equipo,   setEquipo]   = useState("");

  useEffect(() => {
    fetch(import.meta.env.BASE_URL + "estadisticas.json")
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setStatsMap(d.partidos))
      .catch(() => {});
  }, []);

  const equipos = useMemo(() => {
    const set = new Set();
    for (const p of data?.partidos ?? []) {
      set.add(p.equipoA);
      set.add(p.equipoB);
    }
    return [...set].sort((a, b) => a.localeCompare(b, "es"));
  }, [data]);

  const consolidado = useMemo(() => {
    if (!equipo || !data) return null;
    return calcularConsolidado(equipo, data.partidos, statsMap);
  }, [equipo, data, statsMap]);

  const dg = consolidado ? consolidado.gf - consolidado.gc : 0;

  return (
    <div className="pp-vista">

      {/* ── Selector ── */}
      <div className="ev2-hist-topbar" style={{ marginBottom: 20 }}>
        <h3 className="ev2-hist-titulo">Rendimiento por selección</h3>
        <select
          className="ev2-filtro-select"
          value={equipo}
          onChange={e => setEquipo(e.target.value)}
        >
          <option value="">Elige una selección…</option>
          {equipos.map(eq => <option key={eq} value={eq}>{eq}</option>)}
        </select>
      </div>

      {/* ── Estado vacío ── */}
      {!equipo && (
        <div className="ev2-empty">
          <div className="ev2-empty-icon">🌎</div>
          <p className="ev2-empty-msg">Elige una selección</p>
          <p className="ev2-empty-sub">Ver su rendimiento acumulado en el Mundial</p>
        </div>
      )}

      {equipo && !consolidado && (
        <p className="ev2-nodata" style={{ padding: "24px 0" }}>Cargando estadísticas…</p>
      )}

      {equipo && consolidado && consolidado.pj === 0 && (
        <div className="ev2-empty">
          <div className="ev2-empty-icon">⏳</div>
          <p className="ev2-empty-msg">{equipo} aún no ha jugado</p>
          <p className="ev2-empty-sub">Vuelve cuando dispute su primer partido</p>
        </div>
      )}

      {/* ── Ficha del equipo ── */}
      {equipo && consolidado && consolidado.pj > 0 && (
        <div className="ev2-card ended">

          {/* Cabecera */}
          <div className="ev2-header">
            <Bandera equipo={equipo} ancho={36} />
            <span className="ev2-estado" style={{ marginLeft: 6 }}>{equipo}</span>
          </div>

          {/* Resumen PJ / G / E / P / GF / GC / DG */}
          <div className="pp-summary">
            {[
              { lbl: "PJ",  val: consolidado.pj,  cls: ""      },
              { lbl: "G",   val: consolidado.g,   cls: "pp-pos" },
              { lbl: "E",   val: consolidado.e,   cls: ""      },
              { lbl: "P",   val: consolidado.pe,  cls: consolidado.pe > 0 ? "pp-neg" : "" },
              { lbl: "GF",  val: consolidado.gf,  cls: ""      },
              { lbl: "GC",  val: consolidado.gc,  cls: ""      },
              { lbl: "DG",
                val: (dg > 0 ? "+" : "") + dg,
                cls: dg > 0 ? "pp-pos" : dg < 0 ? "pp-neg" : "" },
            ].map(({ lbl, val, cls }) => (
              <div key={lbl} className="pp-summary-item">
                <span className={"pp-summary-val " + cls}>{val}</span>
                <span className="pp-summary-lbl">{lbl}</span>
              </div>
            ))}
          </div>

          {/* Promedios por partido vs rival promedio */}
          {consolidado.nConStats > 0 ? (
            <div className="ev2-stats-wrap">
              <div className="ev2-stats-header">
                <span className="ev2-stats-team home">{equipo}</span>
                <span className="ev2-stats-mid">
                  PROM. / PARTIDO · {consolidado.nConStats} pj con datos
                </span>
                <span className="ev2-stats-team away">Rival prom.</span>
              </div>
              <div className="ev2-stats">
                {STATS_CFG.filter(s => consolidado.promedios[s.key]).map(({ key, label }) => {
                  const { equipo: vA, rival: vB } = consolidado.promedios[key];
                  const fmt = v => v.toFixed(1);
                  return (
                    <StatRow key={key} label={label} valA={fmt(vA)} valB={fmt(vB)} />
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
      )}
    </div>
  );
}

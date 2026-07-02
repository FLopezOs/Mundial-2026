import { useState, useEffect, useMemo } from "react";
import Bandera from "./Bandera.jsx";
import CanalesBadges from "./CanalesBadges.jsx";

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

function StatRow({ label, valA, valB }) {
  const parse = s => parseFloat(String(s ?? "0").replace("%","")) || 0;
  const a = parse(valA), b = parse(valB);
  const tot = a + b || 1;
  const pA  = Math.round(a / tot * 100);
  const pB  = 100 - pA;
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

function StatsBlock({ nameA, nameB, stats }) {
  const rows = STATS_CFG.filter(s => stats[s.key]);
  if (!rows.length) return null;
  return (
    <div className="ev2-stats-wrap">
      <div className="ev2-stats-header">
        <span className="ev2-stats-team home">{nameA}</span>
        <span className="ev2-stats-mid">ESTADÍSTICAS</span>
        <span className="ev2-stats-team away">{nameB}</span>
      </div>
      <div className="ev2-stats">
        {rows.map(({ key, label }) => (
          <StatRow key={key} label={label} valA={stats[key]?.A} valB={stats[key]?.B} />
        ))}
      </div>
    </div>
  );
}

function TarjetaHistorial({ partido, statsMap }) {
  const [expandido, setExpandido] = useState(false);
  const { equipoA, equipoB, resultado, fecha, ciudad, canales } = partido;
  const key   = `${equipoA}|${equipoB}`;
  const stats = statsMap?.[key];
  const gA  = resultado?.golesA ?? "—";
  const gB  = resultado?.golesB ?? "—";
  const gAn = Number(gA), gBn = Number(gB);
  const def = resultado?.definidoPor;
  const esPen = def === "PEN" || def === "pen" || def === "penales";
  const esET  = def === "ET" || def === "prorroga";
  const defLabel = esPen ? "Penales" : esET ? "Prórroga" : "90 min";
  const penA = resultado?.penScoreA, penB = resultado?.penScoreB;

  let fechaDisplay = "";
  try {
    const d = new Date(String(fecha) + "T12:00:00");
    fechaDisplay = d.toLocaleDateString("es-CL", { day: "numeric", month: "short" });
  } catch { fechaDisplay = String(fecha); }

  return (
    <div
      className={"ev2-card ended" + (stats ? " ev2-card-clickable" : "")}
      onClick={() => stats && setExpandido(e => !e)}
    >
      <div className="ev2-header">
        <span className="ev2-estado">{defLabel}</span>
        <span className="ev2-venue">{ciudad ? `${ciudad} · ` : ""}{fechaDisplay}</span>
      </div>
      <CanalesBadges canales={canales} />
      <div className="ev2-score-wrap">
        <div className="ev2-team home">
          <Bandera equipo={equipoA} ancho={44} />
          <span className="ev2-team-name">{equipoA}</span>
        </div>
        <div className="ev2-score-center">
          {esPen && penA != null && <span className="ev2-pen-score">({penA})</span>}
          <span className={"ev2-gol" + (gAn > gBn ? " winner" : "")}>{gA}</span>
          <span className="ev2-dash">–</span>
          <span className={"ev2-gol" + (gBn > gAn ? " winner" : "")}>{gB}</span>
          {esPen && penB != null && <span className="ev2-pen-score">({penB})</span>}
        </div>
        <div className="ev2-team away">
          <Bandera equipo={equipoB} ancho={44} />
          <span className="ev2-team-name">{equipoB}</span>
        </div>
      </div>
      {stats && !expandido && (
        <p className="ev2-nodata ev2-ver-stats">📊 Ver estadísticas</p>
      )}
      {stats && expandido && (
        <>
          <StatsBlock nameA={equipoA} nameB={equipoB} stats={stats} />
          <p className="ev2-nodata ev2-ver-stats">▲ Cerrar</p>
        </>
      )}
      {!stats && <p className="ev2-nodata">Sin estadísticas disponibles</p>}
    </div>
  );
}

const SECCION_ORDER = [
  "Grupo A","Grupo B","Grupo C","Grupo D","Grupo E","Grupo F",
  "Grupo G","Grupo H","Grupo I","Grupo J","Grupo K","Grupo L",
  "R32","Octavos","Cuartos","Semis","3er Puesto","Final",
];
const SECCION_LABEL = {
  R32:"Round of 32", Octavos:"Octavos de final", Cuartos:"Cuartos de final",
  Semis:"Semifinales", "3er Puesto":"Tercer puesto", Final:"Final",
};

function Seccion({ id, partidos, statsMap, abierta, onToggle }) {
  const label = SECCION_LABEL[id] ?? id;
  return (
    <div className="ev2-seccion">
      <button className="ev2-seccion-header" onClick={onToggle}>
        <span className="ev2-chevron">{abierta ? "▾" : "▸"}</span>
        <span className="ev2-seccion-titulo">{label}</span>
        <span className="ev2-seccion-count">
          {partidos.length} partido{partidos.length !== 1 ? "s" : ""}
        </span>
      </button>
      {abierta && (
        <div className="ev2-seccion-contenido">
          <div className="ev2-grid">
            {partidos.map(p => (
              <TarjetaHistorial key={p.id} partido={p} statsMap={statsMap} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Historial({ data }) {
  const [statsMap,     setStatsMap]     = useState(null);
  const [abiertas,     setAbiertas]     = useState(new Set());
  const [filtroEquipo, setFiltroEquipo] = useState("");

  useEffect(() => {
    fetch(import.meta.env.BASE_URL + "estadisticas.json")
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setStatsMap(d.partidos))
      .catch(() => {});
  }, []);

  const terminados = useMemo(
    () => (data?.partidos ?? []).filter(p => p.resultado),
    [data]
  );

  const secciones = useMemo(() => {
    const map = {};
    for (const p of terminados) {
      const id = p.fase === "Grupos" ? `Grupo ${p.grupo}` : (p.fase ?? "");
      if (!id) continue;
      if (!map[id]) map[id] = [];
      map[id].push(p);
    }
    for (const arr of Object.values(map)) {
      arr.sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
    }
    return SECCION_ORDER.filter(id => map[id]).map(id => ({ id, partidos: map[id] }));
  }, [terminados]);

  const equipos = useMemo(() => {
    const set = new Set();
    for (const p of terminados) { set.add(p.equipoA); set.add(p.equipoB); }
    return [...set].sort((a, b) => a.localeCompare(b, "es"));
  }, [terminados]);

  useEffect(() => {
    if (!filtroEquipo) {
      setAbiertas(new Set());
    } else {
      setAbiertas(new Set(
        secciones
          .filter(s => s.partidos.some(p => p.equipoA === filtroEquipo || p.equipoB === filtroEquipo))
          .map(s => s.id)
      ));
    }
  }, [filtroEquipo, secciones]);

  const toggleSeccion = id => setAbiertas(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const seccionesVisibles = useMemo(() => {
    if (!filtroEquipo) return secciones;
    return secciones
      .map(s => ({
        ...s,
        partidos: s.partidos.filter(p => p.equipoA === filtroEquipo || p.equipoB === filtroEquipo),
      }))
      .filter(s => s.partidos.length > 0);
  }, [secciones, filtroEquipo]);

  if (!terminados.length) {
    return <div className="ev2-empty"><p className="ev2-empty-msg">Sin partidos jugados todavía.</p></div>;
  }

  return (
    <div className="envivo-vista">
      <div className="ev2-hist-topbar">
        <h3 className="ev2-hist-titulo">Resultados del Mundial ({terminados.length} partidos)</h3>
        <select
          className="ev2-filtro-select"
          value={filtroEquipo}
          onChange={e => setFiltroEquipo(e.target.value)}
        >
          <option value="">Todos los equipos</option>
          {equipos.map(eq => <option key={eq} value={eq}>{eq}</option>)}
        </select>
      </div>

      {filtroEquipo && seccionesVisibles.length === 0 && (
        <p className="ev2-nodata" style={{ padding: "20px 0" }}>
          Sin partidos jugados para {filtroEquipo}.
        </p>
      )}

      {seccionesVisibles.map(({ id, partidos }) => (
        <Seccion
          key={id} id={id} partidos={partidos} statsMap={statsMap}
          abierta={abiertas.has(id)} onToggle={() => toggleSeccion(id)}
        />
      ))}
    </div>
  );
}

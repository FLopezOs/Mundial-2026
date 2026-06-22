import { useState, useEffect } from "react";
import Bandera from "./Bandera.jsx";

const ESPN = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world";

const ESPN_ES = {
  "United States":"Estados Unidos","Ivory Coast":"Costa de Marfil",
  "South Korea":"Corea del Sur","DR Congo":"R.D. Congo",
  "Czechia":"Chequia","Czech Republic":"Chequia",
  "Bosnia and Herzegovina":"Bosnia y Herzegovina",
  "New Zealand":"Nueva Zelanda","Saudi Arabia":"Arabia Saudita",
  "IR Iran":"Irán","Switzerland":"Suiza","Morocco":"Marruecos",
  "Brazil":"Brasil","France":"Francia","Germany":"Alemania",
  "Spain":"España","England":"Inglaterra","Portugal":"Portugal",
  "Argentina":"Argentina","Netherlands":"Países Bajos",
  "Mexico":"México","Japan":"Japón","Senegal":"Senegal",
};
const canon = n => ESPN_ES[n] ?? n;

const esEnVivo = ev => {
  const t = ev.status?.type ?? {};
  return t.state === "in"
    || (t.name ?? "").toUpperCase().includes("IN_PROGRESS")
    || (t.name ?? "").toUpperCase().includes("HALFTIME")
    || (t.name ?? "").toUpperCase().includes("SECOND_HALF")
    || (t.name ?? "").toUpperCase().includes("FIRST_HALF");
};

function mlToProb(ml) {
  if (ml == null) return null;
  const v = parseFloat(ml);
  if (isNaN(v)) return null;
  return v > 0 ? 100 / (v + 100) : (-v) / (-v + 100);
}

/* ── Fila de estadística con barras horizontales ── */
function StatRow({ label, valA, valB }) {
  const parse = s => parseFloat(String(s ?? "0").replace("%","")) || 0;
  const a = parse(valA), b = parse(valB);
  const tot = a + b || 1;
  const pA  = Math.round(a / tot * 100);
  const pB  = 100 - pA;
  const dispA = valA ?? "—";
  const dispB = valB ?? "—";
  return (
    <div className="ev2-stat">
      <span className="ev2-val home">{dispA}</span>
      <div className="ev2-bar-col">
        <div className="ev2-bar-track">
          <div className="ev2-bar-home" style={{ width: pA + "%" }} />
          <div className="ev2-bar-away" style={{ width: pB + "%", marginLeft: "auto" }} />
        </div>
        <span className="ev2-stat-lbl">{label}</span>
      </div>
      <span className="ev2-val away">{dispB}</span>
    </div>
  );
}

/* ── Barra de probabilidades de cuotas ── */
function OddsBar({ nameA, nameB, pA, pX, pB }) {
  const tot = pA + pX + pB;
  const nA = pA/tot, nX = pX/tot, nB = pB/tot;
  const p = v => Math.round(v * 100) + "%";
  return (
    <div className="ev2-odds">
      <div className="ev2-odds-bar">
        <div className="ev2-odds-home" style={{ flex: nA }} title={nameA + " " + p(nA)} />
        <div className="ev2-odds-draw"  style={{ flex: nX }} title={"Empate " + p(nX)} />
        <div className="ev2-odds-away" style={{ flex: nB }} title={nameB + " " + p(nB)} />
      </div>
      <div className="ev2-odds-nums">
        <span className="ev2-odds-lbl-home">{p(nA)} {nameA}</span>
        <span className="ev2-odds-lbl-draw">{p(nX)} X</span>
        <span className="ev2-odds-lbl-away">{nameB} {p(nB)}</span>
      </div>
    </div>
  );
}

const STATS_CFG = [
  { key: "possessionPct",  label: "Posesión"       },
  { key: "totalShots",     label: "Tiros"           },
  { key: "shotsOnTarget",  label: "Al arco"         },
  { key: "saves",          label: "Atajadas"        },
  { key: "cornerKicks",    label: "Córners"         },
  { key: "foulsCommitted", label: "Faltas"          },
  { key: "yellowCards",    label: "Amarillas"       },
  { key: "redCards",       label: "Rojas"           },
  { key: "offsides",       label: "Offside"         },
];

function TarjetaVivo({ ev }) {
  const comp   = ev.competitions[0];
  const teams  = comp.competitors;
  const teamA  = teams.find(t => t.homeAway === "home") ?? teams[0];
  const teamB  = teams.find(t => t.homeAway === "away") ?? teams[1];
  const status = ev.status.type;
  const live   = esEnVivo(ev);
  const final  = status.name?.includes("FINAL");
  const nameA  = canon(teamA.team.displayName);
  const nameB  = canon(teamB.team.displayName);
  const scA    = teamA.score ?? "—";
  const scB    = teamB.score ?? "—";
  const numA   = parseInt(scA) || 0;
  const numB   = parseInt(scB) || 0;

  /* Estadísticas */
  const statsA = {}, statsB = {};
  if (ev.summary?.boxscore?.teams) {
    ev.summary.boxscore.teams.forEach(t => {
      const isA = t.team.id === teamA.team.id;
      (t.statistics ?? []).forEach(s => { (isA ? statsA : statsB)[s.name] = s.displayValue; });
    });
  }
  const statRows = STATS_CFG.filter(s => statsA[s.key] !== undefined || statsB[s.key] !== undefined);

  /* Cuotas en vivo */
  let odds = null;
  const oddsList = comp.odds ?? [];
  const dk = oddsList.find(o => o.provider?.name?.toLowerCase().includes("draftkings")) ?? oddsList[0];
  if (dk) {
    const pA = mlToProb(dk.homeTeamOdds?.moneyLine);
    const pX = mlToProb(dk.drawOdds?.moneyLine ?? dk.drawOdds);
    const pB = mlToProb(dk.awayTeamOdds?.moneyLine);
    if (pA && pB) odds = { pA, pX: pX ?? (1 - pA - pB), pB };
  }

  return (
    <div className={"ev2-card" + (live ? " live" : final ? " ended" : "")}>

      {/* ── Cabecera oscura con estado y sede ── */}
      <div className="ev2-header">
        {live && <span className="ev2-pulse" />}
        <span className="ev2-estado">{status.shortDetail}</span>
        <span className="ev2-venue">{comp.venue?.fullName ?? ""}</span>
      </div>

      {/* ── Marcador principal ── */}
      <div className="ev2-score-wrap">
        <div className="ev2-team home">
          <Bandera equipo={nameA} ancho={44} />
          <span className="ev2-team-name">{nameA}</span>
        </div>

        <div className="ev2-score-center">
          <span className={"ev2-gol" + (numA > numB ? " winner" : "")}>{scA}</span>
          <span className="ev2-dash">–</span>
          <span className={"ev2-gol" + (numB > numA ? " winner" : "")}>{scB}</span>
        </div>

        <div className="ev2-team away">
          <Bandera equipo={nameB} ancho={44} />
          <span className="ev2-team-name">{nameB}</span>
        </div>
      </div>

      {/* ── Cuotas ── */}
      {odds && (
        <div className="ev2-odds-wrap">
          <span className="ev2-odds-title">Cuotas en vivo</span>
          <OddsBar nameA={nameA} nameB={nameB} pA={odds.pA} pX={odds.pX} pB={odds.pB} />
        </div>
      )}

      {/* ── Estadísticas ── */}
      {statRows.length > 0 ? (
        <div className="ev2-stats-wrap">
          <div className="ev2-stats-header">
            <span className="ev2-stats-team home">{nameA}</span>
            <span className="ev2-stats-mid">ESTADÍSTICAS</span>
            <span className="ev2-stats-team away">{nameB}</span>
          </div>
          <div className="ev2-stats">
            {statRows.map(({ key, label }) => (
              <StatRow key={key} label={label} valA={statsA[key]} valB={statsB[key]} />
            ))}
          </div>
        </div>
      ) : live ? (
        <p className="ev2-nodata">Estadísticas llegando…</p>
      ) : null}

    </div>
  );
}

export default function EnVivo() {
  const [eventos,  setEventos]  = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error,    setError]    = useState(null);
  const [ultima,   setUltima]   = useState(null);

  async function cargar() {
    setCargando(true); setError(null);
    try {
      const ahora = new Date();
      const fHoy  = ahora.toISOString().slice(0,10).replace(/-/g,"");
      const fAyer = new Date(ahora - 86400000).toISOString().slice(0,10).replace(/-/g,"");
      const [dH, dA] = await Promise.all([
        fetch(`${ESPN}/scoreboard?dates=${fHoy}`).then(r => r.json()),
        fetch(`${ESPN}/scoreboard?dates=${fAyer}`).then(r => r.json()),
      ]);
      const ids = new Set();
      const todos = [...(dH.events ?? []), ...(dA.events ?? [])].filter(e => {
        if (ids.has(e.id)) return false; ids.add(e.id); return true;
      });
      const conStats = await Promise.all(todos.map(async ev => {
        if (!esEnVivo(ev)) return ev;
        try {
          const rs = await fetch(`${ESPN}/summary?event=${ev.id}`);
          return { ...ev, summary: await rs.json() };
        } catch { return ev; }
      }));
      setEventos(conStats);
      setUltima(new Date().toLocaleTimeString("es-CL", { hour:"2-digit", minute:"2-digit" }));
    } catch(e) { setError(String(e)); }
    finally    { setCargando(false); }
  }

  useEffect(() => { cargar(); }, []);

  const enVivo = eventos?.filter(esEnVivo) ?? [];

  return (
    <div className="envivo-vista">

      {/* ── Barra superior ── */}
      <div className="ev2-topbar">
        <div className="ev2-topbar-left">
          <span className="ev2-topbar-title">
            {enVivo.length > 0
              ? <><span className="ev2-live-count">{enVivo.length}</span> partido{enVivo.length > 1 ? "s" : ""} en vivo</>
              : "En Vivo"}
          </span>
          {ultima && <span className="ev2-topbar-time">Actualizado {ultima}</span>}
        </div>
        <button className="btn-accion" onClick={cargar} disabled={cargando}>
          {cargando ? "⏳ Actualizando…" : "🔄 Actualizar"}
        </button>
      </div>

      {error && (
        <div className="ev2-error">⚠️ Sin conexión con ESPN: {error}</div>
      )}

      {cargando && !eventos && (
        <div className="ev2-skeleton">
          <div className="ev2-skel-card" /><div className="ev2-skel-card" />
        </div>
      )}

      {!cargando && eventos && enVivo.length === 0 && (
        <div className="ev2-empty">
          <div className="ev2-empty-icon">⏸</div>
          <p className="ev2-empty-msg">Sin partidos en vivo ahora mismo</p>
          <p className="ev2-empty-sub">Actualiza cuando comience el próximo partido</p>
        </div>
      )}

      {enVivo.length > 0 && (
        <div className="ev2-grid">
          {enVivo.map(ev => <TarjetaVivo key={ev.id} ev={ev} />)}
        </div>
      )}
    </div>
  );
}

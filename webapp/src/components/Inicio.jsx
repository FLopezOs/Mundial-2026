import { useState, useRef, useEffect, useMemo } from "react";
import Bandera from "./Bandera.jsx";
import { fmtPct } from "../lib/calculos.js";
import CanalesBadges from "./CanalesBadges.jsx";

function fechaChile() {
  // Usar IANA timezone para no depender de la zona horaria del browser
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Santiago" });
}
function offsetFecha(base, dias) {
  const d = new Date(base + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}
function diaSemana(fecha) {
  const d = new Date(fecha + "T12:00:00Z");
  return d.toLocaleDateString("es-CL", { weekday: "long", month: "short", day: "numeric", timeZone: "UTC" });
}

function FilaProb({ label, labelClass, pA, pX, pB, mlA, mlX, mlB }) {
  return (
    <div className="tp-probs-row">
      <span className={"tp-probs-lbl " + labelClass}>{label}</span>
      <div className="tp-bars-wrap">
        <div className="tp-empate-bar">
          <div className="bar-a" style={{ flex: pA }} />
          <div className="bar-x" style={{ flex: pX }} />
          <div className="bar-b" style={{ flex: pB }} />
        </div>
        <div className="tp-prob-labels">
          <span className="tpl-a" title={mlA ? "ML " + mlA : ""}>{fmtPct(pA, 0)}</span>
          <span className="tpl-x" title={mlX ? "ML " + mlX : ""}>{fmtPct(pX, 0)} X</span>
          <span className="tpl-b" title={mlB ? "ML " + mlB : ""}>{fmtPct(pB, 0)}</span>
        </div>
      </div>
    </div>
  );
}

function Escudo({ p, probs, liveTeams, hoy, ayer }) {
  const pr = probs?.[p.id];
  const ga = p.resultado?.golesA, gb = p.resultado?.golesB;
  const pen = p.resultado?.definidoPor === "pen" || p.resultado?.definidoPor === "PEN";
  const penGanador = p.resultado?.ganadorPenales;
  const jugado = p.resultado != null;

  // Solo marcar como vivo si el partido es HOY o AYER (nunca fechas futuras)
  const fechaElegible = p.fecha === hoy || p.fecha === ayer;
  const isLive = !jugado && fechaElegible && liveTeams &&
    (liveTeams.has(p.equipoA) || liveTeams.has(p.equipoB));

  return (
    <div className={"tarjeta-partido" + (jugado ? " jugado" : "") + (isLive ? " en-vivo-card" : "")}>
      <div className="tp-meta">
        <span className="tp-hora">{p.horaChile ?? "—:—"}</span>
        <span className="tp-fase">{p.fase === "Grupos" ? "Grupo " + p.grupo : p.fase}</span>
        <span className="tp-ciudad">{p.ciudad}</span>
        {isLive && <span className="live-badge-inline">EN VIVO</span>}
      </div>
      <div className="tp-equipos">
        <div className={"tp-equipo" + (jugado && (ga > gb || penGanador === p.equipoA) ? " ganador" : "")}>
          <Bandera equipo={p.equipoA} ancho={28} />
          <span>{p.equipoA}</span>
        </div>
        {jugado
          ? <div className="tp-score-wrap">
              <div className="tp-score">{ga} — {gb}</div>
              {pen && <div className="tp-pen-lbl">pen · gana {penGanador ?? "—"}</div>}
            </div>
          : <div className="tp-vs">VS</div>}
        <div className={"tp-equipo der" + (jugado && (gb > ga || penGanador === p.equipoB) ? " ganador" : "")}>
          <Bandera equipo={p.equipoB} ancho={28} />
          <span>{p.equipoB}</span>
        </div>
      </div>
      {pr && !jugado && (
        <div className="tp-probs">
          <FilaProb label={pr.sinMercado ? "ELO" : "ELO+M"} labelClass="modelo"
            pA={pr.pGanaA} pX={pr.pEmpate} pB={pr.pGanaB} />
          {pr.sinMercado && <p className="tp-sin-mercado">sin cuotas aún</p>}
        </div>
      )}
      {!jugado && pr?.marcadorProbable && (
        <div className="tp-marcador-prob">
          Más probable: <strong>{pr.marcadorProbable}</strong>
          {pr.pMarcador != null && <> · {fmtPct(pr.pMarcador, 0)}</>}
        </div>
      )}
      <CanalesBadges canales={p.canales} />
    </div>
  );
}

function SeccionDia({ titulo, partidos, probs, liveTeams, hoy, ayer }) {
  if (!partidos?.length) return null;
  return (
    <div className="seccion-dia">
      <h2 className="sec-titulo">{titulo}</h2>
      <div className="grilla-partidos">
        {partidos.map(p => (
          <Escudo key={p.id} p={p} probs={probs} liveTeams={liveTeams} hoy={hoy} ayer={ayer} />
        ))}
      </div>
    </div>
  );
}

export default function Inicio({ data, picks, calc, setVista, probsLive: probs, liveTeams }) {
  const hoy    = fechaChile();
  const ayer   = offsetFecha(hoy, -1);
  const manana = offsetFecha(hoy, 1);

  const fechas = useMemo(
    () => [...new Set(data.partidos.map(p => p.fecha))].sort(),
    [data]
  );
  const diaDefault = fechas.includes(hoy)
    ? hoy : (fechas.find(f => f >= hoy) ?? fechas[fechas.length - 1] ?? hoy);
  const [diaSeleccionado, setDiaSeleccionado] = useState(diaDefault);

  const stripRef  = useRef(null);
  const activoRef = useRef(null);
  useEffect(() => {
    activoRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, []);

  function labelFecha(f) {
    if (f === ayer)   return "Ayer";
    if (f === hoy)    return "Hoy";
    if (f === manana) return "Mañana";
    return new Date(f + "T12:00:00Z").toLocaleDateString("es-CL", { day:"numeric", month:"short", timeZone:"UTC" });
  }

  const jugados    = data.partidos.filter(p => p.resultado);
  const pendientes = data.partidos.filter(p => !p.resultado);
  const partidosDia = data.partidos.filter(p => p.fecha === diaSeleccionado);
  const totalGoles = jugados.reduce((s, p) => s + p.resultado.golesA + p.resultado.golesB, 0);
  const promGoles  = jugados.length ? (totalGoles / jugados.length).toFixed(2) : "—";

  return (
    <div className="inicio">
      <div className="stats-bar">
        <div className="stat-item"><span className="stat-val">{jugados.length}</span><span className="stat-lbl">jugados</span></div>
        <div className="stat-item"><span className="stat-val">{pendientes.length}</span><span className="stat-lbl">por jugar</span></div>
        <div className="stat-item"><span className="stat-val">{totalGoles}</span><span className="stat-lbl">goles totales</span></div>
        <div className="stat-item"><span className="stat-val">{promGoles}</span><span className="stat-lbl">goles/partido</span></div>
        {calc.bracket?.campeon && (
          <div className="stat-item campeon-stat">
            <span className="stat-val">🏆</span>
            <span className="stat-lbl">Tu campeón: <strong>{calc.bracket.campeon}</strong></span>
          </div>
        )}
      </div>

      <div className="acciones-inicio">
        <button className="btn-accion btn-principal" onClick={() => setVista("Grupos")}>✏️ Ingresar / ver resultados</button>
        <button className="btn-accion" onClick={() => setVista("Bracket")}>🏆 Ver bracket</button>
        <button className="btn-accion" onClick={() => setVista("En Vivo")}>⚡ Ver en vivo</button>
        <button className="btn-accion" onClick={() => setVista("Resumen")}>📊 Mi resumen</button>
      </div>

      {/* Selector de fechas */}
      <div className="fecha-strip" ref={stripRef}>
        {fechas.map(f => {
          const total = data.partidos.filter(p => p.fecha === f).length;
          const jug   = data.partidos.filter(p => p.fecha === f && p.resultado).length;
          // Punto rojo en chip solo si hay partido vivo HOY/AYER en esa fecha
          const hasLive = liveTeams && (f === hoy || f === ayer) &&
            data.partidos.filter(p => p.fecha === f).some(
              p => !p.resultado && (liveTeams.has(p.equipoA) || liveTeams.has(p.equipoB))
            );
          const isActive = f === diaSeleccionado;
          return (
            <button key={f} ref={isActive ? activoRef : null}
              className={"fecha-chip" + (isActive ? " activa" : "") + (f < hoy ? " pasada" : "") + (f === hoy ? " es-hoy" : "")}
              onClick={() => setDiaSeleccionado(f)}>
              <span className="chip-lbl">{labelFecha(f)}{hasLive ? " 🔴" : ""}</span>
              <span className="chip-cnt">{jug}/{total}{jug === total && jug > 0 ? " ✓" : ""}</span>
            </button>
          );
        })}
      </div>

      {/* Partidos del día seleccionado */}
      {partidosDia.length > 0
        ? <SeccionDia
            titulo={"📅 " + (diaSeleccionado === hoy ? "Hoy · " : "") + diaSemana(diaSeleccionado)}
            partidos={partidosDia}
            probs={probs}
            liveTeams={liveTeams}
            hoy={hoy}
            ayer={ayer}
          />
        : <div className="seccion-dia vacia"><p className="ayuda">No hay partidos el {diaSemana(diaSeleccionado)}.</p></div>
      }

      <p className="nota inicio-nota">Probabilidades con Elo en cadena + Poisson. Actualiza con <kbd>actualizar_resultados.bat</kbd>.</p>
    </div>
  );
}

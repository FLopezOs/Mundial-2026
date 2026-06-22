import { fmtPct, puntajePartido } from "../lib/calculos.js";
import Bandera from "./Bandera.jsx";

function Partido({ p, picks, setPicks, probsLive }) {
  const real = !!p.resultado;
  const s = picks.scores?.[p.id] ?? {};
  const cambiar = (campo, val) => {
    const n = val === "" ? null : Math.max(0, Math.min(20, parseInt(val, 10)));
    const scores = { ...picks.scores, [p.id]: { ...s, [campo]: Number.isInteger(n) ? n : null } };
    setPicks({ ...picks, scores });
  };
  let badge = null, ptsBadge = null;
  if (real && Number.isInteger(s.ga) && Number.isInteger(s.gb)) {
    const ok1x2 = Math.sign(s.ga - s.gb) === Math.sign(p.resultado.golesA - p.resultado.golesB);
    const exacto = s.ga === p.resultado.golesA && s.gb === p.resultado.golesB;
    badge = exacto ? <span className="badge exacto">🎯 exacto</span>
      : ok1x2 ? <span className="badge ok">✓ 1X2</span>
      : <span className="badge mal">✗ fallado</span>;
    const { pts } = puntajePartido(s, p.resultado);
    ptsBadge = <span className={`badge pts-badge pts-${pts}`}>+{pts}</span>;
  }
  // Probabilidades: usa Elo en cadena (live) si disponible, si no el modelo estático del Tracker
  const pr = probsLive?.[p.id] ?? p.modelo;
  const esLive = !!probsLive?.[p.id];

  return (
    <div className={"partido" + (real ? " jugado" : "")}>
      <div className="fila-partido">
        <span className="equipo a">{p.equipoA} <Bandera equipo={p.equipoA} /></span>
        {real ? (
          <span className="marcador-real">{p.resultado.golesA} – {p.resultado.golesB}</span>
        ) : (
          <span className="inputs">
            <input type="number" inputMode="numeric" min="0" max="20"
              value={s.ga ?? ""} onChange={e => cambiar("ga", e.target.value)}
              aria-label={`Goles ${p.equipoA}`} />
            <span>–</span>
            <input type="number" inputMode="numeric" min="0" max="20"
              value={s.gb ?? ""} onChange={e => cambiar("gb", e.target.value)}
              aria-label={`Goles ${p.equipoB}`} />
          </span>
        )}
        <span className="equipo b"><Bandera equipo={p.equipoB} /> {p.equipoB}</span>
      </div>
      <div className="meta-partido">
        <span>{p.fecha}{p.horaChile ? ` · ${p.horaChile} CL` : ""} · {p.ciudad}</span>
        {pr && (
          <span className={"modelo" + (esLive ? " live" : "")}>
            {esLive ? "⚡" : "📊"} {fmtPct(pr.pGanaA ?? pr.pGanaA, 0)}/{fmtPct(pr.pEmpate, 0)}/{fmtPct(pr.pGanaB ?? pr.pGanaB, 0)}
            {pr?.marcadorProbable && !real ? ` · ${pr.marcadorProbable}` : ""}
            {esLive && <span className="live-tag">{pr.sinMercado ? "Elo" : "Elo+M"}</span>}
          </span>
        )}
        {real && <span className="modelo">oficial{p.resultado.definidoPor !== "90" ? ` (${p.resultado.definidoPor})` : ""}</span>}
        {!real && p.oddsImplied && (
          <span className="modelo casas-tag">
            🎰 {fmtPct(p.oddsImplied.pGanaA, 0)}/{fmtPct(p.oddsImplied.pEmpate, 0)}/{fmtPct(p.oddsImplied.pGanaB, 0)}
            <span className="live-tag" style={{background:"#7c3aed"}}>DK</span>
          </span>
        )}
        {badge}{ptsBadge}
        {real && Number.isInteger(s.ga) && <span className="mi-pick">mi pick: {s.ga}-{s.gb}</span>}
      </div>
    </div>
  );
}

function TablaGrupo({ g }) {
  return (
    <table className="tabla">
      <thead><tr><th></th><th className="izq">Equipo</th><th>PJ</th><th>DG</th><th>GF</th><th>Pts</th></tr></thead>
      <tbody>
        {g.equipos.map((e, i) => (
          <tr key={e.nombre} className={i < 2 ? "clasifica" : i === 2 ? "tercero" : ""}>
            <td>{i + 1}</td>
            <td className="izq"><Bandera equipo={e.nombre} ancho={16} /> {e.nombre}</td>
            <td>{e.pj}</td>
            <td>{e.dg > 0 ? "+" + e.dg : e.dg}</td>
            <td>{e.gf}</td>
            <td><strong>{e.pts}</strong></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function Grupos({ data, picks, setPicks, calc, probsLive }) {
  const letras = Object.keys(calc.grupos).sort();
  const pendientes = data.partidos.filter(
    p => p.grupo && !p.resultado && !Number.isInteger(picks.scores?.[p.id]?.ga)
  ).length;
  return (
    <div>
      <p className="ayuda">
        Ingresa tu marcador ({pendientes} sin pick). ⚡ = probabilidad con Elo actualizado a resultados reales.
        Verde = clasifica directo · Amarillo = tercero (pasan 8 mejores).
      </p>
      <div className="grilla-grupos">
        {letras.map(l => (
          <section key={l} className="grupo">
            <h2>Grupo {l} {calc.grupos[l].completo && <span className="badge ok">completo</span>}</h2>
            {calc.grupos[l].partidos.map(p => (
              <Partido key={p.id} p={p} picks={picks} setPicks={setPicks} probsLive={probsLive} />
            ))}
            <TablaGrupo g={calc.grupos[l]} />
          </section>
        ))}
      </div>
      <section className="terceros">
        <h2>Ranking de terceros (clasifican 8)</h2>
        <table className="tabla">
          <thead><tr><th>#</th><th className="izq">Equipo</th><th>Grupo</th><th>Pts</th><th>DG</th><th>GF</th><th></th></tr></thead>
          <tbody>
            {calc.terceros.map(t => (
              <tr key={t.grupo} className={t.clasifica ? "clasifica" : ""}>
                <td>{t.rank}</td>
                <td className="izq">{t.nombre ? <><Bandera equipo={t.nombre} ancho={16} /> {t.nombre}</> : "—"}</td>
                <td>{t.grupo}</td><td>{t.pts}</td>
                <td>{t.dg > 0 ? "+" + t.dg : t.dg}</td><td>{t.gf}</td>
                <td>{t.clasifica ? "✓" : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

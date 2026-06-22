import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { comparativoModelo, fmtPct, ORDEN_FASES } from "../lib/calculos.js";
import { generarHtml } from "../lib/exportHtml.js";
import Bandera from "./Bandera.jsx";

const TITULOS = { R32: "Dieciseisavos", Octavos: "Octavos", Cuartos: "Cuartos", Semis: "Semifinales", "3er Puesto": "3er Puesto", Final: "Final" };

function unoEntre(p) {
  if (!p || p <= 0) return "—";
  const n = 1 / p;
  if (n < 1000) return `≈ 1 entre ${Math.round(n)}`;
  if (n < 1e6) return `≈ 1 entre ${(n / 1000).toFixed(1)} mil`;
  return `≈ 1 entre ${(n / 1e6).toFixed(1)} millones`;
}

export default function Resumen({ data, picks, calc, escenario }) {
  const ref = useRef(null);
  const imprimir = useReactToPrint({
    content: () => ref.current,
    documentTitle: `Polla_Mundial2026_${escenario.replace(/\W+/g, "_")}_${new Date().toISOString().slice(0, 10)}`,
  });
  const comp = comparativoModelo(data, picks);
  const fecha = new Date().toISOString().slice(0, 10);

  const descargarHtml = () => {
    const html = generarHtml({ data, calc, comp, escenario, fecha });
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `Polla_Mundial2026_${escenario.replace(/\W+/g, "_")}_${fecha}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const { llaves, campeon, subcampeon } = calc.bracket;
  return (
    <div>
      <div className="acciones no-imprimir">
        <button onClick={descargarHtml}>Descargar HTML</button>
        <button onClick={imprimir}>Descargar PDF</button>
      </div>
      <div ref={ref} className="hoja-resumen">
        <h2>Polla Mundial 2026 — {escenario} <span className="sub">({fecha})</span></h2>
        {campeon
          ? <div className="campeon">🏆 Campeón: <strong><Bandera equipo={campeon} /> {campeon}</strong> · Subcampeón: <Bandera equipo={subcampeon} ancho={16} /> {subcampeon}</div>
          : <div className="ayuda">Bracket incompleto: faltan picks para llegar al campeón.</div>}

        <h3>Mis picks vs. modelo</h3>
        <p className="comparativo">
          Coincido con el favorito del modelo en <strong>{comp.coincidencias}/{comp.total}</strong> partidos pronosticados (1X2).
          Probabilidad conjunta aproximada de mi combinación de grupos: <strong>{comp.probConjunta ? fmtPct(comp.probConjunta, comp.probConjunta < 0.001 ? 4 : 2) : "—"}</strong> {comp.probConjunta ? `(${unoEntre(comp.probConjunta)})` : ""}.
          <span className="nota"> Aproximación: producto de probabilidades 1X2 del modelo, asume independencia.</span>
        </p>

        <h3>Tablas finales de grupos (reales + mis picks)</h3>
        <div className="grilla-resumen">
          {Object.keys(calc.grupos).sort().map(l => (
            <table key={l} className="tabla compacta">
              <thead><tr><th colSpan="5" className="izq">Grupo {l}{!calc.grupos[l].completo && " (incompleto)"}</th></tr>
                <tr><th className="izq">Equipo</th><th>PJ</th><th>DG</th><th>Pts</th><th></th></tr></thead>
              <tbody>
                {calc.grupos[l].equipos.map((e, i) => (
                  <tr key={e.nombre} className={i < 2 ? "clasifica" : i === 2 ? "tercero" : ""}>
                    <td className="izq"><Bandera equipo={e.nombre} ancho={14} /> {e.nombre}</td><td>{e.pj}</td><td>{e.dg > 0 ? "+" + e.dg : e.dg}</td><td><strong>{e.pts}</strong></td>
                    <td>{i < 2 ? "✓" : i === 2 && calc.terceros.find(t => t.grupo === l)?.clasifica ? "3°✓" : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}
        </div>

        <h3>Bracket</h3>
        <div className="bracket bracket-impresion">
          {ORDEN_FASES.map(f => (
            <div key={f} className="ronda">
              <h4>{TITULOS[f]}</h4>
              {llaves.filter(l => l.fase === f).map(l => (
                <div key={l.numFifa} className="llave-mini">
                  <span className={l.ganador === l.a ? "gana" : ""}>{l.a ? <><Bandera equipo={l.a} ancho={13} /> {l.a}</> : "—"}</span>
                  <span className="vs">v</span>
                  <span className={l.ganador === l.b ? "gana" : ""}>{l.b ? <><Bandera equipo={l.b} ancho={13} /> {l.b}</> : "—"}</span>
                  {l.pen && <span className="badge pen">pen</span>}
                  {l.definicion === "real" && <span className="badge ok">of.</span>}
                </div>
              ))}
            </div>
          ))}
        </div>
        <p className="nota">Generado por Polla Mundial 2026 (datos del Tracker, {data.generado}). Modelo Elo+Poisson solo como referencia.</p>
      </div>
    </div>
  );
}

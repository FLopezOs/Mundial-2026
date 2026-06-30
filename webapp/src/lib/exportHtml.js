// exportHtml.js — HTML autocontenido (estilos inline, sin dependencias) para descargar.
import { ORDEN_FASES, fmtPct } from "./calculos.js";
import { emojiDe } from "../components/Bandera.jsx";

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const TITULOS = { R32: "Dieciseisavos", Octavos: "Octavos", Cuartos: "Cuartos", Semis: "Semifinales", "3er Puesto": "3er Puesto", Final: "Final" };

export function generarHtml({ data, calc, comp, escenario, fecha }) {
  const { grupos, terceros, bracket } = calc;
  const tg = Object.keys(grupos).sort().map(l => `
    <table><tr><th colspan="5" style="text-align:left">Grupo ${l}${grupos[l].completo ? "" : " (incompleto)"}</th></tr>
    <tr><th style="text-align:left">Equipo</th><th>PJ</th><th>DG</th><th>Pts</th><th></th></tr>
    ${grupos[l].equipos.map((e, i) => `<tr style="background:${i < 2 ? "#e8f5e9" : i === 2 ? "#fff8e1" : "#fff"}">
      <td style="text-align:left">${emojiDe(e.nombre)} ${esc(e.nombre)}</td><td>${e.pj}</td><td>${e.dg > 0 ? "+" + e.dg : e.dg}</td><td><b>${e.pts}</b></td>
      <td>${i < 2 ? "✓" : i === 2 && terceros.find(t => t.grupo === l)?.clasifica ? "3°✓" : ""}</td></tr>`).join("")}
    </table>`).join("");
  const br = ORDEN_FASES.map(f => `
    <div style="min-width:150px">
      <h4 style="margin:4px 0;font-size:12px">${TITULOS[f]}</h4>
      ${bracket.llaves.filter(l => l.fase === f).map(l => `
        <div style="border:1px solid #ccc;border-radius:6px;padding:4px 6px;margin:4px 0;font-size:11px">
          <div style="${l.ganador === l.a ? "font-weight:bold" : ""}">${l.a ? emojiDe(l.a) + " " : ""}${esc(l.a ?? "—")}</div>
          <div style="${l.ganador === l.b ? "font-weight:bold" : ""}">${l.b ? emojiDe(l.b) + " " : ""}${esc(l.b ?? "—")}</div>
          ${l.pen ? '<div style="color:#b26a00;font-size:10px">penales</div>' : ""}${l.definicion === "real" ? '<div style="color:#2e7d32;font-size:10px">oficial</div>' : ""}
        </div>`).join("")}
    </div>`).join("");
  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
<title>Seguimiento Mundial 2026 — ${esc(escenario)}</title>
<style>body{font-family:system-ui,Arial,sans-serif;margin:24px;color:#1a1a2e}
table{border-collapse:collapse;margin:6px;font-size:12px;display:inline-table;vertical-align:top}
td,th{border:1px solid #ddd;padding:3px 8px;text-align:center}h1{font-size:20px}</style></head><body>
<h1>⚽ Seguimiento Mundial 2026 — ${esc(escenario)} <small>(${fecha})</small></h1>
${bracket.campeon ? `<p style="font-size:16px">🏆 Campeón: <b>${emojiDe(bracket.campeon)} ${esc(bracket.campeon)}</b> · Subcampeón: ${esc(bracket.subcampeon)}</p>` : "<p><i>Bracket incompleto.</i></p>"}
<p>Coincido con el favorito del modelo en <b>${comp.coincidencias}/${comp.total}</b> partidos.
Probabilidad conjunta aproximada (grupos): <b>${comp.probConjunta ? fmtPct(comp.probConjunta, comp.probConjunta < 0.001 ? 4 : 2) : "—"}</b>.</p>
<h3>Tablas finales de grupos</h3>${tg}
<h3>Bracket</h3><div style="display:flex;gap:8px;overflow-x:auto">${br}</div>
<p style="color:#888;font-size:11px">Datos del Tracker (${esc(data.generado)}). Modelo Elo+Poisson como referencia; no incorpora lesiones ni alineaciones.</p>
</body></html>`;
}

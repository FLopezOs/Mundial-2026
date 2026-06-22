// calculos.js — lógica pura del simulador (sin React).
// Regla dura: el resultado real SIEMPRE prevalece sobre el pick.

export function resultadoPartido(p, picks) {
  if (p.resultado) {
    return { ga: p.resultado.golesA, gb: p.resultado.golesB, real: true,
             pen: p.resultado.definidoPor === "PEN", ganadorPenales: p.resultado.ganadorPenales };
  }
  const s = picks?.scores?.[p.id];
  if (s && Number.isInteger(s.ga) && Number.isInteger(s.gb)) {
    return { ga: s.ga, gb: s.gb, real: false };
  }
  return null;
}

export function signo(ga, gb) { return ga > gb ? "A" : ga < gb ? "B" : "X"; }

// ---------- fase de grupos ----------
export function calcularGrupos(data, picks) {
  const grupos = {};
  for (const p of data.partidos) {
    if (!p.grupo) continue;
    grupos[p.grupo] ??= { partidos: [], tabla: {} };
    grupos[p.grupo].partidos.push(p);
    for (const t of [p.equipoA, p.equipoB]) {
      grupos[p.grupo].tabla[t] ??= { nombre: t, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0 };
    }
  }
  for (const g of Object.values(grupos)) {
    let resueltos = 0;
    for (const p of g.partidos) {
      const r = resultadoPartido(p, picks);
      if (!r) continue;
      resueltos++;
      const A = g.tabla[p.equipoA], B = g.tabla[p.equipoB];
      A.pj++; B.pj++; A.gf += r.ga; A.gc += r.gb; B.gf += r.gb; B.gc += r.ga;
      if (r.ga > r.gb) { A.pg++; B.pp++; }
      else if (r.ga < r.gb) { B.pg++; A.pp++; }
      else { A.pe++; B.pe++; }
    }
    g.completo = resueltos === g.partidos.length;
    g.equipos = Object.values(g.tabla).map(t => ({
      ...t, dg: t.gf - t.gc, pts: 3 * t.pg + t.pe,
    })).sort((a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf || a.nombre.localeCompare(b.nombre));
  }
  return grupos;
}

export function calcularTerceros(grupos) {
  const ts = Object.keys(grupos).sort().map(letra => {
    const e = grupos[letra].equipos[2];
    return { grupo: letra, ...e, completo: grupos[letra].completo };
  });
  ts.sort((a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf || a.nombre.localeCompare(b.nombre));
  ts.forEach((t, i) => { t.rank = i + 1; t.clasifica = i < 8; });
  return ts;
}

// ---------- bracket ----------
const RE_POS = /^[12][A-L]$/, RE_WL = /^([WL])(\d+)$/;

export function resolverBracket(data, picks, grupos, terceros) {
  const todosCompletos = Object.values(grupos).every(g => g.completo);
  const ko = data.partidos.filter(p => p.numFifa).sort((a, b) => a.numFifa - b.numFifa);
  const porNum = {}, usados3 = new Set(), llaves = [];

  const resolverCodigo = (code) => {
    // si el data.json ya trae el nombre real (json oficial actualizado), úsalo
    if (!RE_POS.test(code) && !code.startsWith("3") && !RE_WL.test(code)) return code;
    if (RE_POS.test(code)) {
      const g = grupos[code[1]];
      return g?.completo ? g.equipos[+code[0] - 1].nombre : null;
    }
    if (code.startsWith("3")) {
      if (!todosCompletos) return null;
      const letras = code.slice(1).split("/");
      const elegibles = terceros.filter(t => t.clasifica && !usados3.has(t.grupo));
      const cand = elegibles.find(t => letras.includes(t.grupo)) ?? elegibles[0];
      if (!cand) return null;
      usados3.add(cand.grupo);
      return cand.nombre;
    }
    const m = code.match(RE_WL);
    const prev = porNum[+m[2]];
    return m[1] === "W" ? prev?.ganador ?? null : prev?.perdedor ?? null;
  };

  for (const p of ko) {
    const a = resolverCodigo(p.equipoA), b = resolverCodigo(p.equipoB);
    const llave = { ...p, a, b, ganador: null, perdedor: null, definicion: null, pen: false };
    const r = p.resultado ? resultadoPartido(p, picks) : null;
    if (r && a && b) {
      llave.definicion = "real";
      llave.pen = r.pen;
      if (r.ga > r.gb) [llave.ganador, llave.perdedor] = [a, b];
      else if (r.ga < r.gb) [llave.ganador, llave.perdedor] = [b, a];
      else {
        llave.ganador = r.ganadorPenales === b ? b : a;
        llave.perdedor = llave.ganador === a ? b : a;
      }
    } else if (a && b) {
      const pk = picks?.ko?.[p.numFifa];
      if (pk && (pk.ganador === a || pk.ganador === b)) {
        llave.definicion = "pick";
        llave.ganador = pk.ganador;
        llave.perdedor = pk.ganador === a ? b : a;
        llave.pen = !!pk.pen;
      }
    }
    porNum[p.numFifa] = llave;
    llaves.push(llave);
  }
  const final = llaves.find(l => l.fase === "Final");
  return { llaves, campeon: final?.ganador ?? null, subcampeon: final?.perdedor ?? null };
}

// ---------- marcador de aciertos ----------
export function calcularAciertos(data, picks) {
  let conPick = 0, ok1x2 = 0, exactos = 0;
  for (const p of data.partidos) {
    if (!p.resultado) continue;
    const s = picks?.scores?.[p.id];
    if (s && Number.isInteger(s.ga) && Number.isInteger(s.gb)) {
      conPick++;
      if (signo(s.ga, s.gb) === signo(p.resultado.golesA, p.resultado.golesB)) ok1x2++;
      if (s.ga === p.resultado.golesA && s.gb === p.resultado.golesB) exactos++;
    }
    const pk = picks?.ko?.[p.numFifa];
    if (pk?.ganador && p.numFifa) {
      const r = p.resultado;
      const real = r.golesA > r.golesB ? p.equipoA : r.golesA < r.golesB ? p.equipoB : r.ganadorPenales;
      conPick++;
      if (pk.ganador === real) ok1x2++;
    }
  }
  return { conPick, ok1x2, exactos };
}

// ---------- comparativo vs modelo ----------
export function comparativoModelo(data, picks) {
  let total = 0, coincidencias = 0, probConjunta = 1;
  for (const p of data.partidos) {
    if (!p.modelo || p.resultado) continue;
    const s = picks?.scores?.[p.id];
    if (!s || !Number.isInteger(s.ga) || !Number.isInteger(s.gb)) continue;
    total++;
    const mio = signo(s.ga, s.gb);
    const probs = { A: p.modelo.pGanaA, X: p.modelo.pEmpate, B: p.modelo.pGanaB };
    const fav = Object.keys(probs).reduce((x, y) => (probs[y] > probs[x] ? y : x));
    if (mio === fav) coincidencias++;
    probConjunta *= probs[mio];
  }
  return { total, coincidencias, probConjunta: total ? probConjunta : null };
}

export const fmtPct = (x, d = 0) => x == null ? "—" : (100 * x).toFixed(d) + "%";
export const ORDEN_FASES = ["R32", "Octavos", "Cuartos", "Semis", "3er Puesto", "Final"];

// ========== RECÁLCULO ELO + POISSON EN TIEMPO REAL ==========

function multGoles(gd) {
  const d = Math.abs(gd);
  if (d <= 1) return 1.0;
  if (d === 2) return 1.5;
  if (d === 3) return 1.75;
  return 1.75 + (d - 3) / 8.0;
}

function eloExpect(eloA, eloB) {
  return 1.0 / (1.0 + Math.pow(10, -(eloA - eloB) / 400.0));
}

function poissonPMF(lambda, k) {
  // P(X = k) con lambda; usa logaritmos para evitar overflow
  if (k < 0) return 0;
  let logP = k * Math.log(lambda) - lambda;
  for (let i = 1; i <= k; i++) logP -= Math.log(i);
  return Math.exp(logP);
}

function probsPoisson(lambdaA, lambdaB, maxG = 9) {
  let pA = 0, pX = 0, pB = 0;
  for (let i = 0; i <= maxG; i++) {
    const pa = poissonPMF(lambdaA, i);
    for (let j = 0; j <= maxG; j++) {
      const pb = poissonPMF(lambdaB, j);
      const p = pa * pb;
      if      (i > j) pA += p;
      else if (i === j) pX += p;
      else    pB += p;
    }
  }
  return { pGanaA: pA, pEmpate: pX, pGanaB: pB };
}

function mejorMarcador(lambdaA, lambdaB, maxG = 7) {
  let bestP = -1, bestA = 0, bestB = 0;
  for (let a = 0; a <= maxG; a++) {
    const pa = poissonPMF(lambdaA, a);
    for (let b = 0; b <= maxG; b++) {
      const p = pa * poissonPMF(lambdaB, b);
      if (p > bestP) { bestP = p; bestA = a; bestB = b; }
    }
  }
  return { marcadorProbable: `${bestA}-${bestB}`, pMarcador: +bestP.toFixed(4) };
}

/**
 * Recalcula probabilidades de todos los partidos usando Elo en cadena + Poisson.
 * Procesa resultados reales (data.partidos[i].resultado) y picks del usuario en orden numFifa.
 * @returns {Object} { [numFifa]: { pGanaA, pEmpate, pGanaB, lambdaA, lambdaB } }
 */
export function recalcularProbs(data, picks) {
  if (!data?.calibracion) return {};
  const { mu, beta, equipos: calEq } = data.calibracion;

  // Elo inicial
  const elo = {};
  for (const eq of data.equipos) elo[eq.nombre] = eq.eloInicial;

  const sorted = [...data.partidos].sort((a, b) => a.numFifa - b.numFifa);
  const result = {};

  for (const p of sorted) {
    const ea = p.equipoA, eb = p.equipoB;
    const eloA = elo[ea], eloB = elo[eb];

    // Solo calculamos probs si conocemos el Elo de ambos equipos
    if (eloA != null && eloB != null) {
      const dr = eloA - eloB;  // neutral — sin ventaja de localía
      const lH = (mu + beta * dr) / 2;
      const lA = (mu - beta * dr) / 2;
      const attA = calEq[ea]?.att ?? 1.0, defA = calEq[ea]?.def ?? 1.0;
      const attB = calEq[eb]?.att ?? 1.0, defB = calEq[eb]?.def ?? 1.0;
      const lambdaA = Math.max(0.3, lH * attA * defB);
      const lambdaB = Math.max(0.3, lA * attB * defA);
      result[p.id] = { ...probsPoisson(lambdaA, lambdaB), ...mejorMarcador(lambdaA, lambdaB), lambdaA, lambdaB };
    }

    // Actualizar Elo con resultado conocido (real > pick)
    let gA = null, gB = null;
    if (p.resultado) {
      gA = p.resultado.golesA; gB = p.resultado.golesB;
    } else {
      const s = picks?.scores?.[p.id];
      if (s && Number.isInteger(s.ga) && Number.isInteger(s.gb)) { gA = s.ga; gB = s.gb; }
    }
    if (gA !== null && gB !== null && eloA != null && eloB != null) {
      const expA = eloExpect(eloA, eloB);
      const sA = gA > gB ? 1.0 : (gA === gB ? 0.5 : 0.0);
      const g = multGoles(gA - gB);
      const delta = 60 * g * (sA - expA);
      elo[ea] = eloA + delta;
      elo[eb] = eloB - delta;
    }
  }
  return result;
}

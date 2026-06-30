import { useEffect, useMemo, useState } from "react";
import { useAlmacen } from "./lib/useLocalStorage.js";
import { calcularGrupos, calcularTerceros, resolverBracket, calcularAciertos, calcularPuntaje, recalcularProbs } from "./lib/calculos.js";
import Inicio from "./components/Inicio.jsx";
import Grupos from "./components/Grupos.jsx";
import Bracket from "./components/Bracket.jsx";
import Resumen from "./components/Resumen.jsx";
import EnVivo from "./components/EnVivo.jsx";
import Historial from "./components/Historial.jsx";
import PorPais from "./components/PorPais.jsx";

const VISTAS = [
  { id: "Inicio",     icono: "🏠", label: "Inicio"     },
  { id: "Grupos",     icono: "📋", label: "Grupos"     },
  { id: "Bracket",    icono: "🏆", label: "Bracket"    },
  { id: "En Vivo",    icono: "⚡", label: "En Vivo"    },
  { id: "Resultados", icono: "📅", label: "Resultados" },
  { id: "Por País",   icono: "🌍", label: "Por País"   },
  { id: "Resumen",    icono: "📊", label: "Resumen"    },
];
const VISTA_IDS = VISTAS.map(v => v.id);

/* ─── Mapeo ESPN (inglés) → nombre canónico ES ─── */
const ESPN_CANON = {
  "Brazil":"Brasil","Morocco":"Marruecos","France":"Francia",
  "Germany":"Alemania","Spain":"España","England":"Inglaterra",
  "Portugal":"Portugal","Argentina":"Argentina","Netherlands":"Países Bajos",
  "Mexico":"México","Japan":"Japón","United States":"Estados Unidos",
  "Ivory Coast":"Costa de Marfil","South Korea":"Corea del Sur",
  "DR Congo":"R.D. Congo","Czechia":"Chequia","Czech Republic":"Chequia",
  "Switzerland":"Suiza","Saudi Arabia":"Arabia Saudita","IR Iran":"Irán",
  "New Zealand":"Nueva Zelanda","Senegal":"Senegal","Uruguay":"Uruguay",
  "Ecuador":"Ecuador","Colombia":"Colombia","Peru":"Perú","Chile":"Chile",
  "Belgium":"Bélgica","Croatia":"Croacia","Denmark":"Dinamarca",
  "Serbia":"Serbia","Poland":"Polonia","Australia":"Australia",
  "Ghana":"Ghana","Cameroon":"Camerún","Tunisia":"Túnez",
  "Nigeria":"Nigeria","Egypt":"Egipto","Qatar":"Catar",
  "Costa Rica":"Costa Rica","Honduras":"Honduras","Panama":"Panamá",
  "Canada":"Canadá","Jamaica":"Jamaica","Turkey":"Turquía",
  "Italy":"Italia","Ukraine":"Ucrania","Romania":"Rumania",
  "Hungary":"Hungría","Slovakia":"Eslovaquia","Wales":"Gales",
  "Scotland":"Escocia","Greece":"Grecia","Sweden":"Suecia",
  "Norway":"Noruega","Finland":"Finlandia","Austria":"Austria",
  "Paraguay":"Paraguay","Bolivia":"Bolivia","Venezuela":"Venezuela",
  "Iraq":"Irak","Jordan":"Jordania","Oman":"Omán","Kuwait":"Kuwait",
  "Algeria":"Argelia","South Africa":"Sudáfrica",
  "Mali":"Malí","Burkina Faso":"Burkina Faso","Zambia":"Zambia",
  "Tanzania":"Tanzania",
  "Papua New Guinea":"Papúa Nueva Guinea","Fiji":"Fiyi",
  "Guatemala":"Guatemala","Cuba":"Cuba","Trinidad and Tobago":"Trinidad y Tobago",
};
const toCanon = n => ESPN_CANON[n] ?? n;

/* ─── Logo We Are 26 ─── */
function LogoWA26() {
  return (
    <svg className="logo-weare26" viewBox="0 0 148 58" xmlns="http://www.w3.org/2000/svg"
      role="img" aria-label="FIFA World Cup 2026 — We Are 26">
      <rect width="148" height="58" rx="6" fill="#0d2c54"/>
      <rect x="0"   y="50" width="49"  height="8" fill="#d50032"/>
      <rect x="49"  y="50" width="50"  height="8" fill="#0b7a3b"/>
      <rect x="99"  y="50" width="49"  height="8" fill="#0d4f8b"/>
      <rect x="0"   y="50" width="6"   height="4" fill="#0d2c54"/>
      <rect x="142" y="50" width="6"   height="4" fill="#0d2c54"/>
      <polygon points="74,2 76.4,9 83.5,9 77.8,13.4 80.2,20.4 74,16 67.8,20.4 70.2,13.4 64.5,9 71.6,9"
        fill="#f5c518" stroke="#c8a80080" strokeWidth="0.5"/>
      <text x="74" y="27" fontFamily="Arial,sans-serif" fontWeight="700" fontSize="6.5"
        fill="rgba(255,255,255,0.65)" textAnchor="middle" letterSpacing="2.2">WORLD CUP</text>
      <text x="74" y="38" fontFamily="'Arial Black',Arial,sans-serif" fontWeight="900" fontSize="11.5"
        fill="#ffffff" textAnchor="middle" letterSpacing="4">WE ARE</text>
      <text x="48"  y="50" fontFamily="'Arial Black',Arial,sans-serif" fontWeight="900" fontSize="18" fill="white" textAnchor="middle">2</text>
      <rect x="70"  y="42" width="8" height="10" fill="#0b7a3b" rx="1"/>
      <text x="74"  y="51" fontFamily="'Arial Black',Arial,sans-serif" fontWeight="900" fontSize="10" fill="white" textAnchor="middle">26</text>
      <text x="100" y="50" fontFamily="'Arial Black',Arial,sans-serif" fontWeight="900" fontSize="18" fill="white" textAnchor="middle">6</text>
    </svg>
  );
}

/* ─── Copa del Mundo FIFA — imagen real ─── */
export function TrofeoWC({ size = 1 }) {
  const h = Math.round(50 * size);
  return (
    <img
      src={import.meta.env.BASE_URL + "trofeo.png"}
      alt="Copa del Mundo FIFA"
      className="trofeo-wc"
      style={{ height: h + "px", width: "auto" }}
    />
  );
}

export default function App() {
  const [data,  setData]  = useState(null);
  const [error, setError] = useState(null);
  const { estado, guardar, reiniciarTodo } = useAlmacen();
  const picks = estado.escenarios[estado.activo];

  /* ── Vista persistente via URL hash ── */
  const getHashVista = () => {
    const h = decodeURIComponent(window.location.hash.slice(1));
    return VISTA_IDS.includes(h) ? h : "Inicio";
  };
  const [vista, setVistaState] = useState(getHashVista);
  const setVista = v => {
    setVistaState(v);
    window.location.hash = encodeURIComponent(v);
  };
  useEffect(() => {
    const onHash = () => setVistaState(getHashVista());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  /* ── Partidos en vivo (fetch ESPN cada 60 s) ── */
  const [liveTeams, setLiveTeams] = useState(new Set());
  useEffect(() => {
    const fetchLive = async () => {
      try {
        const ahora = new Date();
        const fHoy  = ahora.toISOString().slice(0,10).replace(/-/g,"");
        const fAyer = new Date(ahora - 86400000).toISOString().slice(0,10).replace(/-/g,"");
        const base  = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=";
        const [dH, dA] = await Promise.all([
          fetch(base + fHoy ).then(r => r.json()),
          fetch(base + fAyer).then(r => r.json()),
        ]);
        const teams = new Set();
        for (const ev of [...(dH.events ?? []), ...(dA.events ?? [])]) {
          const t = ev.status?.type ?? {};
          const live = t.state === "in"
            || (t.name ?? "").toUpperCase().includes("IN_PROGRESS")
            || (t.name ?? "").toUpperCase().includes("HALFTIME")
            || (t.name ?? "").toUpperCase().includes("SECOND_HALF")
            || (t.name ?? "").toUpperCase().includes("FIRST_HALF");
          if (live) {
            ev.competitions?.[0]?.competitors?.forEach(c =>
              teams.add(toCanon(c.team.displayName))
            );
          }
        }
        setLiveTeams(teams);
      } catch { /* red no disponible, silencioso */ }
    };
    fetchLive();
    const iv = setInterval(fetchLive, 60_000);
    return () => clearInterval(iv);
  }, []);

  /* ── Datos del torneo ── */
  useEffect(() => {
    fetch(import.meta.env.BASE_URL + "data.json", { cache: "no-cache" })
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(setData)
      .catch(e => setError(String(e)));
  }, []);

  /* ── Refresco automático cada hora ── */
  useEffect(() => {
    const iv = setInterval(() => window.location.reload(), 60 * 60 * 1000);
    return () => clearInterval(iv);
  }, []);

  const setPicks = np => guardar({ ...estado, escenarios: { ...estado.escenarios, [estado.activo]: np } });

  const calc = useMemo(() => {
    if (!data) return null;
    const grupos   = calcularGrupos(data, picks);
    const terceros = calcularTerceros(grupos);
    const bracket  = resolverBracket(data, picks, grupos, terceros);
    const aciertos = calcularAciertos(data, picks);
    const puntaje  = calcularPuntaje(data, picks);
    return { grupos, terceros, bracket, aciertos, puntaje };
  }, [data, picks]);

  const probsLive = useMemo(() => {
    if (!data) return {};
    return recalcularProbs(data, picks);
  }, [data, picks]);

  if (error)          return <div className="cargando">Error cargando data.json: {error}.</div>;
  if (!data || !calc) return <div className="cargando">Cargando datos del Tracker…</div>;

  const hayVivo = liveTeams.size > 0;

  return (
    <div className="app">
      <header className="encabezado">
        <div className="enc-top">
          <div className="enc-brand">
            <TrofeoWC />
            <div className="titulo">
              <h1>Mundial <span className="veintiseis">26</span></h1>
            </div>
          </div>
        </div>
        <nav className="pestanas">
          {VISTAS.map(({ id, icono, label }) => (
            <button key={id} className={id === vista ? "activa" : ""} onClick={() => setVista(id)}>
              <span className="nav-icono">{icono}</span>
              <span className="nav-label">{label}</span>
              {id === "En Vivo" && hayVivo && <span className="live-dot-nav" aria-label="partido en vivo" />}
            </button>
          ))}
        </nav>
      </header>
      <main>
        {vista === "Inicio"     && <Inicio     data={data} picks={picks} calc={calc} setVista={setVista} probsLive={probsLive} liveTeams={liveTeams} />}
        {vista === "Grupos"     && <Grupos     data={data} picks={picks} setPicks={setPicks} calc={calc} probsLive={probsLive} />}
        {vista === "Bracket"     && <Bracket    picks={picks} setPicks={setPicks} calc={calc} data={data} />}
        {vista === "En Vivo"     && <EnVivo     data={data} />}
        {vista === "Resultados"  && <Historial  data={data} />}
        {vista === "Por País"    && <PorPais    data={data} />}
        {vista === "Resumen"     && <Resumen    data={data} picks={picks} calc={calc} escenario={estado.activo} />}
      </main>
      <footer className="pie">Seguimiento Mundial 2026 · Modelo Elo+Poisson — referencia estadística, no incorpora lesiones ni alineaciones.</footer>
    </div>
  );
}

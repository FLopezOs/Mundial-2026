import { useRef, useEffect } from "react";
import Bandera from "./Bandera.jsx";

const IZQ = {
  R32:    [73,74,75,76,77,78,79,80],
  Octavos:[89,90,91,92],
  Cuartos:[97,98],
  Semis:  [101],
};
const DER = {
  Semis:  [102],
  Cuartos:[99,100],
  Octavos:[93,94,95,96],
  R32:    [81,82,83,84,85,86,87,88],
};

/* Resuelve un código de bracket ("W73", "L101") en texto "Gan. Brasil · Japón" */
function resolveCode(code, pMap) {
  if (!code) return null;
  const m = String(code).match(/^([WL])(\d+)$/i);
  if (!m) return null; // ya es un nombre real (no es código)
  const [, tipo, numStr] = m;
  const src = pMap[parseInt(numStr)];
  if (!src) return `${tipo === "W" ? "Gan." : "Perd."} #${numStr}`;
  const shorten = n => n?.length > 9 ? n.substring(0, 8) + "." : n;
  return `${tipo.toUpperCase() === "W" ? "🏆 Gan." : "🥈 Perd."} ${shorten(src.equipoA)} · ${shorten(src.equipoB)}`;
}

function Llave({ ll, picks, setPicks, compact, pMap }) {
  if (!ll) return <div className="llave-ph" />;
  const elegible = ll.a && ll.b && ll.definicion !== "real";
  const elegir = (equipo) => {
    if (!elegible) return;
    const actual = picks.ko?.[ll.numFifa];
    const ko = { ...picks.ko };
    if (actual?.ganador === equipo && actual?.pen) {
      delete ko[ll.numFifa];          // penales → deseleccionar
    } else if (actual?.ganador === equipo) {
      ko[ll.numFifa] = { ...actual, pen: true };  // pick → penales
    } else {
      ko[ll.numFifa] = { ganador: equipo, pen: false };  // nuevo pick
    }
    setPicks({ ...picks, ko });
  };

  /* Obtenemos el partido raw para resolver los códigos fuente */
  const rawP = pMap?.[ll.numFifa];

  const Slot = ({ nombre, rawCode }) => {
    const pendingLabel = !nombre && rawCode ? resolveCode(rawCode, pMap) : null;
    return (
      <button
        className={
          "slot" +
          (nombre && ll.ganador === nombre ? " ganador" : "") +
          (!elegible ? " bloqueado" : "") +
          (!nombre ? " slot-vacio" : "")
        }
        onClick={() => nombre && elegir(nombre)}
        disabled={!elegible || !nombre}
      >
        {nombre
          ? <><Bandera equipo={nombre} ancho={16} /> <span className="slot-nombre">{nombre}</span></>
          : pendingLabel
            ? <span className="slot-posible">{pendingLabel}</span>
            : <span className="slot-tbd">Por definir</span>}
      </button>
    );
  };

  return (
    <div className={"llave" + (ll.definicion === "real" ? " real" : "") + (compact ? " llave-compact" : "")}>
      <div className="num">#{ll.numFifa}</div>
      <Slot nombre={ll.a} rawCode={rawP?.equipoA} />
      <Slot nombre={ll.b} rawCode={rawP?.equipoB} />
      <div className="estado-llave">
        {ll.definicion === "real" && <span className="badge ok">oficial</span>}
        {ll.pen && ll.ganador && <span className="badge pen">penales</span>}
        {ll.definicion === "pick" && !ll.pen && <span className="badge pick">mi pronóstico</span>}
      </div>
    </div>
  );
}

function ColRonda({ titulo, nums, llaves, picks, setPicks, pMap }) {
  const matches = nums.map(n => llaves.find(l => l.numFifa === n));
  return (
    <div className="col-ronda">
      <div className="col-titulo-ronda">{titulo}</div>
      <div className="col-llaves">
        {matches.map((ll, i) => (
          <Llave key={ll?.numFifa ?? i} ll={ll} picks={picks} setPicks={setPicks} pMap={pMap} />
        ))}
      </div>
    </div>
  );
}


export default function Bracket({ picks, setPicks, calc, data }) {
  const { llaves, campeon } = calc.bracket;
  const llave = (n) => llaves.find(l => l.numFifa === n);
  const sinResolver = llaves.some(l => !l.a || !l.b);

  /* Mapa numFifa → partido (para resolver códigos W/L) */
  const pMap = {};
  for (const p of data?.partidos ?? []) {
    if (p.numFifa) pMap[p.numFifa] = p;
  }

  /* Auto-scroll al centro del bracket al montar */
  const scrollRef = useRef(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
    }
  }, []);

  return (
    <div className="bracket-wrap">
      <p className="ayuda bracket-ayuda">
        Un clic elige ganador · segundo clic marca <em>penales</em> · tercero desmarca · partidos oficiales bloqueados.
        {sinResolver && " 🏆 = posible ganador según equipos clasificados."}
      </p>
      {campeon && (
        <div className="campeon">🏆 Tu campeón: <strong><Bandera equipo={campeon} /> {campeon}</strong></div>
      )}

      <div className="bracket-doble-scroll" ref={scrollRef}>
        <div className="bracket-doble">

          {/* ── ZONA IZQUIERDA ── */}
          <div className="zona-izq">
            <ColRonda titulo="R32"     nums={IZQ.R32}     llaves={llaves} picks={picks} setPicks={setPicks} pMap={pMap}/>
            <ColRonda titulo="Octavos" nums={IZQ.Octavos} llaves={llaves} picks={picks} setPicks={setPicks} pMap={pMap}/>
            <ColRonda titulo="Cuartos" nums={IZQ.Cuartos} llaves={llaves} picks={picks} setPicks={setPicks} pMap={pMap}/>
            <ColRonda titulo="Semis"   nums={IZQ.Semis}   llaves={llaves} picks={picks} setPicks={setPicks} pMap={pMap}/>
          </div>

          {/* ── CENTRO: Trofeo + Final + 3er puesto ── */}
          <div className="zona-centro">
            <img
              src={import.meta.env.BASE_URL + "trofeo.png"}
              alt="Copa del Mundo FIFA"
              className="trofeo-svg"
            />
            <div className="centro-matches">
              <div className="col-titulo-ronda finaltxt">🏆 Final</div>
              <Llave ll={llave(104)} picks={picks} setPicks={setPicks} compact pMap={pMap} />
              <div className="col-titulo-ronda" style={{marginTop:"6px"}}>🥉 3er Puesto</div>
              <Llave ll={llave(103)} picks={picks} setPicks={setPicks} compact pMap={pMap} />
            </div>
          </div>

          {/* ── ZONA DERECHA (espejo) ── */}
          <div className="zona-der">
            <ColRonda titulo="Semis"   nums={DER.Semis}   llaves={llaves} picks={picks} setPicks={setPicks} pMap={pMap}/>
            <ColRonda titulo="Cuartos" nums={DER.Cuartos} llaves={llaves} picks={picks} setPicks={setPicks} pMap={pMap}/>
            <ColRonda titulo="Octavos" nums={DER.Octavos} llaves={llaves} picks={picks} setPicks={setPicks} pMap={pMap}/>
            <ColRonda titulo="R32"     nums={DER.R32}     llaves={llaves} picks={picks} setPicks={setPicks} pMap={pMap}/>
          </div>

        </div>
      </div>
    </div>
  );
}

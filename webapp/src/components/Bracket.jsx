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

function Llave({ ll, picks, setPicks, compact }) {
  if (!ll) return <div className="llave-ph" />;
  const elegible = ll.a && ll.b && ll.definicion !== "real";
  const elegir = (equipo) => {
    if (!elegible) return;
    const actual = picks.ko?.[ll.numFifa];
    const ko = { ...picks.ko };
    if (actual?.ganador === equipo) {
      ko[ll.numFifa] = { ...actual, pen: !actual.pen };
    } else {
      ko[ll.numFifa] = { ganador: equipo, pen: false };
    }
    setPicks({ ...picks, ko });
  };
  const Slot = ({ nombre }) => (
    <button
      className={"slot" + (nombre && ll.ganador === nombre ? " ganador" : "") + (!elegible ? " bloqueado" : "")}
      onClick={() => nombre && elegir(nombre)}
      disabled={!elegible || !nombre}
    >
      {nombre
        ? <><Bandera equipo={nombre} ancho={16} /> <span className="slot-nombre">{nombre}</span></>
        : <span className="slot-tbd">Por definir</span>}
    </button>
  );
  return (
    <div className={"llave" + (ll.definicion === "real" ? " real" : "") + (compact ? " llave-compact" : "")}>
      <div className="num">#{ll.numFifa}</div>
      <Slot nombre={ll.a} />
      <Slot nombre={ll.b} />
      <div className="estado-llave">
        {ll.definicion === "real" && <span className="badge ok">oficial</span>}
        {ll.pen && ll.ganador && <span className="badge pen">penales</span>}
        {ll.definicion === "pick" && !ll.pen && <span className="badge pick">mi pick</span>}
      </div>
    </div>
  );
}

function ColRonda({ titulo, nums, llaves, picks, setPicks }) {
  const matches = nums.map(n => llaves.find(l => l.numFifa === n));
  return (
    <div className="col-ronda">
      <div className="col-titulo-ronda">{titulo}</div>
      <div className="col-llaves">
        {matches.map((ll, i) => (
          <Llave key={ll?.numFifa ?? i} ll={ll} picks={picks} setPicks={setPicks} />
        ))}
      </div>
    </div>
  );
}

function WeAre26SVG() {
  return (
    <svg className="weare26-svg" viewBox="0 0 130 52" xmlns="http://www.w3.org/2000/svg">
      <rect width="130" height="52" rx="5" fill="#0d2c54"/>
      <rect x="0" y="44" width="43" height="8" fill="#d50032"/>
      <rect x="43" y="44" width="44" height="8" fill="#0b7a3b"/>
      <rect x="87" y="44" width="43" height="8" fill="#0d4f8b"/>
      <polygon points="65,2 66.8,7.5 72.5,7.5 67.8,10.8 69.6,16.3 65,13 60.4,16.3 62.2,10.8 57.5,7.5 63.2,7.5"
        fill="#f5c518"/>
      <text x="65" y="30" fontFamily="'Arial Black',Arial,sans-serif" fontWeight="900"
        fontSize="10" fill="#ffffff" textAnchor="middle" letterSpacing="3.5">WE ARE</text>
      <text x="47" y="44" fontFamily="'Arial Black',Arial,sans-serif" fontWeight="900"
        fontSize="16" fill="#d50032" textAnchor="middle">2</text>
      <text x="83" y="44" fontFamily="'Arial Black',Arial,sans-serif" fontWeight="900"
        fontSize="16" fill="#0d4f8b" textAnchor="middle">6</text>
      <text x="65" y="44" fontFamily="'Arial Black',Arial,sans-serif" fontWeight="900"
        fontSize="14" fill="#0b7a3b" textAnchor="middle">·</text>
    </svg>
  );
}

export default function Bracket({ picks, setPicks, calc }) {
  const { llaves, campeon } = calc.bracket;
  const llave = (n) => llaves.find(l => l.numFifa === n);
  const sinResolver = llaves.some(l => !l.a || !l.b);

  return (
    <div className="bracket-wrap">
      <p className="ayuda bracket-ayuda">
        Un clic elige ganador · segundo clic al mismo equipo alterna <em>penales</em> · partidos oficiales bloqueados.
        {sinResolver && " Completa los grupos para poblar el bracket."}
      </p>
      {campeon && (
        <div className="campeon">🏆 Tu campeón: <strong><Bandera equipo={campeon} /> {campeon}</strong></div>
      )}

      <div className="bracket-doble-scroll">
        <div className="bracket-doble">

          {/* ── ZONA IZQUIERDA ── */}
          <div className="zona-izq">
            <ColRonda titulo="R32"     nums={IZQ.R32}     llaves={llaves} picks={picks} setPicks={setPicks}/>
            <ColRonda titulo="Octavos" nums={IZQ.Octavos} llaves={llaves} picks={picks} setPicks={setPicks}/>
            <ColRonda titulo="Cuartos" nums={IZQ.Cuartos} llaves={llaves} picks={picks} setPicks={setPicks}/>
            <ColRonda titulo="Semis"   nums={IZQ.Semis}   llaves={llaves} picks={picks} setPicks={setPicks}/>
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
              <Llave ll={llave(104)} picks={picks} setPicks={setPicks} compact />
              <div className="col-titulo-ronda" style={{marginTop:"6px"}}>🥉 3er Puesto</div>
              <Llave ll={llave(103)} picks={picks} setPicks={setPicks} compact />
            </div>
            <WeAre26SVG/>
          </div>

          {/* ── ZONA DERECHA (espejo) ── */}
          <div className="zona-der">
            <ColRonda titulo="Semis"   nums={DER.Semis}   llaves={llaves} picks={picks} setPicks={setPicks}/>
            <ColRonda titulo="Cuartos" nums={DER.Cuartos} llaves={llaves} picks={picks} setPicks={setPicks}/>
            <ColRonda titulo="Octavos" nums={DER.Octavos} llaves={llaves} picks={picks} setPicks={setPicks}/>
            <ColRonda titulo="R32"     nums={DER.R32}     llaves={llaves} picks={picks} setPicks={setPicks}/>
          </div>

        </div>
      </div>
    </div>
  );
}

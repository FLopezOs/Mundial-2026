import { useState } from "react";

const PREGUNTAS = [
  {
    q: "¿Qué selección tiene más títulos mundiales?",
    ops: ["Argentina", "Alemania", "Brasil", "Italia"],
    ok: 2,
  },
  {
    q: "¿Quién es el máximo goleador en la historia de los Mundiales?",
    ops: ["Pelé", "Miroslav Klose", "Ronaldo Nazário", "Lionel Messi"],
    ok: 1,
  },
  {
    q: "¿En qué año se jugó el primer Mundial de fútbol?",
    ops: ["1926", "1928", "1930", "1934"],
    ok: 2,
  },
  {
    q: "¿Cuántos países participan en el Mundial 2026?",
    ops: ["32", "36", "48", "64"],
    ok: 2,
  },
  {
    q: "¿En qué estadio se juega la final del Mundial 2026?",
    ops: ["Rose Bowl", "AT&T Stadium", "SoFi Stadium", "MetLife Stadium"],
    ok: 3,
  },
];

export default function Trivia() {
  const [idx, setIdx]         = useState(0);
  const [puntaje, setPuntaje] = useState(0);
  const [elegida, setElegida] = useState(null); // índice elegido o null
  const [fin, setFin]         = useState(false);

  const pregunta = PREGUNTAS[idx];

  function responder(i) {
    if (elegida !== null) return; // ya respondió
    setElegida(i);
    if (i === pregunta.ok) setPuntaje(p => p + 1);
    setTimeout(() => {
      if (idx + 1 >= PREGUNTAS.length) {
        setFin(true);
      } else {
        setIdx(idx + 1);
        setElegida(null);
      }
    }, 1200);
  }

  function reiniciar() {
    setIdx(0); setPuntaje(0); setElegida(null); setFin(false);
  }

  return (
    <div className="trivia-seccion">
      <h2 className="sec-titulo">🧠 Trivia mundialista</h2>
      <div className="trivia-box">
        {fin ? (
          <div className="trivia-fin">
            <div className="trivia-trofeo">🏆</div>
            <p className="trivia-result-txt">
              Terminaste con <strong>{puntaje}</strong> de {PREGUNTAS.length} correctas
            </p>
            <button className="trivia-reiniciar" onClick={reiniciar}>Jugar de nuevo</button>
          </div>
        ) : (
          <>
            <div className="trivia-header">
              <span>{idx + 1} / {PREGUNTAS.length}</span>
              <span>Puntaje: <strong>{puntaje}</strong></span>
            </div>
            <p className="trivia-pregunta">{pregunta.q}</p>
            <div className="trivia-opciones">
              {pregunta.ops.map((op, i) => {
                let cls = "trivia-opcion";
                if (elegida !== null) {
                  if (i === pregunta.ok) cls += " correcta";
                  else if (i === elegida) cls += " incorrecta";
                  else cls += " deshabilitada";
                }
                return (
                  <button key={i} className={cls} onClick={() => responder(i)}>
                    {op}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

import { useState, useMemo } from "react";

const BANCO = [
  // Historia mundialista
  { q: "¿Qué selección tiene más títulos mundiales?", ops: ["Argentina", "Alemania", "Brasil", "Italia"], ok: 2 },
  { q: "¿Quién es el máximo goleador en la historia de los Mundiales?", ops: ["Pelé", "Miroslav Klose", "Ronaldo Nazário", "Lionel Messi"], ok: 1 },
  { q: "¿En qué año se jugó el primer Mundial de fútbol?", ops: ["1926", "1928", "1930", "1934"], ok: 2 },
  { q: "¿Qué país organizó el primer Mundial?", ops: ["Brasil", "Argentina", "Uruguay", "Italia"], ok: 2 },
  { q: "¿Cuántos títulos tiene Brasil?", ops: ["4", "5", "6", "3"], ok: 1 },
  { q: "¿Qué selección es la única que ha participado en todos los Mundiales?", ops: ["Alemania", "Italia", "Argentina", "Brasil"], ok: 3 },
  { q: "¿En qué país se jugó el Mundial 2022?", ops: ["Emiratos Árabes", "Arabia Saudita", "Kuwait", "Qatar"], ok: 3 },
  { q: "¿Quién ganó el Mundial 2022?", ops: ["Francia", "Brasil", "Argentina", "Alemania"], ok: 2 },
  { q: "¿En qué edición marcó Pelé su último gol mundialista?", ops: ["1958", "1962", "1966", "1970"], ok: 3 },
  { q: "¿Quién ganó el Balón de Oro del Mundial 2022?", ops: ["Kylian Mbappé", "Lionel Messi", "Luka Modrić", "Emi Martínez"], ok: 1 },
  { q: "¿Cuántos goles marcó Miroslav Klose en Mundiales?", ops: ["14", "15", "16", "17"], ok: 2 },
  { q: "¿Qué selección ganó el Mundial 2018?", ops: ["Argentina", "Croacia", "Bélgica", "Francia"], ok: 3 },
  { q: "¿Dónde se jugó la final del Mundial 2018?", ops: ["San Petersburgo", "Moscú", "Ekaterimburgo", "Sochi"], ok: 1 },
  { q: "¿Qué selección fue campeona en el primer Mundial (1930)?", ops: ["Argentina", "Uruguay", "Brasil", "EE.UU."], ok: 1 },
  { q: "¿Quién ganó el primer Balón de Oro de un Mundial?", ops: ["Pelé", "Johan Cruyff", "Gerd Müller", "Eusébio"], ok: 0 },
  { q: "¿Cuántos equipos participaron en el Mundial 2022?", ops: ["24", "32", "36", "48"], ok: 1 },
  { q: "¿En qué año Alemania ganó su cuarto título?", ops: ["2002", "2006", "2010", "2014"], ok: 3 },
  { q: "¿Qué selección llegó de sorpresa a la final del Mundial 2018?", ops: ["Bélgica", "Suecia", "Croacia", "Rusia"], ok: 2 },
  { q: "¿Dónde se jugó el famoso 'Maracanazo' de 1950?", ops: ["São Paulo", "Río de Janeiro", "Buenos Aires", "Montevideo"], ok: 1 },
  { q: "¿Qué selección fue eliminada en grupos del Mundial 2022 pese a ser campeona vigente?", ops: ["Francia", "Argentina", "Alemania", "Brasil"], ok: 0 },
  // Mundial 2026
  { q: "¿Cuántos países participan en el Mundial 2026?", ops: ["32", "36", "48", "64"], ok: 2 },
  { q: "¿En qué estadio se juega la final del Mundial 2026?", ops: ["Rose Bowl", "AT&T Stadium", "SoFi Stadium", "MetLife Stadium"], ok: 3 },
  { q: "¿Cuáles son los tres países anfitriones del Mundial 2026?", ops: ["EE.UU., México y Brasil", "EE.UU., México y Canadá", "EE.UU., Canadá y Argentina", "México, Canadá y Cuba"], ok: 1 },
  { q: "¿Cuántos estadios albergan partidos del Mundial 2026?", ops: ["12", "14", "16", "18"], ok: 2 },
  { q: "¿Cuántos partidos se juegan en total en el Mundial 2026?", ops: ["64", "80", "104", "128"], ok: 2 },
  { q: "¿Cuántos grupos hay en la fase de grupos del Mundial 2026?", ops: ["8", "10", "12", "16"], ok: 2 },
  { q: "¿Cuántos equipos por grupo hay en el Mundial 2026?", ops: ["3", "4", "5", "6"], ok: 1 },
  { q: "¿En qué ciudad de México se juegan partidos del Mundial 2026?", ops: ["Monterrey y Guadalajara", "Solo en CDMX", "CDMX, Monterrey y Guadalajara", "CDMX y Tijuana"], ok: 2 },
  { q: "¿Qué estadio de México inauguró el Mundial 2026?", ops: ["Estadio BBVA", "Estadio Akron", "Estadio Azteca", "Estadio Olímpico"], ok: 2 },
  { q: "¿Cuántos equipos de cada grupo clasifican directamente a octavos?", ops: ["1", "2", "3", "4"], ok: 1 },
  { q: "¿Cuántos terceros de grupo avanzan a octavos en el Mundial 2026?", ops: ["4", "6", "8", "12"], ok: 2 },
  { q: "¿En qué ciudad estadounidense se encuentra el MetLife Stadium?", ops: ["Nueva York / New Jersey", "Los Ángeles", "Miami", "Chicago"], ok: 0 },
  { q: "¿Cuándo es la final del Mundial 2026?", ops: ["12 de julio", "15 de julio", "19 de julio", "22 de julio"], ok: 2 },
  { q: "¿Qué ciudad canadiense es sede del Mundial 2026?", ops: ["Toronto", "Vancouver", "Montreal", "Toronto y Vancouver"], ok: 3 },
];

function sortear(n = 5) {
  const copia = [...BANCO].sort(() => Math.random() - 0.5);
  return copia.slice(0, n);
}

const N = 5; // preguntas por ronda

export default function Trivia() {
  const [ronda, setRonda]     = useState(0); // cambiar fuerza nuevo sorteo
  const preguntas             = useMemo(() => sortear(N), [ronda]);
  const [idx, setIdx]         = useState(0);
  const [puntaje, setPuntaje] = useState(0);
  const [elegida, setElegida] = useState(null);
  const [fin, setFin]         = useState(false);

  const pregunta = preguntas[idx];

  function responder(i) {
    if (elegida !== null) return;
    setElegida(i);
    if (i === pregunta.ok) setPuntaje(p => p + 1);
    setTimeout(() => {
      if (idx + 1 >= N) {
        setFin(true);
      } else {
        setIdx(idx + 1);
        setElegida(null);
      }
    }, 1200);
  }

  function reiniciar() {
    setRonda(r => r + 1); // dispara nuevo useMemo → nuevo sorteo
    setIdx(0);
    setPuntaje(0);
    setElegida(null);
    setFin(false);
  }

  const emoji = puntaje >= 4 ? "🏆" : puntaje >= 2 ? "⚽" : "😅";

  return (
    <div className="trivia-seccion">
      <h2 className="sec-titulo">🧠 Trivia mundialista</h2>
      <div className="trivia-box">
        {fin ? (
          <div className="trivia-fin">
            <div className="trivia-trofeo">{emoji}</div>
            <p className="trivia-result-txt">
              Terminaste con <strong>{puntaje}</strong> de {N} correctas
            </p>
            <button className="trivia-reiniciar" onClick={reiniciar}>Intentar de nuevo</button>
          </div>
        ) : (
          <>
            <div className="trivia-header">
              <span>{idx + 1} / {N}</span>
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

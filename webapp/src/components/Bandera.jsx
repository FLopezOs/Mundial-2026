// Bandera.jsx — banderas oficiales por selección (flagcdn.com, con fallback silencioso).
// Sin logos/emblemas FIFA: son marca registrada (#WeAre26 protegido).

const ISO = {
  "Argelia": "dz", "Argentina": "ar", "Australia": "au", "Austria": "at",
  "Bélgica": "be", "Bosnia y Herzegovina": "ba", "Brasil": "br", "Canadá": "ca",
  "Cabo Verde": "cv", "Colombia": "co", "Croacia": "hr", "Curaçao": "cw",
  "Chequia": "cz", "RD Congo": "cd", "Ecuador": "ec", "Egipto": "eg",
  "Inglaterra": "gb-eng", "Francia": "fr", "Alemania": "de", "Ghana": "gh",
  "Haití": "ht", "Irán": "ir", "Irak": "iq", "Costa de Marfil": "ci",
  "Japón": "jp", "Jordania": "jo", "México": "mx", "Marruecos": "ma",
  "Países Bajos": "nl", "Nueva Zelanda": "nz", "Noruega": "no", "Panamá": "pa",
  "Paraguay": "py", "Portugal": "pt", "Qatar": "qa", "Arabia Saudita": "sa",
  "Escocia": "gb-sct", "Senegal": "sn", "Sudáfrica": "za", "Corea del Sur": "kr",
  "España": "es", "Suecia": "se", "Suiza": "ch", "Túnez": "tn",
  "Turquía": "tr", "Estados Unidos": "us", "Uruguay": "uy", "Uzbekistán": "uz",
};

export const emojiDe = (nombre) => {
  const c = ISO[nombre];
  if (!c) return "";
  if (c === "gb-eng") return "🏴󠁧󠁢󠁥󠁮󠁧󠁿";
  if (c === "gb-sct") return "🏴󠁧󠁢󠁳󠁣󠁴󠁿";
  return [...c.toUpperCase()].map(ch => String.fromCodePoint(0x1f1e6 + ch.charCodeAt(0) - 65)).join("");
};

export default function Bandera({ equipo, ancho = 20 }) {
  const c = ISO[equipo];
  if (!c) return null;
  return (
    <img
      className="bandera"
      src={`https://flagcdn.com/w40/${c}.png`}
      srcSet={`https://flagcdn.com/w80/${c}.png 2x`}
      width={ancho}
      alt=""
      loading="lazy"
      onError={e => { e.currentTarget.style.display = "none"; }}
    />
  );
}

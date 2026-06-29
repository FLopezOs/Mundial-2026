/* Logos de canal como badges de marca */
const CANALES = {
  "DGO": {
    label: "DGO",
    logo: (
      <svg viewBox="0 0 28 14" xmlns="http://www.w3.org/2000/svg" style={{height:"14px",width:"auto",display:"block"}}>
        <rect width="28" height="14" rx="3" fill="#e60000"/>
        <text x="14" y="10.5" fontFamily="'Arial Black',Arial,sans-serif" fontWeight="900"
          fontSize="8" fill="#fff" textAnchor="middle" letterSpacing="0.5">DGO</text>
      </svg>
    ),
  },
  "CHV": {
    label: "CHV",
    logo: (
      <svg viewBox="0 0 32 14" xmlns="http://www.w3.org/2000/svg" style={{height:"14px",width:"auto",display:"block"}}>
        <rect width="32" height="14" rx="3" fill="#003082"/>
        <text x="16" y="10.5" fontFamily="'Arial Black',Arial,sans-serif" fontWeight="900"
          fontSize="7.5" fill="#fff" textAnchor="middle" letterSpacing="0.3">CHV</text>
      </svg>
    ),
  },
  "Disney+": {
    label: "Disney+",
    logo: (
      <svg viewBox="0 0 38 14" xmlns="http://www.w3.org/2000/svg" style={{height:"14px",width:"auto",display:"block"}}>
        <rect width="38" height="14" rx="3" fill="#0d2c7b"/>
        <text x="19" y="10.5" fontFamily="'Arial Black',Arial,sans-serif" fontWeight="900"
          fontSize="7" fill="#fff" textAnchor="middle" letterSpacing="0.2">Disney+</text>
      </svg>
    ),
  },
  "Paramount+": {
    label: "P+",
    logo: (
      <svg viewBox="0 0 22 14" xmlns="http://www.w3.org/2000/svg" style={{height:"14px",width:"auto",display:"block"}}>
        <rect width="22" height="14" rx="3" fill="#0064ff"/>
        <text x="11" y="10.5" fontFamily="'Arial Black',Arial,sans-serif" fontWeight="900"
          fontSize="8" fill="#fff" textAnchor="middle" letterSpacing="0.3">P+</text>
      </svg>
    ),
  },
};

export default function CanalesBadges({ canales }) {
  if (!canales?.length) return null;
  return (
    <div className="canal-badges">
      {canales.map(c => {
        const cfg = CANALES[c];
        if (!cfg) return null;
        return (
          <span key={c} className="canal-badge" title={cfg.label === "P+" ? "Paramount+" : cfg.label}>
            {cfg.logo}
          </span>
        );
      })}
    </div>
  );
}

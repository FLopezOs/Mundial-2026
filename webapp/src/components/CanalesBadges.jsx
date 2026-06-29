const BASE = import.meta.env.BASE_URL;

const CANALES = {
  "DGO": {
    label: "DGO",
    img: BASE + "logo-dgo.png",
  },
  "CHV": {
    label: "Chilevision",
    img: BASE + "logo-chv.jpg",
  },
  "Disney+": {
    label: "Disney+",
    img: BASE + "logo-disney.png",
  },
  "Paramount+": {
    label: "Paramount+",
    logo: (
      <svg viewBox="0 0 22 14" xmlns="http://www.w3.org/2000/svg" style={{height:"18px",width:"auto",display:"block"}}>
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
          <span key={c} className="canal-badge" title={cfg.label}>
            {cfg.img
              ? <img src={cfg.img} alt={cfg.label} style={{height:"18px", width:"auto", display:"block"}} />
              : cfg.logo
            }
          </span>
        );
      })}
    </div>
  );
}

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

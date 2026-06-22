const CANAL_CFG = {
  "DGO":     { cls: "canal-dgo" },
  "CHV":     { cls: "canal-chv" },
  "Disney+": { cls: "canal-disney" },
};

export default function CanalesBadges({ canales }) {
  if (!canales?.length) return null;
  return (
    <div className="canal-badges">
      {canales.map(c => (
        <span key={c} className={"canal-badge " + (CANAL_CFG[c]?.cls ?? "canal-otro")}>
          {c}
        </span>
      ))}
    </div>
  );
}

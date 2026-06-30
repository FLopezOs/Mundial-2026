import { useState, useEffect } from "react";

const FINAL = new Date("2026-07-19T19:00:00Z"); // 19 jul 2026, 15:00 ET = 19:00 UTC

function calcular() {
  const diff = FINAL - Date.now();
  if (diff <= 0) return null;
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff % 86400000) / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
  };
}

export default function Countdown() {
  const [t, setT] = useState(calcular);

  useEffect(() => {
    const iv = setInterval(() => setT(calcular()), 1000);
    return () => clearInterval(iv);
  }, []);

  if (!t) return null;

  const bloques = [
    { val: t.d, lbl: "días" },
    { val: t.h, lbl: "hrs" },
    { val: t.m, lbl: "min" },
    { val: t.s, lbl: "seg" },
  ];

  return (
    <div className="countdown-banner">
      <span className="countdown-label">🏆 Final · MetLife Stadium</span>
      <div className="countdown-bloques">
        {bloques.map(({ val, lbl }) => (
          <div key={lbl} className="countdown-bloque">
            <span className="countdown-num">{String(val).padStart(2, "0")}</span>
            <span className="countdown-lbl">{lbl}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

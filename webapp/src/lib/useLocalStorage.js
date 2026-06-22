import { useState, useCallback } from "react";

const CLAVE = "polla2026";

const VACIO = { scores: {}, ko: {} };
const inicial = () => ({ activo: "Mi escenario", escenarios: { "Mi escenario": structuredClone(VACIO) } });

export function nuevoEscenario() { return structuredClone(VACIO); }

export function useAlmacen() {
  const [estado, setEstado] = useState(() => {
    try {
      const raw = localStorage.getItem(CLAVE);
      if (raw) {
        const e = JSON.parse(raw);
        if (e?.escenarios && e?.activo && e.escenarios[e.activo]) return e;
      }
    } catch { /* corrupto -> reinicia */ }
    return inicial();
  });

  const guardar = useCallback((nuevo) => {
    setEstado(nuevo);
    try { localStorage.setItem(CLAVE, JSON.stringify(nuevo)); } catch { /* lleno */ }
  }, []);

  const reiniciarTodo = useCallback(() => guardar(inicial()), [guardar]);

  return { estado, guardar, reiniciarTodo };
}

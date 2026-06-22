import { useRef, useState } from "react";
import { nuevoEscenario } from "../lib/useLocalStorage.js";

export default function Escenarios({ estado, guardar, reiniciarTodo }) {
  const [nombre, setNombre] = useState("");
  const archivo = useRef(null);
  const nombres = Object.keys(estado.escenarios);

  const crear = () => {
    const n = nombre.trim();
    if (!n || estado.escenarios[n]) return;
    guardar({ activo: n, escenarios: { ...estado.escenarios, [n]: nuevoEscenario() } });
    setNombre("");
  };
  const duplicar = () => {
    let n = `${estado.activo} (copia)`, i = 2;
    while (estado.escenarios[n]) n = `${estado.activo} (copia ${i++})`;
    guardar({ activo: n, escenarios: { ...estado.escenarios, [n]: structuredClone(estado.escenarios[estado.activo]) } });
  };
  const eliminar = (n) => {
    if (nombres.length === 1) { alert("Debe quedar al menos un escenario."); return; }
    if (!confirm(`¿Eliminar el escenario "${n}"?`)) return;
    const esc = { ...estado.escenarios };
    delete esc[n];
    guardar({ activo: n === estado.activo ? Object.keys(esc)[0] : estado.activo, escenarios: esc });
  };
  const exportar = () => {
    const blob = new Blob([JSON.stringify({ nombre: estado.activo, picks: estado.escenarios[estado.activo] }, null, 1)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `Picks_Mundial2026_${estado.activo.replace(/\W+/g, "_")}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const importar = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    f.text().then(txt => {
      try {
        const d = JSON.parse(txt);
        const picks = d.picks ?? d;
        if (typeof picks?.scores !== "object" || typeof picks?.ko !== "object") throw new Error("formato");
        let n = d.nombre ?? "Importado";
        while (estado.escenarios[n]) n += " (imp)";
        guardar({ activo: n, escenarios: { ...estado.escenarios, [n]: { scores: picks.scores, ko: picks.ko } } });
      } catch { alert("Archivo inválido: se espera el JSON exportado por esta app."); }
      e.target.value = "";
    });
  };

  return (
    <div className="escenarios">
      <h2>Escenarios guardados</h2>
      <ul className="lista-esc">
        {nombres.map(n => (
          <li key={n} className={n === estado.activo ? "activo" : ""}>
            <button className="nombre-esc" onClick={() => guardar({ ...estado, activo: n })}>{n}</button>
            <span className="conteo">{Object.values(estado.escenarios[n].scores ?? {}).filter(s => Number.isInteger(s?.ga)).length} picks</span>
            <button className="peligro chico" onClick={() => eliminar(n)}>✕</button>
          </li>
        ))}
      </ul>
      <div className="acciones">
        <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nuevo escenario (ej. Polla oficina)" onKeyDown={e => e.key === "Enter" && crear()} />
        <button onClick={crear} disabled={!nombre.trim()}>Crear</button>
        <button onClick={duplicar}>Duplicar actual</button>
      </div>
      <div className="acciones">
        <button onClick={exportar}>Exportar picks (JSON)</button>
        <button onClick={() => archivo.current?.click()}>Importar picks</button>
        <input ref={archivo} type="file" accept="application/json" hidden onChange={importar} />
        <button className="peligro" onClick={() => confirm("¿Borrar TODOS los escenarios y picks? Esto no se puede deshacer.") && reiniciarTodo()}>Reiniciar todo</button>
      </div>
      <p className="ayuda">Todo se guarda automáticamente en este navegador (localStorage). Exporta a JSON para respaldar o compartir.</p>
    </div>
  );
}

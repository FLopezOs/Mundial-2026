# Polla Mundial 2026 — simulador de pronósticos

App local (Vite + React, sin backend) alimentada por el Tracker del proyecto.

## Correr

```bash
cd webapp
npm install        # solo la primera vez
npm run dev        # abre la URL que indica Vite (usable desde el celular en la misma red con --host)
npm run build      # genera estático en dist/ (abrible con npm run preview o cualquier hosting)
```

## Regenerar los datos

La app lee `public/data.json`. Después de cada actualización del Tracker
(`modelo/actualizar.py` + recálculo del xlsx), correr desde la raíz del proyecto:

```bash
python3 modelo/exportar_json.py
```

y recargar la página. Los resultados oficiales del data.json **siempre prevalecen**
sobre tus picks: si un partido que pronosticaste ya se jugó, tu pick queda marcado
como acertado/fallado y deja de ser editable.

## Uso

- **Grupos**: ingresa tu marcador por partido pendiente; la probabilidad del modelo
  (P gana A / empate / gana B · marcador más probable) aparece como referencia.
  Tablas y ranking de terceros se recalculan en vivo (Pts → DG → GF).
- **Bracket**: con los 12 grupos completos (reales + picks) se puebla el R32.
  Un clic elige al ganador; segundo clic sobre el mismo equipo marca "por penales".
- **Escenarios**: múltiples escenarios con nombre, exportar/importar picks en JSON,
  reiniciar todo. Todo persiste en localStorage del navegador.
- **Resumen**: pronóstico completo + comparativo vs. modelo, con descarga a HTML
  autocontenido y a PDF (diálogo de impresión del navegador → "Guardar como PDF",
  A4 horizontal ya configurado).

## Estructura

```
src/lib/calculos.js        lógica pura (tablas, terceros, bracket, aciertos, comparativo)
src/lib/useLocalStorage.js persistencia y escenarios
src/lib/exportHtml.js      HTML autocontenido para descarga
src/components/            Grupos, Bracket, Resumen, Escenarios
```

Limitación conocida (igual que el Tracker): desempates por head-to-head y fair play
no automatizados; la asignación de terceros a las llaves usa la regla "mejor rankeado
elegible disponible", que puede diferir de la asignación oficial FIFA.

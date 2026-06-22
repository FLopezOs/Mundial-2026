# PROYECTO: Tracker y Modelo Predictivo — Mundial 2026 (v2)

> Este archivo es el contexto maestro del proyecto. Toda sesión de Cowork debe leerlo
> completo antes de tocar cualquier archivo. Define la metodología, las convenciones
> y las rutinas de actualización. Si una instrucción del usuario contradice este
> documento, prevalece la instrucción del usuario y se actualiza este archivo.

---

## 1. Propósito

Mantener un Excel vivo (`output/Mundial2026_Tracker.xlsx`) que:
1. Registre los resultados de los 104 partidos del Mundial 2026 (Canadá/México/EE.UU., 11-jun al 19-jul).
2. Actualice ratings Elo de las 48 selecciones partido a partido.
3. Genere predicciones probabilísticas (1X2 + marcador más probable) para cada partido pendiente, combinando Elo + Poisson.
4. Proyecte tablas de grupos, ranking de mejores terceros y bracket eliminatorio.
5. Cuando se solicite, corra una simulación Monte Carlo del torneo completo (script Python, no fórmulas).

Principio de diseño: **las fórmulas por partido viven en Excel** (el usuario quiere poder jugar con escenarios a mano); **lo computacionalmente pesado vive en Python** (`modelo/`): cómputo de Elo histórico, calibración y Monte Carlo. Nunca pegar valores donde corresponde una fórmula viva.

---

## 2. Estructura de carpeta y archivos de datos (ESTADO REAL)

```
Excel Mundial/                     ← raíz del proyecto (carpeta de trabajo de Cowork)
├── INSTRUCCIONES.md               ← este archivo
├── Data/                          ← YA EXISTE, con todos los insumos descargados
│   ├── results.csv                ← Kaggle martj42: histórico internacional 1872-presente
│   ├── shootouts.csv              ← Kaggle: definiciones por penales
│   ├── goalscorers.csv            ← Kaggle: goleadores (NO se usa en el modelo; ignorar)
│   ├── former_names.csv           ← Kaggle: nombres históricos de selecciones
│   ├── Elo_Ratings_Mundial_Completo.xlsx  ← ratings Elo aportados por el usuario (ver §5.1)
│   └── worldcup.json              ← fixture/resultados Mundial 2026 (openfootball)
├── modelo/                        ← Cowork la crea
│   ├── elo_historico.py           ← corre Elo sobre results.csv completo
│   ├── calibrar.py                ← calibración λ y regresión Elo→diferencia de goles
│   ├── actualizar.py              ← refresca worldcup.json, carga resultados, recalcula
│   └── montecarlo.py              ← simulación del torneo (10.000 iteraciones)
└── output/                        ← Cowork la crea
    ├── Mundial2026_Tracker.xlsx   ← entregable único
    └── backups/
```

### 2.1 Esquemas de columnas (documentados por el usuario, fuente Kaggle)

**`results.csv`**: `date`, `home_team`, `away_team`, `home_score` (marcador final incluyendo alargue, SIN penales), `away_score` (ídem), `tournament`, `city`, `country`, `neutral` (TRUE/FALSE, cancha neutral).

**`shootouts.csv`**: `date`, `home_team`, `away_team`, `winner` (ganador de la tanda), `first_shooter`.

**`goalscorers.csv`**: `date`, `home_team`, `away_team`, `team`, `scorer`, `own_goal`, `penalty`. → No es insumo del modelo. Solo usar si el usuario pide explícitamente tracking de goleadores.

**`former_names.csv`**: `current` (nombre actual), `former` (nombre histórico), `start_date`, `end_date`. → Obligatorio para normalizar nombres antes de correr el Elo histórico (ej. unificar selecciones renombradas a su nombre actual).

**`worldcup.json`**: formato openfootball (rondas, fecha, team1/team2, score.ft). Fuente de refresco:
`https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json`
La rutina de actualización (§7) descarga y **sobreescribe** `Data/worldcup.json`.

---

## 3. Formato del torneo 2026 (reglas que el Excel debe implementar)

- 48 selecciones, 12 grupos (A–L) de 4. Total 104 partidos.
- Clasifican al Round of 32: los 2 primeros de cada grupo (24) + los **8 mejores terceros**.
- Desempate en grupo (orden FIFA estándar): puntos → diferencia de gol → goles a favor → resultados entre los empatados (puntos, DG, GF head-to-head) → fair play → sorteo. *Verificar contra el reglamento oficial FIFA 2026 antes del cierre de grupos; si difiere, corregir aquí.*
- Ranking de mejores terceros: puntos → diferencia de gol → goles a favor → fair play → ranking. Mismo disclaimer de verificación.
- Fases eliminatorias: Round of 32 → octavos → cuartos → semis → tercer puesto → final. Si hay igualdad a los 90', alargue y penales. Para el modelo, en eliminación directa P(avanza) = P(gana 90') + 0.5 × P(empate 90') como aproximación (penales ≈ moneda al aire; refinamiento opcional: sesgo leve al equipo con mayor Elo).
- OJO con `results.csv` en eliminatorias históricas: `home_score`/`away_score` incluyen el alargue. Para Elo estricto a 90' es una aproximación aceptable; documentar y no corregir salvo que el usuario lo pida.

---

## 4. Arquitectura del Excel (6 hojas)

### Hoja 1 — `Fixture`
Una fila por partido (104). Columnas: `ID_Partido | Fecha | Fase | Grupo | Equipo_A | Equipo_B | Estadio | Ciudad | Pais_Sede | Localia_A | Localia_B`.
`Localia_X` = 1 solo si el equipo es EE.UU., México o Canadá **y** juega en su país; 0 en cualquier otro caso. Se puebla desde `worldcup.json` (campos de sede según disponibilidad del JSON; si el JSON no trae estadio/ciudad, dejar columna vacía sin inventar).

### Hoja 2 — `Resultados`
Única hoja de entrada manual. Columnas: `ID_Partido | Goles_A | Goles_B | Definido_Por (90/ET/PEN) | Ganador_Penales`. Celdas vacías = partido no jugado. Todo lo demás del libro se deriva de aquí por fórmula. La rutina §7 también escribe aquí (solo partidos nuevos).

### Hoja 3 — `Equipos`
48 filas. Columnas: `Equipo | Confederacion | Elo_Inicial | Elo_Actual | PJ | Att (fuerza ataque) | Def (debilidad defensiva) | Lambda_Base`.
`Elo_Actual` se recalcula en cadena con cada resultado nuevo (§5). `Att`, `Def`, `Lambda_Base` y `Elo_Inicial` son valores calculados por los scripts y pegados con fecha de cálculo anotada en celda — única excepción permitida a la regla de "no pegar valores".
Incluir además una **tabla de equivalencias de nombres** (nombre canónico del libro vs. variantes en `results.csv` y `worldcup.json`, ej. "USA"/"United States").

### Hoja 4 — `Modelo`
Motor de cálculo por partido. Para cada partido (jugado o pendiente): Elo de ambos al momento del partido, expectativa Elo `E_A`, `λ_A`, `λ_B`, y los pasos intermedios de actualización Elo. Solo lectura conceptual: nadie edita aquí.

### Hoja 5 — `Predicciones`
Solo partidos pendientes. Por partido: `P(Gana A) | P(Empate) | P(Gana B) | Marcador_Mas_Probable | P(Marcador)` + matriz de marcadores 0–5 × 0–5 (en hoja auxiliar `Matrices` si el rendimiento lo exige).

### Hoja 6 — `Tablas`
Tablas de los 12 grupos en vivo (fórmulas desde `Resultados`), ranking de mejores terceros, y bracket eliminatorio que se puebla con clasificados reales (y proyecciones del modelo donde aún no hay clasificado, marcadas visualmente como proyección).

---

## 5. Modelo Elo

### 5.1 Elo inicial — orden de precedencia
1. **Inspeccionar primero `Data/Elo_Ratings_Mundial_Completo.xlsx`** (contenido aportado por el usuario, estructura no documentada). Si contiene un rating Elo vigente para las 48 selecciones del Mundial, usarlo como `Elo_Inicial`.
2. **En paralelo, siempre** correr `modelo/elo_historico.py`: algoritmo Elo de §5.2 sobre `results.csv` completo (1872→hoy), normalizando nombres con `former_names.csv` y usando `neutral` para la ventaja de localía histórica. Guardar salida en `Data/elo_calculado.csv`.
3. Comparar ambas fuentes para las 48 selecciones. Si la diferencia mediana es < 50 puntos, usar el xlsx del usuario y guardar el calculado como respaldo. Si hay discrepancias grandes o el xlsx no cubre las 48, **reportar al usuario y preguntar** antes de elegir.

### 5.2 Algoritmo (convenciones eloratings.net)
- **Expectativa**: `E_A = 1 / (1 + 10^(−dr/400))`, donde `dr = (Elo_A + 100·Local_A) − (Elo_B + 100·Local_B)`. En el histórico: `Local_A = 1` si `neutral = FALSE` (el home_team juega en casa); en el Mundial 2026: solo anfitriones en su país (§4, Hoja 1).
- **Resultado**: `S_A` = 1 victoria, 0.5 empate, 0 derrota. Los penales cuentan como empate para Elo (consistente con que `results.csv` no incluye penales en el marcador).
- **K por torneo** (histórico): Mundial = 60; continentales y Confederaciones = 50; eliminatorias y torneos mayores = 40; Nations League y similares = 30; amistosos = 20. Para el Mundial 2026: **K = 60**.
- **Multiplicador por diferencia de goles G**: gana por 1 → G=1; por 2 → G=1.5; por 3 → G=1.75; por N>3 → G = 1.75 + (N−3)/8.
- **Actualización**: `Elo_nuevo_A = Elo_A + K·G·(S_A − E_A)` (simétrico para B).
- Equipos nuevos en el histórico parten en 1500 (ajuste fino opcional por confederación; no bloqueante).

El Elo usado para predecir un partido del Mundial es siempre el **Elo vigente a esa fecha** (encadenado en la hoja `Modelo`), no el inicial.

---

## 6. Modelo de goles (Poisson) y probabilidades 1X2

### Calibración (script `modelo/calibrar.py`, se corre una vez al inicio)
Con `results.csv` (nombres ya normalizados vía `former_names.csv`):
1. Filtrar partidos desde 2018-01-01. Ponderación temporal exponencial: peso = `exp(−(años_atrás)/2)`. Partidos de competencia oficial (columna `tournament` ≠ "Friendly") pesan 1.5×.
2. Estimar μ = media ponderada de goles por partido (referencia esperada: ~2.5–2.8).
3. Regresión: diferencia de goles esperada `Δ` en función de la diferencia Elo del momento (`Δ ≈ β·dr`, controlando localía vía `neutral`). β típico ≈ 0.004–0.006 por punto Elo — usar el valor que arroje la regresión, no el típico. Requiere el Elo histórico encadenado de `elo_historico.py` (cada partido con el Elo vigente a su fecha).
4. Estimar `Att` y `Def` por equipo (goles anotados/recibidos relativos a μ, ajustados por calidad de rivales vía Elo).

### Predicción por partido (fórmulas Excel, hoja `Modelo`)
1. `Δ = β · dr` (con localía incluida en dr).
2. `Total = μ · √(Att_A · Att_B · Def_A · Def_B)` acotado a [1.8, 3.6].
3. `λ_A = (Total + Δ)/2`, `λ_B = (Total − Δ)/2`, mínimo 0.2 cada uno.
4. Matriz de marcadores: `P(a,b) = POISSON.DIST(a, λ_A, 0) · POISSON.DIST(b, λ_B, 0)` para a,b ∈ [0,5]; documentar el tratamiento del residuo (>5 goles).
5. `P(Gana A)` = triángulo inferior; `P(Empate)` = diagonal; `P(Gana B)` = triángulo superior. Marcador más probable = argmax.

Refinamiento opcional (no bloqueante, solo si el usuario lo pide): ajuste Dixon-Coles para 0-0 y 1-1; uso de `shootouts.csv` para estimar si existe ventaja real del que patea primero en vez del 50/50 de §3.

---

## 7. Rutina de actualización post-jornada

Cuando el usuario pida "actualiza el mundial" (o similar), ejecutar en orden:
1. Descargar el JSON de openfootball (URL en §2.1), sobreescribir `Data/worldcup.json`, comparar contra la hoja `Resultados`.
2. Cargar solo los partidos nuevos en `Resultados` (nunca sobreescribir un resultado digitado manualmente por el usuario; ante conflicto, reportar y preguntar).
3. Verificar que el recálculo en cadena de Elo fluyó correctamente (spot-check de 2-3 equipos).
4. Reportar: resultados cargados, mayores movimientos de Elo, y los 3 cambios más relevantes en `Predicciones` y en la proyección de clasificados.
5. No regenerar el archivo desde cero: editar el existente. El usuario puede tener notas o formato propio.
6. Si la descarga del JSON falla o viene desactualizado respecto a la fecha actual, avisar y ofrecer carga manual.

---

## 8. Monte Carlo (script `modelo/montecarlo.py`, bajo demanda)

- 10.000 simulaciones del torneo restante desde el estado actual.
- En cada simulación: muestrear marcadores desde las matrices Poisson, actualizar Elo dentro de la simulación, aplicar reglas de grupo + mejores terceros + bracket (§3), resolver empates eliminatorios con la regla de §3.
- Salida: hoja `MonteCarlo` con, por selección: P(pasa de grupo), P(R32), P(octavos), P(cuartos), P(semis), P(final), P(campeón). Incluir fecha/hora de la corrida y semilla.
- Correr solo cuando el usuario lo pida explícitamente.

---

## 9. Convenciones y reglas duras

- **Nombres de equipos**: nombre canónico único en todo el libro; tabla de equivalencias en `Equipos` para mapear variantes de `results.csv` y `worldcup.json`. Para el histórico, `former_names.csv` es la fuente de normalización.
- **Idioma del Excel**: español (encabezados y etiquetas). En openpyxl escribir fórmulas con sintaxis estándar inglesa (separador `,`); Excel las traduce al abrir.
- **Sin macros/VBA**: todo en fórmulas nativas + scripts Python externos.
- **Transparencia del modelo**: toda probabilidad mostrada debe rastrearse a sus insumos (Elo, λ). Nada de números mágicos sin celda de origen.
- **Honestidad estadística**: nota visible en `Predicciones`: las probabilidades son de un modelo Elo+Poisson calibrado con datos históricos; no incorpora lesiones, alineaciones ni clima, y en fútbol el favorito pierde con frecuencia.
- **Backups**: antes de cualquier modificación estructural del xlsx, copiar a `output/backups/Tracker_YYYYMMDD_HHMM.xlsx`. Máximo 10 backups, borrar los más viejos.

---

## 10. Estado del proyecto (mantener actualizado)

| Fecha | Hito |
|---|---|
| 2026-06-12 | Proyecto definido (v1). |
| 2026-06-12 | v2: datos completos en `Data/` (Kaggle: results, shootouts, goalscorers, former_names; worldcup.json descargado; Elo xlsx aportado por el usuario). Esquemas documentados en §2.1. Pendiente: primera construcción del Tracker (carpetas `modelo/` y `output/`, Elo inicial §5.1, calibración §6, xlsx con 6 hojas §4, carga de resultados ya jugados). |
| 2026-06-12 | Primera construcción completada. Elo inicial: **calculado propio** (decisión del usuario tras comparación §5.1: mediana \|diff\| vs xlsx = 87 pts > 50 y al xlsx le faltaba Corea del Sur; xlsx queda de respaldo en `Data/`). Calibración: μ=2.778, β=0.00508, ventana 2018→2026-06-10 (en `Data/calibracion.json`); Att/Def excluyen mismatches con λ esperado <0.3 y van acotados a [0.75, 1.3]. Tracker con 7 hojas (las 6 de §4 + `Matrices` con selector de partido). Nombres canónicos en **español**; equivalencias en `Equipos`. Elo encadenado vía grid AE:BZ en `Modelo` (fila 2 = inicial). Fórmulas usan `POISSON` (forma legada; `POISSON.DIST` da #NAME? vía openpyxl). 3 resultados cargados (MEX 2-0 RSA, KOR 2-1 CZE, CAN 1-1 BIH) con `actualizar.py`; cadena Elo verificada contra Python (match exacto). Scripts: `elo_historico.py`, `calibrar.py`, `actualizar.py`, `montecarlo.py` (probado en seco, sin escribir hoja) + `construir_tracker{,2,3}.py` (constructores, reproducibles) y `comun.py` (equivalencias). Limitaciones documentadas en el libro: desempates head-to-head/fair-play no automatizados; asignación de terceros al bracket aproximada hasta que cierren grupos. OJO: la descarga del JSON falla desde el sandbox (403 de red); usar el `Data/worldcup.json` local refrescado manualmente. |

| 2026-06-12 | Webapp de pronósticos construida (`webapp/`, §11): Vite + React sin backend, en español, responsive. `modelo/exportar_json.py` exporta el Tracker a `webapp/public/data.json` (correr tras cada actualización §7). Funcionalidades: picks por partido con prob. del modelo de referencia, tablas y terceros en vivo, bracket clicable (penales en empate conceptual), escenarios múltiples en localStorage con export/import JSON, vista Resumen con comparativo vs. modelo y descargas HTML autocontenido + PDF (impresión A4 horizontal). Reales siempre prevalecen sobre picks; marcador de aciertos (1X2 y exactos) en el header. Verificado: `npm run build` sin errores y suite de lógica en Node (tablas, terceros sin duplicados en bracket, cadena W/L hasta campeón, picks inválidos ignorados). `node_modules/` no se versiona (.gitignore); correr `npm install` en la máquina del usuario. Detalles en `webapp/README.md`. |

| 2026-06-12 | Corrección manual: CAN-BIH estaba 2-1 en `Resultados` (edición posterior a la carga); prensa confirma 1-1 (Larin 78'). Corregido, recalculado (0 errores), Elo verificado (CAN 1871.7 / BIH 1671.9) y `data.json` re-exportado. Frontend: banderas oficiales por selección vía flagcdn.com con fallback (y emoji en el HTML exportado), tema tricolor inspirado en We Are 26. **Sin logos/emblemas FIFA: marca registrada.** Build OK. |

| 2026-06-17 | Integración de datos en vivo. `actualizar.py` ahora usa la **API no oficial de ESPN** (scoreboard `fifa.world`) como fuente principal, con *fallback* a `worldcup.json` de openfootball. Nuevos insumos: `Data/odds.json` (cuotas **DraftKings** vía ESPN: P(1X2) implícitas + moneylines) y `Data/resultados_manuales.json` (resultados que ESPN no capturó; se aplican solo si el Excel tiene `null`). `exportar_json.py` mergea ambos y agrega `horaChile` por partido y la calibración (μ, β, Att/Def) al `data.json`. Webapp: pestaña **En Vivo** que consume ESPN directo en el navegador (estado del partido, estadísticas y cuotas en vivo) + comparativo **modelo vs. mercado** en Inicio/Grupos. Scripts Windows: `actualizar_resultados.bat` → `.ps1` (autodetecta Python, instala deps, corre `actualizar.py` + `exportar_json.py`). Corrección al §10 previo: `montecarlo.py` **sí escribe** la hoja `MonteCarlo` (ya no está "en seco"). |
| 2026-06-22 | Resultado manual cargado: partido 32 = 0-1 (ESPN no lo capturó). `odds.json` y `data.json` refrescados; datos al día (fase de grupos en curso). **Deuda técnica identificada** para resolver en Claude Code: (a) sin control de versiones git; (b) 3 constructores duplicados `construir_tracker{,2,3}.py` por consolidar; (c) la poda de backups no respeta el máx. 10 (hay 11) y respalda aunque no haya cambio estructural; (d) sin *harness* de validación/backtest (Brier/log-loss vs. 2018-2022 y vs. mercado); (e) desempates *head-to-head*/fair-play aún no automatizados. |

*(Cada sesión de Cowork agrega una fila al cerrar.)*

---

## 11. Webapp de pronósticos (`webapp/`)

Simulador personal de pronósticos (Vite + React, sin backend). La app NO lee el xlsx:
consume `webapp/public/data.json`, generado por `modelo/exportar_json.py`.

**Regla de actualización**: después de cada actualización del Tracker (§7: `actualizar.py`
+ recálculo del xlsx), correr:

```
python3 modelo/exportar_json.py
```

Esto regenera `webapp/public/data.json` (104 partidos, resultados reales, Elo actual de
las 48 selecciones y probabilidades del modelo por partido pendiente). Los picks del
usuario viven solo en localStorage del navegador (escenarios con nombre, export/import
JSON desde la propia app). Los resultados reales siempre prevalecen sobre los picks.
Uso y detalles: `webapp/README.md`.


---

## 12. Backlog de mejoras solicitadas por el usuario (2026-06-22)

Solicitadas para ejecutar en **Claude Code**, después de la fundación (git + limpieza de
deuda técnica del §10 + harness de backtest). Orden de prioridad a definir con el usuario.

1. **Auto-actualización sin `.bat`.** Hoy hay que correr `actualizar_resultados.bat` a mano
   para refrescar resultados y predicciones. La pestaña *En Vivo* ya consume ESPN en el
   navegador, pero el pipeline Excel → `data.json` es manual. Objetivo: que la app/página se
   refresque sola (opciones a evaluar: tarea programada de Windows que corra el pipeline; o
   que la webapp lea resultados/predicciones sin depender del recálculo del xlsx).
2. **Historial de estadísticas por partido.** Persistir las estadísticas que hoy solo se ven
   en vivo (ESPN), para clickear un partido terminado y revisar cómo fue su estadística.
3. **Consolidado estadístico por país.** Acumular las estadísticas por partido en un
   rendimiento acumulado por selección a lo largo del Mundial.
4. **Modernización visual** de la webapp, manteniendo el estilo actual (que al usuario le
   gusta) pero con un look más moderno.
5. **Canales de transmisión en Chile** por partido. Preferencia: **DGO (DirecTV GO), Disney+
   y CHV**. Requiere una fuente de la grilla TV/streaming Chile y un campo nuevo por partido.

*(Estas mejoras NO se ejecutan en esta sesión de Cowork: se documentan aquí para el handoff.)*

# Guía paso a paso — Pasar el proyecto a Claude Code (para principiantes)

> Hecha el 2026-06-22. Sigue los pasos en orden. No necesitas saber programar:
> Claude Code hace el trabajo; tú solo instalas, abres la carpeta y le hablas en español.

---

## Parte A — Instalar lo necesario (una sola vez, ~15 min)

### Paso 1. Instalar Git para Windows
Git es lo que guarda el "historial" del proyecto (poder devolverte si algo sale mal).

1. Entra a https://git-scm.com/download/win y descarga el instalador (64-bit).
2. Ábrelo y dale **Next** a todo (las opciones por defecto están bien).
3. Termina con **Install** → **Finish**.

### Paso 2. Instalar Claude Code
1. Abre **PowerShell**: tecla Windows → escribe `powershell` → Enter.
2. Copia y pega esta línea, y dale Enter:

   ```powershell
   irm https://claude.ai/install.ps1 | iex
   ```

3. Espera a que termine (se instala solo).
4. Cierra esa ventana de PowerShell y abre una **nueva** (para que reconozca el comando).

### Paso 3. Iniciar sesión
1. En la nueva PowerShell, escribe:

   ```powershell
   claude
   ```

2. La primera vez te abrirá el navegador para iniciar sesión con tu cuenta de Claude.
   Inicia sesión y vuelve a PowerShell. Listo, ya estás dentro de Claude Code.
3. Para salir en cualquier momento: escribe `/exit` y Enter.

---

## Parte B — Abrir TU proyecto en Claude Code

Claude Code trabaja sobre la carpeta donde lo abras. Hay que pararse en la carpeta del Mundial.

1. Abre PowerShell.
2. Pega esto **tal cual** (incluye las comillas) y Enter, para entrar a la carpeta:

   ```powershell
   cd "C:\Users\felip\OneDrive\Documentos\Personal\Proyectos\Excel Mundial"
   ```

3. Ahora abre Claude Code ahí mismo:

   ```powershell
   claude
   ```

Ya estás dentro, parado en el proyecto. De aquí en adelante le hablas en español.

> Consejo OneDrive: si OneDrive está sincronizando, puede ir un poco lento. No es problema;
> solo ten paciencia si una operación tarda.

---

## Parte C — Lo primero que le pides a Claude Code (la "fundación")

Copia y pega este mensaje **completo** dentro de Claude Code y dale Enter. Es la base; no
inventes nada más todavía.

> Lee INSTRUCCIONES.md completo, especialmente §10 (estado real) y §12 (mejoras pendientes).
> Antes de tocar nada: inicia git en esta carpeta, crea un .gitignore que excluya
> node_modules, los archivos .xlsx pesados de output/backups y archivos temporales, y haz un
> primer commit que congele el estado actual como "baseline". Explícame en pasos simples qué
> hiciste. No ejecutes todavía las mejoras del §12.

Claude Code te irá pidiendo permiso antes de cada acción (responde **yes** / **sí**). Cuando
termine, tendrás el proyecto "fotografiado": cualquier cambio futuro se puede revertir.

### Después de la fundación (mismo chat, uno a la vez):
1. "Consolida los 3 constructores `construir_tracker{,2,3}.py` en uno solo y borra los otros, sin romper el xlsx."
2. "Arregla la poda de backups: máximo 10, y que no respalde si no hubo cambios."
3. "Crea un backtest que mida qué tan bueno es el modelo (Brier y log-loss) contra los Mundiales 2018 y 2022 y contra las cuotas de mercado."

Cada vez que Claude Code termine algo, pídele: **"haz un commit con un mensaje claro"**.
Así queda guardado y reversible.

---

## Parte D — Tus 5 mejoras (cuando la fundación esté lista)

Están escritas en `INSTRUCCIONES.md` §12. Pídeselas a Claude Code de a una, en orden de lo
que más te importe. Ejemplo para la primera:

> Quiero que la app/página se actualice sola, sin tener que correr el .bat cada vez.
> Revisa el §12 punto 1 de INSTRUCCIONES.md y propón 2 opciones simples antes de implementar.

---

## Si algo se complica
- Para deshacer el último cambio: dile a Claude Code *"devuélveme al commit anterior"*.
- Si te pierdes: dile *"explícame en palabras simples qué está pasando"*.
- Para cerrar: `/exit`. Tu trabajo queda guardado en la carpeta.

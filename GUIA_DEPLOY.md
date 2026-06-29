# Guía paso a paso — Publicar la app en internet (GitHub Pages)

> Etapa 1: dejar el sitio vivo con un link para compartir. Sigue los pasos en orden.
> Ya tienes cuenta de GitHub. El repositorio será **público** (cualquiera ve el código y
> los datos del Mundial, pero NO puede cambiar nada; tus pronósticos quedan en tu navegador).

---

## Parte A — Crear el repositorio en GitHub (en la web)

1. Entra a https://github.com e inicia sesión.
2. Arriba a la derecha, haz clic en el **+** → **New repository**.
3. En **Repository name** escribe: `polla-mundial-2026`
4. Deja **Public** seleccionado (es la opción de arriba).
5. **NO marques** ninguna casilla de "Add a README", ".gitignore" ni "license".
   (Tiene que quedar vacío, o el siguiente paso falla.)
6. Clic en **Create repository**.
7. Te aparecerá una página con comandos. Déjala abierta; la usamos en la Parte B.

---

## Parte B — Subir tu proyecto a ese repositorio

Abre **PowerShell** (tecla Windows → escribe `powershell` → Enter) y pega estos comandos,
**uno por uno**, dándole Enter a cada uno. Reemplaza `TU-USUARIO` por tu nombre de usuario
de GitHub (el que sale en la URL de tu repositorio).

```powershell
cd "C:\Users\felip\OneDrive\Documentos\Personal\Proyectos\Excel Mundial"
git remote add origin https://github.com/TU-USUARIO/polla-mundial-2026.git
git push -u origin master
```

- En el **primer push**, se abrirá una ventana del navegador para iniciar sesión en GitHub.
  Acepta / inicia sesión. Eso autoriza tu computador una sola vez.
- Cuando termine, refresca la página de tu repositorio en GitHub: ya deberías ver todos
  tus archivos ahí.

> Si prefieres, también puedes pegarle estos tres comandos a Claude Code y que los corra él.

---

## Parte C — Activar GitHub Pages

1. En tu repositorio en GitHub, ve a **Settings** (arriba) → en el menú izquierdo, **Pages**.
2. En **Source**, elige **GitHub Actions** (NO "Deploy from a branch").
3. Listo, no hay que guardar nada más.

---

## Parte D — Publicar y obtener el link

1. Ve a la pestaña **Actions** (arriba en tu repositorio).
2. Deberías ver un workflow llamado **"Deploy to GitHub Pages"** corriendo o ya terminado.
   - Si está corriendo (círculo amarillo), espera 1-2 minutos a que quede ✓ verde.
   - Si ves un ✗ rojo en el paso de deploy, casi seguro es que faltó la Parte C: actívala
     y vuelve a correr el workflow (botón **Re-run jobs**).
3. Cuando esté verde, tu link estará en **Settings → Pages**, arriba, algo como:
   `https://TU-USUARIO.github.io/polla-mundial-2026/`
4. Ábrelo. ¡Esa es tu app en vivo! Ese link lo puedes compartir con quien quieras.

---

## Notas
- Por ahora el sitio muestra los datos **tal como están hoy**. Que se actualice solo es la
  **Etapa 2** (el "robot en la nube"), que montamos después de que este link funcione.
- Cada vez que subas cambios (`git push`), el sitio se vuelve a publicar solo.
- Tus pronósticos y los de cada persona viven en el navegador de cada uno: son privados y
  no se mezclan.

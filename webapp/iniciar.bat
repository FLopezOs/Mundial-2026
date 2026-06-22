@echo off
cd /d "%~dp0\.."
echo.
echo =========================================
echo   Polla Mundial 2026
echo =========================================
echo.

REM --- Detectar Python ---
set PYEXE=
for %%c in (py python python3) do (
    if not defined PYEXE (
        %%c --version >nul 2>&1 && set PYEXE=%%c
    )
)
if not defined PYEXE (
    echo [AVISO] Python no encontrado. Saltando actualizacion.
    goto :iniciar
)

REM --- Actualizar resultados ---
echo [1/3] Descargando resultados oficiales...
%PYEXE% modelo\actualizar.py
if errorlevel 1 (
    echo [AVISO] Error en actualizar.py. Continuando con datos anteriores.
)

echo.
echo [2/3] Generando data.json...
%PYEXE% modelo\exportar_json.py
if errorlevel 1 (
    echo [AVISO] Error en exportar_json.py. Continuando con datos anteriores.
)

:iniciar
echo.
cd /d "%~dp0"
echo [3/3] Iniciando servidor en http://localhost:3000
echo       Ctrl+C para detener
echo.
if not exist node_modules (
    echo Instalando dependencias por primera vez...
    call npm install --no-audit --no-fund
)
call npm run dev
pause

Set-Location $PSScriptRoot

Write-Host "=========================================" -ForegroundColor Blue
Write-Host "  Actualizando resultados del Mundial..." -ForegroundColor Blue
Write-Host "=========================================" -ForegroundColor Blue
Write-Host ""

# --- Detectar ejecutable de Python ---
$pyExe = $null
foreach ($cmd in @("py", "python", "python3")) {
    try {
        $ver = & $cmd --version 2>&1
        if ($ver -match "Python \d") { $pyExe = $cmd; break }
    } catch {}
}

if (-not $pyExe) {
    Write-Host "ERROR: Python no esta instalado." -ForegroundColor Red
    Write-Host "Instala desde: https://www.python.org/downloads/" -ForegroundColor Yellow
    Write-Host "Marca 'Add Python to PATH' durante la instalacion." -ForegroundColor Yellow
    Read-Host "`nPresiona Enter para cerrar"
    exit 1
}

Write-Host "Python: $pyExe" -ForegroundColor DarkGray

# --- Instalar dependencias si faltan ---
Write-Host ""
Write-Host "[0/2] Verificando dependencias..." -ForegroundColor Cyan
$paquetes = @("openpyxl", "pandas", "numpy", "requests", "scipy")
foreach ($pkg in $paquetes) {
    $check = & $pyExe -c "import $pkg" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  Instalando $pkg..." -ForegroundColor Yellow
        & $pyExe -m pip install $pkg --quiet
    }
}
Write-Host "  Dependencias OK" -ForegroundColor Green

# --- Actualizar resultados ---
Write-Host ""
Write-Host "[1/3] Descargando resultados oficiales..." -ForegroundColor Cyan
& $pyExe modelo/actualizar.py
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR en actualizar.py" -ForegroundColor Red
    Read-Host "Presiona Enter para cerrar"
    exit 1
}

Write-Host ""
Write-Host "[2/3] Generando datos para la pagina web..." -ForegroundColor Cyan
& $pyExe modelo/exportar_json.py
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR en exportar_json.py" -ForegroundColor Red
    Read-Host "Presiona Enter para cerrar"
    exit 1
}

Write-Host ""
Write-Host "[3/3] Descargando estadisticas de partidos jugados..." -ForegroundColor Cyan
& $pyExe modelo/stats_espn.py
if ($LASTEXITCODE -ne 0) {
    Write-Host "AVISO: stats_espn.py fallo (las estadisticas no se actualizaron)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "  Listo! Presiona F5 en el browser      " -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Read-Host "Presiona Enter para cerrar"

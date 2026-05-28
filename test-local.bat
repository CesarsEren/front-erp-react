@echo off
echo ========================================
echo   PRUEBA LOCAL DEL BUILD
echo ========================================
echo.

REM Verificar que existe dist
if not exist dist (
    echo ERROR: No existe la carpeta dist
    echo Ejecuta primero: npm run build:cruzcargo
    pause
    exit /b 1
)

REM Verificar que existe index.html
if not exist dist\index.html (
    echo ERROR: No existe dist\index.html
    pause
    exit /b 1
)

echo [OK] Carpeta dist encontrada
echo.

REM Mostrar contenido de dist
echo Archivos en dist:
dir /b dist
echo.

REM Verificar rutas en index.html
echo Verificando rutas en index.html...
findstr /C:"/erpfacturacion/" dist\index.html >nul
if %errorlevel% equ 0 (
    echo [OK] Las rutas contienen /erpfacturacion/
) else (
    echo [ERROR] Las rutas NO contienen /erpfacturacion/
    echo Verifica que vite.config.ts tenga: base: '/erpfacturacion/'
)
echo.

REM Mostrar primeras líneas de index.html
echo Contenido de index.html:
echo ----------------------------------------
type dist\index.html
echo ----------------------------------------
echo.

echo ========================================
echo   OPCIONES DE PRUEBA
echo ========================================
echo.
echo 1. Instalar y ejecutar servidor de prueba:
echo    npm install express
echo    node test-server.js
echo.
echo 2. Usar npx serve:
echo    npx serve dist -p 3000
echo.
echo 3. Copiar a tu servidor Nginx:
echo    Ver INSTRUCCIONES-ERPFACTURACION.md
echo.
pause

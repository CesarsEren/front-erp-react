@echo off
echo ========================================
echo   Despliegue a Nginx Windows - CruzCargo
echo ========================================
echo.

REM 1. Compilar
echo [1/4] Compilando proyecto...
call npm run build:cruzcargo
if %errorlevel% neq 0 (
    echo ERROR: Fallo al compilar
    pause
    exit /b %errorlevel%
)
echo.

REM 2. Crear carpeta si no existe
echo [2/4] Preparando carpeta destino...
if not exist "C:\nginx-1.26.2\html\cruzcargo\erpfacturacion" (
    mkdir "C:\nginx-1.26.2\html\cruzcargo\erpfacturacion"
    echo Carpeta creada: C:\nginx-1.26.2\html\cruzcargo\erpfacturacion
) else (
    echo Carpeta ya existe: C:\nginx-1.26.2\html\cruzcargo\erpfacturacion
)
echo.

REM 3. Copiar archivos
echo [3/4] Copiando archivos...
xcopy /E /I /Y dist\* C:\nginx-1.26.2\html\cruzcargo\erpfacturacion\
if %errorlevel% neq 0 (
    echo ERROR: Fallo al copiar archivos
    pause
    exit /b %errorlevel%
)
echo.

REM 4. Verificar archivos
echo Verificando archivos copiados...
if exist "C:\nginx-1.26.2\html\cruzcargo\erpfacturacion\index.html" (
    echo [OK] index.html copiado
) else (
    echo [ERROR] No se encontro index.html
    pause
    exit /b 1
)

if exist "C:\nginx-1.26.2\html\cruzcargo\erpfacturacion\assets" (
    echo [OK] Carpeta assets copiada
) else (
    echo [ERROR] No se encontro carpeta assets
    pause
    exit /b 1
)
echo.

REM 5. Reiniciar Nginx
echo [4/4] Reiniciando Nginx...
cd C:\nginx-1.26.2

REM Verificar configuración primero
nginx -t
if %errorlevel% neq 0 (
    echo ERROR: Configuracion de Nginx invalida
    echo Revisa: C:\nginx-1.26.2\conf\nginx.conf
    pause
    exit /b %errorlevel%
)

REM Recargar Nginx
nginx -s reload
if %errorlevel% neq 0 (
    echo Advertencia: No se pudo recargar Nginx
    echo Intenta reiniciar manualmente:
    echo   1. nginx -s stop
    echo   2. start nginx
)
echo.

echo ========================================
echo   DESPLIEGUE COMPLETADO EXITOSAMENTE
echo ========================================
echo.
echo Archivos desplegados en:
echo   C:\nginx-1.26.2\html\cruzcargo\erpfacturacion\
echo.
echo Acceder a:
echo   https://cruzcargo.pe/erpfacturacion/
echo.
echo Si no funciona, verifica:
echo   1. Nginx esta corriendo: tasklist /FI "IMAGENAME eq nginx.exe"
echo   2. Ver logs: type C:\nginx-1.26.2\logs\error.log
echo   3. Abrir DevTools en el navegador (F12) y ver errores
echo.
pause

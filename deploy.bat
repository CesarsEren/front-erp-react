@echo off
echo ========================================
echo   Despliegue de CruzCargo SPA
echo ========================================
echo.

REM 1. Limpiar build anterior
echo [1/4] Limpiando build anterior...
if exist dist rmdir /s /q dist
echo.

REM 2. Instalar dependencias
echo [2/4] Instalando dependencias...
call npm ci
if %errorlevel% neq 0 (
    echo ERROR: Fallo al instalar dependencias
    pause
    exit /b %errorlevel%
)
echo.

REM 3. Build del proyecto
echo [3/4] Compilando proyecto para CruzCargo...
call npm run build:cruzcargo
if %errorlevel% neq 0 (
    echo ERROR: Fallo al compilar el proyecto
    pause
    exit /b %errorlevel%
)
echo.

REM 4. Verificar build
echo [4/4] Verificando build...
if not exist dist (
    echo ERROR: El directorio dist no fue creado
    pause
    exit /b 1
)

if not exist dist\index.html (
    echo ERROR: index.html no fue generado
    pause
    exit /b 1
)

echo.
echo ========================================
echo   BUILD COMPLETADO EXITOSAMENTE
echo ========================================
echo.
echo Archivos generados en: .\dist
echo.
echo PROXIMOS PASOS:
echo.
echo OPCION 1 - Despliegue manual en Nginx:
echo   1. Copiar todo el contenido de .\dist a /usr/share/nginx/html/erpfacturacion
echo   2. Copiar nginx.conf a /etc/nginx/conf.d/cruzcargo.conf
echo   3. Reiniciar Nginx: sudo systemctl restart nginx
echo   4. Acceder a: http://tu-servidor/erpfacturacion/
echo.
echo OPCION 2 - Despliegue con Docker:
echo   docker build -t cruzcargo-frontend .
echo   docker run -d -p 80:80 cruzcargo-frontend
echo.
echo OPCION 3 - Prueba local con servidor simple:
echo   npx serve -s dist -p 3000
echo.
pause

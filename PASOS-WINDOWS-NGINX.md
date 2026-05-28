# 🪟 Pasos para Desplegar en Nginx Windows

## 📁 Estructura de Carpetas Requerida

Basándome en tu configuración, la estructura debe ser:

```
C:/nginx-1.26.2/
├── html/
│   └── cruzcargo/
│       ├── main/              ← Tu aplicación principal
│       │   └── index.html
│       └── erpfacturacion/    ← Tu aplicación React (ERP)
│           ├── index.html
│           └── assets/
│               ├── index-CBjNPNJm.js
│               ├── vendor-rsJjzirJ.js
│               ├── ui-BY7GwYDJ.js
│               └── index-We4IA5wH.css
└── conf/
    └── nginx.conf
```

## 🚀 Pasos de Despliegue

### 1. Compilar el proyecto
```bash
npm run build:cruzcargo
```

### 2. Copiar archivos a Nginx

**Opción A - Copiar manualmente:**
```bash
# Copiar todo el contenido de dist a la carpeta erpfacturacion
xcopy /E /I /Y dist\* C:\nginx-1.26.2\html\cruzcargo\erpfacturacion\
```

**Opción B - Usando PowerShell:**
```powershell
# Crear carpeta si no existe
New-Item -ItemType Directory -Force -Path "C:\nginx-1.26.2\html\cruzcargo\erpfacturacion"

# Copiar archivos
Copy-Item -Path "dist\*" -Destination "C:\nginx-1.26.2\html\cruzcargo\erpfacturacion\" -Recurse -Force
```

### 3. Verificar que los archivos se copiaron correctamente

```bash
# Listar archivos
dir C:\nginx-1.26.2\html\cruzcargo\erpfacturacion\

# Debes ver:
# - index.html
# - assets\ (carpeta con archivos .js y .css)
```

### 4. Actualizar configuración de Nginx

**Opción A - Reemplazar todo el bloque server:**

1. Abrir: `C:\nginx-1.26.2\conf\nginx.conf`
2. Buscar el bloque `server` para `cruzcargo.pe`
3. Reemplazarlo con el contenido de `nginx-cruzcargo-windows.conf`

**Opción B - Solo actualizar la sección /erpfacturacion:**

Reemplazar esta parte:
```nginx
location /erpfacturacion {
    alias C:/nginx-1.26.2/html/cruzcargo/erpfacturacion;
    index index.html;
    try_files $uri $uri/ /erpfacturacion/index.html;
}

location = /erpfacturacion/index.html {
    alias C:/nginx-1.26.2/html/cruzcargo/erpfacturacion/index.html;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Pragma "no-cache";
    add_header Expires "0";
}

location ~ ^/erpfacturacion/assets/ {
    alias C:/nginx-1.26.2/html/cruzcargo/erpfacturacion/;
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 5. Verificar configuración de Nginx

```bash
# Ir a la carpeta de Nginx
cd C:\nginx-1.26.2

# Verificar sintaxis
nginx -t
```

**Debe decir:** `syntax is ok` y `test is successful`

### 6. Reiniciar Nginx

```bash
# Detener Nginx
nginx -s stop

# Iniciar Nginx
start nginx

# O recargar configuración (sin detener)
nginx -s reload
```

### 7. Verificar que Nginx está corriendo

```bash
# Ver procesos de Nginx
tasklist /FI "IMAGENAME eq nginx.exe"

# Debes ver al menos 2 procesos nginx.exe
```

### 8. Probar en el navegador

```
https://cruzcargo.pe/erpfacturacion/
```

## ❌ Problemas Comunes

### Problema 1: "404 Not Found"

**Causa:** Archivos no están en la ruta correcta

**Solución:**
```bash
# Verificar que existen los archivos
dir C:\nginx-1.26.2\html\cruzcargo\erpfacturacion\index.html
dir C:\nginx-1.26.2\html\cruzcargo\erpfacturacion\assets\

# Si no existen, copiarlos de nuevo
xcopy /E /I /Y dist\* C:\nginx-1.26.2\html\cruzcargo\erpfacturacion\
```

### Problema 2: "403 Forbidden"

**Causa:** Permisos de archivos

**Solución:**
```bash
# Dar permisos de lectura a todos los archivos
icacls C:\nginx-1.26.2\html\cruzcargo\erpfacturacion /grant Everyone:R /T
```

### Problema 3: Página en blanco

**Causa:** Rutas de assets incorrectas

**Solución:**
1. Abrir DevTools (F12) → Console
2. Ver errores de carga de archivos
3. Verificar que `vite.config.ts` tenga: `base: '/erpfacturacion/'`
4. Recompilar: `npm run build:cruzcargo`

### Problema 4: Assets dan 404

**Causa:** Configuración de `alias` incorrecta

**Solución:** Verificar que en nginx.conf:
```nginx
location ~ ^/erpfacturacion/assets/ {
    alias C:/nginx-1.26.2/html/cruzcargo/erpfacturacion/;
    # ↑ Debe terminar con / 
}
```

### Problema 5: Rutas internas dan 404 al recargar

**Causa:** Falta `try_files`

**Solución:**
```nginx
location /erpfacturacion {
    alias C:/nginx-1.26.2/html/cruzcargo/erpfacturacion;
    try_files $uri $uri/ /erpfacturacion/index.html;
    # ↑ Esta línea es CRUCIAL
}
```

## 🔍 Verificación Paso a Paso

### 1. Verificar archivos
```bash
dir C:\nginx-1.26.2\html\cruzcargo\erpfacturacion\
```
✅ Debe mostrar `index.html` y carpeta `assets`

### 2. Verificar contenido de index.html
```bash
type C:\nginx-1.26.2\html\cruzcargo\erpfacturacion\index.html
```
✅ Debe contener rutas como `/erpfacturacion/assets/...`

### 3. Verificar configuración de Nginx
```bash
nginx -t
```
✅ Debe decir `syntax is ok`

### 4. Verificar que Nginx está corriendo
```bash
tasklist /FI "IMAGENAME eq nginx.exe"
```
✅ Debe mostrar al menos 2 procesos

### 5. Verificar logs de error
```bash
type C:\nginx-1.26.2\logs\error.log
```
✅ No debe haber errores recientes

## 📝 Script de Despliegue Automático

Crear archivo `deploy-to-nginx.bat`:

```batch
@echo off
echo ========================================
echo   Despliegue a Nginx Windows
echo ========================================

REM 1. Compilar
echo [1/4] Compilando proyecto...
call npm run build:cruzcargo
if %errorlevel% neq 0 exit /b %errorlevel%

REM 2. Crear carpeta
echo [2/4] Creando carpeta destino...
if not exist "C:\nginx-1.26.2\html\cruzcargo\erpfacturacion" (
    mkdir "C:\nginx-1.26.2\html\cruzcargo\erpfacturacion"
)

REM 3. Copiar archivos
echo [3/4] Copiando archivos...
xcopy /E /I /Y dist\* C:\nginx-1.26.2\html\cruzcargo\erpfacturacion\

REM 4. Reiniciar Nginx
echo [4/4] Reiniciando Nginx...
cd C:\nginx-1.26.2
nginx -s reload

echo.
echo ========================================
echo   DESPLIEGUE COMPLETADO
echo ========================================
echo.
echo Acceder a: https://cruzcargo.pe/erpfacturacion/
echo.
pause
```

## 🎯 Comandos Útiles de Nginx en Windows

```bash
# Ir a la carpeta de Nginx
cd C:\nginx-1.26.2

# Iniciar Nginx
start nginx

# Detener Nginx
nginx -s stop

# Recargar configuración
nginx -s reload

# Verificar configuración
nginx -t

# Ver procesos
tasklist /FI "IMAGENAME eq nginx.exe"

# Matar todos los procesos de Nginx (si se quedó colgado)
taskkill /F /IM nginx.exe

# Ver logs de error
type logs\error.log

# Ver logs de acceso
type logs\access.log
```

## ✅ Checklist Final

- [ ] `npm run build:cruzcargo` ejecutado sin errores
- [ ] Archivos copiados a `C:\nginx-1.26.2\html\cruzcargo\erpfacturacion\`
- [ ] Existe `C:\nginx-1.26.2\html\cruzcargo\erpfacturacion\index.html`
- [ ] Existe `C:\nginx-1.26.2\html\cruzcargo\erpfacturacion\assets\`
- [ ] `nginx -t` pasa sin errores
- [ ] Nginx reiniciado con `nginx -s reload`
- [ ] Acceder a `https://cruzcargo.pe/erpfacturacion/`
- [ ] Verificar en DevTools (F12) que no hay errores 404

## 🆘 Si Nada Funciona

1. **Detener Nginx completamente:**
   ```bash
   taskkill /F /IM nginx.exe
   ```

2. **Verificar que los archivos están donde deben:**
   ```bash
   dir C:\nginx-1.26.2\html\cruzcargo\erpfacturacion\index.html
   ```

3. **Iniciar Nginx de nuevo:**
   ```bash
   cd C:\nginx-1.26.2
   start nginx
   ```

4. **Ver logs en tiempo real:**
   ```bash
   # En PowerShell
   Get-Content C:\nginx-1.26.2\logs\error.log -Wait -Tail 20
   ```

5. **Acceder y revisar consola del navegador (F12)**

# 🔍 Diagnóstico y Solución de Problemas con Nginx

## ✅ Verificación Paso a Paso

### 1. Verificar que el build se generó correctamente

```bash
# En Windows (PowerShell)
dir dist\
dir dist\assets\

# Debes ver:
# - index.html
# - assets\ (con archivos .js y .css)
```

**Archivos esperados:**
- `dist/index.html`
- `dist/assets/index-[hash].js`
- `dist/assets/index-[hash].css`
- `dist/assets/vendor-[hash].js`
- `dist/assets/ui-[hash].js`

---

### 2. Probar localmente ANTES de subir a Nginx

**Opción A - Con Node.js (Express):**
```bash
# Instalar express si no lo tienes
npm install express

# Ejecutar servidor de prueba
node test-server.js
```
Abrir: `http://localhost:3000/erpfacturacion/`

**Opción B - Con serve:**
```bash
npx serve dist -p 3000
```
Abrir: `http://localhost:3000/` (nota: sin /erpfacturacion porque serve no simula subdirectorios)

**Opción C - Con http-server:**
```bash
npx http-server dist -p 3000 --proxy http://localhost:3000?
```

---

### 3. Verificar estructura en el servidor Nginx

```bash
# Conectarse al servidor
ssh usuario@tu-servidor

# Verificar que existe el directorio
ls -la /usr/share/nginx/html/erpfacturacion/

# Debes ver:
# - index.html
# - assets/ (directorio con archivos)
```

**Estructura correcta:**
```
/usr/share/nginx/html/
└── erpfacturacion/
    ├── index.html
    ├── assets/
    │   ├── index-CBjNPNJm.js
    │   ├── vendor-rsJjzirJ.js
    │   ├── ui-BY7GwYDJ.js
    │   └── index-We4IA5wH.css
    └── favicon.ico (si existe)
```

---

### 4. Verificar configuración de Nginx

```bash
# Ver configuración actual
cat /etc/nginx/conf.d/cruzcargo.conf

# O si está en sites-available
cat /etc/nginx/sites-available/cruzcargo

# Verificar sintaxis
sudo nginx -t
```

**Configuración mínima requerida:**
```nginx
server {
    listen 80;
    server_name tu-servidor.com;

    location /erpfacturacion {
        alias /usr/share/nginx/html/erpfacturacion;
        try_files $uri $uri/ /erpfacturacion/index.html;
    }
}
```

---

### 5. Verificar permisos de archivos

```bash
# Los archivos deben ser legibles por nginx
sudo chown -R nginx:nginx /usr/share/nginx/html/erpfacturacion/
sudo chmod -R 755 /usr/share/nginx/html/erpfacturacion/

# O si nginx corre como www-data (Ubuntu/Debian)
sudo chown -R www-data:www-data /usr/share/nginx/html/erpfacturacion/
sudo chmod -R 755 /usr/share/nginx/html/erpfacturacion/
```

---

### 6. Reiniciar Nginx y verificar logs

```bash
# Reiniciar Nginx
sudo systemctl restart nginx

# Verificar que está corriendo
sudo systemctl status nginx

# Ver logs en tiempo real
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

---

## 🐛 Problemas Comunes y Soluciones

### ❌ Problema 1: "404 Not Found" al acceder a /erpfacturacion

**Causas posibles:**
1. Los archivos no están en `/usr/share/nginx/html/erpfacturacion/`
2. La configuración de Nginx no está cargada
3. Permisos incorrectos

**Solución:**
```bash
# Verificar archivos
ls -la /usr/share/nginx/html/erpfacturacion/

# Si no existen, copiarlos
scp -r dist/* usuario@servidor:/usr/share/nginx/html/erpfacturacion/

# Verificar configuración
sudo nginx -t

# Recargar Nginx
sudo systemctl reload nginx
```

---

### ❌ Problema 2: Página en blanco o "Cannot GET /"

**Causa:** Rutas de assets incorrectas

**Solución:**
1. Verificar que `vite.config.ts` tenga: `base: '/erpfacturacion/'`
2. Recompilar: `npm run build:cruzcargo`
3. Verificar en `dist/index.html` que las rutas sean `/erpfacturacion/assets/...`

---

### ❌ Problema 3: Assets (JS/CSS) dan 404

**Causa:** Configuración de `alias` incorrecta en Nginx

**Solución en nginx.conf:**
```nginx
location /erpfacturacion {
    alias /usr/share/nginx/html/erpfacturacion;  # Sin / al final
    try_files $uri $uri/ /erpfacturacion/index.html;
}
```

**NO usar `root`, usar `alias`:**
```nginx
# ❌ INCORRECTO
location /erpfacturacion {
    root /usr/share/nginx/html;
}

# ✅ CORRECTO
location /erpfacturacion {
    alias /usr/share/nginx/html/erpfacturacion;
}
```

---

### ❌ Problema 4: "404 Not Found" al recargar rutas internas

**Ejemplo:** `/erpfacturacion/login` funciona, pero al recargar (F5) da 404

**Causa:** Falta `try_files` en Nginx

**Solución:**
```nginx
location /erpfacturacion {
    alias /usr/share/nginx/html/erpfacturacion;
    try_files $uri $uri/ /erpfacturacion/index.html;  # ← Esto es crucial
}
```

---

### ❌ Problema 5: API no responde (CORS, 502, etc.)

**Causa:** Proxy no configurado o URL incorrecta

**Solución en nginx.conf:**
```nginx
location /api/ {
    proxy_pass https://tu-api-real.com/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

**Y en `.env.cruzcargo`:**
```env
VITE_API_URL=/api  # Ruta relativa para usar el proxy de Nginx
```

---

### ❌ Problema 6: Favicon da 404

**Causa:** Favicon no está en la carpeta dist

**Solución:**
1. Agregar `favicon.ico` en `public/` antes de compilar
2. O ignorar el error (no afecta funcionalidad)

---

## 🧪 Comandos de Diagnóstico

### Verificar que Nginx está escuchando en el puerto 80
```bash
sudo netstat -tlnp | grep :80
# O
sudo ss -tlnp | grep :80
```

### Verificar configuración de Nginx
```bash
# Ver todas las configuraciones cargadas
sudo nginx -T

# Verificar sintaxis
sudo nginx -t
```

### Probar acceso desde el servidor
```bash
# Desde el servidor, probar localmente
curl http://localhost/erpfacturacion/

# Debe retornar el HTML de index.html
```

### Ver logs en tiempo real
```bash
# Terminal 1: Logs de error
sudo tail -f /var/log/nginx/error.log

# Terminal 2: Logs de acceso
sudo tail -f /var/log/nginx/access.log

# Luego acceder desde el navegador y ver qué se registra
```

---

## 📋 Checklist de Despliegue

Antes de declarar que "no funciona", verifica:

- [ ] `npm run build:cruzcargo` ejecutado sin errores
- [ ] Existe `dist/index.html` con rutas `/erpfacturacion/assets/...`
- [ ] Archivos copiados a `/usr/share/nginx/html/erpfacturacion/`
- [ ] Permisos correctos (755 para directorios, 644 para archivos)
- [ ] Configuración de Nginx tiene `location /erpfacturacion` con `alias`
- [ ] Configuración tiene `try_files $uri $uri/ /erpfacturacion/index.html;`
- [ ] `sudo nginx -t` pasa sin errores
- [ ] Nginx reiniciado: `sudo systemctl restart nginx`
- [ ] Firewall permite tráfico en puerto 80
- [ ] Accediendo a `http://servidor/erpfacturacion/` (con / al final)

---

## 🔬 Prueba Definitiva

### Paso 1: Crear archivo de prueba
```bash
# En el servidor
echo "NGINX FUNCIONA" | sudo tee /usr/share/nginx/html/erpfacturacion/test.txt
```

### Paso 2: Acceder desde navegador
```
http://tu-servidor/erpfacturacion/test.txt
```

**Si ves "NGINX FUNCIONA":** Nginx está sirviendo archivos correctamente
**Si da 404:** Problema con la configuración de Nginx o permisos

---

## 🆘 Si Nada Funciona

### Opción 1: Configuración mínima de Nginx

Crear archivo `/etc/nginx/conf.d/test.conf`:
```nginx
server {
    listen 8080;
    
    location /erpfacturacion {
        alias /usr/share/nginx/html/erpfacturacion;
        index index.html;
        try_files $uri $uri/ /erpfacturacion/index.html;
    }
}
```

Reiniciar y probar en puerto 8080:
```bash
sudo systemctl restart nginx
curl http://localhost:8080/erpfacturacion/
```

### Opción 2: Usar Docker (más confiable)

```bash
# En tu máquina local
docker build -t cruzcargo-frontend .
docker run -d -p 8080:80 cruzcargo-frontend

# Acceder a http://localhost:8080/erpfacturacion/
```

---

## 📞 Información para Soporte

Si necesitas ayuda, proporciona:

1. **Salida de:**
   ```bash
   ls -la /usr/share/nginx/html/erpfacturacion/
   cat /etc/nginx/conf.d/cruzcargo.conf
   sudo nginx -t
   sudo tail -20 /var/log/nginx/error.log
   ```

2. **Captura de pantalla de:**
   - Navegador mostrando el error
   - Consola del navegador (F12 → Console)
   - Network tab (F12 → Network)

3. **¿Qué URL estás usando?**
   - ¿Con o sin / al final?
   - ¿HTTP o HTTPS?

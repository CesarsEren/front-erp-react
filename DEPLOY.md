# Guía de Despliegue - CruzCargo Frontend

## 📋 Requisitos Previos

- Node.js 18+ instalado
- Nginx instalado en el servidor (o Docker)
- Acceso SSH al servidor (para despliegue manual)

## 🚀 Opción 1: Despliegue Manual en Nginx

### Paso 1: Compilar el proyecto

**En Windows:**
```bash
npm run build:cruzcargo
```

O ejecutar el script:
```bash
deploy.bat
```

**En Linux/Mac:**
```bash
npm run build:cruzcargo
```

O ejecutar el script:
```bash
chmod +x deploy.sh
./deploy.sh
```

### Paso 2: Copiar archivos al servidor

```bash
# Desde tu máquina local
scp -r dist/* usuario@servidor:/usr/share/nginx/html/
scp nginx.conf usuario@servidor:/etc/nginx/conf.d/cruzcargo.conf
```

### Paso 3: Configurar Nginx en el servidor

```bash
# Conectarse al servidor
ssh usuario@servidor

# Verificar la configuración de Nginx
sudo nginx -t

# Si todo está OK, reiniciar Nginx
sudo systemctl restart nginx

# Verificar que Nginx esté corriendo
sudo systemctl status nginx
```

### Paso 4: Verificar el despliegue

Abrir en el navegador: `http://tu-servidor/`

---

## 🐳 Opción 2: Despliegue con Docker (Recomendado)

### Paso 1: Construir la imagen

```bash
docker build -t cruzcargo-frontend .
```

### Paso 2: Ejecutar el contenedor

```bash
docker run -d \
  --name cruzcargo-app \
  -p 80:80 \
  --restart unless-stopped \
  cruzcargo-frontend
```

### Paso 3: Verificar que está corriendo

```bash
docker ps
docker logs cruzcargo-app
```

### Comandos útiles de Docker

```bash
# Ver logs
docker logs -f cruzcargo-app

# Detener el contenedor
docker stop cruzcargo-app

# Iniciar el contenedor
docker start cruzcargo-app

# Eliminar el contenedor
docker rm -f cruzcargo-app

# Reconstruir y redesplegar
docker build -t cruzcargo-frontend . && \
docker rm -f cruzcargo-app && \
docker run -d --name cruzcargo-app -p 80:80 --restart unless-stopped cruzcargo-frontend
```

---

## 🐳 Opción 3: Docker Compose

Crear archivo `docker-compose.yml`:

```yaml
version: '3.8'

services:
  cruzcargo-frontend:
    build: .
    container_name: cruzcargo-app
    ports:
      - "80:80"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/"]
      interval: 30s
      timeout: 3s
      retries: 3
```

Ejecutar:
```bash
docker-compose up -d
```

---

## 🧪 Opción 4: Prueba Local

Para probar el build localmente antes de desplegar:

```bash
# Opción 1: Con npx serve
npx serve -s dist -p 3000

# Opción 2: Con http-server
npx http-server dist -p 3000

# Opción 3: Con vite preview
npm run preview
```

Abrir: `http://localhost:3000`

---

## 🔧 Configuración de Nginx

### Ubicación de archivos en el servidor

- **HTML/JS/CSS:** `/usr/share/nginx/html/`
- **Configuración:** `/etc/nginx/conf.d/cruzcargo.conf`
- **Logs:** `/var/log/nginx/`

### Comandos útiles de Nginx

```bash
# Verificar configuración
sudo nginx -t

# Recargar configuración (sin downtime)
sudo nginx -s reload

# Reiniciar Nginx
sudo systemctl restart nginx

# Ver logs en tiempo real
sudo tail -f /var/log/nginx/cruzcargo_access.log
sudo tail -f /var/log/nginx/cruzcargo_error.log
```

---

## 🔐 Configuración HTTPS (Opcional pero Recomendado)

### Con Let's Encrypt (Certbot)

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obtener certificado SSL
sudo certbot --nginx -d cruzcargo.com -d www.cruzcargo.com

# Renovación automática (ya configurada por defecto)
sudo certbot renew --dry-run
```

---

## 🐛 Solución de Problemas

### Problema: "404 Not Found" en rutas de React Router

**Solución:** Verificar que nginx.conf tenga:
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### Problema: Assets no cargan (404 en archivos .js, .css)

**Solución:** Verificar que `base: '/'` esté en `vite.config.ts`

### Problema: API no responde

**Solución:** Verificar la configuración del proxy en nginx.conf:
```nginx
location /api/ {
    proxy_pass https://cruzcargo/api/;
}
```

### Problema: Cambios no se reflejan

**Solución:** Limpiar caché del navegador o hacer hard refresh (Ctrl+Shift+R)

---

## 📊 Verificación del Build

Después de compilar, verificar:

1. ✅ Existe `dist/index.html`
2. ✅ Existe `dist/assets/` con archivos .js y .css
3. ✅ Tamaño del build es razonable (< 5MB típicamente)

```bash
# Ver tamaño del build
du -sh dist

# Listar archivos
ls -lh dist/assets/
```

---

## 🔄 Actualización del Sitio

### Despliegue manual

```bash
# 1. Compilar nueva versión
npm run build:cruzcargo

# 2. Hacer backup del anterior
ssh usuario@servidor "cp -r /usr/share/nginx/html /usr/share/nginx/html.backup"

# 3. Subir nueva versión
scp -r dist/* usuario@servidor:/usr/share/nginx/html/

# 4. Limpiar caché de Nginx (opcional)
ssh usuario@servidor "sudo nginx -s reload"
```

### Con Docker

```bash
# Reconstruir y redesplegar
docker build -t cruzcargo-frontend . && \
docker rm -f cruzcargo-app && \
docker run -d --name cruzcargo-app -p 80:80 --restart unless-stopped cruzcargo-frontend
```

---

## 📝 Checklist de Despliegue

- [ ] Ejecutar `npm run build:cruzcargo`
- [ ] Verificar que `dist/` fue creado correctamente
- [ ] Copiar archivos al servidor
- [ ] Configurar nginx.conf
- [ ] Reiniciar Nginx
- [ ] Probar todas las rutas principales
- [ ] Verificar que la API funciona
- [ ] Configurar HTTPS (producción)
- [ ] Configurar monitoreo/logs

---

## 📞 Soporte

Si encuentras problemas, verifica:
1. Logs de Nginx: `/var/log/nginx/cruzcargo_error.log`
2. Consola del navegador (F12)
3. Network tab para ver requests fallidos

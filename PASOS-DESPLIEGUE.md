# 🚀 PASOS RÁPIDOS PARA DESPLEGAR CRUZCARGO EN NGINX

## ⚡ Método Rápido (Windows)

### 1. Compilar el proyecto
```bash
npm run build:cruzcargo
```

### 2. Verificar que se creó la carpeta `dist`
- Debe existir: `dist/index.html`
- Debe existir: `dist/assets/` con archivos .js y .css

### 3. Copiar archivos al servidor Nginx

**Opción A - Si tienes acceso SSH:**
```bash
scp -r dist/* usuario@tu-servidor:/usr/share/nginx/html/
scp nginx.conf usuario@tu-servidor:/etc/nginx/conf.d/cruzcargo.conf
```

**Opción B - Manualmente:**
1. Comprimir la carpeta `dist` en un .zip
2. Subirlo al servidor por FTP/SFTP
3. Descomprimir en `/usr/share/nginx/html/`

### 4. En el servidor, configurar Nginx

```bash
# Conectarse al servidor
ssh usuario@tu-servidor

# Copiar la configuración
sudo cp nginx.conf /etc/nginx/conf.d/cruzcargo.conf

# Editar si es necesario
sudo nano /etc/nginx/conf.d/cruzcargo.conf

# Verificar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

### 5. ¡Listo! Abre tu navegador
```
http://tu-servidor/
```

---

## 🐳 Método con Docker (MÁS FÁCIL)

### 1. Compilar y crear imagen Docker
```bash
docker build -t cruzcargo-frontend .
```

### 2. Ejecutar contenedor
```bash
docker run -d --name cruzcargo-app -p 80:80 --restart unless-stopped cruzcargo-frontend
```

### 3. ¡Listo! Abre tu navegador
```
http://localhost/
```

---

## 🔧 IMPORTANTE: Configuración de la API

Antes de compilar, verifica en `.env.cruzcargo`:

```env
# Si tu API está en el mismo servidor:
VITE_API_URL=/api

# Si tu API está en otro servidor:
VITE_API_URL=https://api.cruzcargo.com
```

Y en `nginx.conf` debe estar configurado el proxy:

```nginx
location /api/ {
    proxy_pass https://tu-servidor-api/api/;
    # ... resto de configuración
}
```

---

## ❌ Problemas Comunes

### Problema 1: "Cannot GET /ruta" al recargar página
**Causa:** Nginx no está redirigiendo correctamente las rutas de React Router

**Solución:** Verificar que `nginx.conf` tenga:
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### Problema 2: Archivos .js y .css dan 404
**Causa:** Ruta base incorrecta

**Solución:** En `vite.config.ts` debe tener:
```typescript
base: '/'
```

### Problema 3: API no responde
**Causa:** Configuración de proxy incorrecta

**Solución:** Verificar en `nginx.conf`:
```nginx
location /api/ {
    proxy_pass https://tu-api-real.com/api/;
}
```

### Problema 4: Página en blanco
**Causa:** Error de JavaScript

**Solución:** 
1. Abrir consola del navegador (F12)
2. Ver errores en la pestaña Console
3. Verificar que todos los archivos carguen en Network

---

## 📝 Checklist Antes de Desplegar

- [ ] Configurar correctamente `VITE_API_URL` en `.env.cruzcargo`
- [ ] Ejecutar `npm run build:cruzcargo`
- [ ] Verificar que existe `dist/index.html`
- [ ] Configurar dominio en `nginx.conf` (línea `server_name`)
- [ ] Configurar proxy de API en `nginx.conf` (línea `proxy_pass`)
- [ ] Copiar archivos al servidor
- [ ] Reiniciar Nginx
- [ ] Probar en navegador

---

## 🎯 Comandos Útiles

```bash
# Ver logs de Nginx en tiempo real
sudo tail -f /var/log/nginx/cruzcargo_access.log
sudo tail -f /var/log/nginx/cruzcargo_error.log

# Reiniciar Nginx
sudo systemctl restart nginx

# Verificar configuración de Nginx
sudo nginx -t

# Ver procesos de Docker
docker ps

# Ver logs de Docker
docker logs -f cruzcargo-app
```

---

## 📞 ¿Necesitas ayuda?

1. Revisa los logs de Nginx
2. Revisa la consola del navegador (F12)
3. Verifica que la API esté funcionando
4. Consulta el archivo `DEPLOY.md` para más detalles

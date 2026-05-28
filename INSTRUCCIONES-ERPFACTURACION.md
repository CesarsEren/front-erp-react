# 🚀 Despliegue en /erpfacturacion

## ⚡ Pasos Rápidos

### 1. Compilar el proyecto
```bash
npm run build:cruzcargo
```

### 2. Copiar archivos al servidor

**La aplicación se desplegará en:** `http://tu-servidor/erpfacturacion/`

```bash
# Crear directorio en el servidor
ssh usuario@servidor "sudo mkdir -p /usr/share/nginx/html/erpfacturacion"

# Copiar archivos del build
scp -r dist/* usuario@servidor:/usr/share/nginx/html/erpfacturacion/

# Copiar configuración de Nginx
scp nginx.conf usuario@servidor:/etc/nginx/conf.d/cruzcargo.conf
```

### 3. Configurar Nginx en el servidor

```bash
# Conectarse al servidor
ssh usuario@servidor

# Verificar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

### 4. Acceder a la aplicación

```
http://tu-servidor/erpfacturacion/
```

---

## 📁 Estructura de Archivos en el Servidor

```
/usr/share/nginx/html/
└── erpfacturacion/
    ├── index.html
    ├── assets/
    │   ├── index-abc123.js
    │   ├── index-def456.css
    │   └── ...
    └── ...
```

---

## 🔧 Configuración Importante

### vite.config.ts
```typescript
base: '/erpfacturacion/',  // ✅ Ya configurado
```

### nginx.conf
```nginx
location /erpfacturacion {
    alias /usr/share/nginx/html/erpfacturacion;
    try_files $uri $uri/ /erpfacturacion/index.html;
}
```

---

## 🐳 Con Docker

Si usas Docker, los archivos se copiarán automáticamente a `/usr/share/nginx/html/erpfacturacion`:

```bash
docker build -t cruzcargo-frontend .
docker run -d --name cruzcargo-app -p 80:80 cruzcargo-frontend
```

Acceder a: `http://localhost/erpfacturacion/`

---

## ✅ Verificación

Después del despliegue, verifica:

1. **Página principal carga:** `http://tu-servidor/erpfacturacion/`
2. **Assets cargan correctamente:** Revisa en DevTools (F12) → Network
3. **Rutas funcionan:** Navega por la aplicación y recarga (F5)
4. **API funciona:** Verifica que las llamadas a la API respondan

---

## 🔄 Actualización

Para actualizar la aplicación:

```bash
# 1. Compilar nueva versión
npm run build:cruzcargo

# 2. Hacer backup (opcional)
ssh usuario@servidor "sudo cp -r /usr/share/nginx/html/erpfacturacion /usr/share/nginx/html/erpfacturacion.backup"

# 3. Subir nueva versión
scp -r dist/* usuario@servidor:/usr/share/nginx/html/erpfacturacion/

# 4. Limpiar caché del navegador (Ctrl+Shift+R)
```

---

## ❌ Solución de Problemas

### Problema: 404 al acceder a /erpfacturacion
**Solución:** Verificar que los archivos estén en `/usr/share/nginx/html/erpfacturacion/`

### Problema: Assets dan 404
**Solución:** Verificar que `base: '/erpfacturacion/'` esté en vite.config.ts

### Problema: Rutas internas dan 404 al recargar
**Solución:** Verificar configuración de nginx.conf:
```nginx
location /erpfacturacion {
    try_files $uri $uri/ /erpfacturacion/index.html;
}
```

---

## 📝 Comandos Útiles

```bash
# Ver archivos en el servidor
ssh usuario@servidor "ls -la /usr/share/nginx/html/erpfacturacion/"

# Ver logs de Nginx
ssh usuario@servidor "sudo tail -f /var/log/nginx/cruzcargo_error.log"

# Reiniciar Nginx
ssh usuario@servidor "sudo systemctl restart nginx"

# Verificar configuración de Nginx
ssh usuario@servidor "sudo nginx -t"
```

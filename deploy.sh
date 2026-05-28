#!/bin/bash

# Script de despliegue para CruzCargo SPA

echo "🚀 Iniciando despliegue de CruzCargo..."

# 1. Limpiar build anterior
echo "🧹 Limpiando build anterior..."
rm -rf dist

# 2. Instalar dependencias
echo "📦 Instalando dependencias..."
npm ci

# 3. Build del proyecto
echo "🔨 Compilando proyecto..."
npm run build:cruzcargo

# 4. Verificar que el build fue exitoso
if [ ! -d "dist" ]; then
    echo "❌ Error: El directorio dist no fue creado"
    exit 1
fi

if [ ! -f "dist/index.html" ]; then
    echo "❌ Error: index.html no fue generado"
    exit 1
fi

echo "✅ Build completado exitosamente"
echo "📁 Archivos generados en: ./dist"

# Mostrar tamaño del build
echo "📊 Tamaño del build:"
du -sh dist

# Listar archivos principales
echo "📄 Archivos principales:"
ls -lh dist/

echo ""
echo "🎉 ¡Despliegue listo!"
echo ""
echo "📋 Próximos pasos:"
echo "   1. Copiar el contenido de ./dist a tu servidor Nginx"
echo "   2. Copiar nginx.conf a /etc/nginx/conf.d/"
echo "   3. Reiniciar Nginx: sudo systemctl restart nginx"
echo ""
echo "🐳 O usar Docker:"
echo "   docker build -t cruzcargo-frontend ."
echo "   docker run -d -p 80:80 cruzcargo-frontend"

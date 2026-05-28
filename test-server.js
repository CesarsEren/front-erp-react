// Servidor de prueba para simular Nginx con subdirectorio /erpfacturacion
const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Servir archivos estáticos desde /erpfacturacion
app.use('/erpfacturacion', express.static(path.join(__dirname, 'dist')));

// Manejo de rutas de React Router - redirigir todo a index.html
app.get('/erpfacturacion/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Redirección de raíz a /erpfacturacion
app.get('/', (req, res) => {
  res.redirect('/erpfacturacion/');
});

app.listen(PORT, () => {
  console.log('');
  console.log('🚀 Servidor de prueba iniciado');
  console.log('');
  console.log(`   Local:   http://localhost:${PORT}/erpfacturacion/`);
  console.log('');
  console.log('📝 Presiona Ctrl+C para detener');
  console.log('');
});

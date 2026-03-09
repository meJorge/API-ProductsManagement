const express = require('express');
const app = express();

// Middlewares globales
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes  = require('./routes/productRoutes');

app.use('/api/categories', categoryRoutes);
app.use('/api/products',   productRoutes);

// Ruta base
app.get('/', (req, res) => {
  res.json({
    message: 'API de Gestión de Productos',
    version: '1.0.0',
    endpoints: {
      categories: '/api/categories',
      products:   '/api/products',
    },
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Error global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
  });
});

module.exports = app;

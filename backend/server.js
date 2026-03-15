const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('uploads'));
app.use(express.static('frontend'));

// Error Handler Middleware
const errorHandler = require('./core/middleware/errorHandler');

// Rotas da API - Legacy
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/reviews', require('./routes/reviews'));

// Rotas da API - Novos serviços profissionais
const ordersRoutes = require('./features/orders/routes/ordersRoutes');
const paymentsRoutes = require('./features/payments/routes/paymentsRoutes');
const recommendationsRoutes = require('./features/recommendations/routes/recommendationsRoutes');
const analyticsRoutes = require('./features/analytics/routes/analyticsRoutes');
const usersRoutes = require('./features/users/routes/usersRoutes');

app.use('/api/orders', ordersRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin/users', usersRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Global Error Handler
app.use(errorHandler);

// Servir index.html para todas as rotas que não são API (SPA)
app.get(/^(?!\/api)/, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✓ Servidor rodando em http://localhost:${PORT}`);
  console.log(`✓ Endpoint da API: http://localhost:${PORT}/api`);
  console.log(`✓ Admin Users: http://localhost:${PORT}/api/admin/users`);
  console.log(`✓ Analytics: http://localhost:${PORT}/api/analytics`);
  console.log(`✓ Recommendations: http://localhost:${PORT}/api/recommendations`);
  console.log(`✓ Orders: http://localhost:${PORT}/api/orders`);
  console.log(`✓ Payments: http://localhost:${PORT}/api/payments`);
});


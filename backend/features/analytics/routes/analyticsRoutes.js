const express = require('express');
const AnalyticsController = require('../controllers/AnalyticsController');
const authMiddleware = require('../../../core/middleware/authMiddleware');
const adminMiddleware = require('../../../core/middleware/adminMiddleware');

const router = express.Router();

// Todas as rotas requerem autenticação e acesso admin
router.use(authMiddleware, adminMiddleware);

// Dashboard principal
router.get('/dashboard', AnalyticsController.getDashboard);

// Tendência de receita
router.get('/revenue-trend', AnalyticsController.getRevenueTrend);

// Produtos mais vendidos
router.get('/top-products', AnalyticsController.getTopProducts);

// Segmentação de clientes
router.get('/customer-segments', AnalyticsController.getCustomerSegments);

// Funil de conversão
router.get('/conversion-funnel', AnalyticsController.getConversionFunnel);

// Dados geográficos
router.get('/geographic', AnalyticsController.getGeographic);

// Métodos de pagamento
router.get('/payment-methods', AnalyticsController.getPaymentMethods);

// Busca de eventos
router.post('/search', AnalyticsController.searchAnalytics);

module.exports = router;

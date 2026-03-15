const express = require('express');
const PaymentController = require('../controllers/PaymentController');
const authMiddleware = require('../../../core/middleware/authMiddleware');
const adminMiddleware = require('../../../core/middleware/adminMiddleware');

const router = express.Router();

// Webhook (sem autenticação)
router.post('/webhook', PaymentController.webhook);

// Rotas autenticadas
router.use(authMiddleware);

router.post('/preference', PaymentController.createPaymentPreference);
router.get('/:order_id/status', PaymentController.getStatus);
router.get('/:order_id/history', PaymentController.getHistory);
router.post('/:order_id/refund', PaymentController.refund);

// Rotas administrativas
router.get('/admin/revenue-stats', adminMiddleware, PaymentController.getRevenueStats);

module.exports = router;

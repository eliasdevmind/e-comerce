const express = require('express');
const OrderController = require('../controllers/OrderController');
const authMiddleware = require('../../../core/middleware/authMiddleware');
const adminMiddleware = require('../../../core/middleware/adminMiddleware');

const router = express.Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware);

// Rotas de usuário
router.post('/', OrderController.create);
router.get('/user/list', OrderController.listUserOrders);
router.get('/:order_id', OrderController.getById);
router.post('/:order_id/cancel', OrderController.cancel);
router.post('/:order_id/items/:item_id/remove', OrderController.removeItem);
router.post('/:order_id/payment/confirm', OrderController.confirmPayment);

// Rotas administrativas
router.get('/', adminMiddleware, OrderController.listAllOrders);
router.patch('/:order_id/status', adminMiddleware, OrderController.updateStatus);
router.get('/admin/stats', adminMiddleware, OrderController.getStats);
router.get('/admin/revenue-trend', adminMiddleware, OrderController.getRevenueTrend);

module.exports = router;

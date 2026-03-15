const express = require('express');
const orderController = require('../controllers/orderController');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

const router = express.Router();

// Rotas de cliente
router.post('/create', verifyToken, orderController.createOrder);
router.get('/', verifyToken, orderController.getUserOrders);
router.get('/:order_id', verifyToken, orderController.getOrderDetails);

// Rotas de admin
router.get('/admin/all', verifyAdmin, orderController.getAllOrders);
router.put('/admin/:order_id/status', verifyAdmin, orderController.updateOrderStatus);
router.put('/admin/:order_id/payment', verifyAdmin, orderController.processPayment);

module.exports = router;

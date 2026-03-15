const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const auth = require('../middleware/auth');

// Criar preferência de pagamento
router.post('/preference', auth, paymentController.createPaymentPreference);

// Webhook de Mercado Pago
router.post('/webhook/mercadopago', paymentController.handleWebhook);
router.get('/webhook/mercadopago', paymentController.handleWebhook);

// Status de pagamento
router.get('/:orderId', auth, paymentController.getPaymentStatus);

// Histórico de pagamentos (admin)
router.get('/history', auth, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Acesso negado' });
  }
  paymentController.getPaymentHistory(req, res);
});

module.exports = router;

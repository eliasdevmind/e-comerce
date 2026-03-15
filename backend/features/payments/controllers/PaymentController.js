const PaymentService = require('../services/PaymentService');
const OrderRepository = require('../../orders/repositories/OrderRepository');
const AppError = require('../../../core/errors/AppError');

class PaymentController {
  async createPaymentPreference(req, res) {
    try {
      const { order_id } = req.body;
      const user_id = req.user.id;

      if (!order_id) {
        throw new AppError('order_id é obrigatório', 400);
      }

      const order = await OrderRepository.findById(order_id);

      if (order.user_id !== user_id && req.user.role !== 'admin') {
        throw new AppError('Acesso negado', 403);
      }

      const preference = await PaymentService.createPaymentPreference(order_id, {
        items: order.items,
        user: {
          name: order.user_name,
          email: order.user_email
        },
        total_price: order.total_price,
        tax: order.tax,
        shipping_cost: order.shipping_cost
      });

      res.json({
        success: true,
        message: 'Preferência de pagamento criada',
        data: {
          order_id,
          init_point: preference.init_point,
          preference_id: preference.id
        }
      });
    } catch (error) {
      res.status(error.statusCode || 400).json({
        success: false,
        error: error.message
      });
    }
  }

  async webhook(req, res) {
    try {
      const result = await PaymentService.processWebhook(req.body);

      res.json({ success: true, result });
    } catch (error) {
      console.error('Erro no webhook:', error);
      res.status(200).json({ success: false, error: error.message });
    }
  }

  async getStatus(req, res) {
    try {
      const { order_id } = req.params;

      const payment = await PaymentService.getPaymentStatus(order_id);

      if (!payment) {
        return res.status(404).json({
          success: false,
          error: 'Nenhum pagamento encontrado para este pedido'
        });
      }

      res.json({
        success: true,
        data: payment
      });
    } catch (error) {
      res.status(error.statusCode || 400).json({
        success: false,
        error: error.message
      });
    }
  }

  async getHistory(req, res) {
    try {
      const { order_id } = req.params;

      const payments = await PaymentService.getPaymentHistory(order_id);

      res.json({
        success: true,
        data: payments
      });
    } catch (error) {
      res.status(error.statusCode || 400).json({
        success: false,
        error: error.message
      });
    }
  }

  async refund(req, res) {
    try {
      const { order_id } = req.params;
      const { reason } = req.body;

      const result = await PaymentService.refundPayment(order_id, reason);

      res.json({
        success: true,
        message: result.message,
        data: result
      });
    } catch (error) {
      res.status(error.statusCode || 400).json({
        success: false,
        error: error.message
      });
    }
  }

  async getRevenueStats(req, res) {
    try {
      const { days = 30 } = req.query;

      const stats = await PaymentService.getRevenueStats(parseInt(days));

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(error.statusCode || 400).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new PaymentController();

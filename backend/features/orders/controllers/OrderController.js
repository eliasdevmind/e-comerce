const OrderService = require('../services/OrderService');
const AuthService = require('../../auth/services/AuthService');
const AppError = require('../../../core/errors/AppError');

class OrderController {
  async create(req, res) {
    try {
      const { items, delivery_address_id, payment_method } = req.body;
      const user_id = req.user.id;

      const order = await OrderService.createOrder({
        user_id,
        items,
        delivery_address_id,
        payment_method
      });

      res.status(201).json({
        success: true,
        message: 'Pedido criado com sucesso',
        data: order
      });
    } catch (error) {
      res.status(error.statusCode || 400).json({
        success: false,
        error: error.message
      });
    }
  }

  async getById(req, res) {
    try {
      const { order_id } = req.params;
      const user_id = req.user.id;
      const user_role = req.user.role;

      const order = await OrderService.getOrderById(order_id, user_id, user_role);

      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      res.status(error.statusCode || 400).json({
        success: false,
        error: error.message
      });
    }
  }

  async listUserOrders(req, res) {
    try {
      const user_id = req.user.id;
      const { limit = 10, offset = 0, status } = req.query;

      const orders = await OrderService.listUserOrders(user_id, {
        limit: parseInt(limit),
        offset: parseInt(offset),
        status
      });

      res.json({
        success: true,
        data: orders
      });
    } catch (error) {
      res.status(error.statusCode || 400).json({
        success: false,
        error: error.message
      });
    }
  }

  async listAllOrders(req, res) {
    try {
      const { limit = 20, offset = 0, status } = req.query;

      const orders = await OrderService.listAllOrders({
        limit: parseInt(limit),
        offset: parseInt(offset),
        status
      });

      res.json({
        success: true,
        data: orders
      });
    } catch (error) {
      res.status(error.statusCode || 400).json({
        success: false,
        error: error.message
      });
    }
  }

  async updateStatus(req, res) {
    try {
      const { order_id } = req.params;
      const { status } = req.body;

      if (!status) {
        throw new AppError('Status é obrigatório', 400);
      }

      const order = await OrderService.updateOrderStatus(order_id, status);

      res.json({
        success: true,
        message: 'Status atualizado com sucesso',
        data: order
      });
    } catch (error) {
      res.status(error.statusCode || 400).json({
        success: false,
        error: error.message
      });
    }
  }

  async cancel(req, res) {
    try {
      const { order_id } = req.params;
      const user_id = req.user.id;
      const user_role = req.user.role;

      const order = await OrderService.cancelOrder(order_id, user_id, user_role);

      res.json({
        success: true,
        message: 'Pedido cancelado com sucesso',
        data: order
      });
    } catch (error) {
      res.status(error.statusCode || 400).json({
        success: false,
        error: error.message
      });
    }
  }

  async confirmPayment(req, res) {
    try {
      const { order_id } = req.params;
      const { payment_id, transaction_id } = req.body;

      const order = await OrderService.confirmPayment(order_id, payment_id, transaction_id);

      res.json({
        success: true,
        message: 'Pagamento confirmado com sucesso',
        data: order
      });
    } catch (error) {
      res.status(error.statusCode || 400).json({
        success: false,
        error: error.message
      });
    }
  }

  async getStats(req, res) {
    try {
      const stats = await OrderService.getOrderStats();

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

  async getRevenueTrend(req, res) {
    try {
      const { days = 30 } = req.query;
      const trend = await OrderService.getRevenueTrend(parseInt(days));

      res.json({
        success: true,
        data: trend
      });
    } catch (error) {
      res.status(error.statusCode || 400).json({
        success: false,
        error: error.message
      });
    }
  }

  async removeItem(req, res) {
    try {
      const { order_id, item_id } = req.params;
      const user_id = req.user.id;

      const order = await OrderService.removeOrderItem(order_id, item_id, user_id);

      res.json({
        success: true,
        message: 'Item removido com sucesso',
        data: order
      });
    } catch (error) {
      res.status(error.statusCode || 400).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new OrderController();

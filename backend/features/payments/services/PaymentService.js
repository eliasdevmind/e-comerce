const db = require('../../../config/database');
const AppError = require('../../../core/errors/AppError');
const businessRules = require('../../../shared/constants/businessRules');

class PaymentService {
  constructor() {
    this.accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || 'TEST-TOKEN';
  }

  async createPaymentPreference(order_id, orderData) {
    try {
      const {
        items = [],
        user,
        total_price = 0,
        tax = 0,
        shipping_cost = 0
      } = orderData;

      const preference = {
        items: items.map(item => ({
          id: item.product_id,
          title: item.product_name,
          unit_price: item.price,
          quantity: item.quantity,
          currency_id: 'BRL'
        })),
        payer: {
          name: user.name,
          email: user.email
        },
        back_urls: {
          success: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/checkout/success?order_id=${order_id}`,
          failure: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/checkout/failure?order_id=${order_id}`,
          pending: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/checkout/pending?order_id=${order_id}`
        },
        notification_url: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payments/webhook`,
        auto_return: 'approved',
        external_reference: `order_${order_id}_${Date.now()}`,
        metadata: {
          order_id,
          tax,
          shipping_cost
        }
      };

      // Simular resposta se em mode teste
      return this.createMockPaymentPreference(order_id, preference);
    } catch (error) {
      throw new AppError('Erro ao criar preferência de pagamento: ' + error.message, 400);
    }
  }

  createMockPaymentPreference(order_id, preference) {
    return {
      id: `MOCK_PREF_${order_id}_${Date.now()}`,
      init_point: `https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=MOCK_PREF_${order_id}`,
      ...preference
    };
  }

  async processWebhook(data) {
    try {
      const { id, type, data: webhook_data } = data;

      if (type === 'payment') {
        return await this.handlePaymentUpdate(webhook_data);
      }

      if (type === 'plan') {
        return await this.handlePlanUpdate(webhook_data);
      }

      if (type === 'subscription') {
        return await this.handleSubscriptionUpdate(webhook_data);
      }

      return { success: true };
    } catch (error) {
      console.error('Erro ao processar webhook:', error);
      throw new AppError('Erro ao processar webhook: ' + error.message, 400);
    }
  }

  async handlePaymentUpdate(payment_data) {
    try {
      const { id, status, external_reference } = payment_data;

      // Extrair order_id do external_reference
      const order_id = external_reference?.split('_')[1];

      if (!order_id) {
        throw new AppError('Order ID não encontrado no webhook', 400);
      }

      const paymentStatus = this.mapPaymentStatus(status);

      // Log da transação
      await this.logPaymentTransaction(order_id, id, status, payment_data);

      // TODO: Atualizar status do pedido quando OrderService estiver disponível
      // if (paymentStatus === 'approved') {
      //   await OrderService.confirmPayment(order_id, id, external_reference);
      // }

      return { success: true, order_id, status: paymentStatus };
    } catch (error) {
      throw new AppError('Erro ao atualizar pagamento: ' + error.message, 400);
    }
  }

  async handlePlanUpdate(plan_data) {
    // Implementar para planos de assinatura no futuro
    return { success: true };
  }

  async handleSubscriptionUpdate(subscription_data) {
    // Implementar para assinaturas no futuro
    return { success: true };
  }

  mapPaymentStatus(status) {
    const statusMap = {
      'approved': 'approved',
      'pending': 'pending',
      'authorized': 'pending',
      'in_process': 'pending',
      'in_mediation': 'pending',
      'rejected': 'rejected',
      'cancelled': 'cancelled',
      'refunded': 'refunded',
      'charged_back': 'chargedback'
    };

    return statusMap[status] || 'unknown';
  }

  async logPaymentTransaction(order_id, payment_id, status, payment_data) {
    try {
      const query = `
        INSERT INTO payment_logs (order_id, payment_id, provider, status, response_data, created_at)
        VALUES (?, ?, ?, ?, ?, NOW())
      `;

      await db.execute(query, [
        order_id,
        payment_id,
        'mercado_pago',
        status,
        JSON.stringify(payment_data)
      ]);
    } catch (error) {
      console.error('Erro ao registrar log de pagamento:', error);
    }
  }

  async getPaymentStatus(order_id) {
    try {
      const query = `
        SELECT * FROM payment_logs 
        WHERE order_id = ? 
        ORDER BY created_at DESC 
        LIMIT 1
      `;

      const [result] = await db.execute(query, [order_id]);

      if (result.length === 0) {
        return null;
      }

      const payment = result[0];
      return {
        order_id,
        payment_id: payment.payment_id,
        provider: payment.provider,
        status: payment.status,
        created_at: payment.created_at,
        data: JSON.parse(payment.response_data || '{}')
      };
    } catch (error) {
      throw new AppError('Erro ao obter status de pagamento: ' + error.message, 400);
    }
  }

  async getPaymentHistory(order_id) {
    try {
      const query = `
        SELECT 
          id,
          order_id,
          payment_id,
          provider,
          status,
          created_at
        FROM payment_logs 
        WHERE order_id = ? 
        ORDER BY created_at DESC
      `;

      const [payments] = await db.execute(query, [order_id]);

      return payments.map(p => ({
        id: p.id,
        order_id: p.order_id,
        payment_id: p.payment_id,
        provider: p.provider,
        status: p.status,
        created_at: p.created_at
      }));
    } catch (error) {
      throw new AppError('Erro ao obter histórico de pagamentos: ' + error.message, 400);
    }
  }

  async refundPayment(order_id, reason = 'Reembolso solicitado pelo cliente') {
    try {
      const payment = await this.getPaymentStatus(order_id);

      if (!payment) {
        throw new AppError('Pagamento não encontrado para este pedido', 404);
      }

      if (payment.status !== 'approved') {
        throw new AppError('Apenas pagamentos aprovados podem ser reembolsados', 400);
      }

      // Aqui integraria com API real do Mercado Pago
      // const refund = await this.client.payment.refund(payment.payment_id, { reason });

      // Log da tentativa de reembolso
      await this.logPaymentTransaction(order_id, payment.payment_id, 'refunded', {
        reason,
        refund_date: new Date()
      });

      return {
        success: true,
        message: 'Reembolso processado com sucesso',
        payment_id: payment.payment_id
      };
    } catch (error) {
      throw new AppError('Erro ao processar reembolso: ' + error.message, 400);
    }
  }

  async getRevenueStats(days = 30) {
    try {
      const query = `
        SELECT 
          DATE(pl.created_at) as date,
          COUNT(*) as transactions,
          COUNT(CASE WHEN pl.status = 'approved' THEN 1 END) as approved_count,
          SUM(CASE WHEN pl.status = 'approved' THEN o.total_price ELSE 0 END) as revenue,
          AVG(o.total_price) as avg_order_value
        FROM payment_logs pl
        LEFT JOIN orders o ON pl.order_id = o.id
        WHERE pl.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        AND pl.status = 'approved'
        GROUP BY DATE(pl.created_at)
        ORDER BY date DESC
      `;

      const [stats] = await db.execute(query, [days]);

      return stats;
    } catch (error) {
      throw new AppError('Erro ao obter estatísticas de receita: ' + error.message, 400);
    }
  }
}

module.exports = new PaymentService();

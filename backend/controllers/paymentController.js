const mercadopago = require('mercadopago');
const db = require('../models/database');

// Configurar Mercado Pago com access token
mercadopago.configure({
  access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN || 'APP_TEST_ACCESS_TOKEN'
});

// Criar preferência de pagamento
exports.createPaymentPreference = async (req, res) => {
  try {
    const { orderId } = req.body;
    
    // Validar order
    const [order] = await db.query(
      'SELECT o.*, SUM(oi.price * oi.quantity) as total FROM orders o LEFT JOIN order_items oi ON o.id = oi.order_id WHERE o.id = ? AND o.user_id = ?',
      [orderId, req.user.id]
    );
    
    if (!order.length) {
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }
    
    const items = await db.query(
      'SELECT oi.*, p.name FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?',
      [orderId]
    );
    
    const preference = {
      items: items[0].map(item => ({
        title: item.name,
        quantity: item.quantity,
        unit_price: parseFloat(item.price),
        currency_id: 'BRL'
      })),
      payer: {
        email: req.user.email,
        name: req.user.name,
        identification: {
          type: 'CPF',
          number: req.body.cpf || ''
        }
      },
      payment_methods: {
        default_payment_method_id: 'credit_card',
        installments: 12,
        excluded_payment_types: [
          {
            id: 'atm'
          }
        ]
      },
      back_urls: {
        success: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/checkout?status=success&order=${orderId}`,
        failure: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/checkout?status=failure&order=${orderId}`,
        pending: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/checkout?status=pending&order=${orderId}`
      },
      notification_url: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/webhooks/mercadopago`,
      external_reference: `ORDER_${orderId}`,
      metadata: {
        order_id: orderId,
        user_id: req.user.id
      }
    };
    
    const response = await mercadopago.preferences.create(preference);
    
    // Registrar tentativa de pagamento
    await db.query(
      'INSERT INTO payment_logs (order_id, preference_id, status, response) VALUES (?, ?, ?, ?)',
      [orderId, response.body.id, 'pending', JSON.stringify(response.body)]
    );
    
    res.json({
      preference_id: response.body.id,
      init_point: response.body.init_point
    });
  } catch (error) {
    console.error('Erro ao criar preferência:', error);
    res.status(500).json({ message: 'Erro ao processar pagamento' });
  }
};

// Processar webhook de pagamento
exports.handleWebhook = async (req, res) => {
  try {
    const { id, type, data } = req.query;
    
    if (type === 'payment') {
      const payment = await mercadopago.payment.findById(id);
      
      const paymentData = payment.body;
      const orderId = paymentData.external_reference?.split('_')[1];
      
      // Atualizar status do pedido
      if (paymentData.status === 'approved') {
        await db.query(
          'UPDATE orders SET payment_status = ?, status = ? WHERE id = ?',
          ['approved', 'processing', orderId]
        );
        
        // Limpar carrinho
        await db.query('DELETE FROM cart_items WHERE user_id = (SELECT user_id FROM orders WHERE id = ?)', [orderId]);
      } else if (paymentData.status === 'rejected') {
        await db.query(
          'UPDATE orders SET payment_status = ? WHERE id = ?',
          ['rejected', orderId]
        );
      } else if (paymentData.status === 'pending') {
        await db.query(
          'UPDATE orders SET payment_status = ? WHERE id = ?',
          ['pending', orderId]
        );
      }
      
      // Registrar webhook
      await db.query(
        'INSERT INTO payment_logs (order_id, preference_id, status, response) VALUES (?, ?, ?, ?)',
        [orderId, paymentData.preference_id, paymentData.status, JSON.stringify(paymentData)]
      );
    }
    
    res.sendStatus(200);
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    res.sendStatus(500);
  }
};

// Obter status de pagamento
exports.getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const [order] = await db.query(
      'SELECT id, payment_status, status FROM orders WHERE id = ? AND user_id = ?',
      [orderId, req.user.id]
    );
    
    if (!order.length) {
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }
    
    const [logs] = await db.query(
      'SELECT * FROM payment_logs WHERE order_id = ? ORDER BY created_at DESC LIMIT 1',
      [orderId]
    );
    
    res.json({
      order: order[0],
      payment_log: logs[0] || null
    });
  } catch (error) {
    console.error('Erro ao obter status:', error);
    res.status(500).json({ message: 'Erro ao obter status de pagamento' });
  }
};

// Listar histórico de pagamentos (admin)
exports.getPaymentHistory = async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    
    let query = 'SELECT pl.*, o.order_number, u.email FROM payment_logs pl JOIN orders o ON pl.order_id = o.id JOIN users u ON o.user_id = u.id';
    const params = [];
    
    if (status) {
      query += ' WHERE pl.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY pl.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const [logs] = await db.query(query, params);
    
    // Total count
    let countQuery = 'SELECT COUNT(*) as total FROM payment_logs';
    const countParams = [];
    
    if (status) {
      countQuery += ' WHERE status = ?';
      countParams.push(status);
    }
    
    const [countResult] = await db.query(countQuery, countParams);
    
    res.json({
      data: logs,
      pagination: {
        total: countResult[0].total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Erro ao listar histórico:', error);
    res.status(500).json({ message: 'Erro ao listar histórico de pagamentos' });
  }
};

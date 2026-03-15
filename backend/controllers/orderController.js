const pool = require('../models/database');
const { v4: uuidv4 } = require('uuid');

// Criar pedido (checkout)
exports.createOrder = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { shipping_address, payment_method } = req.body;

    // Obter carrinho
    const [cartItems] = await pool.query(
      `SELECT ci.quantity, p.price, p.discount_price
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = ?`,
      [user_id]
    );

    if (cartItems.length === 0) {
      return res.status(400).json({ message: 'Carrinho vazio' });
    }

    // Calcular totais
    let subtotal = 0;
    for (let item of cartItems) {
      const price = item.discount_price || item.price;
      subtotal += price * item.quantity;
    }

    const tax = parseFloat((subtotal * 0.1).toFixed(2));
    const shipping_cost = subtotal > 100 ? 0 : 10;
    const total_amount = parseFloat((subtotal + tax + shipping_cost).toFixed(2));

    // Criar pedido
    const orderNumber = `ORD-${Date.now()}-${uuidv4().slice(0, 8)}`;
    const [result] = await pool.query(
      `INSERT INTO orders (order_number, user_id, subtotal, tax, shipping_cost, total_amount, shipping_address, payment_method)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [orderNumber, user_id, subtotal, tax, shipping_cost, total_amount, shipping_address, payment_method]
    );

    const orderId = result.insertId;

    // Adicionar itens do pedido
    const [items] = await pool.query(
      `SELECT ci.id, ci.quantity, ci.product_id, p.price, p.discount_price
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = ?`,
      [user_id]
    );

    for (let item of items) {
      const unitPrice = item.discount_price || item.price;
      const itemSubtotal = unitPrice * item.quantity;
      
      await pool.query(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)',
        [orderId, item.product_id, item.quantity, unitPrice, itemSubtotal]
      );
    }

    // Limpar carrinho
    await pool.query('DELETE FROM cart_items WHERE user_id = ?', [user_id]);

    res.status(201).json({
      message: 'Pedido criado com sucesso',
      order: {
        id: orderId,
        order_number: orderNumber,
        subtotal,
        tax,
        shipping_cost,
        total_amount,
        status: 'pending',
        payment_status: 'pending'
      }
    });
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    res.status(500).json({ message: 'Erro ao criar pedido' });
  }
};

// Obter pedidos do usuário
exports.getUserOrders = async (req, res) => {
  try {
    const user_id = req.user.id;

    const [orders] = await pool.query(
      `SELECT o.id, o.order_number, o.total_amount, o.status, o.payment_status, o.created_at,
              COUNT(oi.id) as item_count
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE o.user_id = ?
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [user_id]
    );

    res.json(orders);
  } catch (error) {
    console.error('Erro ao obter pedidos:', error);
    res.status(500).json({ message: 'Erro ao obter pedidos' });
  }
};

// Obter detalhes do pedido
exports.getOrderDetails = async (req, res) => {
  try {
    const { order_id } = req.params;
    const user_id = req.user.id;

    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [order_id, user_id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }

    const order = orders[0];

    const [items] = await pool.query(
      `SELECT oi.id, oi.product_id, oi.quantity, oi.unit_price, oi.subtotal,
              p.name, p.cover_image
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [order_id]
    );

    order.items = items;
    res.json(order);
  } catch (error) {
    console.error('Erro ao obter detalhes do pedido:', error);
    res.status(500).json({ message: 'Erro ao obter detalhes do pedido' });
  }
};

// Processar pagamento (Admin)
exports.processPayment = async (req, res) => {
  try {
    const { order_id } = req.params;
    const { payment_status } = req.body;

    if (!['completed', 'failed', 'refunded'].includes(payment_status)) {
      return res.status(400).json({ message: 'Status de pagamento inválido' });
    }

    await pool.query(
      'UPDATE orders SET payment_status = ?, status = ? WHERE id = ?',
      [payment_status, payment_status === 'completed' ? 'processing' : 'cancelled', order_id]
    );

    res.json({ message: 'Pagamento atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao processar pagamento:', error);
    res.status(500).json({ message: 'Erro ao processar pagamento' });
  }
};

// Obter todos os pedidos (Admin)
exports.getAllOrders = async (req, res) => {
  try {
    const { status, payment_status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT o.*, u.name, u.email FROM orders o JOIN users u ON o.user_id = u.id WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND o.status = ?';
      params.push(status);
    }

    if (payment_status) {
      query += ' AND o.payment_status = ?';
      params.push(payment_status);
    }

    query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [orders] = await pool.query(query, params);
    res.json(orders);
  } catch (error) {
    console.error('Erro ao obter pedidos:', error);
    res.status(500).json({ message: 'Erro ao obter pedidos' });
  }
};

// Atualizar status do pedido (Admin)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { order_id } = req.params;
    const { status } = req.body;

    if (!['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Status inválido' });
    }

    await pool.query(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, order_id]
    );

    res.json({ message: 'Status do pedido atualizado' });
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({ message: 'Erro ao atualizar status' });
  }
};

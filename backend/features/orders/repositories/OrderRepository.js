const db = require('../../../database/db');
const AppError = require('../../../core/errors/AppError');
const NotFoundError = require('../../../core/errors/NotFoundError');

class OrderRepository {
  async create(orderData) {
    const { user_id, total_price, tax, shipping_cost, status, payment_method, delivery_address_id } = orderData;
    
    try {
      const query = `
        INSERT INTO orders (user_id, total_price, tax, shipping_cost, status, payment_method, delivery_address_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;
      
      const [result] = await db.execute(query, [
        user_id,
        total_price,
        tax,
        shipping_cost,
        status,
        payment_method,
        delivery_address_id
      ]);
      
      return result.insertId;
    } catch (error) {
      throw new AppError('Erro ao criar pedido: ' + error.message, 400);
    }
  }

  async addItem(order_id, product_id, quantity, price) {
    try {
      const query = `
        INSERT INTO order_items (order_id, product_id, quantity, price, created_at)
        VALUES (?, ?, ?, ?, NOW())
      `;
      
      const [result] = await db.execute(query, [order_id, product_id, quantity, price]);
      return result.insertId;
    } catch (error) {
      throw new AppError('Erro ao adicionar item ao pedido: ' + error.message, 400);
    }
  }

  async findById(order_id) {
    try {
      const query = `
        SELECT 
          o.id,
          o.user_id,
          o.total_price,
          o.tax,
          o.shipping_cost,
          o.status,
          o.payment_method,
          o.delivery_address_id,
          o.created_at,
          o.updated_at,
          u.name as user_name,
          u.email as user_email,
          a.street,
          a.city,
          a.state,
          a.zip_code,
          a.country
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        LEFT JOIN addresses a ON o.delivery_address_id = a.id
        WHERE o.id = ?
      `;
      
      const [orders] = await db.execute(query, [order_id]);
      
      if (orders.length === 0) {
        throw new NotFoundError('Pedido não encontrado');
      }

      const order = orders[0];
      const itemsQuery = `
        SELECT 
          oi.id,
          oi.product_id,
          oi.quantity,
          oi.price,
          p.name as product_name,
          p.image as product_image
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `;
      
      const [items] = await db.execute(itemsQuery, [order_id]);
      
      return {
        ...order,
        items
      };
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new AppError('Erro ao buscar pedido: ' + error.message, 400);
    }
  }

  async findByUserId(user_id, limit = 10, offset = 0) {
    try {
      const query = `
        SELECT 
          o.id,
          o.user_id,
          o.total_price,
          o.tax,
          o.shipping_cost,
          o.status,
          o.payment_method,
          o.created_at,
          o.updated_at,
          COUNT(oi.id) as item_count
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.user_id = ?
        GROUP BY o.id
        ORDER BY o.created_at DESC
        LIMIT ? OFFSET ?
      `;
      
      const [orders] = await db.execute(query, [user_id, limit, offset]);
      
      const countQuery = 'SELECT COUNT(*) as total FROM orders WHERE user_id = ?';
      const [countResult] = await db.execute(countQuery, [user_id]);
      
      return {
        data: orders,
        total: countResult[0].total,
        limit,
        offset
      };
    } catch (error) {
      throw new AppError('Erro ao listar pedidos do usuário: ' + error.message, 400);
    }
  }

  async findAll(status = null, limit = 20, offset = 0) {
    try {
      let query = `
        SELECT 
          o.id,
          o.user_id,
          o.total_price,
          o.tax,
          o.shipping_cost,
          o.status,
          o.payment_method,
          o.created_at,
          u.name as user_name,
          u.email as user_email,
          COUNT(oi.id) as item_count
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        LEFT JOIN order_items oi ON o.id = oi.order_id
      `;
      
      const params = [];
      
      if (status) {
        query += ' WHERE o.status = ?';
        params.push(status);
      }
      
      query += ` GROUP BY o.id ORDER BY o.created_at DESC LIMIT ? OFFSET ?`;
      params.push(limit, offset);
      
      const [orders] = await db.execute(query, params);
      
      const countQuery = status 
        ? 'SELECT COUNT(*) as total FROM orders WHERE status = ?'
        : 'SELECT COUNT(*) as total FROM orders';
      const countParams = status ? [status] : [];
      const [countResult] = await db.execute(countQuery, countParams);
      
      return {
        data: orders,
        total: countResult[0].total,
        limit,
        offset
      };
    } catch (error) {
      throw new AppError('Erro ao listar pedidos: ' + error.message, 400);
    }
  }

  async updateStatus(order_id, status) {
    try {
      const query = 'UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?';
      const [result] = await db.execute(query, [status, order_id]);
      
      if (result.affectedRows === 0) {
        throw new NotFoundError('Pedido não encontrado');
      }
      
      return result;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new AppError('Erro ao atualizar status: ' + error.message, 400);
    }
  }

  async updatePaymentStatus(order_id, payment_status, payment_id = null) {
    try {
      const query = `
        UPDATE orders 
        SET 
          payment_status = ?,
          payment_id = ?,
          updated_at = NOW()
        WHERE id = ?
      `;
      
      const [result] = await db.execute(query, [payment_status, payment_id, order_id]);
      
      if (result.affectedRows === 0) {
        throw new NotFoundError('Pedido não encontrado');
      }
      
      return result;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new AppError('Erro ao atualizar pagamento: ' + error.message, 400);
    }
  }

  async getOrderStats() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_orders,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
          AVG(total_price) as avg_order_value,
          SUM(total_price) as total_revenue
        FROM orders
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      `;
      
      const [stats] = await db.execute(query);
      return stats[0] || {};
    } catch (error) {
      throw new AppError('Erro ao obter estatísticas: ' + error.message, 400);
    }
  }

  async removeItem(order_item_id) {
    try {
      const query = 'DELETE FROM order_items WHERE id = ?';
      const [result] = await db.execute(query, [order_item_id]);
      
      if (result.affectedRows === 0) {
        throw new NotFoundError('Item do pedido não encontrado');
      }
      
      return result;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new AppError('Erro ao remover item: ' + error.message, 400);
    }
  }

  async cancel(order_id) {
    try {
      const query = 'UPDATE orders SET status = "cancelled", updated_at = NOW() WHERE id = ? AND status != "completed"';
      const [result] = await db.execute(query, [order_id]);
      
      if (result.affectedRows === 0) {
        throw new AppError('Não é possível cancelar este pedido', 400);
      }
      
      return result;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new OrderRepository();

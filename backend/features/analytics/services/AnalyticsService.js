const db = require('../../../database/db');
const AppError = require('../../../core/errors/AppError');
const cache = require('../../../shared/utils/cache');

class AnalyticsService {
  async getDashboardMetrics(days = 30) {
    try {
      const cacheKey = `analytics:dashboard:${days}`;
      const cached = cache.get(cacheKey);
      if (cached) return cached;

      const metrics = await Promise.all([
        this.getTotalMetrics(days),
        this.getSalesMetrics(days),
        this.getUserMetrics(days),
        this.getProductMetrics(days),
        this.getEventMetrics(days)
      ]);

      const result = {
        total: metrics[0],
        sales: metrics[1],
        users: metrics[2],
        products: metrics[3],
        events: metrics[4]
      };

      cache.set(cacheKey, result, 3600);
      return result;
    } catch (error) {
      throw new AppError('Erro ao obter métricas do dashboard: ' + error.message, 400);
    }
  }

  async getTotalMetrics(days) {
    try {
      const query = `
        SELECT 
          COUNT(DISTINCT o.id) as total_orders,
          COUNT(DISTINCT o.user_id) as total_customers,
          SUM(o.total_price) as total_revenue,
          AVG(o.total_price) as avg_order_value,
          COUNT(DISTINCT p.id) as total_products,
          SUM(CASE WHEN p.stock > 0 THEN 1 ELSE 0 END) as products_in_stock
        FROM orders o
        LEFT JOIN products p ON 1=1
        WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        AND o.status IN ('completed', 'shipped', 'delivered')
      `;

      const [result] = await db.execute(query, [days]);
      return result[0] || {};
    } catch (error) {
      console.error('Erro ao calcular métricas totais:', error);
      return {};
    }
  }

  async getSalesMetrics(days) {
    try {
      const query = `
        SELECT 
          DATE(o.created_at) as date,
          COUNT(*) as orders,
          SUM(o.total_price) as revenue,
          AVG(o.total_price) as avg_order,
          COUNT(CASE WHEN o.payment_status = 'approved' THEN 1 END) as completed_payments
        FROM orders o
        WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY DATE(o.created_at)
        ORDER BY date DESC
      `;

      const [result] = await db.execute(query, [days]);
      return result;
    } catch (error) {
      console.error('Erro ao calcular métricas de vendas:', error);
      return [];
    }
  }

  async getUserMetrics(days) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) THEN 1 END) as new_users,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
          COUNT(CASE WHEN status = 'suspended' THEN 1 END) as suspended_users,
          COUNT(DISTINCT id) as registered_users
        FROM users
      `;

      const [result] = await db.execute(query, [days]);
      return result[0] || {};
    } catch (error) {
      console.error('Erro ao calcular métricas de usuários:', error);
      return {};
    }
  }

  async getProductMetrics(days) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_products,
          COUNT(CASE WHEN active = 1 THEN 1 END) as active_products,
          COUNT(CASE WHEN stock = 0 THEN 1 END) as out_of_stock,
          AVG(price) as avg_price,
          MAX(price) as max_price,
          MIN(price) as min_price,
          AVG(total_sold) as avg_sold
        FROM products
      `;

      const [result] = await db.execute(query);
      return result[0] || {};
    } catch (error) {
      console.error('Erro ao calcular métricas de produtos:', error);
      return {};
    }
  }

  async getEventMetrics(days) {
    try {
      const query = `
        SELECT 
          event_type,
          COUNT(*) as count,
          COUNT(DISTINCT user_id) as unique_users,
          COUNT(DISTINCT product_id) as unique_products
        FROM events
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY event_type
      `;

      const [result] = await db.execute(query, [days]);
      return result;
    } catch (error) {
      console.error('Erro ao calcular métricas de eventos:', error);
      return [];
    }
  }

  async getRevenueTrend(days = 30) {
    try {
      const query = `
        SELECT 
          DATE(o.created_at) as date,
          SUM(o.total_price) as revenue,
          COUNT(*) as orders,
          COUNT(DISTINCT o.user_id) as customers
        FROM orders o
        WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        AND o.payment_status = 'approved'
        GROUP BY DATE(o.created_at)
        ORDER BY date ASC
      `;

      const [result] = await db.execute(query, [days]);
      return result;
    } catch (error) {
      throw new AppError('Erro ao obter tendência de receita: ' + error.message, 400);
    }
  }

  async getTopProducts(limit = 10, days = 30) {
    try {
      const query = `
        SELECT 
          p.id,
          p.name,
          p.image,
          p.category,
          COUNT(oi.id) as sales,
          SUM(oi.quantity) as units_sold,
          SUM(oi.price * oi.quantity) as revenue,
          AVG(r.rating) as avg_rating
        FROM products p
        LEFT JOIN order_items oi ON p.id = oi.product_id
        LEFT JOIN orders o ON oi.order_id = o.id
        LEFT JOIN reviews r ON p.id = r.product_id
        WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        AND o.payment_status = 'approved'
        GROUP BY p.id
        ORDER BY revenue DESC
        LIMIT ?
      `;

      const [result] = await db.execute(query, [days, limit]);
      return result;
    } catch (error) {
      throw new AppError('Erro ao obter produtos mais vendidos: ' + error.message, 400);
    }
  }

  async getCustomerSegments() {
    try {
      const query = `
        SELECT 
          CASE 
            WHEN total_spent >= 10000 THEN 'Premium'
            WHEN total_spent >= 5000 THEN 'Gold'
            WHEN total_spent >= 1000 THEN 'Silver'
            ELSE 'Bronze'
          END as segment,
          COUNT(*) as customer_count,
          AVG(total_spent) as avg_spent,
          AVG(orders_count) as avg_orders,
          MAX(total_spent) as max_spent,
          MIN(total_spent) as min_spent
        FROM (
          SELECT 
            u.id,
            COUNT(o.id) as orders_count,
            SUM(o.total_price) as total_spent
          FROM users u
          LEFT JOIN orders o ON u.id = o.user_id
          WHERE o.payment_status = 'approved'
          GROUP BY u.id
        ) as customer_stats
        GROUP BY segment
      `;

      const [result] = await db.execute(query);
      return result;
    } catch (error) {
      throw new AppError('Erro ao obter segmentação de clientes: ' + error.message, 400);
    }
  }

  async getConversionFunnel(days = 30) {
    try {
      const query = `
        SELECT 
          'Visualizações' as stage,
          COUNT(DISTINCT CASE WHEN event_type = 'view' THEN user_id END) as count
        FROM events
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        
        UNION ALL
        
        SELECT 
          'Adicionado ao carrinho',
          COUNT(DISTINCT CASE WHEN event_type = 'add_to_cart' THEN user_id END)
        FROM events
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        
        UNION ALL
        
        SELECT 
          'Compras concluídas',
          COUNT(DISTINCT user_id)
        FROM orders
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        AND payment_status = 'approved'
      `;

      const [result] = await db.execute(query, [days, days, days]);
      return result;
    } catch (error) {
      throw new AppError('Erro ao obter funil de conversão: ' + error.message, 400);
    }
  }

  async getGeographicData() {
    try {
      const query = `
        SELECT 
          a.state,
          a.city,
          COUNT(DISTINCT o.user_id) as customers,
          COUNT(o.id) as orders,
          SUM(o.total_price) as revenue
        FROM orders o
        LEFT JOIN addresses a ON o.delivery_address_id = a.id
        WHERE o.payment_status = 'approved'
        GROUP BY a.state, a.city
        ORDER BY revenue DESC
        LIMIT 20
      `;

      const [result] = await db.execute(query);
      return result;
    } catch (error) {
      throw new AppError('Erro ao obter dados geográficos: ' + error.message, 400);
    }
  }

  async getPaymentMethodStats(days = 30) {
    try {
      const query = `
        SELECT 
          payment_method,
          COUNT(*) as transactions,
          SUM(total_price) as revenue,
          AVG(total_price) as avg_value,
          COUNT(CASE WHEN payment_status = 'approved' THEN 1 END) as successful
        FROM orders
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY payment_method
        ORDER BY revenue DESC
      `;

      const [result] = await db.execute(query, [days]);
      return result;
    } catch (error) {
      throw new AppError('Erro ao obter estatísticas de pagamento: ' + error.message, 400);
    }
  }

  async searchAnalytics(query) {
    try {
      const searchQuery = `
        SELECT 
          search_term,
          COUNT(*) as searches,
          COUNT(DISTINCT user_id) as unique_users,
          COUNT(CASE WHEN purchase_conversion = 1 THEN 1 END) as conversions
        FROM search_events
        WHERE search_term LIKE ?
        GROUP BY search_term
        ORDER BY searches DESC
      `;

      const [result] = await db.execute(searchQuery, ['%' + query + '%']);
      return result;
    } catch (error) {
      throw new AppError('Erro ao buscar eventos de busca: ' + error.message, 400);
    }
  }
}

module.exports = new AnalyticsService();

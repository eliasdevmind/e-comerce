const db = require('../../../database/db');
const AppError = require('../../../core/errors/AppError');
const cache = require('../../../shared/utils/cache');

class RecommendationService {
  async getPersonalizedRecommendations(user_id, limit = 10) {
    try {
      // Verificar cache
      const cacheKey = `recommendations:user:${user_id}`;
      const cached = cache.get(cacheKey);
      if (cached) return cached;

      // Estratégia 1: Produtos similares aos que o usuário já comprou
      const recommendations = await this.getSimilarProductsFromPurchases(user_id, limit);

      if (recommendations.length < limit) {
        // Estratégia 2: Produtos populares que o usuário não viu
        const popular = await this.getPopularProductsNotViewed(user_id, limit - recommendations.length);
        recommendations.push(...popular);
      }

      if (recommendations.length < limit) {
        // Estratégia 3: Produtos novos
        const newProducts = await this.getNewestProducts(limit - recommendations.length);
        recommendations.push(...newProducts);
      }

      // Remove duplicatas
      const unique = [...new Map(recommendations.map(item => [item.id, item])).values()];

      // Salvar no cache por 24 horas
      cache.set(cacheKey, unique.slice(0, limit), 86400);

      return unique.slice(0, limit);
    } catch (error) {
      throw new AppError('Erro ao obter recomendações personalizadas: ' + error.message, 400);
    }
  }

  async getSimilarProductsFromPurchases(user_id, limit) {
    try {
      const query = `
        SELECT DISTINCT
          p.id,
          p.name,
          p.price,
          p.image,
          p.category,
          AVG(r.rating) as rating,
          COUNT(oi.id) as purchase_count
        FROM products p
        LEFT JOIN reviews r ON p.id = r.product_id
        LEFT JOIN order_items oi ON p.id = oi.product_id
        WHERE p.category IN (
          SELECT DISTINCT category FROM products 
          WHERE id IN (
            SELECT product_id FROM order_items 
            WHERE order_id IN (
              SELECT id FROM orders WHERE user_id = ?
            )
          )
        )
        AND p.id NOT IN (
          SELECT product_id FROM order_items 
          WHERE order_id IN (
            SELECT id FROM orders WHERE user_id = ?
          )
        )
        AND p.active = 1
        GROUP BY p.id
        ORDER BY purchase_count DESC, rating DESC
        LIMIT ?
      `;

      const [products] = await db.execute(query, [user_id, user_id, limit]);
      return products;
    } catch (error) {
      console.error('Erro ao buscar produtos similares:', error);
      return [];
    }
  }

  async getPopularProductsNotViewed(user_id, limit) {
    try {
      const query = `
        SELECT 
          p.id,
          p.name,
          p.price,
          p.image,
          p.category,
          COUNT(oi.id) as purchase_count,
          AVG(r.rating) as rating
        FROM products p
        LEFT JOIN order_items oi ON p.id = oi.product_id
        LEFT JOIN reviews r ON p.id = r.product_id
        WHERE p.id NOT IN (
          SELECT product_id FROM order_items 
          WHERE order_id IN (
            SELECT id FROM orders WHERE user_id = ?
          )
        )
        AND p.id NOT IN (
          SELECT product_id FROM events 
          WHERE user_id = ? AND event_type = 'view'
        )
        AND p.active = 1
        GROUP BY p.id
        HAVING purchase_count > 2
        ORDER BY purchase_count DESC, rating DESC
        LIMIT ?
      `;

      const [products] = await db.execute(query, [user_id, user_id, limit]);
      return products;
    } catch (error) {
      console.error('Erro ao buscar produtos populares:', error);
      return [];
    }
  }

  async getNewestProducts(limit) {
    try {
      const query = `
        SELECT 
          p.id,
          p.name,
          p.price,
          p.image,
          p.category,
          p.created_at,
          AVG(r.rating) as rating
        FROM products p
        LEFT JOIN reviews r ON p.id = r.product_id
        WHERE p.active = 1
        GROUP BY p.id
        ORDER BY p.created_at DESC
        LIMIT ?
      `;

      const [products] = await db.execute(query, [limit]);
      return products;
    } catch (error) {
      console.error('Erro ao buscar produtos novos:', error);
      return [];
    }
  }

  async getTrendingProducts(limit = 10, days = 7) {
    try {
      const query = `
        SELECT 
          p.id,
          p.name,
          p.price,
          p.image,
          p.category,
          COUNT(e.id) as view_count,
          COUNT(CASE WHEN e.event_type = 'view' THEN 1 END) as views,
          COUNT(CASE WHEN e.event_type = 'add_to_cart' THEN 1 END) as cart_adds,
          COUNT(CASE WHEN e.event_type = 'purchase' THEN 1 END) as purchases,
          AVG(r.rating) as rating
        FROM products p
        LEFT JOIN events e ON p.id = e.product_id AND e.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        LEFT JOIN reviews r ON p.id = r.product_id
        WHERE p.active = 1
        GROUP BY p.id
        ORDER BY (
          COUNT(CASE WHEN e.event_type = 'purchase' THEN 1 END) * 3 +
          COUNT(CASE WHEN e.event_type = 'add_to_cart' THEN 1 END) * 2 +
          COUNT(CASE WHEN e.event_type = 'view' THEN 1 END)
        ) DESC
        LIMIT ?
      `;

      const [products] = await db.execute(query, [days, limit]);
      return products;
    } catch (error) {
      throw new AppError('Erro ao obter produtos em tendência: ' + error.message, 400);
    }
  }

  async getProductRecommendations(product_id, limit = 5) {
    try {
      const cacheKey = `recommendations:product:${product_id}`;
      const cached = cache.get(cacheKey);
      if (cached) return cached;

      const query = `
        SELECT DISTINCT
          p.id,
          p.name,
          p.price,
          p.image,
          p.category,
          AVG(r.rating) as rating,
          COUNT(oi.id) as purchase_count
        FROM products p
        LEFT JOIN reviews r ON p.id = r.product_id
        LEFT JOIN order_items oi ON p.id = oi.product_id
        WHERE p.category = (SELECT category FROM products WHERE id = ?)
        AND p.id != ?
        AND p.active = 1
        GROUP BY p.id
        ORDER BY purchase_count DESC, rating DESC
        LIMIT ?
      `;

      const [products] = await db.execute(query, [product_id, product_id, limit]);

      cache.set(cacheKey, products, 3600);
      return products;
    } catch (error) {
      throw new AppError('Erro ao obter recomendações de produtos: ' + error.message, 400);
    }
  }

  async recordEvent(user_id, product_id, event_type, metadata = {}) {
    try {
      const query = `
        INSERT INTO events (user_id, product_id, event_type, metadata, created_at)
        VALUES (?, ?, ?, ?, NOW())
      `;

      await db.execute(query, [user_id, product_id, event_type, JSON.stringify(metadata)]);

      // Invalidar cache de recomendações do usuário
      cache.delete(`recommendations:user:${user_id}`);
    } catch (error) {
      console.error('Erro ao registrar evento:', error);
    }
  }

  async getCategoryRecommendations(category, limit = 10) {
    try {
      const query = `
        SELECT 
          p.id,
          p.name,
          p.price,
          p.image,
          p.category,
          COUNT(oi.id) as purchase_count,
          AVG(r.rating) as rating
        FROM products p
        LEFT JOIN order_items oi ON p.id = oi.product_id
        LEFT JOIN reviews r ON p.id = r.product_id
        WHERE p.category = ?
        AND p.active = 1
        GROUP BY p.id
        ORDER BY purchase_count DESC, rating DESC
        LIMIT ?
      `;

      const [products] = await db.execute(query, [category, limit]);
      return products;
    } catch (error) {
      throw new AppError('Erro ao obter recomendações de categoria: ' + error.message, 400);
    }
  }

  async getRelatedProducts(product_id, limit = 5) {
    try {
      const query = `
        SELECT DISTINCT
          p.id,
          p.name,
          p.price,
          p.image,
          p.category,
          SQRT(
            POW(p.price - (SELECT price FROM products WHERE id = ?), 2)
          ) as price_similarity,
          AVG(r.rating) as rating
        FROM products p
        LEFT JOIN reviews r ON p.id = r.product_id
        WHERE p.id != ?
        AND p.active = 1
        ORDER BY price_similarity ASC, rating DESC
        LIMIT ?
      `;

      const [products] = await db.execute(query, [product_id, product_id, limit]);
      return products;
    } catch (error) {
      throw new AppError('Erro ao obter produtos relacionados: ' + error.message, 400);
    }
  }
}

module.exports = new RecommendationService();

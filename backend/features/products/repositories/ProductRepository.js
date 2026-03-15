const IRepository = require('../../../core/interfaces/IRepository');
const db = require('../../../config/database');
const NotFoundError = require('../../../core/errors/NotFoundError');

/**
 * Repositório de Produtos
 * Responsável por todas as operações de CRUD com a tabela products
 * Implementa padrão Repository + Query Builder
 */
class ProductRepository extends IRepository {
  
  /**
   * Encontrar produto por ID com relacionamentos
   * @param {number} id - ID do produto
   * @param {object} options - Opções (incluir imagens, reviews, etc)
   * @returns {Promise<Product>}
   */
  async findById(id, options = {}) {
    try {
      const query = `
        SELECT p.*, c.name as category_name, c.slug as category_slug,
               COUNT(DISTINCT r.id) as review_count,
               AVG(r.rating) as rating
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN reviews r ON p.id = r.product_id AND r.is_approved = TRUE
        WHERE p.id = ?
        GROUP BY p.id
      `;

      const [results] = await db.query(query, [id]);

      if (!results.length) {
        throw new NotFoundError('Produto', id);
      }

      const product = results[0];

      // Incluir imagens se solicitado
      if (options.includeImages) {
        const [images] = await db.query(
          'SELECT id, image_url, alt_text FROM product_images WHERE product_id = ? ORDER BY display_order',
          [id]
        );
        product.images = images;
      }

      // Incluir reviews se solicitado
      if (options.includeReviews) {
        const [reviews] = await db.query(
          `SELECT r.*, u.name as user_name 
           FROM reviews r 
           JOIN users u ON r.user_id = u.id 
           WHERE r.product_id = ? AND r.is_approved = TRUE 
           ORDER BY r.created_at DESC`,
          [id]
        );
        product.reviews = reviews;
      }

      return product;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Encontrar todos os produtos com filtros e paginação
   * @param {object} filters - { categoryId, active, featured, searchQuery, sortBy }
   * @param {object} pagination - { page, limit }
   * @returns {Promise<{data, pagination}>}
   */
  async findAll(filters = {}, pagination = { page: 1, limit: 20 }) {
    try {
      const {
        categoryId,
        active = true,
        featured = false,
        searchQuery,
        sortBy = 'created_at',
        minPrice,
        maxPrice
      } = filters;

      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      // Construir query dinamicamente
      let whereConditions = [];
      let queryParams = [];

      if (active !== undefined) {
        whereConditions.push('p.is_active = ?');
        queryParams.push(active);
      }

      if (featured) {
        whereConditions.push('p.is_featured = TRUE');
      }

      if (categoryId) {
        whereConditions.push('p.category_id = ?');
        queryParams.push(categoryId);
      }

      if (minPrice !== undefined) {
        whereConditions.push('p.price >= ?');
        queryParams.push(minPrice);
      }

      if (maxPrice !== undefined) {
        whereConditions.push('p.price <= ?');
        queryParams.push(maxPrice);
      }

      // Busca full-text se há query de busca
      let fullTextCondition = '';
      if (searchQuery) {
        fullTextCondition = 'AND MATCH(p.name, p.description, p.short_description) AGAINST(? IN BOOLEAN MODE)';
        queryParams.push(`+${searchQuery}*`);
      }

      const whereClause = whereConditions.length 
        ? 'WHERE ' + whereConditions.join(' AND ') + ' ' + fullTextCondition
        : (fullTextCondition ? 'WHERE ' + fullTextCondition.substring(4) : '');

      // Ordenação validada
      const sortOptions = {
        'created_at': 'p.created_at DESC',
        'price_asc': 'p.price ASC',
        'price_desc': 'p.price DESC',
        'rating': 'p.rating DESC',
        'sold': 'p.total_sold DESC'
      };

      const orderBy = sortOptions[sortBy] || sortOptions.created_at;

      // Query de dados
      const dataQuery = `
        SELECT p.id, p.name, p.price, p.discount_price, p.cover_image,
               p.rating, p.review_count, p.category_id
        FROM products p
        ${whereClause}
        ORDER BY ${orderBy}
        LIMIT ? OFFSET ?
      `;

      queryParams.push(limit, offset);
      const [products] = await db.query(dataQuery, queryParams);

      // Query de contagem
      const countQuery = `SELECT COUNT(*) as total FROM products p ${whereClause}`;
      const countParams = queryParams.slice(0, -2); // Remove LIMIT e OFFSET
      const [countResult] = await db.query(countQuery, countParams);
      const total = countResult[0].total;

      return {
        data: products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Criar novo produto
   * @param {object} data - Dados do produto
   * @returns {Promise<number>} - ID do produto criado
   */
  async create(data) {
    try {
      const {
        sku, name, slug, description, shortDescription, 
        price, discountPrice, categoryId, platform
      } = data;

      const query = `
        INSERT INTO products (
          sku, name, slug, description, short_description,
          price, discount_price, category_id, platform
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [result] = await db.query(query, [
        sku, name, slug, description, shortDescription,
        price, discountPrice, categoryId, platform
      ]);

      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Atualizar produto
   * @param {number} id - ID do produto
   * @param {object} data - Dados a atualizar
   * @returns {Promise<boolean>}
   */
  async update(id, data) {
    try {
      const fields = [];
      const values = [];

      // Construir query dinamicamente baseado em dados fornecidos
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          fields.push(`${this.camelToSnake(key)} = ?`);
          values.push(value);
        }
      });

      if (!fields.length) {
        return false;
      }

      values.push(id);
      const query = `UPDATE products SET ${fields.join(', ')} WHERE id = ?`;
      
      const [result] = await db.query(query, values);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Deletar produto
   * @param {number} id - ID do produto
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    try {
      const [result] = await db.query('DELETE FROM products WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Contar produtos com filtros
   * @param {object} filters - Filtros a aplicar
   * @returns {Promise<number>}
   */
  async count(filters = {}) {
    try {
      const { categoryId, active = true } = filters;
      
      let query = 'SELECT COUNT(*) as total FROM products WHERE is_active = ?';
      const params = [active];

      if (categoryId) {
        query += ' AND category_id = ?';
        params.push(categoryId);
      }

      const [result] = await db.query(query, params);
      return result[0].total;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verificar se produto existe
   * @param {number} id - ID do produto
   * @returns {Promise<boolean>}
   */
  async exists(id) {
    try {
      const [result] = await db.query(
        'SELECT 1 FROM products WHERE id = ?', 
        [id]
      );
      return result.length > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Incrementar visualizações de produto
   * @param {number} id - ID do produto
   * @returns {Promise<void>}
   */
  async incrementViews(id) {
    try {
      await db.query('UPDATE products SET view_count = view_count + 1 WHERE id = ?', [id]);
    } catch (error) {
      // Não lançar erro para não quebrar fluxo principal
      console.error('Erro ao incrementar visualizações:', error);
    }
  }

  /**
   * Obter produtos relacionados/recomendados
   * @param {number} id - ID do produto
   * @param {number} limit - Quantidade de produtos
   * @returns {Promise<Array>}
   */
  async getRecommendations(id, limit = 5) {
    try {
      const query = `
        SELECT p.id, p.name, p.price, p.cover_image, p.rating,
               r.score, r.strategy
        FROM recommendations r
        JOIN products p ON r.recommended_product_id = p.id
        WHERE r.source_product_id = ? AND p.is_active = TRUE
        ORDER BY r.score DESC
        LIMIT ?
      `;

      const [products] = await db.query(query, [id, limit]);
      return products;
    } catch (error) {
      return []; // Retornar vazio se falhar
    }
  }

  /**
   * Converter camelCase para snake_case
   * @private
   */
  camelToSnake(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}

module.exports = ProductRepository;

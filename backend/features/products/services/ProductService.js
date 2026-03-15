const ProductRepository = require('../repositories/ProductRepository');
const { NotFoundError, ValidationError } = require('../../../core/errors');
const { BUSINESS_RULES } = require('../../../shared/constants/businessRules');

/**
 * Serviço de Produtos
 * Orquestra lógica de negócio, validações e coordenação entre repositórios
 */
class ProductService {
  constructor(repository = null, cacheService = null, analyticsService = null) {
    this.repository = repository || new ProductRepository();
    this.cache = cacheService;
    this.analytics = analyticsService;
  }

  /**
   * Obter produto com todas as informações e recomendações
   * @param {number} productId - ID do produto
   * @param {object} options - Opções (incluir recomendações, reviews, etc)
   * @returns {Promise<object>}
   */
  async getProduct(productId, options = {}) {
    try {
      // Validar ID
      if (!productId || productId < 1) {
        throw new ValidationError('ID do produto inválido', { productId: 'Deve ser um número positivo' });
      }

      // Tentar obter do cache
      if (this.cache) {
        const cached = await this.cache.get(`product:${productId}`);
        if (cached) return cached;
      }

      // Buscar do banco
      const product = await this.repository.findById(productId, {
        includeImages: true,
        includeReviews: options.includeReviews !== false
      });

      if (!product) {
        throw new NotFoundError('Produto', productId);
      }

      // Incrementar visualizações
      if (this.analytics) {
        await this.analytics.trackEvent('product_viewed', productId);
      }
      await this.repository.incrementViews(productId);

      // Adicionar recomendações se solicitado
      if (options.includeRecommendations !== false) {
        product.recommendations = await this.repository.getRecommendations(productId, 5);
      }

      // Calcular preço final (com desconto)
      product.finalPrice = this.calculateFinalPrice(product);

      // Formatar dados sensíveis
      product = this.formatProductResponse(product);

      // Cachear resultado
      if (this.cache) {
        await this.cache.set(`product:${productId}`, product, BUSINESS_RULES.CACHE.TTL.MEDIUM);
      }

      return product;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Listar produtos com filtros avançados
   * @param {object} filters - Filtros (categoria, preço, busca, etc)
   * @param {object} pagination - Paginação (página, limite)
   * @returns {Promise<object>}
   */
  async listProducts(filters = {}, pagination = { page: 1, limit: 20 }) {
    try {
      // Validar filtros
      this.validateFilters(filters);
      this.validatePagination(pagination);

      // Gerar chave de cache
      const cacheKey = `products:${JSON.stringify({ filters, pagination })}`;
      if (this.cache) {
        const cached = await this.cache.get(cacheKey);
        if (cached) return cached;
      }

      // Buscar produtos
      const result = await this.repository.findAll(filters, pagination);

      // Formatar resposta
      result.data = result.data.map(product => this.formatProductResponse(product));

      // Cachear
      if (this.cache) {
        await this.cache.set(cacheKey, result, BUSINESS_RULES.CACHE.TTL.SHORT);
      }

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Criar novo produto (apenas admin)
   * @param {object} data - Dados do produto
   * @returns {Promise<object>}
   */
  async createProduct(data) {
    try {
      // Validar dados
      this.validateProductData(data);

      // Validar regras de negócio
      if (data.discountPrice && data.discountPrice >= data.price) {
        throw new ValidationError('Preço de desconto inválido', {
          discountPrice: 'Deve ser menor que o preço original'
        });
      }

      // Verificar SKU único
      const existing = await this.repository.findBySku(data.sku);
      if (existing) {
        throw new ValidationError('SKU já existe', { sku: 'Este SKU já está em uso' });
      }

      // Criar produto
      const productId = await this.repository.create({
        sku: data.sku,
        name: data.name,
        slug: this.generateSlug(data.name),
        description: data.description,
        shortDescription: data.shortDescription,
        price: parseFloat(data.price),
        discountPrice: data.discountPrice ? parseFloat(data.discountPrice) : null,
        categoryId: data.categoryId,
        platform: data.platform
      });

      // Invalidar cache de produtos
      if (this.cache) {
        await this.cache.invalidatePattern('products:*');
      }

      return await this.getProduct(productId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Atualizar produto
   * @param {number} productId - ID do produto
   * @param {object} data - Dados a atualizar
   * @returns {Promise<object>}
   */
  async updateProduct(productId, data) {
    try {
      // Verificar existência
      if (!await this.repository.exists(productId)) {
        throw new NotFoundError('Produto', productId);
      }

      // Validar dados (apenas campos fornecidos)
      this.validateProductUpdate(data);

      // Atualizar
      const success = await this.repository.update(productId, data);

      if (!success) {
        throw new Error('Falha ao atualizar produto');
      }

      // Invalidar cache
      if (this.cache) {
        await this.cache.delete(`product:${productId}`);
        await this.cache.invalidatePattern('products:*');
      }

      return await this.getProduct(productId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Deletar produto
   * @param {number} productId - ID do produto
   * @returns {Promise<boolean>}
   */
  async deleteProduct(productId) {
    try {
      // Verificar existência
      if (!await this.repository.exists(productId)) {
        throw new NotFoundError('Produto', productId);
      }

      // Deletar
      const success = await this.repository.delete(productId);

      // Invalidar cache
      if (this.cache) {
        await this.cache.delete(`product:${productId}`);
        await this.cache.invalidatePattern('products:*');
      }

      return success;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obter produtos relacionados por categoria
   * @param {number} productId - ID do produto
   * @param {number} limit - Quantidade máxima
   * @returns {Promise<Array>}
   */
  async getRelatedProducts(productId, limit = 6) {
    try {
      const product = await this.repository.findById(productId);
      
      const result = await this.repository.findAll(
        { categoryId: product.category_id, active: true },
        { page: 1, limit: limit + 1 }
      );

      // Remover o próprio produto
      return result.data.filter(p => p.id !== productId).slice(0, limit);
    } catch (error) {
      return []; // Retornar array vazio em caso de erro
    }
  }

  /**
   * Busca full-text de produtos
   * @param {string} query - Query de busca
   * @param {object} pagination - Paginação
   * @returns {Promise<object>}
   */
  async search(query, pagination = { page: 1, limit: 20 }) {
    try {
      if (!query || query.length < 2) {
        throw new ValidationError('Query de busca inválida', { 
          query: 'Deve ter pelo menos 2 caracteres' 
        });
      }

      return await this.repository.findAll(
        { searchQuery: query, active: true },
        pagination
      );
    } catch (error) {
      throw error;
    }
  }

  // ========== Métodos Auxiliares ==========

  /**
   * Calcular preço final com desconto
   * @private
   */
  calculateFinalPrice(product) {
    if (product.discount_price) {
      return product.discount_price;
    }
    return product.price;
  }

  /**
   * Validar dados do produto
   * @private
   */
  validateProductData(data) {
    const errors = {};

    if (!data.name || data.name.length < 3) {
      errors.name = 'Nome deve ter pelo menos 3 caracteres';
    }

    if (!data.description || data.description.length < 10) {
      errors.description = 'Descrição deve ter pelo menos 10 caracteres';
    }

    if (!data.price || data.price <= 0) {
      errors.price = 'Preço deve ser maior que 0';
    }

    if (!data.categoryId) {
      errors.categoryId = 'Categoria é obrigatória';
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError('Dados do produto inválidos', errors);
    }
  }

  /**
   * Validar atualização de produto
   * @private
   */
  validateProductUpdate(data) {
    const errors = {};

    if (data.name && data.name.length < 3) {
      errors.name = 'Nome deve ter pelo menos 3 caracteres';
    }

    if (data.price && data.price <= 0) {
      errors.price = 'Preço deve ser maior que 0';
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError('Dados de atualização inválidos', errors);
    }
  }

  /**
   * Validar filtros
   * @private
   */
  validateFilters(filters) {
    if (filters.minPrice && filters.minPrice < 0) {
      throw new ValidationError('Filtro inválido', { 
        minPrice: 'Preço mínimo não pode ser negativo' 
      });
    }

    if (filters.maxPrice && filters.maxPrice < 0) {
      throw new ValidationError('Filtro inválido', { 
        maxPrice: 'Preço máximo não pode ser negativo' 
      });
    }

    if (filters.minPrice && filters.maxPrice && filters.minPrice > filters.maxPrice) {
      throw new ValidationError('Filtro inválido', { 
        price: 'Preço mínimo não pode ser maior que o máximo' 
      });
    }
  }

  /**
   * Validar paginação
   * @private
   */
  validatePagination(pagination) {
    if (pagination.page < 1) {
      throw new ValidationError('Paginação inválida', { 
        page: 'Deve ser maior que 0' 
      });
    }

    if (pagination.limit < 1 || pagination.limit > 100) {
      throw new ValidationError('Paginação inválida', { 
        limit: 'Deve estar entre 1 e 100' 
      });
    }
  }

  /**
   * Gerar slug a partir do nome
   * @private
   */
  generateSlug(name) {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  /**
   * Formatar resposta de produto
   * @private
   */
  formatProductResponse(product) {
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      shortDescription: product.short_description,
      price: parseFloat(product.price),
      discountPrice: product.discount_price ? parseFloat(product.discount_price) : null,
      finalPrice: this.calculateFinalPrice(product),
      rating: parseFloat(product.rating) || 0,
      reviewCount: product.review_count || 0,
      totalSold: product.total_sold || 0,
      stock: product.stock || 0,
      isActive: !!product.is_active,
      isFeatured: !!product.is_featured,
      coverImage: product.cover_image,
      category: {
        id: product.category_id,
        name: product.category_name
      },
      images: product.images || [],
      reviews: product.reviews || [],
      recommendations: product.recommendations || []
    };
  }
}

module.exports = ProductService;

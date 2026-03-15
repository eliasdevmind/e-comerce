const OrderRepository = require('../repositories/OrderRepository');
const NotFoundError = require('../../../core/errors/NotFoundError');
const ValidationError = require('../../../core/errors/ValidationError');
const { BUSINESS_RULES } = require('../../../shared/constants/businessRules');

/**
 * Serviço de Pedidos
 * Orquestra lógica de negócio relacionada a pedidos e checkout
 */
class OrderService {
  
  constructor(repository = null) {
    this.repository = repository || new OrderRepository();
  }

  /**
   * Criar novo pedido a partir do carrinho
   * @param {number} userId - ID do usuário
   * @param {number} shippingAddressId - ID do endereço de entrega
   * @param {array} cartItems - Itens do carrinho [{productId, quantity, price}]
   * @param {object} discounts - {couponCode, discountAmount}
   * @returns {Promise<object>}
   */
  async createOrder(userId, shippingAddressId, cartItems, discounts = {}) {
    try {
      // Validar entrada
      if (!cartItems || cartItems.length === 0) {
        throw new ValidationError('Carrinho vazio', { 
          cartItems: 'Adicione itens ao carrinho' 
        });
      }

      if (!shippingAddressId) {
        throw new ValidationError('Endereço obrigatório', { 
          shippingAddress: 'Selecione um endereço de entrega' 
        });
      }

      // Calcular totais
      const subtotal = this.calculateSubtotal(cartItems);
      const tax = this.calculateTax(subtotal);
      const shippingCost = BUSINESS_RULES.ORDER.SHIPPING_COST;
      const discountAmount = discounts.discountAmount || 0;
      const totalAmount = subtotal + tax + shippingCost - discountAmount;

      // Validar valores
      if (totalAmount < 0) {
        throw new ValidationError('Desconto inválido', {
          discountAmount: 'Desconto não pode ser maior que o total'
        });
      }

      // Gerar número do pedido
      const orderNumber = this.generateOrderNumber();

      // Criar pedido
      const orderId = await this.repository.create({
        orderNumber,
        userId,
        subtotal,
        tax,
        shippingCost,
        discountAmount,
        totalAmount,
        shippingAddressId,
        status: 'pending',
        paymentStatus: 'pending',
        paymentMethod: 'pending'
      });

      // Adicionar itens ao pedido
      for (const item of cartItems) {
        await this.repository.addItem(orderId, {
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.price
        });
      }

      // Buscar pedido criado
      return await this.getOrder(orderId, userId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obter pedido por ID
   * @param {number} orderId - ID do pedido
   * @param {number} userId - ID do usuário (para validação)
   * @returns {Promise<object>}
   */
  async getOrder(orderId, userId) {
    try {
      const order = await this.repository.findById(orderId);

      if (!order) {
        throw new NotFoundError('Pedido', orderId);
      }

      // Validar acesso (usuário só vê seus pedidos, admin vê todos)
      if (order.user_id !== userId && !this.isAdmin) {
        throw new Error('Acesso negado');
      }

      // Buscar itens
      const items = await this.repository.getItems(orderId);

      return this.formatOrderResponse({
        ...order,
        items
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Listar pedidos do usuário
   * @param {number} userId - ID do usuário
   * @param {object} filters - {status, paymentStatus}
   * @param {object} pagination - {page, limit}
   * @returns {Promise<object>}
   */
  async listUserOrders(userId, filters = {}, pagination = { page: 1, limit: 20 }) {
    try {
      filters.userId = userId;

      const result = await this.repository.findAll(filters, pagination);

      return {
        data: result.data.map(order => this.formatOrderResponse(order)),
        pagination: result.pagination
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Listar todos os pedidos (admin)
   * @param {object} filters - Filtros
   * @param {object} pagination - Paginação
   * @returns {Promise<object>}
   */
  async listAllOrders(filters = {}, pagination = { page: 1, limit: 50 }) {
    try {
      const result = await this.repository.findAll(filters, pagination);

      return {
        data: result.data.map(order => this.formatOrderResponse(order)),
        pagination: result.pagination
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cancelar pedido
   * @param {number} orderId - ID do pedido
   * @param {string} reason - Motivo do cancelamento
   * @returns {Promise<boolean>}
   */
  async cancelOrder(orderId, reason = '') {
    try {
      const order = await this.repository.findById(orderId);

      if (!order) {
        throw new NotFoundError('Pedido', orderId);
      }

      // Validar status
      if (order.status !== 'pending' && order.status !== 'confirmed') {
        throw new ValidationError('Pedido não pode ser cancelado', {
          status: `Status '${order.status}' não permite cancelamento`
        });
      }

      // Cancelar
      const success = await this.repository.updateStatus(orderId, 'cancelled', reason);

      return success;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Confirmar pagamento de pedido
   * @param {number} orderId - ID do pedido
   * @param {object} paymentData - {gateway, transactionId, amount}
   * @returns {Promise<object>}
   */
  async confirmPayment(orderId, paymentData) {
    try {
      const order = await this.repository.findById(orderId);

      if (!order) {
        throw new NotFoundError('Pedido', orderId);
      }

      // Atualizar status de pagamento
      const success = await this.repository.updatePaymentStatus(
        orderId,
        'approved',
        paymentData.gateway,
        paymentData.transactionId
      );

      if (success) {
        // Atualizar status do pedido para confirmado
        await this.repository.updateStatus(orderId, 'confirmed');
      }

      return await this.getOrder(orderId, order.user_id);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Atualizar status do pedido (admin)
   * @param {number} orderId - ID do pedido
   * @param {string} status - Novo status
   * @returns {Promise<boolean>}
   */
  async updateOrderStatus(orderId, status) {
    try {
      // Validar status
      const validStatuses = Object.values(BUSINESS_RULES.ORDER.STATUSES);
      if (!validStatuses.includes(status)) {
        throw new ValidationError('Status inválido', {
          status: `Status deve ser um de: ${validStatuses.join(', ')}`
        });
      }

      const order = await this.repository.findById(orderId);
      if (!order) {
        throw new NotFoundError('Pedido', orderId);
      }

      return await this.repository.updateStatus(orderId, status);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obter estatísticas de pedidos (admin)
   * @returns {Promise<object>}
   */
  async getStatistics() {
    try {
      return await this.repository.getStatistics();
    } catch (error) {
      throw error;
    }
  }

  // ========== Métodos Privados ==========

  /**
   * Calcular subtotal do carrinho
   * @private
   */
  calculateSubtotal(items) {
    return items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  }

  /**
   * Calcular impostos (10% do subtotal)
   * @private
   */
  calculateTax(subtotal) {
    return subtotal * 0.10;
  }

  /**
   * Gerar número único do pedido
   * @private
   */
  generateOrderNumber() {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }

  /**
   * Formatar resposta de pedido
   * @private
   */
  formatOrderResponse(order) {
    return {
      id: order.id,
      orderNumber: order.order_number,
      userId: order.user_id,
      subtotal: parseFloat(order.subtotal),
      tax: parseFloat(order.tax),
      shippingCost: parseFloat(order.shipping_cost),
      discountAmount: parseFloat(order.discount_amount),
      totalAmount: parseFloat(order.total_amount),
      status: order.status,
      paymentStatus: order.payment_status,
      paymentMethod: order.payment_method,
      shippingAddress: order.shipping_address,
      notes: order.notes,
      items: order.items || [],
      createdAt: order.created_at,
      updatedAt: order.updated_at
    };
  }
}

module.exports = OrderService;

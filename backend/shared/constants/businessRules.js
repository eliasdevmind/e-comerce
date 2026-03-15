// Constantes de negócio
const BUSINESS_RULES = {
  // Pagamentos
  PAYMENT: {
    MAX_INSTALLMENTS: 12,
    MIN_INSTALLMENT_AMOUNT: 20,
    GATEWAYS: ['mercado_pago', 'stripe', 'paypal'],
    METHODS: {
      CREDIT_CARD: 'credit_card',
      DEBIT_CARD: 'debit_card',
      PIX: 'pix',
      BOLETO: 'boleto'
    }
  },

  // Pedidos
  ORDER: {
    STATUSES: {
      PENDING: 'pending',
      CONFIRMED: 'confirmed',
      PROCESSING: 'processing',
      SHIPPED: 'shipped',
      DELIVERED: 'delivered',
      CANCELLED: 'cancelled',
      REFUNDED: 'refunded'
    },
    PAYMENT_STATUSES: {
      PENDING: 'pending',
      APPROVED: 'approved',
      REJECTED: 'rejected',
      CANCELLED: 'cancelled'
    },
    MAX_QUANTITY_PER_ITEM: 99,
    SHIPPING_COST: 15.00
  },

  // Produtos
  PRODUCT: {
    MAX_DISCOUNT_PERCENT: 100,
    MIN_PRICE: 0.01,
    DEFAULT_STOCK: 100,
    IMAGE_UPLOAD: {
      MAX_SIZE: 5242880, // 5MB
      ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      MAX_PER_PRODUCT: 10
    }
  },

  // Reviews
  REVIEW: {
    MIN_RATING: 1,
    MAX_RATING: 5,
    MIN_COMMENT_LENGTH: 10,
    MAX_COMMENT_LENGTH: 5000,
    MODERATION_REQUIRED: true
  },

  // Usuários
  USER: {
    ROLES: ['customer', 'admin', 'moderator'],
    STATUSES: ['active', 'inactive', 'suspended'],
    PASSWORD: {
      MIN_LENGTH: 8,
      REQUIRE_UPPERCASE: true,
      REQUIRE_NUMBERS: true,
      REQUIRE_SPECIAL: false
    }
  },

  // Cache
  CACHE: {
    TTL: {
      SHORT: 300,      // 5 minutos
      MEDIUM: 1800,    // 30 minutos
      LONG: 3600,      // 1 hora
      VERY_LONG: 86400 // 1 dia
    }
  }
};

const ERROR_CODES = {
  // Auth
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',

  // Products
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  INVALID_PRICE: 'INVALID_PRICE',

  // Orders
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  CART_EMPTY: 'CART_EMPTY',
  INVALID_SHIPPING_ADDRESS: 'INVALID_SHIPPING_ADDRESS',

  // Payments
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  GATEWAY_ERROR: 'GATEWAY_ERROR',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  REQUIRED_FIELD: 'REQUIRED_FIELD'
};

const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

module.exports = {
  BUSINESS_RULES,
  ERROR_CODES,
  HTTP_STATUS
};

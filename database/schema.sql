-- =================================================================
-- SCHEMA GAMESHOP E-COMMERCE - ARQUITETURA ESCALÁVEL E PROFISSIONAL
-- =================================================================

CREATE DATABASE IF NOT EXISTS games_ecommerce;
USE games_ecommerce;

-- ==================== TABELA: USUÁRIOS ====================
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role ENUM('customer', 'admin', 'moderator') DEFAULT 'customer',
  status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  CONSTRAINT email_format CHECK (email LIKE '%@%.%'),
  INDEX idx_email (email),
  INDEX idx_status (status),
  INDEX idx_created (created_at),
  INDEX idx_role (role)
);

-- ==================== TABELA: ENDEREÇOS ====================
CREATE TABLE user_addresses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  type ENUM('shipping', 'billing', 'default') DEFAULT 'shipping',
  street VARCHAR(255) NOT NULL,
  number VARCHAR(20) NOT NULL,
  complement VARCHAR(255),
  neighborhood VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(2) NOT NULL,
  zipcode VARCHAR(20) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_type (type),
  INDEX idx_primary (is_primary)
);

-- ==================== TABELA: CATEGORIAS ====================
CREATE TABLE categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  parent_id INT,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_parent (parent_id),
  INDEX idx_active (is_active),
  INDEX idx_slug (slug),
  INDEX idx_order (display_order)
);

-- ==================== TABELA: PRODUTOS ====================
CREATE TABLE products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  sku VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description LONGTEXT NOT NULL,
  short_description VARCHAR(500),
  price DECIMAL(10, 2) NOT NULL,
  discount_price DECIMAL(10, 2),
  category_id INT NOT NULL,
  platform VARCHAR(100),
  rating DECIMAL(3, 2) DEFAULT 0,
  review_count INT DEFAULT 0,
  total_sold INT DEFAULT 0,
  stock INT DEFAULT 100,
  cover_image VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  view_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
  CONSTRAINT price_positive CHECK (price > 0),
  CONSTRAINT discount_valid CHECK (discount_price IS NULL OR (discount_price > 0 AND discount_price < price)),
  CONSTRAINT stock_non_negative CHECK (stock >= 0),
  CONSTRAINT rating_valid CHECK (rating BETWEEN 0 AND 5),
  INDEX idx_category (category_id),
  INDEX idx_active (is_active),
  INDEX idx_featured (is_featured),
  INDEX idx_slug (slug),
  INDEX idx_sku (sku),
  INDEX idx_category_active (category_id, is_active),
  FULLTEXT INDEX ft_search (name, description, short_description)
);

-- ==================== TABELA: IMAGENS DE PRODUTOS ====================
CREATE TABLE product_images (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  alt_text VARCHAR(255),
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product (product_id),
  INDEX idx_order (display_order)
);

-- ==================== TABELA: CARRINHO ====================
CREATE TABLE cart_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT quantity_positive CHECK (quantity > 0),
  CONSTRAINT quantity_max CHECK (quantity <= 99),
  INDEX idx_user (user_id),
  UNIQUE KEY unique_cart_item (user_id, product_id)
);

-- ==================== TABELA: PEDIDOS ====================
CREATE TABLE orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  user_id INT NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) DEFAULT 0,
  shipping_cost DECIMAL(10, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded') DEFAULT 'pending',
  payment_status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
  payment_method VARCHAR(50),
  shipping_address INT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (shipping_address) REFERENCES user_addresses(id) ON DELETE SET NULL,
  CONSTRAINT total_positive CHECK (total_amount > 0),
  INDEX idx_user (user_id),
  INDEX idx_status (status),
  INDEX idx_payment_status (payment_status),
  INDEX idx_created (created_at),
  INDEX idx_user_created (user_id, created_at DESC),
  UNIQUE INDEX idx_order_number (order_number)
);

-- ==================== TABELA: ITENS DO PEDIDO ====================
CREATE TABLE order_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  CONSTRAINT quantity_positive CHECK (quantity > 0),
  CONSTRAINT price_positive CHECK (unit_price > 0),
  INDEX idx_order (order_id),
  INDEX idx_product (product_id)
);

-- ==================== TABELA: PAGAMENTOS ====================
CREATE TABLE payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  transaction_id VARCHAR(255) UNIQUE,
  gateway VARCHAR(50) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status ENUM('pending', 'authorized', 'captured', 'failed', 'refunded') DEFAULT 'pending',
  method ENUM('credit_card', 'debit_card', 'pix', 'boleto') DEFAULT 'credit_card',
  response_data JSON,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT amount_positive CHECK (amount > 0),
  INDEX idx_order (order_id),
  INDEX idx_status (status),
  INDEX idx_gateway (gateway),
  INDEX idx_created (created_at),
  INDEX idx_transaction (transaction_id)
);

-- ==================== TABELA: REVIEWS/AVALIAÇÕES ====================
CREATE TABLE reviews (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,
  user_id INT NOT NULL,
  rating INT NOT NULL,
  title VARCHAR(200),
  comment TEXT,
  is_verified_purchase BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT TRUE,
  helpful_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT rating_range CHECK (rating BETWEEN 1 AND 5),
  INDEX idx_product (product_id),
  INDEX idx_user (user_id),
  INDEX idx_approved (is_approved),
  INDEX idx_verified (is_verified_purchase),
  INDEX idx_created (created_at),
  INDEX idx_product_approved (product_id, is_approved),
  UNIQUE KEY unique_review (product_id, user_id)
);

-- ==================== TABELA: WISHLIST ====================
CREATE TABLE wishlist (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_product (user_id, product_id),
  INDEX idx_user (user_id)
);

-- ==================== TABELA: EVENTOS (Analytics) ====================
CREATE TABLE events (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  event_type VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50),
  entity_id INT,
  metadata JSON,
  ip_address VARCHAR(45),
  user_agent VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user (user_id),
  INDEX idx_event_type (event_type),
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_created (created_at),
  INDEX idx_user_event (user_id, event_type, created_at DESC)
);

-- ==================== TABELA: RECOMENDAÇÕES ====================
CREATE TABLE recommendations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  source_product_id INT NOT NULL,
  recommended_product_id INT NOT NULL,
  strategy VARCHAR(50) NOT NULL,
  score DECIMAL(5, 2) NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (source_product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (recommended_product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT score_valid CHECK (score BETWEEN 0 AND 100),
  INDEX idx_source (source_product_id),
  INDEX idx_strategy (strategy),
  UNIQUE KEY unique_recommendation (source_product_id, recommended_product_id, strategy)
);

-- ==================== DADOS INICIAIS ====================

-- Inserir categorias padrão
INSERT IGNORE INTO categories (name, slug, description) VALUES
('Action', 'action', 'Jogos de ação e aventura'),
('RPG', 'rpg', 'Role-Playing Games'),
('Strategy', 'strategy', 'Estratégia e simulação'),
('Sports', 'sports', 'Jogos de esportos'),
('Puzzle', 'puzzle', 'Puzzles e quebra-cabeças'),
('Indie', 'indie', 'Jogos independentes');

-- Inserir usuário admin (senha: admin123 - hash bcrypt com 10 rounds)
INSERT IGNORE INTO users (email, password, name, role) 
VALUES ('admin@gameshop.com', '$2a$10$K8H1.vy1XVfm1AFtzLDh2OPST9/PgBkqquzi.Hksv3OgYV.U9JYRW', 'Admin', 'admin');

-- ==================== FIM DO SCHEMA ====================

const pool = require('../models/database');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

// Obter todos os produtos com filtros
exports.getProducts = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 12 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM products WHERE is_active = TRUE';
    const params = [];

    if (category && category !== 'all') {
      query += ' AND category_id = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND (MATCH(name, description) AGAINST(? IN BOOLEAN MODE) OR name LIKE ?)';
      params.push(search, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [products] = await pool.query(query, params);
    
    // Obter imagens para cada produto
    for (let product of products) {
      const [images] = await pool.query(
        'SELECT id, image_url, alt_text FROM product_images WHERE product_id = ? ORDER BY display_order',
        [product.id]
      );
      product.images = images;
    }

    res.json(products);
  } catch (error) {
    console.error('Erro ao obter produtos:', error);
    res.status(500).json({ message: 'Erro ao obter produtos' });
  }
};

// Obter um produto específico
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [products] = await pool.query('SELECT * FROM products WHERE id = ? AND is_active = TRUE', [id]);
    
    if (products.length === 0) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    const product = products[0];

    // Obter imagens
    const [images] = await pool.query(
      'SELECT id, image_url, alt_text FROM product_images WHERE product_id = ? ORDER BY display_order',
      [id]
    );
    product.images = images;

    // Obter reviews
    const [reviews] = await pool.query(
      `SELECT r.id, r.rating, r.title, r.comment, r.created_at, u.name, u.id as user_id, r.is_verified_purchase
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.product_id = ? AND r.is_active = TRUE
       ORDER BY r.created_at DESC`,
      [id]
    );
    product.reviews = reviews;

    res.json(product);
  } catch (error) {
    console.error('Erro ao obter produto:', error);
    res.status(500).json({ message: 'Erro ao obter produto' });
  }
};

// Criar produto (Admin)
exports.createProduct = async (req, res) => {
  try {
    const { name, description, short_description, price, discount_price, category_id, platform, release_date, developer, publisher } = req.body;

    if (!name || !description || !price || !category_id) {
      return res.status(400).json({ message: 'Campos obrigatórios faltando' });
    }

    let coverImage = null;
    if (req.file) {
      coverImage = `/uploads/products/${req.file.filename}`;
    }

    const [result] = await pool.query(
      `INSERT INTO products (name, description, short_description, price, discount_price, category_id, platform, release_date, developer, publisher, cover_image)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, description, short_description, price, discount_price, category_id, platform, release_date, developer, publisher, coverImage]
    );

    res.status(201).json({ message: 'Produto criado com sucesso', productId: result.insertId });
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    res.status(500).json({ message: 'Erro ao criar produto' });
  }
};

// Atualizar produto (Admin)
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, short_description, price, discount_price, category_id, platform, release_date, developer, publisher, stock } = req.body;

    let query = 'UPDATE products SET name = ?, description = ?, short_description = ?, price = ?, discount_price = ?, category_id = ?, platform = ?, release_date = ?, developer = ?, publisher = ?, stock = ?';
    const params = [name, description, short_description, price, discount_price, category_id, platform, release_date, developer, publisher, stock];

    if (req.file) {
      const coverImage = `/uploads/products/${req.file.filename}`;
      query += ', cover_image = ?';
      params.push(coverImage);
    }

    query += ' WHERE id = ?';
    params.push(id);

    await pool.query(query, params);

    res.json({ message: 'Produto atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({ message: 'Erro ao atualizar produto' });
  }
};

// Deletar produto (Admin)
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query('DELETE FROM products WHERE id = ?', [id]);

    res.json({ message: 'Produto deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar produto:', error);
    res.status(500).json({ message: 'Erro ao deletar produto' });
  }
};

// Upload de imagens do produto
exports.uploadProductImages = async (req, res) => {
  try {
    const { product_id } = req.params;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Nenhuma imagem fornecida' });
    }

    const imageUrls = [];
    for (let i = 0; i < req.files.length; i++) {
      const imageUrl = `/uploads/products/${req.files[i].filename}`;
      await pool.query(
        'INSERT INTO product_images (product_id, image_url, display_order) VALUES (?, ?, ?)',
        [product_id, imageUrl, i]
      );
      imageUrls.push(imageUrl);
    }

    res.status(201).json({ message: 'Imagens enviadas com sucesso', images: imageUrls });
  } catch (error) {
    console.error('Erro ao fazer upload:', error);
    res.status(500).json({ message: 'Erro ao fazer upload' });
  }
};

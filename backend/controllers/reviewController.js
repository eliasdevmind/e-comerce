const pool = require('../models/database');

// Obter reviews de um produto
exports.getReviews = async (req, res) => {
  try {
    const { product_id } = req.params;

    const [reviews] = await pool.query(
      `SELECT r.id, r.rating, r.title, r.comment, r.created_at, r.helpful_count, u.name
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.product_id = ? AND r.is_active = TRUE
       ORDER BY r.created_at DESC`,
      [product_id]
    );

    res.json(reviews);
  } catch (error) {
    console.error('Erro ao obter reviews:', error);
    res.status(500).json({ message: 'Erro ao obter reviews' });
  }
};

// Criar review
exports.createReview = async (req, res) => {
  try {
    const { product_id } = req.params;
    const { rating, title, comment } = req.body;
    const user_id = req.user.id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating deve estar entre 1 e 5' });
    }

    // Verificar se o usuário já comprou este produto
    const [purchases] = await pool.query(
      `SELECT oi.id FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE o.user_id = ? AND oi.product_id = ? AND o.status = 'delivered'`,
      [user_id, product_id]
    );

    const isVerifiedPurchase = purchases.length > 0;

    // Verificar se já existe review do usuário para este produto
    const [existingReview] = await pool.query(
      'SELECT id FROM reviews WHERE user_id = ? AND product_id = ?',
      [user_id, product_id]
    );

    if (existingReview.length > 0) {
      return res.status(400).json({ message: 'Você já fez uma review deste produto' });
    }

    await pool.query(
      'INSERT INTO reviews (product_id, user_id, rating, title, comment, is_verified_purchase) VALUES (?, ?, ?, ?, ?, ?)',
      [product_id, user_id, rating, title, comment, isVerifiedPurchase]
    );

    // Atualizar rating médio do produto
    const [ratings] = await pool.query(
      'SELECT AVG(rating) as avg_rating FROM reviews WHERE product_id = ? AND is_active = TRUE',
      [product_id]
    );

    await pool.query(
      'UPDATE products SET rating = ? WHERE id = ?',
      [parseFloat(ratings[0].avg_rating || 0).toFixed(2), product_id]
    );

    res.status(201).json({ message: 'Review criada com sucesso' });
  } catch (error) {
    console.error('Erro ao criar review:', error);
    res.status(500).json({ message: 'Erro ao criar review' });
  }
};

// Atualizar review
exports.updateReview = async (req, res) => {
  try {
    const { review_id } = req.params;
    const { rating, title, comment } = req.body;
    const user_id = req.user.id;

    const [review] = await pool.query(
      'SELECT product_id FROM reviews WHERE id = ? AND user_id = ?',
      [review_id, user_id]
    );

    if (review.length === 0) {
      return res.status(403).json({ message: 'Você não tem permissão para atualizar esta review' });
    }

    await pool.query(
      'UPDATE reviews SET rating = ?, title = ?, comment = ? WHERE id = ?',
      [rating, title, comment, review_id]
    );

    // Atualizar rating médio
    const [ratings] = await pool.query(
      'SELECT AVG(rating) as avg_rating FROM reviews WHERE product_id = ? AND is_active = TRUE',
      [review[0].product_id]
    );

    await pool.query(
      'UPDATE products SET rating = ? WHERE id = ?',
      [parseFloat(ratings[0].avg_rating || 0).toFixed(2), review[0].product_id]
    );

    res.json({ message: 'Review atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar review:', error);
    res.status(500).json({ message: 'Erro ao atualizar review' });
  }
};

// Deletar review
exports.deleteReview = async (req, res) => {
  try {
    const { review_id } = req.params;
    const user_id = req.user.id;

    const [review] = await pool.query(
      'SELECT product_id FROM reviews WHERE id = ? AND user_id = ?',
      [review_id, user_id]
    );

    if (review.length === 0) {
      return res.status(403).json({ message: 'Você não tem permissão para deletar esta review' });
    }

    await pool.query('UPDATE reviews SET is_active = FALSE WHERE id = ?', [review_id]);

    // Atualizar rating médio
    const [ratings] = await pool.query(
      'SELECT AVG(rating) as avg_rating FROM reviews WHERE product_id = ? AND is_active = TRUE',
      [review[0].product_id]
    );

    await pool.query(
      'UPDATE products SET rating = ? WHERE id = ?',
      [parseFloat(ratings[0].avg_rating || 0).toFixed(2), review[0].product_id]
    );

    res.json({ message: 'Review deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar review:', error);
    res.status(500).json({ message: 'Erro ao deletar review' });
  }
};

// Marcar review como útil
exports.markHelpful = async (req, res) => {
  try {
    const { review_id } = req.params;

    await pool.query(
      'UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = ?',
      [review_id]
    );

    res.json({ message: 'Review marcada como útil' });
  } catch (error) {
    console.error('Erro ao marcar como útil:', error);
    res.status(500).json({ message: 'Erro ao marcar como útil' });
  }
};

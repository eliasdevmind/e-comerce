const pool = require('../models/database');

// Adicionar item ao carrinho
exports.addToCart = async (req, res) => {
  try {
    const { product_id, quantity } = req.body;
    const user_id = req.user.id;

    if (!product_id || !quantity || quantity < 1) {
      return res.status(400).json({ message: 'Product ID e quantity são obrigatórios' });
    }

    const [existing] = await pool.query(
      'SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?',
      [user_id, product_id]
    );

    if (existing.length > 0) {
      await pool.query(
        'UPDATE cart_items SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?',
        [quantity, user_id, product_id]
      );
    } else {
      await pool.query(
        'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)',
        [user_id, product_id, quantity]
      );
    }

    res.json({ message: 'Produto adicionado ao carrinho' });
  } catch (error) {
    console.error('Erro ao adicionar ao carrinho:', error);
    res.status(500).json({ message: 'Erro ao adicionar ao carrinho' });
  }
};

// Obter carrinho
exports.getCart = async (req, res) => {
  try {
    const user_id = req.user.id;

    const [cartItems] = await pool.query(
      `SELECT ci.id, ci.quantity, p.id as product_id, p.name, p.price, p.discount_price, p.cover_image
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = ?
       ORDER BY ci.added_at DESC`,
      [user_id]
    );

    const cart = {
      items: cartItems,
      subtotal: 0,
      tax: 0,
      total: 0
    };

    for (let item of cartItems) {
      const price = item.discount_price || item.price;
      item.subtotal = price * item.quantity;
      cart.subtotal += item.subtotal;
    }

    cart.tax = parseFloat((cart.subtotal * 0.1).toFixed(2));
    cart.total = parseFloat((cart.subtotal + cart.tax).toFixed(2));

    res.json(cart);
  } catch (error) {
    console.error('Erro ao obter carrinho:', error);
    res.status(500).json({ message: 'Erro ao obter carrinho' });
  }
};

// Atualizar quantidade do item
exports.updateCartItem = async (req, res) => {
  try {
    const { item_id } = req.params;
    const { quantity } = req.body;
    const user_id = req.user.id;

    if (quantity < 1) {
      return res.status(400).json({ message: 'Quantidade deve ser maior que 0' });
    }

    await pool.query(
      'UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?',
      [quantity, item_id, user_id]
    );

    res.json({ message: 'Carrinho atualizado' });
  } catch (error) {
    console.error('Erro ao atualizar carrinho:', error);
    res.status(500).json({ message: 'Erro ao atualizar carrinho' });
  }
};

// Remover item do carrinho
exports.removeFromCart = async (req, res) => {
  try {
    const { item_id } = req.params;
    const user_id = req.user.id;

    await pool.query(
      'DELETE FROM cart_items WHERE id = ? AND user_id = ?',
      [item_id, user_id]
    );

    res.json({ message: 'Item removido do carrinho' });
  } catch (error) {
    console.error('Erro ao remover do carrinho:', error);
    res.status(500).json({ message: 'Erro ao remover do carrinho' });
  }
};

// Limpar carrinho
exports.clearCart = async (req, res) => {
  try {
    const user_id = req.user.id;

    await pool.query('DELETE FROM cart_items WHERE user_id = ?', [user_id]);

    res.json({ message: 'Carrinho limpo' });
  } catch (error) {
    console.error('Erro ao limpar carrinho:', error);
    res.status(500).json({ message: 'Erro ao limpar carrinho' });
  }
};

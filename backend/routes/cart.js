const express = require('express');
const cartController = require('../controllers/cartController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.post('/add', verifyToken, cartController.addToCart);
router.get('/', verifyToken, cartController.getCart);
router.put('/:item_id', verifyToken, cartController.updateCartItem);
router.delete('/:item_id', verifyToken, cartController.removeFromCart);
router.delete('/', verifyToken, cartController.clearCart);

module.exports = router;

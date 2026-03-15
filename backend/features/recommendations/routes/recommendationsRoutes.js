const express = require('express');
const RecommendationController = require('../controllers/RecommendationController');
const authMiddleware = require('../../../core/middleware/authMiddleware');

const router = express.Router();

// Rotas públicas
router.get('/trending', RecommendationController.getTrending);
router.get('/product/:product_id', RecommendationController.getForProduct);
router.get('/category/:category', RecommendationController.getByCategory);
router.get('/related/:product_id', RecommendationController.getRelated);

// Rotas autenticadas
router.use(authMiddleware);

router.get('/personalized', RecommendationController.getPersonalized);
router.post('/event', RecommendationController.recordEvent);

module.exports = router;

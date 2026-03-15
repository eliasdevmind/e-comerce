const express = require('express');
const reviewController = require('../controllers/reviewController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.get('/:product_id', reviewController.getReviews);
router.post('/:product_id', verifyToken, reviewController.createReview);
router.put('/:review_id', verifyToken, reviewController.updateReview);
router.delete('/:review_id', verifyToken, reviewController.deleteReview);
router.post('/:review_id/helpful', verifyToken, reviewController.markHelpful);

module.exports = router;

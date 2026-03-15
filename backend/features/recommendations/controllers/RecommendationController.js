const RecommendationService = require('../services/RecommendationService');
const AppError = require('../../../core/errors/AppError');

class RecommendationController {
  async getPersonalized(req, res) {
    try {
      const user_id = req.user.id;
      const { limit = 10 } = req.query;

      const recommendations = await RecommendationService.getPersonalizedRecommendations(
        user_id,
        parseInt(limit)
      );

      res.json({
        success: true,
        data: recommendations
      });
    } catch (error) {
      res.status(error.statusCode || 400).json({
        success: false,
        error: error.message
      });
    }
  }

  async getTrending(req, res) {
    try {
      const { limit = 10, days = 7 } = req.query;

      const products = await RecommendationService.getTrendingProducts(
        parseInt(limit),
        parseInt(days)
      );

      res.json({
        success: true,
        data: products
      });
    } catch (error) {
      res.status(error.statusCode || 400).json({
        success: false,
        error: error.message
      });
    }
  }

  async getForProduct(req, res) {
    try {
      const { product_id } = req.params;
      const { limit = 5 } = req.query;

      const recommendations = await RecommendationService.getProductRecommendations(
        product_id,
        parseInt(limit)
      );

      res.json({
        success: true,
        data: recommendations
      });
    } catch (error) {
      res.status(error.statusCode || 400).json({
        success: false,
        error: error.message
      });
    }
  }

  async getByCategory(req, res) {
    try {
      const { category } = req.params;
      const { limit = 10 } = req.query;

      const products = await RecommendationService.getCategoryRecommendations(
        category,
        parseInt(limit)
      );

      res.json({
        success: true,
        data: products
      });
    } catch (error) {
      res.status(error.statusCode || 400).json({
        success: false,
        error: error.message
      });
    }
  }

  async getRelated(req, res) {
    try {
      const { product_id } = req.params;
      const { limit = 5 } = req.query;

      const products = await RecommendationService.getRelatedProducts(
        product_id,
        parseInt(limit)
      );

      res.json({
        success: true,
        data: products
      });
    } catch (error) {
      res.status(error.statusCode || 400).json({
        success: false,
        error: error.message
      });
    }
  }

  async recordEvent(req, res) {
    try {
      const user_id = req.user.id;
      const { product_id, event_type, metadata } = req.body;

      if (!product_id || !event_type) {
        throw new AppError('product_id e event_type são obrigatórios', 400);
      }

      await RecommendationService.recordEvent(user_id, product_id, event_type, metadata);

      res.json({
        success: true,
        message: 'Evento registrado com sucesso'
      });
    } catch (error) {
      res.status(error.statusCode || 400).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new RecommendationController();

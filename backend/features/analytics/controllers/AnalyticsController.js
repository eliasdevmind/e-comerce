const AnalyticsService = require('../services/AnalyticsService');
const AppError = require('../../../core/errors/AppError');

class AnalyticsController {
  async getDashboard(req, res) {
    try {
      const { days = 30 } = req.query;
      const metrics = await AnalyticsService.getDashboardMetrics(parseInt(days));

      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      res.status(error.statusCode || 400).json({
        success: false,
        error: error.message
      });
    }
  }

  async getRevenueTrend(req, res) {
    try {
      const { days = 30 } = req.query;
      const trend = await AnalyticsService.getRevenueTrend(parseInt(days));

      res.json({
        success: true,
        data: trend
      });
    } catch (error) {
      res.status(error.statusCode || 400).json({
        success: false,
        error: error.message
      });
    }
  }

  async getTopProducts(req, res) {
    try {
      const { limit = 10, days = 30 } = req.query;
      const products = await AnalyticsService.getTopProducts(parseInt(limit), parseInt(days));

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

  async getCustomerSegments(req, res) {
    try {
      const segments = await AnalyticsService.getCustomerSegments();

      res.json({
        success: true,
        data: segments
      });
    } catch (error) {
      res.status(error.statusCode || 400).json({
        success: false,
        error: error.message
      });
    }
  }

  async getConversionFunnel(req, res) {
    try {
      const { days = 30 } = req.query;
      const funnel = await AnalyticsService.getConversionFunnel(parseInt(days));

      res.json({
        success: true,
        data: funnel
      });
    } catch (error) {
      res.status(error.statusCode || 400).json({
        success: false,
        error: error.message
      });
    }
  }

  async getGeographic(req, res) {
    try {
      const data = await AnalyticsService.getGeographicData();

      res.json({
        success: true,
        data
      });
    } catch (error) {
      res.status(error.statusCode || 400).json({
        success: false,
        error: error.message
      });
    }
  }

  async getPaymentMethods(req, res) {
    try {
      const { days = 30 } = req.query;
      const methods = await AnalyticsService.getPaymentMethodStats(parseInt(days));

      res.json({
        success: true,
        data: methods
      });
    } catch (error) {
      res.status(error.statusCode || 400).json({
        success: false,
        error: error.message
      });
    }
  }

  async searchAnalytics(req, res) {
    try {
      const { query } = req.body;

      if (!query || query.trim() === '') {
        throw new AppError('Query é obrigatória', 400);
      }

      const results = await AnalyticsService.searchAnalytics(query);

      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      res.status(error.statusCode || 400).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new AnalyticsController();

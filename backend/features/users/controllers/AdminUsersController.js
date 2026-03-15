const AdminUsersService = require('../services/AdminUsersService');
const AppError = require('../../../core/errors/AppError');

class AdminUsersController {
  async listUsers(req, res) {
    try {
      const { limit = 20, offset = 0, role, status, search } = req.query;

      const result = await AdminUsersService.listUsers(
        { role, status, search },
        { limit: parseInt(limit), offset: parseInt(offset) }
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(error.statusCode || 400).json({
        success: false,
        error: error.message
      });
    }
  }

  async getUserDetails(req, res) {
    try {
      const { user_id } = req.params;

      const user = await AdminUsersService.getUserDetails(user_id);

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      res.status(error.statusCode || 400).json({
        success: false,
        error: error.message
      });
    }
  }

  async updateRole(req, res) {
    try {
      const { user_id } = req.params;
      const { role } = req.body;
      const admin_id = req.user.id;

      if (!role) {
        throw new AppError('Função é obrigatória', 400);
      }

      const user = await AdminUsersService.updateUserRole(admin_id, user_id, role);

      res.json({
        success: true,
        message: 'Função atualizada com sucesso',
        data: user
      });
    } catch (error) {
      res.status(error.statusCode || 400).json({
        success: false,
        error: error.message
      });
    }
  }

  async updateStatus(req, res) {
    try {
      const { user_id } = req.params;
      const { status } = req.body;
      const admin_id = req.user.id;

      if (!status) {
        throw new AppError('Status é obrigatório', 400);
      }

      const user = await AdminUsersService.updateUserStatus(admin_id, user_id, status);

      res.json({
        success: true,
        message: 'Status atualizado com sucesso',
        data: user
      });
    } catch (error) {
      res.status(error.statusCode || 400).json({
        success: false,
        error: error.message
      });
    }
  }

  async deleteUser(req, res) {
    try {
      const { user_id } = req.params;
      const admin_id = req.user.id;

      const result = await AdminUsersService.deleteUser(admin_id, user_id);

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      res.status(error.statusCode || 400).json({
        success: false,
        error: error.message
      });
    }
  }

  async getStats(req, res) {
    try {
      const stats = await AdminUsersService.getUserStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(error.statusCode || 400).json({
        success: false,
        error: error.message
      });
    }
  }

  async getAdminLogs(req, res) {
    try {
      const { limit = 50, offset = 0, admin_id } = req.query;

      const logs = await AdminUsersService.getAdminLogs(
        admin_id || null,
        { limit: parseInt(limit), offset: parseInt(offset) }
      );

      res.json({
        success: true,
        data: logs
      });
    } catch (error) {
      res.status(error.statusCode || 400).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new AdminUsersController();

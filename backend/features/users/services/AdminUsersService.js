const AdminUsersRepository = require('../repositories/AdminUsersRepository');
const AppError = require('../../../core/errors/AppError');
const businessRules = require('../../../shared/constants/businessRules');

class AdminUsersService {
  async listUsers(filters = {}, pagination = {}) {
    try {
      const { limit = 20, offset = 0 } = pagination;
      const result = await AdminUsersRepository.findAll(filters, limit, offset);
      
      return {
        ...result,
        data: result.data.map(this.formatUser)
      };
    } catch (error) {
      throw error;
    }
  }

  async getUserDetails(user_id) {
    try {
      const user = await AdminUsersRepository.findById(user_id);
      return this.formatUserDetails(user);
    } catch (error) {
      throw error;
    }
  }

  async updateUserRole(admin_id, user_id, new_role) {
    try {
      if (!businessRules.VALID_ROLES.includes(new_role)) {
        throw new AppError('Função inválida: ' + new_role, 400);
      }

      if (user_id === admin_id) {
        throw new AppError('Você não pode alterar sua própria função', 400);
      }

      await AdminUsersRepository.updateRole(user_id, new_role);
      await AdminUsersRepository.logAction(admin_id, user_id, 'update_role', { new_role });

      const user = await AdminUsersRepository.findById(user_id);
      return this.formatUser(user);
    } catch (error) {
      throw error;
    }
  }

  async updateUserStatus(admin_id, user_id, new_status) {
    try {
      if (!['active', 'suspended', 'deleted'].includes(new_status)) {
        throw new AppError('Status inválido: ' + new_status, 400);
      }

      if (user_id === admin_id && new_status !== 'active') {
        throw new AppError('Você não pode suspender ou deletar sua própria conta', 400);
      }

      await AdminUsersRepository.updateStatus(user_id, new_status);
      await AdminUsersRepository.logAction(admin_id, user_id, 'update_status', { new_status });

      const user = await AdminUsersRepository.findById(user_id);
      return this.formatUser(user);
    } catch (error) {
      throw error;
    }
  }

  async deleteUser(admin_id, user_id) {
    try {
      if (user_id === admin_id) {
        throw new AppError('Você não pode deletar sua própria conta', 400);
      }

      const user = await AdminUsersRepository.findById(user_id);

      if (user.role === 'admin') {
        throw new AppError('Não é possível deletar usuários com função de admin', 403);
      }

      await AdminUsersRepository.deleteUser(user_id);
      await AdminUsersRepository.logAction(admin_id, user_id, 'delete_user', {});

      return { success: true, message: 'Usuário deletado com sucesso' };
    } catch (error) {
      throw error;
    }
  }

  async getUserStats() {
    try {
      return await AdminUsersRepository.getStats();
    } catch (error) {
      throw error;
    }
  }

  async getAdminLogs(admin_id = null, pagination = {}) {
    try {
      const { limit = 50, offset = 0 } = pagination;
      const logs = await AdminUsersRepository.getAdminLogs(admin_id, limit, offset);
      
      return logs.map(log => ({
        id: log.id,
        admin_id: log.admin_id,
        admin_name: log.admin_name,
        user_id: log.user_id,
        user_name: log.user_name,
        action: log.action,
        details: JSON.parse(log.details || '{}'),
        created_at: log.created_at
      }));
    } catch (error) {
      throw error;
    }
  }

  formatUser(user) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      avatar: user.avatar,
      created_at: user.created_at,
      updated_at: user.updated_at
    };
  }

  formatUserDetails(user) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      avatar: user.avatar,
      created_at: user.created_at,
      updated_at: user.updated_at,
      stats: {
        total_orders: user.total_orders || 0,
        total_spent: user.total_spent || 0,
        total_reviews: user.total_reviews || 0
      }
    };
  }
}

module.exports = new AdminUsersService();

const db = require('../../../database/db');
const AppError = require('../../../core/errors/AppError');
const NotFoundError = require('../../../core/errors/NotFoundError');

class AdminUsersRepository {
  async findAll(filters = {}, limit = 20, offset = 0) {
    try {
      const { role, status, search } = filters;
      
      let query = 'SELECT id, name, email, role, status, created_at, updated_at, avatar FROM users WHERE 1=1';
      const params = [];

      if (role) {
        query += ' AND role = ?';
        params.push(role);
      }

      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }

      if (search) {
        query += ' AND (name LIKE ? OR email LIKE ?)';
        params.push('%' + search + '%', '%' + search + '%');
      }

      const countQuery = query.replace('SELECT id, name, email, role, status, created_at, updated_at, avatar', 'SELECT COUNT(*) as total');
      const [countResult] = await db.execute(countQuery, params);
      const total = countResult[0].total;

      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const [users] = await db.execute(query, params);

      return {
        data: users,
        total,
        limit,
        offset
      };
    } catch (error) {
      throw new AppError('Erro ao listar usuários: ' + error.message, 400);
    }
  }

  async findById(user_id) {
    try {
      const query = `
        SELECT 
          u.id,
          u.name,
          u.email,
          u.role,
          u.status,
          u.avatar,
          u.created_at,
          u.updated_at,
          COUNT(DISTINCT o.id) as total_orders,
          SUM(o.total_price) as total_spent,
          COUNT(DISTINCT r.id) as total_reviews
        FROM users u
        LEFT JOIN orders o ON u.id = o.user_id
        LEFT JOIN reviews r ON u.id = r.user_id
        WHERE u.id = ?
        GROUP BY u.id
      `;

      const [users] = await db.execute(query, [user_id]);

      if (users.length === 0) {
        throw new NotFoundError('Usuário não encontrado');
      }

      return users[0];
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new AppError('Erro ao buscar usuário: ' + error.message, 400);
    }
  }

  async updateRole(user_id, new_role) {
    try {
      const query = 'UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?';
      const [result] = await db.execute(query, [new_role, user_id]);

      if (result.affectedRows === 0) {
        throw new NotFoundError('Usuário não encontrado');
      }

      return result;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new AppError('Erro ao atualizar função: ' + error.message, 400);
    }
  }

  async updateStatus(user_id, new_status) {
    try {
      const query = 'UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?';
      const [result] = await db.execute(query, [new_status, user_id]);

      if (result.affectedRows === 0) {
        throw new NotFoundError('Usuário não encontrado');
      }

      return result;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new AppError('Erro ao atualizar status: ' + error.message, 400);
    }
  }

  async deleteUser(user_id) {
    try {
      const query = 'UPDATE users SET status = "deleted", updated_at = NOW() WHERE id = ?';
      const [result] = await db.execute(query, [user_id]);

      if (result.affectedRows === 0) {
        throw new NotFoundError('Usuário não encontrado');
      }

      return result;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new AppError('Erro ao deletar usuário: ' + error.message, 400);
    }
  }

  async getStats() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
          COUNT(CASE WHEN role = 'moderator' THEN 1 END) as moderators,
          COUNT(CASE WHEN role = 'customer' THEN 1 END) as customers,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
          COUNT(CASE WHEN status = 'suspended' THEN 1 END) as suspended,
          COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_30d
        FROM users
      `;

      const [stats] = await db.execute(query);
      return stats[0] || {};
    } catch (error) {
      throw new AppError('Erro ao obter estatísticas de usuários: ' + error.message, 400);
    }
  }

  async logAction(admin_id, user_id, action, details) {
    try {
      const query = `
        INSERT INTO admin_logs (admin_id, user_id, action, details, created_at)
        VALUES (?, ?, ?, ?, NOW())
      `;

      await db.execute(query, [admin_id, user_id, action, JSON.stringify(details)]);
    } catch (error) {
      console.error('Erro ao registrar ação admin:', error);
    }
  }

  async getAdminLogs(admin_id = null, limit = 50, offset = 0) {
    try {
      let query = `
        SELECT 
          id,
          admin_id,
          user_id,
          action,
          details,
          created_at,
          a.name as admin_name,
          u.name as user_name
        FROM admin_logs al
        LEFT JOIN users a ON al.admin_id = a.id
        LEFT JOIN users u ON al.user_id = u.id
        WHERE 1=1
      `;

      const params = [];

      if (admin_id) {
        query += ' AND admin_id = ?';
        params.push(admin_id);
      }

      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const [logs] = await db.execute(query, params);
      return logs;
    } catch (error) {
      throw new AppError('Erro ao obter logs de admin: ' + error.message, 400);
    }
  }
}

module.exports = new AdminUsersRepository();

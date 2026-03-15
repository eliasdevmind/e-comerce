const IRepository = require('../../../core/interfaces/IRepository');
const db = require('../../../config/database');
const NotFoundError = require('../../../core/errors/NotFoundError');

/**
 * Repositório de Autenticação
 * Responsável por operações de CRUD com usuários
 */
class AuthRepository extends IRepository {
  
  /**
   * Buscar usuário por email
   * @param {string} email - Email do usuário
   * @returns {Promise<object|null>}
   */
  async findByEmail(email) {
    try {
      const [results] = await db.query(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Buscar usuário por ID
   * @param {number} id - ID do usuário
   * @returns {Promise<object>}
   */
  async findById(id) {
    try {
      const [results] = await db.query(
        'SELECT * FROM users WHERE id = ?',
        [id]
      );

      if (!results.length) {
        throw new NotFoundError('Usuário', id);
      }

      return results[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Listar usuários com filtros
   * @param {object} filters - { role, status }
   * @param {object} pagination - { page, limit }
   * @returns {Promise<{data, pagination}>}
   */
  async findAll(filters = {}, pagination = { page: 1, limit: 20 }) {
    try {
      const { role, status } = filters;
      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      // Construir query
      let whereConditions = [];
      let queryParams = [];

      if (role) {
        whereConditions.push('role = ?');
        queryParams.push(role);
      }

      if (status) {
        whereConditions.push('status = ?');
        queryParams.push(status);
      }

      const whereClause = whereConditions.length 
        ? 'WHERE ' + whereConditions.join(' AND ')
        : '';

      // Query de dados
      const dataQuery = `
        SELECT id, email, name, role, status, phone, address, city, state, zipcode, created_at, updated_at
        FROM users
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;

      queryParams.push(limit, offset);
      const [users] = await db.query(dataQuery, queryParams);

      // Query de contagem
      const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
      const countParams = queryParams.slice(0, -2);
      const [countResult] = await db.query(countQuery, countParams);

      return {
        data: users,
        pagination: {
          page,
          limit,
          total: countResult[0].total,
          pages: Math.ceil(countResult[0].total / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Criar novo usuário
   * @param {object} data - Dados do usuário
   * @returns {Promise<number>} - ID do usuário criado
   */
  async create(data) {
    try {
      const {
        email, password, name, role = 'customer', status = 'active'
      } = data;

      const query = `
        INSERT INTO users (email, password, name, role, status)
        VALUES (?, ?, ?, ?, ?)
      `;

      const [result] = await db.query(query, [
        email, password, name, role, status
      ]);

      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Atualizar usuário
   * @param {number} id - ID do usuário
   * @param {object} data - Dados a atualizar
   * @returns {Promise<boolean>}
   */
  async update(id, data) {
    try {
      const fields = [];
      const values = [];

      // Construir query dinamicamente
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && key !== 'password') {
          fields.push(`${this.camelToSnake(key)} = ?`);
          values.push(value);
        }
      });

      if (!fields.length) {
        return false;
      }

      values.push(id);
      const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
      
      const [result] = await db.query(query, values);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Atualizar senha do usuário
   * @param {number} id - ID do usuário
   * @param {string} hashedPassword - Senha com hash
   * @returns {Promise<boolean>}
   */
  async updatePassword(id, hashedPassword) {
    try {
      const [result] = await db.query(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Atualizar status do usuário
   * @param {number} id - ID do usuário
   * @param {string} status - Novo status (active, inactive, suspended)
   * @param {string} reason - Motivo (opcional)
   * @returns {Promise<boolean>}
   */
  async updateStatus(id, status, reason = '') {
    try {
      const query = 'UPDATE users SET status = ? WHERE id = ?';
      const [result] = await db.query(query, [status, id]);
      
      // TODO: Log de audit (quando implementar)
      if (reason) {
        console.log(`Usuário ${id} status alterado para ${status}. Motivo: ${reason}`);
      }

      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Deletar usuário
   * @param {number} id - ID do usuário
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    try {
      const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verificar se usuário existe
   * @param {number} id - ID do usuário
   * @returns {Promise<boolean>}
   */
  async exists(id) {
    try {
      const [result] = await db.query(
        'SELECT 1 FROM users WHERE id = ?',
        [id]
      );
      return result.length > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Contar usuários
   * @param {object} filters - Filtros
   * @returns {Promise<number>}
   */
  async count(filters = {}) {
    try {
      const { role, status } = filters;
      
      let query = 'SELECT COUNT(*) as total FROM users';
      const params = [];

      if (role || status) {
        const conditions = [];
        if (role) {
          conditions.push('role = ?');
          params.push(role);
        }
        if (status) {
          conditions.push('status = ?');
          params.push(status);
        }
        query += ' WHERE ' + conditions.join(' AND ');
      }

      const [result] = await db.query(query, params);
      return result[0].total;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Converter camelCase para snake_case
   * @private
   */
  camelToSnake(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}

module.exports = AuthRepository;

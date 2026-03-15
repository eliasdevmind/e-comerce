const AuthService = require('../services/AuthService');

/**
 * Controlador de Autenticação
 * Interface HTTP para operações de autenticação
 */
class AuthController {
  
  constructor(service = null) {
    this.service = service || new AuthService();
  }

  /**
   * Registrar novo usuário
   * POST /api/auth/register
   */
  async register(req, res, next) {
    try {
      const { email, password, name } = req.body;

      const result = await this.service.register(email, password, name);

      res.status(201).json({
        status: 'success',
        message: 'Usuário cadastrado com sucesso',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Fazer login
   * POST /api/auth/login
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const result = await this.service.login(email, password);

      res.status(200).json({
        status: 'success',
        message: 'Login realizado com sucesso',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obter perfil do usuário autenticado
   * GET /api/auth/profile
   */
  async getProfile(req, res, next) {
    try {
      const user = await this.service.getProfile(req.user.userId);

      res.status(200).json({
        status: 'success',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualizar perfil
   * PUT /api/auth/profile
   */
  async updateProfile(req, res, next) {
    try {
      const data = {
        name: req.body.name,
        phone: req.body.phone,
        address: req.body.address,
        city: req.body.city,
        state: req.body.state,
        zipcode: req.body.zipcode
      };

      const user = await this.service.updateProfile(req.user.userId, data);

      res.status(200).json({
        status: 'success',
        message: 'Perfil atualizado com sucesso',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Alterar senha
   * POST /api/auth/change-password
   */
  async changePassword(req, res, next) {
    try {
      const { oldPassword, newPassword } = req.body;

      await this.service.changePassword(req.user.userId, oldPassword, newPassword);

      res.status(200).json({
        status: 'success',
        message: 'Senha alterada com sucesso'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Fazer logout
   * POST /api/auth/logout
   */
  async logout(req, res, next) {
    try {
      await this.service.logout(req.user.userId);

      res.status(200).json({
        status: 'success',
        message: 'Logout realizado com sucesso'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Listar usuários (admin only)
   * GET /api/auth/users
   */
  async listUsers(req, res, next) {
    try {
      const { role, status, page = 1, limit = 20 } = req.query;

      const result = await this.service.listUsers(
        { role, status },
        { page: parseInt(page), limit: parseInt(limit) }
      );

      res.status(200).json({
        status: 'success',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Suspender usuário (admin only)
   * POST /api/auth/users/:userId/suspend
   */
  async suspendUser(req, res, next) {
    try {
      const { userId } = req.params;
      const { reason } = req.body;

      const success = await this.service.suspendUser(parseInt(userId), reason);

      res.status(200).json({
        status: 'success',
        message: success ? 'Usuário suspenso' : 'Erro ao suspender usuário'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Ativar usuário (admin only)
   * POST /api/auth/users/:userId/activate
   */
  async activateUser(req, res, next) {
    try {
      const { userId } = req.params;

      const success = await this.service.activateUser(parseInt(userId));

      res.status(200).json({
        status: 'success',
        message: success ? 'Usuário ativado' : 'Erro ao ativar usuário'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verificar token (para debug)
   * POST /api/auth/verify
   */
  async verifyToken(req, res, next) {
    try {
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        return res.status(400).json({
          status: 'error',
          message: 'Token não fornecido'
        });
      }

      const decoded = await this.service.verifyToken(token);

      res.status(200).json({
        status: 'success',
        data: decoded
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;

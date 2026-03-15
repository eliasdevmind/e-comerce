const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AuthRepository = require('../repositories/AuthRepository');
const { ValidationError, AuthenticationError, AuthorizationError } = require('../../../core/errors/AuthError');
const NotFoundError = require('../../../core/errors/NotFoundError');
const { BUSINESS_RULES, ERROR_CODES } = require('../../../shared/constants/businessRules');

/**
 * Serviço de Autenticação
 * Orquestra login, registro, validação de tokens e gerenciamento de sessões
 */
class AuthService {
  constructor(repository = null) {
    this.repository = repository || new AuthRepository();
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    this.jwtExpiration = process.env.JWT_EXPIRATION || '7d';
  }

  /**
   * Registrar novo usuário
   * @param {string} email - Email do usuário
   * @param {string} password - Senha em plain text
   * @param {string} name - Nome completo
   * @returns {Promise<{user, token}>}
   */
  async register(email, password, name) {
    try {
      // Validar dados de entrada
      this.validateRegistrationData(email, password, name);

      // Verificar se email já existe
      const existingUser = await this.repository.findByEmail(email);
      if (existingUser) {
        throw new ValidationError('Email já cadastrado', {
          email: 'Este email já está em uso'
        });
      }

      // Hash da senha
      const hashedPassword = await bcrypt.hash(password, 10);

      // Criar usuário
      const userId = await this.repository.create({
        email,
        password: hashedPassword,
        name,
        role: 'customer',
        status: 'active'
      });

      // Buscar usuário criado
      const user = await this.repository.findById(userId);

      // Gerar token
      const token = this.generateToken(user);

      return {
        user: this.formatUserResponse(user),
        token
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Fazer login
   * @param {string} email - Email do usuário
   * @param {string} password - Senha em plain text
   * @returns {Promise<{user, token}>}
   */
  async login(email, password) {
    try {
      // Validar entrada
      if (!email || !password) {
        throw new ValidationError('Dados incompletos', {
          email: 'Email obrigatório',
          password: 'Senha obrigatória'
        });
      }

      // Buscar usuário
      const user = await this.repository.findByEmail(email);
      if (!user) {
        throw new AuthenticationError('Email ou senha incorretos');
      }

      // Verificar status
      if (user.status !== 'active') {
        throw new AuthorizationError('Usuário inativo ou suspenso');
      }

      // Validar senha
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new AuthenticationError('Email ou senha incorretos');
      }

      // Gerar token
      const token = this.generateToken(user);

      return {
        user: this.formatUserResponse(user),
        token
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verificar token JWT
   * @param {string} token - Token JWT
   * @returns {Promise<object>} - Payload do token
   */
  async verifyToken(token) {
    try {
      if (!token) {
        throw new AuthenticationError('Token não fornecido');
      }

      const decoded = jwt.verify(token, this.jwtSecret);
      
      // Verificar se usuário ainda existe e está ativo
      const user = await this.repository.findById(decoded.userId);
      if (!user || user.status !== 'active') {
        throw new AuthenticationError('Usuário inválido ou inativo');
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthenticationError('Token expirado');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError('Token inválido');
      }
      throw error;
    }
  }

  /**
   * Obter perfil do usuário autenticado
   * @param {number} userId - ID do usuário
   * @returns {Promise<object>}
   */
  async getProfile(userId) {
    try {
      const user = await this.repository.findById(userId);
      if (!user) {
        throw new NotFoundError('Usuário', userId);
      }

      return this.formatUserResponse(user);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Atualizar perfil do usuário
   * @param {number} userId - ID do usuário
   * @param {object} data - Dados a atualizar
   * @returns {Promise<object>}
   */
  async updateProfile(userId, data) {
    try {
      // Validar dados
      this.validateProfileUpdate(data);

      // Atualizar
      const success = await this.repository.update(userId, {
        name: data.name,
        phone: data.phone,
        address: data.address,
        city: data.city,
        state: data.state,
        zipcode: data.zipcode
      });

      if (!success) {
        throw new Error('Falha ao atualizar perfil');
      }

      // Retornar perfil atualizado
      const user = await this.repository.findById(userId);
      return this.formatUserResponse(user);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Alterar senha
   * @param {number} userId - ID do usuário
   * @param {string} oldPassword - Senha antiga
   * @param {string} newPassword - Nova senha
   * @returns {Promise<boolean>}
   */
  async changePassword(userId, oldPassword, newPassword) {
    try {
      // Buscar usuário
      const user = await this.repository.findById(userId);
      if (!user) {
        throw new NotFoundError('Usuário', userId);
      }

      // Validar senha antiga
      const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
      if (!isPasswordValid) {
        throw new ValidationError('Senha atual incorreta', {
          oldPassword: 'Senha atual não confere'
        });
      }

      // Validar nova senha
      if (!newPassword || newPassword.length < BUSINESS_RULES.USER.PASSWORD.MIN_LENGTH) {
        throw new ValidationError('Nova senha inválida', {
          newPassword: `Mínimo de ${BUSINESS_RULES.USER.PASSWORD.MIN_LENGTH} caracteres`
        });
      }

      // Hash nova senha
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Atualizar
      return await this.repository.updatePassword(userId, hashedPassword);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Fazer logout (client-side, token é discartado)
   * @param {number} userId - ID do usuário
   * @returns {Promise<boolean>}
   */
  async logout(userId) {
    try {
      // Logging de logout (opcional, para auditoria)
      console.log(`✓ Usuário ${userId} desconectado`);
      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Listar todos os usuários (admin only)
   * @param {object} filters - Filtros
   * @param {object} pagination - Paginação
   * @returns {Promise<object>}
   */
  async listUsers(filters = {}, pagination = { page: 1, limit: 20 }) {
    try {
      const result = await this.repository.findAll(filters, pagination);
      
      return {
        data: result.data.map(user => this.formatUserResponse(user)),
        pagination: result.pagination
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Suspender usuário (admin only)
   * @param {number} userId - ID do usuário
   * @param {string} reason - Motivo da suspensão
   * @returns {Promise<boolean>}
   */
  async suspendUser(userId, reason = '') {
    try {
      return await this.repository.updateStatus(userId, 'suspended', reason);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Ativar usuário (admin only)
   * @param {number} userId - ID do usuário
   * @returns {Promise<boolean>}
   */
  async activateUser(userId) {
    try {
      return await this.repository.updateStatus(userId, 'active');
    } catch (error) {
      throw error;
    }
  }

  // ========== Métodos Privados ==========

  /**
   * Gerar JWT token
   * @private
   */
  generateToken(user) {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      this.jwtSecret,
      { expiresIn: this.jwtExpiration }
    );
  }

  /**
   * Validar dados de registro
   * @private
   */
  validateRegistrationData(email, password, name) {
    const errors = {};

    // Validar email
    if (!email || !this.isValidEmail(email)) {
      errors.email = 'Email inválido';
    }

    // Validar senha
    if (!password || password.length < BUSINESS_RULES.USER.PASSWORD.MIN_LENGTH) {
      errors.password = `Mínimo de ${BUSINESS_RULES.USER.PASSWORD.MIN_LENGTH} caracteres`;
    }

    if (BUSINESS_RULES.USER.PASSWORD.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
      errors.password = 'Deve conter pelo menos uma letra maiúscula';
    }

    if (BUSINESS_RULES.USER.PASSWORD.REQUIRE_NUMBERS && !/[0-9]/.test(password)) {
      errors.password = 'Deve conter pelo menos um número';
    }

    // Validar nome
    if (!name || name.length < 3) {
      errors.name = 'Nome deve ter pelo menos 3 caracteres';
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError('Dados de registro inválidos', errors);
    }
  }

  /**
   * Validar atualização de perfil
   * @private
   */
  validateProfileUpdate(data) {
    const errors = {};

    if (data.name && data.name.length < 3) {
      errors.name = 'Nome deve ter pelo menos 3 caracteres';
    }

    if (data.phone && !/^[\d\s\-()]+$/.test(data.phone)) {
      errors.phone = 'Telefone inválido';
    }

    if (data.zipcode && !/^\d{5}-?\d{3}$/.test(data.zipcode)) {
      errors.zipcode = 'CEP inválido (formato: XXXXX-XXX)';
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError('Dados de atualização inválidos', errors);
    }
  }

  /**
   * Validar formato de email
   * @private
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Formatar resposta de usuário (sem dados sensíveis)
   * @private
   */
  formatUserResponse(user) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      phone: user.phone || null,
      address: user.address || null,
      city: user.city || null,
      state: user.state || null,
      zipcode: user.zipcode || null,
      createdAt: user.created_at
    };
  }
}

module.exports = AuthService;

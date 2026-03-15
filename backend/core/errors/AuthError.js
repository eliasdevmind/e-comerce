const AppError = require('./AppError');

class AuthenticationError extends AppError {
  constructor(message = 'Autenticação necessária') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Acesso negado') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

module.exports = { AuthenticationError, AuthorizationError };

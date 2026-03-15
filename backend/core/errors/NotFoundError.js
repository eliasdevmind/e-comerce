const AppError = require('./AppError');

class NotFoundError extends AppError {
  constructor(resource = 'Recurso', identifier = '') {
    const message = identifier ? 
      `${resource} com identificador '${identifier}' não encontrado` : 
      `${resource} não encontrado`;
    super(message, 404, 'NOT_FOUND');
  }
}

module.exports = NotFoundError;

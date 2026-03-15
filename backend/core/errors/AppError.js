// Classe base para erros da aplicação
class AppError extends Error {
  constructor(message, statusCode, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.timestamp = new Date();
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      status: 'error',
      code: this.code,
      message: this.message,
      timestamp: this.timestamp
    };
  }
}

module.exports = AppError;

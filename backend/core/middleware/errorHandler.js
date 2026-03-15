// Middleware de tratamento de erros global
const errorHandler = (err, req, res, next) => {
  console.error('❌ Erro:', {
    message: err.message,
    code: err.code || 'UNKNOWN',
    statusCode: err.statusCode || 500,
    method: req.method,
    path: req.path,
    timestamp: new Date()
  });

  // AppError (aplicação)
  if (err.statusCode) {
    return res.status(err.statusCode).json(err.toJSON?.() || {
      status: 'error',
      message: err.message,
      code: err.code
    });
  }

  // Erro de validação Joi/Yup
  if (err.isJoi || err.name === 'ValidationError') {
    return res.status(400).json({
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: 'Falha na validação',
      details: err.details || err.message
    });
  }

  // Erro MySQL
  if (err.code?.startsWith('ER_')) {
    return res.status(400).json({
      status: 'error',
      code: 'DATABASE_ERROR',
      message: 'Erro ao processar operação no banco de dados'
    });
  }

  // Erro genérico
  res.status(err.statusCode || 500).json({
    status: 'error',
    code: 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'production' 
      ? 'Erro interno do servidor' 
      : err.message
  });
};

module.exports = errorHandler;

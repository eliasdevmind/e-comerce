const AppError = require('../errors/AppError');

const adminMiddleware = (req, res, next) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
      throw new AppError('Acesso negado. Privilégios de administrador necessários', 403);
    }

    next();
  } catch (error) {
    res.status(error.statusCode || 403).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = adminMiddleware;

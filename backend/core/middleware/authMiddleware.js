const jwt = require('jsonwebtoken');
const AppError = require('../errors/AppError');
const AuthError = require('../errors/AuthError');

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new AuthError('Token não fornecido', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        error: 'Token expirado'
      });
    }

    if (error instanceof AuthError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    }

    res.status(401).json({
      success: false,
      error: 'Token inválido'
    });
  }
};

module.exports = authMiddleware;

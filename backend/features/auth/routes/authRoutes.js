const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const AuthService = require('../services/AuthService');
const AuthRepository = require('../repositories/AuthRepository');
const auth = require('../../../core/middleware/auth');

// Injetar dependências
const repository = new AuthRepository();
const service = new AuthService(repository);
const controller = new AuthController(service);

/**
 * Rotas de Autenticação
 */

// Públicas
router.post('/register', (req, res, next) => controller.register(req, res, next));
router.post('/login', (req, res, next) => controller.login(req, res, next));
router.post('/verify', (req, res, next) => controller.verifyToken(req, res, next));

// Autenticadas
router.get('/profile', auth, (req, res, next) => controller.getProfile(req, res, next));
router.put('/profile', auth, (req, res, next) => controller.updateProfile(req, res, next));
router.post('/change-password', auth, (req, res, next) => controller.changePassword(req, res, next));
router.post('/logout', auth, (req, res, next) => controller.logout(req, res, next));

// Admin
router.get('/users', auth, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ status: 'error', message: 'Acesso negado' });
  }
  controller.listUsers(req, res, next);
});

router.post('/users/:userId/suspend', auth, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ status: 'error', message: 'Acesso negado' });
  }
  controller.suspendUser(req, res, next);
});

router.post('/users/:userId/activate', auth, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ status: 'error', message: 'Acesso negado' });
  }
  controller.activateUser(req, res, next);
});

module.exports = router;

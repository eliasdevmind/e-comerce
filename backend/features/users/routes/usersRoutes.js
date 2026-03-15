const express = require('express');
const AdminUsersController = require('../controllers/AdminUsersController');
const authMiddleware = require('../../../core/middleware/authMiddleware');
const adminMiddleware = require('../../../core/middleware/adminMiddleware');

const router = express.Router();

// Todas as rotas requerem autenticação e acesso admin
router.use(authMiddleware, adminMiddleware);

// Listar usuários
router.get('/', AdminUsersController.listUsers);

// Estatísticas de usuários
router.get('/stats', AdminUsersController.getStats);

// Logs de ações admin
router.get('/logs', AdminUsersController.getAdminLogs);

// Obter detalhes de um usuário
router.get('/:user_id', AdminUsersController.getUserDetails);

// Atualizar role de um usuário
router.patch('/:user_id/role', AdminUsersController.updateRole);

// Atualizar status de um usuário
router.patch('/:user_id/status', AdminUsersController.updateStatus);

// Deletar um usuário
router.delete('/:user_id', AdminUsersController.deleteUser);

module.exports = router;

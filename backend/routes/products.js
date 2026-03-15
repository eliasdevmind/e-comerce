const express = require('express');
const productController = require('../controllers/productController');
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Configurar multer para upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/products');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}.${file.originalname.split('.').pop()}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const isAllowed = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (isAllowed) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Rotas públicas
router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);

// Rotas de admin
router.post('/', verifyAdmin, upload.single('cover_image'), productController.createProduct);
router.put('/:id', verifyAdmin, upload.single('cover_image'), productController.updateProduct);
router.delete('/:id', verifyAdmin, productController.deleteProduct);
router.post('/:product_id/images', verifyAdmin, upload.array('images', 10), productController.uploadProductImages);

module.exports = router;

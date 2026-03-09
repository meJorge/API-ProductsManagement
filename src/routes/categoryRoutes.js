const router = require('express').Router();
const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const authenticate           = require('../middlewares/auth');
const { validateCategory }   = require('../middlewares/validate');

// Públicos
router.get('/',    getAllCategories);
router.get('/:id', getCategoryById);

// Protegidos (requieren token)
router.post('/',    authenticate, validateCategory, createCategory);
router.put('/:id',  authenticate, validateCategory, updateCategory);
router.delete('/:id', authenticate, deleteCategory);

module.exports = router;

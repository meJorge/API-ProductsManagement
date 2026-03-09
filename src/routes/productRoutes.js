const router = require('express').Router();
const {
  getAllProducts,
  getFeaturedProducts,
  getBestSellers,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  sellProduct,
  updateStock,
} = require('../controllers/productController');
const authenticate = require('../middlewares/auth');
const {
  validateProduct,
  validateProductUpdate,
  validateSell,
  validateSearch,
} = require('../middlewares/validate');

router.get('/featured',     getFeaturedProducts);
router.get('/best-sellers', getBestSellers);

router.get('/', validateSearch, getAllProducts);

router.get('/:id', getProductById);

router.post('/',               authenticate, validateProduct,       createProduct);
router.put('/:id',             authenticate, validateProductUpdate, updateProduct);
router.delete('/:id',          authenticate,                        deleteProduct);

router.post('/:id/sell',       authenticate, validateSell,          sellProduct);
router.patch('/:id/stock',     authenticate, validateSell,          updateStock);

module.exports = router;

const { body, query, validationResult } = require('express-validator');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      error: 'Datos inválidos',
      details: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ── Categorías ───────────────────────────────────────────────────────────────
const validateCategory = [
  body('name')
    .trim()
    .notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('La descripción no puede superar 500 caracteres'),
  handleValidation,
];

// ── Productos ────────────────────────────────────────────────────────────────
const validateProduct = [
  body('name')
    .trim()
    .notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ min: 2, max: 200 }).withMessage('El nombre debe tener entre 2 y 200 caracteres'),
  body('price')
    .notEmpty().withMessage('El precio es obligatorio')
    .isFloat({ min: 0 }).withMessage('El precio debe ser un número mayor o igual a 0'),
  body('category')
    .notEmpty().withMessage('La categoría es obligatoria')
    .isMongoId().withMessage('ID de categoría inválido'),
  body('stock')
    .optional()
    .isInt({ min: 0 }).withMessage('El stock debe ser un entero mayor o igual a 0'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('La descripción no puede superar 1000 caracteres'),
  handleValidation,
];

const validateProductUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 }).withMessage('El nombre debe tener entre 2 y 200 caracteres'),
  body('price')
    .optional()
    .isFloat({ min: 0 }).withMessage('El precio debe ser un número mayor o igual a 0'),
  body('category')
    .optional()
    .isMongoId().withMessage('ID de categoría inválido'),
  body('stock')
    .optional()
    .isInt({ min: 0 }).withMessage('El stock debe ser un entero mayor o igual a 0'),
  handleValidation,
];

// ── Venta (descuento de stock) ────────────────────────────────────────────────
const validateSell = [
  body('quantity')
    .notEmpty().withMessage('La cantidad es obligatoria')
    .isInt({ min: 1 }).withMessage('La cantidad debe ser un entero mayor a 0'),
  handleValidation,
];

// ── Query de búsqueda ────────────────────────────────────────────────────────
const validateSearch = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('page debe ser un entero mayor a 0'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('limit debe ser entre 1 y 100'),
  query('minPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('minPrice debe ser un número positivo'),
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('maxPrice debe ser un número positivo'),
  handleValidation,
];

module.exports = {
  validateCategory,
  validateProduct,
  validateProductUpdate,
  validateSell,
  validateSearch,
};

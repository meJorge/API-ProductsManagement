const Product  = require('../models/Product');
const Category = require('../models/Category');

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Construye el objeto de filtros a partir de los query params
 */
const buildFilters = ({ search, category, minPrice, maxPrice, inStock }) => {
  const filter = { active: true };

  if (search) {
    filter.$text = { $search: search };
  }
  if (category) {
    filter.category = category;
  }
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = parseFloat(minPrice);
    if (maxPrice !== undefined) filter.price.$lte = parseFloat(maxPrice);
  }
  if (inStock === 'true') {
    filter.stock = { $gt: 0 };
  }

  return filter;
};

const getAllProducts = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 10);
    const skip  = (page - 1) * limit;

    const { search, category, minPrice, maxPrice, inStock, sortBy } = req.query;
    const filter = buildFilters({ search, category, minPrice, maxPrice, inStock });

    const sortOptions = {
      price_asc:   { price: 1 },
      price_desc:  { price: -1 },
      name_asc:    { name: 1 },
      newest:      { createdAt: -1 },
      best_sellers:{ salesCount: -1 },
    };
    const sort = sortOptions[sortBy] || { createdAt: -1 };

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Product.countDocuments(filter),
    ]);

    res.json({
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      products,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener productos', details: error.message });
  }
};

// ── GET /api/products/featured ────────────────────────────────────────────────
const getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.find({ active: true, featured: true })
      .populate('category', 'name')
      .sort({ salesCount: -1 })
      .limit(10);

    res.json({ total: products.length, products });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener productos destacados', details: error.message });
  }
};

// ── GET /api/products/best-sellers ───────────────────────────────────────────
const getBestSellers = async (req, res) => {
  try {
    const limit    = Math.min(50, parseInt(req.query.limit) || 10);
    const products = await Product.find({ active: true, salesCount: { $gt: 0 } })
      .populate('category', 'name')
      .sort({ salesCount: -1 })
      .limit(limit);

    res.json({ total: products.length, products });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener más vendidos', details: error.message });
  }
};

// ── GET /api/products/:id ────────────────────────────────────────────────────
const getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, active: true })
      .populate('category', 'name description');
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ product });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener producto', details: error.message });
  }
};

// ── POST /api/products ────────────────────────────────────────────────────────
const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock, featured, imageUrl } = req.body;

    // Verificar que la categoría existe y está activa
    const cat = await Category.findOne({ _id: category, active: true });
    if (!cat) return res.status(404).json({ error: 'Categoría no encontrada o inactiva' });

    const product = await Product.create({
      name, description, price, category, stock, featured, imageUrl,
    });

    await product.populate('category', 'name');
    res.status(201).json({ message: 'Producto creado exitosamente', product });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear producto', details: error.message });
  }
};

// ── PUT /api/products/:id ────────────────────────────────────────────────────
const updateProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock, featured, imageUrl } = req.body;

    if (category) {
      const cat = await Category.findOne({ _id: category, active: true });
      if (!cat) return res.status(404).json({ error: 'Categoría no encontrada o inactiva' });
    }

    const updateData = {};
    if (name        !== undefined) updateData.name        = name;
    if (description !== undefined) updateData.description = description;
    if (price       !== undefined) updateData.price       = price;
    if (category    !== undefined) updateData.category    = category;
    if (stock       !== undefined) updateData.stock       = stock;
    if (featured    !== undefined) updateData.featured    = featured;
    if (imageUrl    !== undefined) updateData.imageUrl    = imageUrl;

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('category', 'name');

    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ message: 'Producto actualizado exitosamente', product });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar producto', details: error.message });
  }
};

// ── DELETE /api/products/:id ──────────────────────────────────────────────────
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { active: false },
      { new: true }
    );
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ message: 'Producto eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar producto', details: error.message });
  }
};

// ── POST /api/products/:id/sell ───────────────────────────────────────────────
const sellProduct = async (req, res) => {
  try {
    const { quantity } = req.body;
    const product = await Product.findOne({ _id: req.params.id, active: true });

    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

    // Validación de negocio: no se puede vender sin stock
    if (product.stock === 0) {
      return res.status(400).json({ error: 'Producto sin stock disponible' });
    }
    if (product.stock < quantity) {
      return res.status(400).json({
        error: `Stock insuficiente. Disponible: ${product.stock}, solicitado: ${quantity}`,
      });
    }

    product.stock      -= quantity;
    product.salesCount += quantity;
    await product.save();

    res.json({
      message: `Venta registrada: ${quantity} unidad(es)`,
      stockRestante: product.stock,
      totalVendido:  product.salesCount,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar venta', details: error.message });
  }
};

// ── PATCH /api/products/:id/stock ────────────────────────────────────────────
const updateStock = async (req, res) => {
  try {
    const { quantity } = req.body;
    const product = await Product.findOne({ _id: req.params.id, active: true });
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

    product.stock += quantity; // Puede ser negativo para reducir
    if (product.stock < 0) {
      return res.status(400).json({ error: 'El ajuste dejaría el stock en negativo' });
    }
    await product.save();

    res.json({
      message: 'Stock actualizado exitosamente',
      stockActual: product.stock,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar stock', details: error.message });
  }
};

module.exports = {
  getAllProducts,
  getFeaturedProducts,
  getBestSellers,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  sellProduct,
  updateStock,
};

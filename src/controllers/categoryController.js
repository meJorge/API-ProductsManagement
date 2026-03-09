const Category = require('../models/Category');
const Product  = require('../models/Product');

// GET /api/categories
const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({ active: true }).sort({ name: 1 });
    res.json({ total: categories.length, categories });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener categorías', details: error.message });
  }
};

// GET /api/categories/:id
const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findOne({ _id: req.params.id, active: true });
    if (!category) return res.status(404).json({ error: 'Categoría no encontrada' });
    res.json({ category });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener categoría', details: error.message });
  }
};

// POST /api/categories
const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    const exists = await Category.findOne({ name: name.trim() });
    if (exists) return res.status(409).json({ error: 'Ya existe una categoría con ese nombre' });

    const category = await Category.create({ name, description });
    res.status(201).json({ message: 'Categoría creada exitosamente', category });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear categoría', details: error.message });
  }
};

// PUT /api/categories/:id
const updateCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (name) {
      const exists = await Category.findOne({ name: name.trim(), _id: { $ne: req.params.id } });
      if (exists) return res.status(409).json({ error: 'Ya existe una categoría con ese nombre' });
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { ...(name && { name }), ...(description !== undefined && { description }) },
      { new: true, runValidators: true }
    );
    if (!category) return res.status(404).json({ error: 'Categoría no encontrada' });

    res.json({ message: 'Categoría actualizada exitosamente', category });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar categoría', details: error.message });
  }
};

// DELETE /api/categories/:id
const deleteCategory = async (req, res) => {
  try {
    // Verificar que no haya productos activos usando esta categoría
    const productCount = await Product.countDocuments({ category: req.params.id, active: true });
    if (productCount > 0) {
      return res.status(400).json({
        error: `No se puede eliminar la categoría porque tiene ${productCount} producto(s) asociado(s)`,
      });
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { active: false },
      { new: true }
    );
    if (!category) return res.status(404).json({ error: 'Categoría no encontrada' });

    res.json({ message: 'Categoría eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar categoría', details: error.message });
  }
};

module.exports = { getAllCategories, getCategoryById, createCategory, updateCategory, deleteCategory };

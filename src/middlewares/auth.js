const { verifyToken } = require('../utils/generateToken');

/**
 * Middleware de autenticación simplificado.
 * En este proyecto los productos/categorías son públicos para consulta
 * pero requieren token para crear, editar y eliminar.
 */
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }
    const token   = authHeader.split(' ')[1];
    req.user = verifyToken(token);
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    return res.status(401).json({ error: 'Token inválido' });
  }
};

module.exports = authenticate;

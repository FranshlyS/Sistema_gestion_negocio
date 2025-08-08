const { verifyToken } = require('../utils/auth');

const authMiddleware = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Acceso denegado. Token no proporcionado.'
      });
    }

    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token inválido.'
    });
  }
};

module.exports = authMiddleware;
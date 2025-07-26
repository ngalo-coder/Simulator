// Authentication middleware used by multiple services
const jwt = require('jsonwebtoken');
const ApiResponse = require('../utils/api-response');

const authMiddleware = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json(
        ApiResponse.error('Access denied. No token provided.', 401)
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json(
        ApiResponse.error('Invalid token.', 401)
      );
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json(
        ApiResponse.error('Token expired.', 401)
      );
    }
    res.status(500).json(
      ApiResponse.error('Internal server error', 500)
    );
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json(
        ApiResponse.error('Access denied. Insufficient permissions.', 403)
      );
    }
    next();
  };
};

module.exports = { authMiddleware, authorize };
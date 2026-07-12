const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password', 'passwordResetToken', 'passwordResetExpires'] }
      });

      if (!req.user) {
        res.status(401);
        throw new Error('User not found');
      }

      // Check if user is active
      if (req.user.status !== 'active') {
        res.status(401);
        throw new Error('User account is deactivated');
      }

      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        res.status(401);
        throw new Error('Invalid token');
      }

      if (error.name === 'TokenExpiredError') {
        res.status(401);
        throw new Error('Token expired');
      }

      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

// Middleware to check user role
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401);
      throw new Error('Not authorized');
    }

    if (!roles.includes(req.user.role)) {
      res.status(403);
      throw new Error('Not authorized to access this resource');
    }

    next();
  };
};

module.exports = { protect, authorize };
const crypto = require('crypto');
const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Role = require('../models/Role');
const { generateToken } = require('../utils/authUtils');

// @desc    Register a new user
// @route   POST /api/v1/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Simple validation
  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please provide name, email and password');
  }

  // Check if user already exists
  const userExists = await User.findOne({ where: { email } });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Always assign 'employee' role on registration - admin will assign proper role later
  const userRole = await Role.findOne({ where: { code: 'employee' } });

  if (!userRole) {
    res.status(400);
    throw new Error('System error: Default role not found');
  }

  // Create user with 'pending' status - admin approval required
  const user = await User.create({
    name,
    email,
    password,
    roleId: userRole.id,
    status: 'pending'
  });

  if (user) {
    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: userRole.code,
        status: user.status,
        token: generateToken(user.id)
      },
      message: 'Registration successful. Your account is pending admin approval.'
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Authenticate user & get token
// @route   POST /api/v1/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

  // Check for user
  const user = await User.findOne({
    where: { email },
    include: [{ model: Role, as: 'roleInfo', attributes: ['id', 'code', 'name'] }]
  });

  if (user && (await user.isValidPassword(password))) {
    // Update last login
    await user.updateLastLogin();

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.roleInfo?.code ?? 'employee',
        status: user.status,
        token: generateToken(user.id)
      }
    });
  } else {
    res.status(401);
    throw new Error('Invalid credentials');
  }
});

// @desc    Get user data
// @route   GET /api/v1/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    attributes: { exclude: ['password', 'passwordResetToken', 'passwordResetExpires'] },
    include: [{ model: Role, as: 'roleInfo', attributes: ['id', 'code', 'name'] }]
  });

  if (user) {
    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.roleInfo?.code ?? 'employee',
        status: user.status,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user profile
// @route   PUT /api/v1/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    include: [{ model: Role, as: 'roleInfo', attributes: ['id', 'code', 'name'] }]
  });

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;

    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(req.body.password, salt);
    }

    const updatedUser = await user.save();

    res.status(200).json({
      success: true,
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.roleInfo?.code ?? 'employee'
      }
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Forgot password
// @route   POST /api/v1/auth/forgotpassword
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Please provide an email address');
  }

  const user = await User.findOne({ where: { email } });

  if (!user) {
    // Return same message to prevent email enumeration
    return res.status(200).json({
      success: true,
      message: 'If the email exists in our system, you will receive a password reset link'
    });
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Hash token and set to resetPasswordToken field
  user.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire (1 hour from now)
  user.passwordResetExpires = Date.now() + 3600000; // 1 hour

  await user.save();

  // In a real application, you would send an email here
  // For now, we'll just return the token (NOT SECURE - for demo only)
  res.status(200).json({
    success: true,
    message: 'Password reset token generated',
    // In production, remove this and send email instead
    resetToken: resetToken // REMOVE THIS IN PRODUCTION
  });
});

// @desc    Reset password
// @route   PUT /api/v1/auth/resetpassword/:token
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  // Hash URL token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    where: {
      passwordResetToken: resetPasswordToken,
      passwordResetExpires: {
        [Sequelize.Op.gt]: Date.now()
      }
    }
  });

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired token');
  }

  // Set new password
  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password reset successful'
  });
});

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  forgotPassword,
  resetPassword
};
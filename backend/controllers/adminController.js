const asyncHandler = require('express-async-handler');
const { Op } = require('sequelize');
const User = require('../models/User');
const Role = require('../models/Role');

// @desc    Get all users
// @route   GET /api/v1/admin/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const { status, role, search } = req.query;

  const where = {};
  
  if (status) {
    where.status = status;
  }

  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } }
    ];
  }

  const users = await User.findAll({
    where,
    attributes: { exclude: ['password', 'passwordResetToken', 'passwordResetExpires'] },
    include: [{ 
      model: Role, 
      as: 'roleInfo', 
      attributes: ['id', 'code', 'name'],
      ...(role ? { where: { code: role } } : {})
    }],
    order: [['createdAt', 'DESC']]
  });

  // Transform users to include flat role property
  const transformedUsers = users.map(user => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.roleInfo?.code ?? 'employee',
    status: user.status,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  }));

  res.status(200).json({
    success: true,
    count: transformedUsers.length,
    data: transformedUsers
  });
});

// @desc    Get single user
// @route   GET /api/v1/admin/users/:id
// @access  Private/Admin
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id, {
    attributes: { exclude: ['password', 'passwordResetToken', 'passwordResetExpires'] },
    include: [{ model: Role, as: 'roleInfo', attributes: ['id', 'code', 'name'] }]
  });

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

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
});

// @desc    Update user (role, status)
// @route   PUT /api/v1/admin/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
  const { role, status, name, email } = req.body;

  const user = await User.findByPk(req.params.id, {
    include: [{ model: Role, as: 'roleInfo', attributes: ['id', 'code', 'name'] }]
  });

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Prevent admin from changing their own role or status
  if (user.id === req.user.id) {
    res.status(400);
    throw new Error('Cannot modify your own account role or status');
  }

  // Update role if provided
  if (role) {
    const newRole = await Role.findOne({ where: { code: role } });
    if (!newRole) {
      res.status(400);
      throw new Error(`Invalid role: ${role}`);
    }
    user.roleId = newRole.id;
  }

  // Update status if provided
  if (status && ['active', 'inactive', 'suspended', 'pending'].includes(status)) {
    user.status = status;
  }

  // Update basic info if provided
  if (name) user.name = name;
  if (email) user.email = email;

  await user.save();

  // Reload with role info
  await user.reload({
    include: [{ model: Role, as: 'roleInfo', attributes: ['id', 'code', 'name'] }]
  });

  res.status(200).json({
    success: true,
    data: user.getPublicProfile()
  });
});

// @desc    Delete user
// @route   DELETE /api/v1/admin/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Prevent admin from deleting their own account
  if (user.id === req.user.id) {
    res.status(400);
    throw new Error('Cannot delete your own account');
  }

  await user.destroy();

  res.status(200).json({
    success: true,
    message: 'User deleted successfully'
  });
});

// @desc    Get all roles
// @route   GET /api/v1/admin/roles
// @access  Private/Admin
const getRoles = asyncHandler(async (req, res) => {
  const roles = await Role.findAll({
    where: { status: 'active' },
    order: [['name', 'ASC']]
  });

  res.status(200).json({
    success: true,
    count: roles.length,
    data: roles
  });
});

// @desc    Get pending users count
// @route   GET /api/v1/admin/users/pending/count
// @access  Private/Admin
const getPendingUsersCount = asyncHandler(async (req, res) => {
  const count = await User.count({
    where: { status: 'pending' }
  });

  res.status(200).json({
    success: true,
    data: { count }
  });
});

module.exports = {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getRoles,
  getPendingUsersCount
};

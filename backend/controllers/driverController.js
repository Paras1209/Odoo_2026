const asyncHandler = require('express-async-handler');
const Driver = require('../models/Driver');

// @desc    Get all drivers
// @route   GET /api/v1/drivers
// @access  Private
const getDrivers = asyncHandler(async (req, res) => {
  const { status } = req.query;

  const filter = {};
  
  // Default to active drivers if no status specified
  if (status) {
    filter.status = status;
  } else {
    filter.status = 'Active';
  }

  const drivers = await Driver.findAll({
    where: filter,
    attributes: { exclude: ['password'] },
    order: [['name', 'ASC']]
  });

  res.status(200).json({
    success: true,
    count: drivers.length,
    data: drivers
  });
});

// @desc    Get single driver
// @route   GET /api/v1/drivers/:id
// @access  Private
const getDriver = asyncHandler(async (req, res) => {
  const driver = await Driver.findByPk(req.params.id, {
    attributes: { exclude: ['password'] }
  });

  if (!driver) {
    res.status(404);
    throw new Error('Driver not found');
  }

  res.status(200).json({
    success: true,
    data: driver
  });
});

// @desc    Create new driver
// @route   POST /api/v1/drivers
// @access  Private/Admin
const createDriver = asyncHandler(async (req, res) => {
  const { name, email, phone, licenseNumber, licenseExpiry } = req.body;

  // Validate required fields
  if (!name || !email || !phone || !licenseNumber || !licenseExpiry) {
    res.status(400);
    throw new Error('Please provide all required fields');
  }

  // Check if license number already exists
  const existingDriver = await Driver.findOne({ where: { licenseNumber } });
  if (existingDriver) {
    res.status(400);
    throw new Error('Driver with this license number already exists');
  }

  const driver = await Driver.create({
    name,
    email,
    phone,
    licenseNumber,
    licenseExpiry,
    status: 'Active',
    safetyScore: 100
  });

  res.status(201).json({
    success: true,
    data: driver
  });
});

// @desc    Update driver
// @route   PUT /api/v1/drivers/:id
// @access  Private/Admin
const updateDriver = asyncHandler(async (req, res) => {
  const driver = await Driver.findByPk(req.params.id);

  if (!driver) {
    res.status(404);
    throw new Error('Driver not found');
  }

  const { name, email, phone, licenseNumber, licenseExpiry, status, safetyScore } = req.body;

  if (name) driver.name = name;
  if (email) driver.email = email;
  if (phone) driver.phone = phone;
  if (licenseNumber) driver.licenseNumber = licenseNumber;
  if (licenseExpiry) driver.licenseExpiry = licenseExpiry;
  if (status) driver.status = status;
  if (safetyScore !== undefined) driver.safetyScore = safetyScore;

  await driver.save();

  res.status(200).json({
    success: true,
    data: driver
  });
});

// @desc    Delete driver
// @route   DELETE /api/v1/drivers/:id
// @access  Private/Admin
const deleteDriver = asyncHandler(async (req, res) => {
  const driver = await Driver.findByPk(req.params.id);

  if (!driver) {
    res.status(404);
    throw new Error('Driver not found');
  }

  await driver.destroy();

  res.status(200).json({
    success: true,
    message: 'Driver deleted successfully'
  });
});

module.exports = {
  getDrivers,
  getDriver,
  createDriver,
  updateDriver,
  deleteDriver
};

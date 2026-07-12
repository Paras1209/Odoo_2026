const asyncHandler = require('express-async-handler');
const Driver = require('../models/Driver');

const allowedDriverStatuses = ['active', 'inactive', 'suspended', 'on_leave'];
const allowedLicenseCategories = ['A', 'A1', 'A2', 'B', 'B1', 'C', 'C1', 'D', 'D1', 'E', 'F', 'G', 'H', 'other'];

const parseNumericValue = (value) => {
  if (value === undefined || value === null || value === '') return value;
  const numericValue = Number(value);
  return Number.isNaN(numericValue) ? value : numericValue;
};

const validateString = (errors, value, fieldName, min, max, required = true) => {
  const text = String(value || '').trim();
  if (!text) {
    if (required) errors.push(`${fieldName} is required`);
    return;
  }
  if (text.length < min || text.length > max) {
    errors.push(`${fieldName} must be between ${min} and ${max} characters`);
  }
};

const validateDriverPayload = (payload, isUpdate = false) => {
  const errors = [];
  const shouldValidate = (field) => !isUpdate || payload[field] !== undefined;

  if (shouldValidate('name')) validateString(errors, payload.name, 'name', 2, 120);
  if (shouldValidate('licenseNumber')) validateString(errors, payload.licenseNumber, 'licenseNumber', 3, 60);
  if (shouldValidate('contact')) validateString(errors, payload.contact, 'contact', 5, 255);
  if (shouldValidate('licenseCategory') && !allowedLicenseCategories.includes(payload.licenseCategory)) {
    errors.push(`licenseCategory must be one of: ${allowedLicenseCategories.join(', ')}`);
  }
  if (shouldValidate('licenseExpiry') && Number.isNaN(new Date(payload.licenseExpiry).getTime())) {
    errors.push('licenseExpiry must be a valid date');
  }
  if (shouldValidate('safetyScore')) {
    const safetyScore = Number(payload.safetyScore);
    if (Number.isNaN(safetyScore) || safetyScore < 0 || safetyScore > 100) {
      errors.push('safetyScore must be a number between 0 and 100');
    }
  }
  if (shouldValidate('status') && !allowedDriverStatuses.includes(payload.status)) {
    errors.push(`status must be one of: ${allowedDriverStatuses.join(', ')}`);
  }
  return errors;
};

const normalizeDriverPayload = (payload) => ({
  name: payload.name?.trim(),
  licenseNumber: payload.licenseNumber?.trim(),
  licenseCategory: payload.licenseCategory,
  licenseExpiry: payload.licenseExpiry,
  contact: payload.contact?.trim(),
  safetyScore: parseNumericValue(payload.safetyScore),
  status: payload.status
});

const createDriver = asyncHandler(async (req, res) => {
  const errors = validateDriverPayload(req.body);
  if (errors.length) {
    res.status(400);
    throw new Error(errors.join('; '));
  }
  const existingDriver = await Driver.findOne({ where: { licenseNumber: req.body.licenseNumber.trim() } });
  if (existingDriver) {
    res.status(400);
    throw new Error('Driver with this licenseNumber already exists');
  }
  const driver = await Driver.create(normalizeDriverPayload(req.body));
  res.status(201).json({ success: true, data: driver });
});

const getDrivers = asyncHandler(async (req, res) => {
  const drivers = await Driver.findAll({ order: [['createdAt', 'DESC']] });
  res.status(200).json({ success: true, count: drivers.length, data: drivers });
});

const getDriver = asyncHandler(async (req, res) => {
  const driver = await Driver.findByPk(req.params.id);
  if (!driver) {
    res.status(404);
    throw new Error('Driver not found');
  }
  res.status(200).json({ success: true, data: driver });
});

const updateDriver = asyncHandler(async (req, res) => {
  const driver = await Driver.findByPk(req.params.id);
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
  const errors = validateDriverPayload(req.body, true);
  if (errors.length) {
    res.status(400);
    throw new Error(errors.join('; '));
  }
  if (req.body.licenseNumber !== undefined) {
    const licenseNumber = req.body.licenseNumber.trim();
    if (licenseNumber !== driver.licenseNumber) {
      const existingDriver = await Driver.findOne({ where: { licenseNumber } });
      if (existingDriver) {
        res.status(400);
        throw new Error('Driver with this licenseNumber already exists');
      }
    }
  }
  Object.entries(normalizeDriverPayload(req.body)).forEach(([field, value]) => {
    if (req.body[field] !== undefined) driver[field] = value;
  });
  const updatedDriver = await driver.save();
  res.status(200).json({ success: true, data: updatedDriver });
});

const deleteDriver = asyncHandler(async (req, res) => {
  const driver = await Driver.findByPk(req.params.id);

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
  res.status(200).json({ success: true, message: 'Driver deleted successfully' });
});

module.exports = { createDriver, getDrivers, getDriver, updateDriver, deleteDriver, validateDriverPayload };

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

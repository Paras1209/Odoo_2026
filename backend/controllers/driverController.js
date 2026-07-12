const asyncHandler = require('express-async-handler');
const Driver = require('../models/Driver');
const { 
  parseNumericValue, 
  validateStringField,
  validateEnumField,
  validateDateField,
  createUpdateValidator
} = require('../utils/validation');
const { ALLOWED_DRIVER_STATUSES, LICENSE_CATEGORIES } = require('../constants');

/**
 * Validate driver payload
 * @param {Object} payload - Driver data to validate
 * @param {boolean} isUpdate - Whether this is an update operation
 * @returns {Array} - Array of error messages
 */
const validateDriverPayload = (payload, isUpdate = false) => {
  const errors = [];
  const shouldValidate = createUpdateValidator(isUpdate, payload);

  if (shouldValidate('name')) {
    validateStringField(errors, payload.name, 'name', 2, 120, !isUpdate);
  }

  if (shouldValidate('licenseNumber')) {
    validateStringField(errors, payload.licenseNumber, 'licenseNumber', 3, 60, !isUpdate);
  }

  if (shouldValidate('contact')) {
    validateStringField(errors, payload.contact, 'contact', 5, 255, !isUpdate);
  }

  if (shouldValidate('licenseCategory') && payload.licenseCategory) {
    validateEnumField(errors, payload.licenseCategory, 'licenseCategory', LICENSE_CATEGORIES);
  }

  if (shouldValidate('licenseExpiry') && payload.licenseExpiry) {
    validateDateField(errors, payload.licenseExpiry, 'licenseExpiry', !isUpdate);
  }

  if (shouldValidate('safetyScore') && payload.safetyScore !== undefined) {
    const safetyScore = Number(payload.safetyScore);
    if (Number.isNaN(safetyScore) || safetyScore < 0 || safetyScore > 100) {
      errors.push('safetyScore must be a number between 0 and 100');
    }
  }

  if (shouldValidate('status') && payload.status) {
    validateEnumField(errors, payload.status, 'status', ALLOWED_DRIVER_STATUSES);
  }

  return errors;
};

/**
 * Normalize driver payload
 * @param {Object} payload - Raw driver data
 * @returns {Object} - Normalized driver data
 */
const normalizeDriverPayload = (payload) => {
  const normalized = {};

  if (payload.name !== undefined) normalized.name = payload.name.trim();
  if (payload.licenseNumber !== undefined) normalized.licenseNumber = payload.licenseNumber.trim();
  if (payload.licenseCategory !== undefined) normalized.licenseCategory = payload.licenseCategory;
  if (payload.licenseExpiry !== undefined) normalized.licenseExpiry = payload.licenseExpiry;
  if (payload.contact !== undefined) normalized.contact = payload.contact.trim();
  if (payload.safetyScore !== undefined) normalized.safetyScore = parseNumericValue(payload.safetyScore);
  if (payload.status !== undefined) normalized.status = payload.status;

  return normalized;
};

// @desc    Get all drivers
// @route   GET /api/v1/drivers
// @access  Private
const getDrivers = asyncHandler(async (req, res) => {
  const { status } = req.query;

  const filter = {};
  
  if (status) {
    filter.status = status;
  }

  const drivers = await Driver.findAll({
    where: filter,
    order: [['createdAt', 'DESC']]
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
  const driver = await Driver.findByPk(req.params.id);

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
  // Validate payload
  const errors = validateDriverPayload(req.body);
  if (errors.length > 0) {
    res.status(400);
    throw new Error(errors.join('; '));
  }

  // Check if license number already exists
  const existingDriver = await Driver.findOne({ 
    where: { licenseNumber: req.body.licenseNumber.trim() } 
  });

  if (existingDriver) {
    res.status(400);
    throw new Error('Driver with this license number already exists');
  }

  // Create driver
  const driver = await Driver.create(normalizeDriverPayload(req.body));

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

  // Validate payload
  const errors = validateDriverPayload(req.body, true);
  if (errors.length > 0) {
    res.status(400);
    throw new Error(errors.join('; '));
  }

  // Check if license number is being changed and already exists
  if (req.body.licenseNumber !== undefined) {
    const licenseNumber = req.body.licenseNumber.trim();
    if (licenseNumber !== driver.licenseNumber) {
      const existingDriver = await Driver.findOne({ where: { licenseNumber } });
      if (existingDriver) {
        res.status(400);
        throw new Error('Driver with this license number already exists');
      }
    }
  }

  // Update driver fields
  const normalizedData = normalizeDriverPayload(req.body);
  Object.entries(normalizedData).forEach(([field, value]) => {
    if (value !== undefined) {
      driver[field] = value;
    }
  });

  const updatedDriver = await driver.save();

  res.status(200).json({
    success: true,
    data: updatedDriver
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
  deleteDriver,
  validateDriverPayload
};

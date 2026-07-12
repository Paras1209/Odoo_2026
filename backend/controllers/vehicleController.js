const asyncHandler = require('express-async-handler');
const Vehicle = require('../models/Vehicle');
const Maintenance = require('../models/Maintenance');
const Expense = require('../models/Expense');
const {
  parseNumericValue,
  validateStringField,
  validateNumericField,
  validateEnumField,
  createUpdateValidator
} = require('../utils/validation');
const { VEHICLE_TYPES, ALLOWED_VEHICLE_STATUSES } = require('../constants');

/**
 * Build operational cost summary for a vehicle
 * @param {string} vehicleId - Vehicle ID
 * @returns {Object} - Operational cost breakdown
 */
const buildOperationalCostSummary = async (vehicleId) => {
  const [fuelCost, maintenanceCost] = await Promise.all([
    Expense.sum('amount', {
      where: {
        vehicleId,
        type: 'fuel'
      }
    }),
    Maintenance.sum('cost', {
      where: {
        vehicleId,
        status: 'completed'
      }
    })
  ]);

  const normalizedFuelCost = Number(fuelCost || 0);
  const normalizedMaintenanceCost = Number(maintenanceCost || 0);

  return {
    fuelCost: normalizedFuelCost,
    maintenanceCost: normalizedMaintenanceCost,
    operationalCost: normalizedFuelCost + normalizedMaintenanceCost
  };
};

/**
 * Enrich vehicle data with operational cost
 * @param {Object} vehicle - Vehicle instance
 * @returns {Object} - Vehicle data with operational cost
 */
const enrichVehicleWithOperationalCost = async (vehicle) => {
  if (!vehicle) {
    return vehicle;
  }

  const operationalCostSummary = await buildOperationalCostSummary(vehicle.id);

  return {
    ...vehicle.get({ plain: true }),
    operationalCost: operationalCostSummary
  };
};

/**
 * Validate vehicle payload
 * @param {Object} payload - Vehicle data to validate
 * @param {boolean} isUpdate - Whether this is an update operation
 * @returns {Array} - Array of error messages
 */
const validateVehiclePayload = (payload, isUpdate = false) => {
  const errors = [];
  const shouldValidate = createUpdateValidator(isUpdate, payload);

  if (shouldValidate('registrationNumber')) {
    validateStringField(errors, payload.registrationNumber, 'registrationNumber', 2, 50, !isUpdate);
  }

  if (shouldValidate('name')) {
    validateStringField(errors, payload.name, 'name', 2, 120, !isUpdate);
  }

  if (shouldValidate('model')) {
    validateStringField(errors, payload.model, 'model', 2, 120, !isUpdate);
  }

  if (shouldValidate('type') && payload.type) {
    validateEnumField(errors, payload.type, 'type', VEHICLE_TYPES);
  }

  if (shouldValidate('maxCapacity') && payload.maxCapacity !== undefined) {
    validateNumericField(errors, payload.maxCapacity, 'maxCapacity', 1, true);
  }

  if (shouldValidate('odometer') && payload.odometer !== undefined) {
    validateNumericField(errors, payload.odometer, 'odometer', 0);
  }

  if (shouldValidate('acquisitionCost') && payload.acquisitionCost !== undefined) {
    validateNumericField(errors, payload.acquisitionCost, 'acquisitionCost', 0);
  }

  if (shouldValidate('status') && payload.status) {
    validateEnumField(errors, payload.status, 'status', ALLOWED_VEHICLE_STATUSES);
  }

  return errors;
};

/**
 * Normalize vehicle payload
 * @param {Object} payload - Raw vehicle data
 * @returns {Object} - Normalized vehicle data
 */
const normalizeVehiclePayload = (payload) => {
  const normalized = {};

  if (payload.registrationNumber !== undefined) normalized.registrationNumber = payload.registrationNumber.trim();
  if (payload.name !== undefined) normalized.name = payload.name.trim();
  if (payload.model !== undefined) normalized.model = payload.model.trim();
  if (payload.type !== undefined) normalized.type = payload.type;
  if (payload.maxCapacity !== undefined) normalized.maxCapacity = parseNumericValue(payload.maxCapacity);
  if (payload.odometer !== undefined) normalized.odometer = parseNumericValue(payload.odometer);
  if (payload.acquisitionCost !== undefined) normalized.acquisitionCost = parseNumericValue(payload.acquisitionCost);
  if (payload.status !== undefined) normalized.status = payload.status;

  return normalized;
};

// @desc    Create new vehicle
// @route   POST /api/v1/vehicles
// @access  Private/Admin
const createVehicle = asyncHandler(async (req, res) => {
  // Validate payload
  const errors = validateVehiclePayload(req.body);
  if (errors.length > 0) {
    res.status(400);
    throw new Error(errors.join('; '));
  }

  // Check if registration number already exists
  const existingVehicle = await Vehicle.findOne({
    where: { registrationNumber: req.body.registrationNumber.trim() }
  });

  if (existingVehicle) {
    res.status(400);
    throw new Error('Vehicle with this registration number already exists');
  }

  // Create vehicle
  const vehicle = await Vehicle.create(normalizeVehiclePayload(req.body));

  res.status(201).json({
    success: true,
    data: vehicle
  });
});

// @desc    Get all vehicles
// @route   GET /api/v1/vehicles
// @access  Private
const getVehicles = asyncHandler(async (req, res) => {
  const { status } = req.query;

  const filter = {};
  
  if (status) {
    filter.status = status;
  }

  const vehicles = await Vehicle.findAll({
    where: filter,
    order: [['createdAt', 'DESC']]
  });

  // Enrich with operational costs
  const vehiclesWithCosts = await Promise.all(
    vehicles.map(enrichVehicleWithOperationalCost)
  );

  res.status(200).json({
    success: true,
    count: vehiclesWithCosts.length,
    data: vehiclesWithCosts
  });
});

// @desc    Get single vehicle
// @route   GET /api/v1/vehicles/:id
// @access  Private
const getVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findByPk(req.params.id);

  if (!vehicle) {
    res.status(404);
    throw new Error('Vehicle not found');
  }

  const vehicleWithCost = await enrichVehicleWithOperationalCost(vehicle);

  res.status(200).json({
    success: true,
    data: vehicleWithCost
  });
});

// @desc    Update vehicle
// @route   PUT /api/v1/vehicles/:id
// @access  Private/Admin
const updateVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findByPk(req.params.id);

  if (!vehicle) {
    res.status(404);
    throw new Error('Vehicle not found');
  }

  // Validate payload
  const errors = validateVehiclePayload(req.body, true);
  if (errors.length > 0) {
    res.status(400);
    throw new Error(errors.join('; '));
  }

  // Check if registration number is being changed and already exists
  if (req.body.registrationNumber !== undefined) {
    const registrationNumber = req.body.registrationNumber.trim();
    if (registrationNumber !== vehicle.registrationNumber) {
      const existingVehicle = await Vehicle.findOne({ where: { registrationNumber } });
      if (existingVehicle) {
        res.status(400);
        throw new Error('Vehicle with this registration number already exists');
      }
    }
  }

  // Update vehicle fields
  const normalizedData = normalizeVehiclePayload(req.body);
  Object.entries(normalizedData).forEach(([field, value]) => {
    if (value !== undefined) {
      vehicle[field] = value;
    }
  });

  const updatedVehicle = await vehicle.save();
  const updatedVehicleWithCost = await enrichVehicleWithOperationalCost(updatedVehicle);

  res.status(200).json({
    success: true,
    data: updatedVehicleWithCost
  });
});

// @desc    Get vehicle operational cost
// @route   GET /api/v1/vehicles/:id/operational-cost
// @access  Private
const getVehicleOperationalCost = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findByPk(req.params.id);

  if (!vehicle) {
    res.status(404);
    throw new Error('Vehicle not found');
  }

  const operationalCost = await buildOperationalCostSummary(vehicle.id);

  res.status(200).json({
    success: true,
    data: {
      vehicleId: vehicle.id,
      registrationNumber: vehicle.registrationNumber,
      name: vehicle.name,
      ...operationalCost
    }
  });
});

// @desc    Delete vehicle
// @route   DELETE /api/v1/vehicles/:id
// @access  Private/Admin
const deleteVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findByPk(req.params.id);

  if (!vehicle) {
    res.status(404);
    throw new Error('Vehicle not found');
  }

  await vehicle.destroy();

  res.status(200).json({
    success: true,
    message: 'Vehicle deleted successfully'
  });
});

module.exports = {
  createVehicle,
  getVehicles,
  getVehicle,
  updateVehicle,
  getVehicleOperationalCost,
  deleteVehicle,
  validateVehiclePayload
};

const asyncHandler = require('express-async-handler');
const Vehicle = require('../models/Vehicle');
const Maintenance = require('../models/Maintenance');
const Expense = require('../models/Expense');

const allowedVehicleTypes = ['bus', 'van', 'truck', 'car', 'motorcycle', 'trailer', 'other'];
const allowedVehicleStatuses = ['available', 'on_trip', 'in_shop', 'retired', 'active', 'inactive', 'maintenance'];
const normalizedVehicleStatuses = {
  active: 'available',
  inactive: 'retired',
  maintenance: 'in_shop',
  available: 'available',
  on_trip: 'on_trip',
  in_shop: 'in_shop',
  retired: 'retired'
};

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

const parseNumericValue = (value) => {
  if (value === undefined || value === null || value === '') {
    return value;
  }

  const numericValue = Number(value);
  return Number.isNaN(numericValue) ? value : numericValue;
};

const validateStringField = (errors, value, fieldName, minLength, maxLength, required) => {
  const stringValue = String(value || '').trim();

  if (!stringValue) {
    if (required) {
      errors.push(`${fieldName} is required`);
    }
    return;
  }

  if (stringValue.length < minLength || stringValue.length > maxLength) {
    errors.push(`${fieldName} must be between ${minLength} and ${maxLength} characters`);
  }
};

const validateNumericField = (errors, value, fieldName, minimum, allowIntegerOnly = false) => {
  const numericValue = Number(value);

  if (Number.isNaN(numericValue) || numericValue < minimum || (allowIntegerOnly && !Number.isInteger(numericValue))) {
    const minimumText = minimum === 0 ? 'greater than or equal to 0' : `greater than or equal to ${minimum}`;
    const typeText = allowIntegerOnly ? 'positive integer' : `number ${minimumText}`;
    errors.push(`${fieldName} must be a ${typeText}`);
  }
};

const validateEnumField = (errors, value, fieldName, allowedValues) => {
  if (!allowedValues.includes(value)) {
    errors.push(`${fieldName} must be one of: ${allowedValues.join(', ')}`);
  }
};

const validateVehiclePayload = (payload, isUpdate = false) => {
  const errors = [];
  const shouldValidate = (fieldName) => !isUpdate || payload[fieldName] !== undefined;

  if (shouldValidate('registrationNumber')) {
    validateStringField(errors, payload.registrationNumber, 'registrationNumber', 2, 50, true);
  }

  if (shouldValidate('name')) {
    validateStringField(errors, payload.name, 'name', 2, 120, true);
  }

  if (shouldValidate('model')) {
    validateStringField(errors, payload.model, 'model', 2, 120, true);
  }

  if (shouldValidate('type')) {
    validateEnumField(errors, payload.type, 'type', allowedVehicleTypes);
  }

  if (shouldValidate('maxCapacity')) {
    validateNumericField(errors, payload.maxCapacity, 'maxCapacity', 1, true);
  }

  if (shouldValidate('odometer')) {
    validateNumericField(errors, payload.odometer, 'odometer', 0);
  }

  if (shouldValidate('acquisitionCost')) {
    validateNumericField(errors, payload.acquisitionCost, 'acquisitionCost', 0);
  }

  if (shouldValidate('status')) {
    validateEnumField(errors, payload.status, 'status', allowedVehicleStatuses);
  }

  return errors;
};

const normalizeVehiclePayload = (payload) => ({
  registrationNumber: payload.registrationNumber?.trim(),
  name: payload.name?.trim(),
  model: payload.model?.trim(),
  type: payload.type,
  maxCapacity: parseNumericValue(payload.maxCapacity),
  odometer: parseNumericValue(payload.odometer),
  acquisitionCost: parseNumericValue(payload.acquisitionCost),
  status: normalizedVehicleStatuses[payload.status] ?? payload.status
});

const createVehicle = asyncHandler(async (req, res) => {
  const errors = validateVehiclePayload(req.body);

  if (errors.length > 0) {
    res.status(400);
    throw new Error(errors.join('; '));
  }

  const existingVehicle = await Vehicle.findOne({
    where: { registrationNumber: req.body.registrationNumber.trim() }
  });

  if (existingVehicle) {
    res.status(400);
    throw new Error('Vehicle with this registrationNumber already exists');
  }

  const vehicle = await Vehicle.create(normalizeVehiclePayload(req.body));

  res.status(201).json({
    success: true,
    data: vehicle
  });
});

const getVehicles = asyncHandler(async (req, res) => {
  const vehicles = await Vehicle.findAll({ order: [['createdAt', 'DESC']] });
  const vehiclesWithCosts = await Promise.all(vehicles.map(enrichVehicleWithOperationalCost));

  res.status(200).json({
    success: true,
    count: vehiclesWithCosts.length,
    data: vehiclesWithCosts
  });
});


// @desc    Get all available vehicles
// @route   GET /api/v1/vehicles
// @access  Private
const getVehicles = asyncHandler(async (req, res) => {
  const { status } = req.query;

  const filter = {};
  
  // Default to available vehicles if no status specified
  if (status) {
    filter.status = status;
  } else {
    filter.status = 'Available';
  }

  const vehicles = await Vehicle.findAll({
    where: filter,
    order: [['registrationNumber', 'ASC']]
  });

  res.status(200).json({
    success: true,
    count: vehicles.length,
    data: vehicles
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

const updateVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findByPk(req.params.id);

  if (!vehicle) {
    res.status(404);
    throw new Error('Vehicle not found');
  }

  const errors = validateVehiclePayload(req.body, true);

  if (errors.length > 0) {
    res.status(400);
    throw new Error(errors.join('; '));
  }

  const updateField = (fieldName, transform = (value) => value) => {
    if (req.body[fieldName] !== undefined) {
      vehicle[fieldName] = transform(req.body[fieldName]);
    }
  };

  if (req.body.registrationNumber !== undefined) {
    const registrationNumber = req.body.registrationNumber.trim();
    if (registrationNumber && registrationNumber !== vehicle.registrationNumber) {
      const existingVehicle = await Vehicle.findOne({ where: { registrationNumber } });
      if (existingVehicle) {
        res.status(400);
        throw new Error('Vehicle with this registrationNumber already exists');
      }
      vehicle.registrationNumber = registrationNumber;
    }
  }

  updateField('name', (value) => value.trim());
  updateField('model', (value) => value.trim());
  updateField('type');
  updateField('maxCapacity', parseNumericValue);
  updateField('odometer', parseNumericValue);
  updateField('acquisitionCost', parseNumericValue);
  updateField('status', (value) => normalizedVehicleStatuses[value] ?? value);

  const updatedVehicle = await vehicle.save();
  const updatedVehicleWithCost = await enrichVehicleWithOperationalCost(updatedVehicle);

  res.status(200).json({
    success: true,
    data: updatedVehicleWithCost
  });
});

const getVehicleOperationalCost = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: vehicle
  });
});

// @desc    Create new vehicle
// @route   POST /api/v1/vehicles
// @access  Private/Admin
const createVehicle = asyncHandler(async (req, res) => {
  const { registrationNumber, name, model, type, maxCapacity, acquisitionCost } = req.body;

  // Validate required fields
  if (!registrationNumber || !name || !model || !type || !maxCapacity || !acquisitionCost) {
    res.status(400);
    throw new Error('Please provide all required fields');
  }

  // Check if registration number already exists
  const existingVehicle = await Vehicle.findOne({ where: { registrationNumber } });
  if (existingVehicle) {
    res.status(400);
    throw new Error('Vehicle with this registration number already exists');
  }

  const vehicle = await Vehicle.create({
    registrationNumber,
    name,
    model,
    type,
    maxCapacity,
    acquisitionCost,
    status: 'Available'
  });

  res.status(201).json({
    success: true,
    data: vehicle
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

  const { registrationNumber, name, model, type, maxCapacity, acquisitionCost, status, odometer } = req.body;

  if (registrationNumber) vehicle.registrationNumber = registrationNumber;
  if (name) vehicle.name = name;
  if (model) vehicle.model = model;
  if (type) vehicle.type = type;
  if (maxCapacity) vehicle.maxCapacity = maxCapacity;
  if (acquisitionCost) vehicle.acquisitionCost = acquisitionCost;
  if (status) vehicle.status = status;
  if (odometer !== undefined) vehicle.odometer = odometer;

  await vehicle.save();

  res.status(200).json({
    success: true,
    data: vehicle
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
  getVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle
};

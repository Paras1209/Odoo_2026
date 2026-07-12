const asyncHandler = require('express-async-handler');
const Trip = require('../models/Trip');
const Vehicle = require('../models/Vehicle');

const allowedTripStatuses = ['draft', 'dispatched', 'completed', 'cancelled'];

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

const validateNumericField = (errors, value, fieldName, minimum) => {
  const numericValue = Number(value);

  if (Number.isNaN(numericValue) || numericValue < minimum) {
    errors.push(`${fieldName} must be a number greater than or equal to ${minimum}`);
  }
};

const validateEnumField = (errors, value, fieldName, allowedValues) => {
  if (!allowedValues.includes(value)) {
    errors.push(`${fieldName} must be one of: ${allowedValues.join(', ')}`);
  }
};

const validateTripPayload = (payload, isUpdate = false) => {
  const errors = [];
  const shouldValidate = (fieldName) => !isUpdate || payload[fieldName] !== undefined;

  if (shouldValidate('source')) {
    validateStringField(errors, payload.source, 'source', 2, 120, true);
  }

  if (shouldValidate('destination')) {
    validateStringField(errors, payload.destination, 'destination', 2, 120, true);
  }

  if (shouldValidate('vehicleId')) {
    validateStringField(errors, payload.vehicleId, 'vehicleId', 1, 100, true);
  }

  if (shouldValidate('cargoWeight')) {
    validateNumericField(errors, payload.cargoWeight, 'cargoWeight', 0);
  }

  if (shouldValidate('plannedDistance')) {
    validateNumericField(errors, payload.plannedDistance, 'plannedDistance', 0);
  }

  if (shouldValidate('actualDistance') && payload.actualDistance !== undefined && payload.actualDistance !== null && payload.actualDistance !== '') {
    validateNumericField(errors, payload.actualDistance, 'actualDistance', 0);
  }

  if (shouldValidate('fuelConsumed') && payload.fuelConsumed !== undefined && payload.fuelConsumed !== null && payload.fuelConsumed !== '') {
    validateNumericField(errors, payload.fuelConsumed, 'fuelConsumed', 0);
  }

  if (shouldValidate('status')) {
    validateEnumField(errors, payload.status, 'status', allowedTripStatuses);
  }

  return errors;
};

const normalizeTripPayload = (payload) => ({
  source: payload.source?.trim(),
  destination: payload.destination?.trim(),
  vehicleId: payload.vehicleId?.trim(),
  cargoWeight: parseNumericValue(payload.cargoWeight),
  plannedDistance: parseNumericValue(payload.plannedDistance),
  actualDistance: parseNumericValue(payload.actualDistance),
  fuelConsumed: parseNumericValue(payload.fuelConsumed),
  status: payload.status,
  startedAt: payload.startedAt || null,
  endedAt: payload.endedAt || null
});

const includeVehicle = [{ model: Vehicle, as: 'vehicle' }];

const createTrip = asyncHandler(async (req, res) => {
  const errors = validateTripPayload(req.body);

  if (errors.length > 0) {
    res.status(400);
    throw new Error(errors.join('; '));
  }

  const vehicle = await Vehicle.findByPk(req.body.vehicleId);

  if (!vehicle) {
    res.status(404);
    throw new Error('Vehicle not found');
  }

  const trip = await Trip.create(normalizeTripPayload(req.body));

  res.status(201).json({
    success: true,
    data: trip
  });
});

const getTrips = asyncHandler(async (req, res) => {
  const trips = await Trip.findAll({ include: includeVehicle, order: [['createdAt', 'DESC']] });

  res.status(200).json({
    success: true,
    count: trips.length,
    data: trips
  });
});

const getTrip = asyncHandler(async (req, res) => {
  const trip = await Trip.findByPk(req.params.id, { include: includeVehicle });

  if (!trip) {
    res.status(404);
    throw new Error('Trip not found');
  }

  res.status(200).json({
    success: true,
    data: trip
  });
});

const updateTrip = asyncHandler(async (req, res) => {
  const trip = await Trip.findByPk(req.params.id);

  if (!trip) {
    res.status(404);
    throw new Error('Trip not found');
  }

  const errors = validateTripPayload(req.body, true);

  if (errors.length > 0) {
    res.status(400);
    throw new Error(errors.join('; '));
  }

  const updateField = (fieldName, transform = (value) => value) => {
    if (req.body[fieldName] !== undefined) {
      trip[fieldName] = transform(req.body[fieldName]);
    }
  };

  if (req.body.vehicleId !== undefined) {
    const vehicle = await Vehicle.findByPk(req.body.vehicleId.trim());
    if (!vehicle) {
      res.status(404);
      throw new Error('Vehicle not found');
    }
  }

  updateField('source', (value) => value.trim());
  updateField('destination', (value) => value.trim());
  updateField('vehicleId', (value) => value.trim());
  updateField('cargoWeight', parseNumericValue);
  updateField('plannedDistance', parseNumericValue);
  updateField('actualDistance', parseNumericValue);
  updateField('fuelConsumed', parseNumericValue);
  updateField('status');
  updateField('startedAt');
  updateField('endedAt');

  const updatedTrip = await trip.save();

  res.status(200).json({
    success: true,
    data: updatedTrip
  });
});

const deleteTrip = asyncHandler(async (req, res) => {
  const trip = await Trip.findByPk(req.params.id);

  if (!trip) {
    res.status(404);
    throw new Error('Trip not found');
  }

  await trip.destroy();

  res.status(200).json({
    success: true,
    message: 'Trip deleted successfully'
  });
});

module.exports = {
  createTrip,
  getTrips,
  getTrip,
  updateTrip,
  deleteTrip,
  validateTripPayload
};
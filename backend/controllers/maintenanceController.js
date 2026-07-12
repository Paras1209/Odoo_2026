const asyncHandler = require('express-async-handler');
const Maintenance = require('../models/Maintenance');
const Vehicle = require('../models/Vehicle');
const {
  parseNumericValue,
  validateStringField,
  validateNumericField,
  validateEnumField,
  validateDateField,
  createUpdateValidator
} = require('../utils/validation');
const { ALLOWED_MAINTENANCE_STATUSES } = require('../constants');

const validateMaintenancePayload = (payload, isUpdate = false) => {
  const errors = [];
  const shouldValidate = createUpdateValidator(isUpdate, payload);

  if (shouldValidate('vehicleId')) {
    validateStringField(errors, payload.vehicleId, 'vehicleId', 1, 100, !isUpdate);
  }

  if (shouldValidate('type')) {
    validateStringField(errors, payload.type, 'type', 2, 120, !isUpdate);
  }

  if (shouldValidate('description')) {
    validateStringField(errors, payload.description, 'description', 1, 10000, !isUpdate);
  }

  if (shouldValidate('cost') && payload.cost !== undefined) {
    validateNumericField(errors, payload.cost, 'cost', 0);
  }

  if (shouldValidate('date') && payload.date) {
    validateDateField(errors, payload.date, 'date', !isUpdate);
  }

  if (shouldValidate('status') && payload.status) {
    validateEnumField(errors, payload.status, 'status', ALLOWED_MAINTENANCE_STATUSES);
  }

  return errors;
};

const normalizeMaintenancePayload = (payload) => ({
  vehicleId: payload.vehicleId?.trim(),
  type: payload.type?.trim(),
  description: payload.description?.trim(),
  cost: parseNumericValue(payload.cost),
  date: payload.date,
  status: payload.status
});

const setVehicleStatus = async (vehicleId, status) => {
  const vehicle = await Vehicle.findByPk(vehicleId);

  if (!vehicle) {
    return null;
  }

  vehicle.status = status;
  return vehicle.save();
};

const createMaintenance = asyncHandler(async (req, res) => {
  const errors = validateMaintenancePayload(req.body);

  if (errors.length > 0) {
    res.status(400);
    throw new Error(errors.join('; '));
  }

  const vehicle = await Vehicle.findByPk(req.body.vehicleId);

  if (!vehicle) {
    res.status(404);
    throw new Error('Vehicle not found');
  }

  const maintenance = await Maintenance.create(normalizeMaintenancePayload(req.body));
  await setVehicleStatus(vehicle.id, 'in_shop');

  const createdMaintenance = await Maintenance.findByPk(maintenance.id, {
    include: [{ model: Vehicle, as: 'vehicle' }]
  });

  res.status(201).json({
    success: true,
    data: createdMaintenance
  });
});

const getMaintenanceRecords = asyncHandler(async (req, res) => {
  const maintenanceRecords = await Maintenance.findAll({
    include: [{ model: Vehicle, as: 'vehicle' }],
    order: [['createdAt', 'DESC']]
  });

  res.status(200).json({
    success: true,
    count: maintenanceRecords.length,
    data: maintenanceRecords
  });
});

const getMaintenanceRecord = asyncHandler(async (req, res) => {
  const maintenanceRecord = await Maintenance.findByPk(req.params.id, {
    include: [{ model: Vehicle, as: 'vehicle' }]
  });

  if (!maintenanceRecord) {
    res.status(404);
    throw new Error('Maintenance record not found');
  }

  res.status(200).json({
    success: true,
    data: maintenanceRecord
  });
});

const updateMaintenanceRecord = asyncHandler(async (req, res) => {
  const maintenanceRecord = await Maintenance.findByPk(req.params.id);

  if (!maintenanceRecord) {
    res.status(404);
    throw new Error('Maintenance record not found');
  }

  const errors = validateMaintenancePayload(req.body, true);

  if (errors.length > 0) {
    res.status(400);
    throw new Error(errors.join('; '));
  }

  if (req.body.type !== undefined) {
    maintenanceRecord.type = req.body.type.trim();
  }

  if (req.body.description !== undefined) {
    maintenanceRecord.description = req.body.description.trim();
  }

  if (req.body.cost !== undefined) {
    maintenanceRecord.cost = parseNumericValue(req.body.cost);
  }

  if (req.body.date !== undefined) {
    maintenanceRecord.date = req.body.date;
  }

  const previousStatus = maintenanceRecord.status;

  if (req.body.status !== undefined) {
    maintenanceRecord.status = req.body.status;
  }

  const updatedMaintenanceRecord = await maintenanceRecord.save();

  if (previousStatus !== 'completed' && updatedMaintenanceRecord.status === 'completed') {
    await setVehicleStatus(updatedMaintenanceRecord.vehicleId, 'available');
  } else if (previousStatus === 'completed' && updatedMaintenanceRecord.status !== 'completed') {
    await setVehicleStatus(updatedMaintenanceRecord.vehicleId, 'in_shop');
  }

  const responseMaintenanceRecord = await Maintenance.findByPk(updatedMaintenanceRecord.id, {
    include: [{ model: Vehicle, as: 'vehicle' }]
  });

  res.status(200).json({
    success: true,
    data: responseMaintenanceRecord
  });
});

const closeMaintenanceRecord = asyncHandler(async (req, res) => {
  const maintenanceRecord = await Maintenance.findByPk(req.params.id);

  if (!maintenanceRecord) {
    res.status(404);
    throw new Error('Maintenance record not found');
  }

  maintenanceRecord.status = 'completed';
  const closedMaintenanceRecord = await maintenanceRecord.save();
  await setVehicleStatus(closedMaintenanceRecord.vehicleId, 'available');

  const responseMaintenanceRecord = await Maintenance.findByPk(closedMaintenanceRecord.id, {
    include: [{ model: Vehicle, as: 'vehicle' }]
  });

  res.status(200).json({
    success: true,
    data: responseMaintenanceRecord
  });
});

const deleteMaintenanceRecord = asyncHandler(async (req, res) => {
  const maintenanceRecord = await Maintenance.findByPk(req.params.id);

  if (!maintenanceRecord) {
    res.status(404);
    throw new Error('Maintenance record not found');
  }

  await maintenanceRecord.destroy();

  res.status(200).json({
    success: true,
    message: 'Maintenance record deleted successfully'
  });
});

module.exports = {
  createMaintenance,
  getMaintenanceRecords,
  getMaintenanceRecord,
  updateMaintenanceRecord,
  closeMaintenanceRecord,
  deleteMaintenanceRecord,
  validateMaintenancePayload
};
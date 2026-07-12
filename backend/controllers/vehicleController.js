const asyncHandler = require('express-async-handler');
const Vehicle = require('../models/Vehicle');

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
  getVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle
};

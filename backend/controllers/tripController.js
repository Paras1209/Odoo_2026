const asyncHandler = require('express-async-handler');
const Trip = require('../models/Trip');
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const { Op } = require('sequelize');

// @desc    Get all trips with filtering and pagination
// @route   GET /api/v1/trips
// @access  Private
const getAllTrips = asyncHandler(async (req, res) => {
  const { source, destination, status, vehicleId, driverId, page = 1, limit = 10 } = req.query;

  // Build filter object
  const filter = {};

  if (source) {
    filter.source = { [Op.iLike]: `%${source}%` };
  }

  if (destination) {
    filter.destination = { [Op.iLike]: `%${destination}%` };
  }

  if (status) {
    filter.status = status;
  }

  if (vehicleId) {
    filter.vehicleId = vehicleId;
  }

  if (driverId) {
    filter.driverId = driverId;
  }

  // Parse pagination params
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const offset = (pageNum - 1) * limitNum;

  // Get trips with pagination and include vehicle/driver details
  const { count, rows } = await Trip.findAndCountAll({
    where: filter,
    include: [
      { model: Vehicle, as: 'vehicle', attributes: ['registrationNumber', 'name', 'type', 'maxCapacity'] },
      { model: Driver, as: 'driver', attributes: ['name', 'licenseNumber', 'safetyScore'] }
    ],
    limit: limitNum,
    offset: offset,
    order: [['createdAt', 'DESC']]
  });

  res.status(200).json({
    success: true,
    data: {
      trips: rows,
      pagination: {
        total: count,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(count / limitNum)
      }
    }
  });
});

// @desc    Get single trip by ID
// @route   GET /api/v1/trips/:id
// @access  Private
const getTripById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const trip = await Trip.findByPk(id, {
    include: [
      { model: Vehicle, as: 'vehicle' },
      { model: Driver, as: 'driver' }
    ]
  });

  if (!trip) {
    res.status(404);
    throw new Error('Trip not found');
  }

  res.status(200).json({
    success: true,
    data: trip
  });
});

// @desc    Create new trip
// @route   POST /api/v1/trips
// @access  Private
const createTrip = asyncHandler(async (req, res) => {
  const { source, destination, vehicleId, driverId, cargoWeight, plannedDistance } = req.body;

  // Validate required fields
  if (!source || !destination || !vehicleId || !driverId || !cargoWeight || !plannedDistance) {
    res.status(400);
    throw new Error('Please provide all required fields');
  }

  // Validate numeric fields
  if (parseFloat(cargoWeight) <= 0) {
    res.status(400);
    throw new Error('Cargo weight must be greater than 0');
  }

  if (parseFloat(plannedDistance) <= 0) {
    res.status(400);
    throw new Error('Planned distance must be greater than 0');
  }

  // Check if vehicle exists
  const vehicle = await Vehicle.findByPk(vehicleId);
  if (!vehicle) {
    res.status(404);
    throw new Error('Vehicle not found');
  }

  // Check if driver exists
  const driver = await Driver.findByPk(driverId);
  if (!driver) {
    res.status(404);
    throw new Error('Driver not found');
  }

  // Create trip
  const trip = await Trip.create({
    source,
    destination,
    vehicleId,
    driverId,
    cargoWeight,
    plannedDistance
  });

  res.status(201).json({
    success: true,
    data: trip
  });
});

// @desc    Update trip
// @route   PUT /api/v1/trips/:id
// @access  Private
const updateTrip = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { source, destination, vehicleId, driverId, cargoWeight, plannedDistance } = req.body;

  // Find trip
  const trip = await Trip.findByPk(id);

  if (!trip) {
    res.status(404);
    throw new Error('Trip not found');
  }

  // Only allow updates for draft trips
  if (trip.status !== 'draft') {
    res.status(409);
    throw new Error('Only draft trips can be updated');
  }

  // Validate required fields if provided
  if (source !== undefined) trip.source = source;
  if (destination !== undefined) trip.destination = destination;
  if (vehicleId !== undefined) trip.vehicleId = vehicleId;
  if (driverId !== undefined) trip.driverId = driverId;
  if (cargoWeight !== undefined) {
    if (parseFloat(cargoWeight) <= 0) {
      res.status(400);
      throw new Error('Cargo weight must be greater than 0');
    }
    trip.cargoWeight = cargoWeight;
  }
  if (plannedDistance !== undefined) {
    if (parseFloat(plannedDistance) <= 0) {
      res.status(400);
      throw new Error('Planned distance must be greater than 0');
    }
    trip.plannedDistance = plannedDistance;
  }

  // Validate vehicle and driver if changed
  if (vehicleId !== undefined) {
    const vehicle = await Vehicle.findByPk(vehicleId);
    if (!vehicle) {
      res.status(404);
      throw new Error('Vehicle not found');
    }
  }

  if (driverId !== undefined) {
    const driver = await Driver.findByPk(driverId);
    if (!driver) {
      res.status(404);
      throw new Error('Driver not found');
    }
  }

  await trip.save();

  // Get updated trip with vehicle/driver details
  const updatedTrip = await Trip.findByPk(id, {
    include: [
      { model: Vehicle, as: 'vehicle' },
      { model: Driver, as: 'driver' }
    ]
  });

  res.status(200).json({
    success: true,
    data: updatedTrip
  });
});

// @desc    Delete trip
// @route   DELETE /api/v1/trips/:id
// @access  Private
const deleteTrip = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Find trip
  const trip = await Trip.findByPk(id);

  if (!trip) {
    res.status(404);
    throw new Error('Trip not found');
  }

  // Only allow deletion of draft or cancelled trips
  if (trip.status !== 'draft' && trip.status !== 'cancelled') {
    res.status(409);
    throw new Error('Only draft or cancelled trips can be deleted');
  }

  await trip.destroy();

  res.status(204).json({
    success: true,
    data: null
  });
});

// @desc    Dispatch trip
// @route   POST /api/v1/trips/:id/dispatch
// @access  Private
const dispatchTrip = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Find trip
  const trip = await Trip.findByPk(id);

  if (!trip) {
    res.status(404);
    throw new Error('Trip not found');
  }

  // Dispatch trip using model method
  const dispatchedTrip = await trip.dispatch();

  // Get updated trip with vehicle/driver details
  const result = await Trip.findByPk(id, {
    include: [
      { model: Vehicle, as: 'vehicle' },
      { model: Driver, as: 'driver' }
    ]
  });

  res.status(200).json({
    success: true,
    data: result
  });
});

// @desc    Complete trip
// @route   POST /api/v1/trips/:id/complete
// @access  Private
const completeTrip = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { actualDistance, fuelConsumed } = req.body;

  // Validate required fields
  if (actualDistance === undefined || fuelConsumed === undefined) {
    res.status(400);
    throw new Error('Please provide actual distance and fuel consumed');
  }

  // Find trip
  const trip = await Trip.findByPk(id);

  if (!trip) {
    res.status(404);
    throw new Error('Trip not found');
  }

  // Complete trip using model method
  const completedTrip = await trip.complete(parseFloat(actualDistance), parseFloat(fuelConsumed));

  // Get updated trip with vehicle/driver details
  const result = await Trip.findByPk(id, {
    include: [
      { model: Vehicle, as: 'vehicle' },
      { model: Driver, as: 'driver' }
    ]
  });

  res.status(200).json({
    success: true,
    data: result
  });
});

// @desc    Cancel trip
// @route   POST /api/v1/trips/:id/cancel
// @access  Private
const cancelTrip = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Find trip
  const trip = await Trip.findByPk(id);

  if (!trip) {
    res.status(404);
    throw new Error('Trip not found');
  }

  // Cancel trip using model method
  const cancelledTrip = await trip.cancel();

  // Get updated trip with vehicle/driver details
  const result = await Trip.findByPk(id, {
    include: [
      { model: Vehicle, as: 'vehicle' },
      { model: Driver, as: 'driver' }
    ]
  });

  res.status(200).json({
    success: true,
    data: result
  });
});

module.exports = {
  getAllTrips,
  getTripById,
  createTrip,
  updateTrip,
  deleteTrip,
  dispatchTrip,
  completeTrip,
  cancelTrip
};

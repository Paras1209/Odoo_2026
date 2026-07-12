const express = require('express');
const router = express.Router();
const {
  getAllTrips,
  getTripById,
  createTrip,
  updateTrip,
  deleteTrip,
  dispatchTrip,
  completeTrip,
  cancelTrip
} = require('../controllers/tripController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// GET all trips with filtering and pagination
router.get('/', authorize('admin', 'fleet_manager', 'dispatcher', 'safety_officer', 'driver'), getAllTrips);

// GET single trip by ID
router.get('/:id', authorize('admin', 'fleet_manager', 'dispatcher', 'safety_officer', 'driver'), getTripById);

// POST create new trip
router.post('/', authorize('admin', 'fleet_manager', 'dispatcher'), createTrip);

// PUT update trip
router.put('/:id', authorize('admin', 'fleet_manager', 'dispatcher'), updateTrip);

// DELETE trip
router.delete('/:id', authorize('admin', 'fleet_manager'), deleteTrip);

// POST dispatch trip
router.post('/:id/dispatch', authorize('admin', 'fleet_manager', 'dispatcher'), dispatchTrip);

// POST complete trip
router.post('/:id/complete', authorize('admin', 'fleet_manager', 'dispatcher', 'driver'), completeTrip);

// POST cancel trip
router.post('/:id/cancel', authorize('admin', 'fleet_manager', 'dispatcher'), cancelTrip);

module.exports = router;
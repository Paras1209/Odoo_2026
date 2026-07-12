const express = require('express');
const router = express.Router();
const {
  createTrip,
  getTrips,
  getTrip,
  updateTrip,
  deleteTrip
} = require('../controllers/tripController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('admin', 'fleet_manager', 'dispatcher', 'safety_officer'), getTrips);
router.get('/:id', protect, authorize('admin', 'fleet_manager', 'dispatcher', 'safety_officer'), getTrip);
router.post('/', protect, authorize('admin', 'fleet_manager', 'dispatcher'), createTrip);
router.put('/:id', protect, authorize('admin', 'fleet_manager', 'dispatcher'), updateTrip);
router.delete('/:id', protect, authorize('admin', 'fleet_manager'), deleteTrip);
  getAllTrips,
  getTripById,
  createTrip,
  updateTrip,
  deleteTrip,
  dispatchTrip,
  completeTrip,
  cancelTrip
} = require('../controllers/tripController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// GET all trips with filtering and pagination
router.get('/', getAllTrips);

// GET single trip by ID
router.get('/:id', getTripById);

// POST create new trip
router.post('/', createTrip);

// PUT update trip
router.put('/:id', updateTrip);

// DELETE trip
router.delete('/:id', deleteTrip);

// POST dispatch trip
router.post('/:id/dispatch', dispatchTrip);

// POST complete trip
router.post('/:id/complete', completeTrip);

// POST cancel trip
router.post('/:id/cancel', cancelTrip);

module.exports = router;
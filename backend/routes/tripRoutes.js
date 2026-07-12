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
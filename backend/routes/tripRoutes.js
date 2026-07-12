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

module.exports = router;
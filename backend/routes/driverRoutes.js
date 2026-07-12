const express = require('express');
const router = express.Router();
const {
  createDriver,
  getDrivers,
  getDriver,
  updateDriver,
  deleteDriver
} = require('../controllers/driverController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('admin', 'fleet_manager', 'safety_officer'), getDrivers);
router.get('/:id', protect, authorize('admin', 'fleet_manager', 'safety_officer'), getDriver);
router.post('/', protect, authorize('admin', 'fleet_manager'), createDriver);
router.put('/:id', protect, authorize('admin', 'fleet_manager'), updateDriver);
router.delete('/:id', protect, authorize('admin', 'fleet_manager'), deleteDriver);

module.exports = router;
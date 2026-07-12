const express = require('express');
const router = express.Router();
const {
  getDrivers,
  getDriver,
  createDriver,
  updateDriver,
  deleteDriver
} = require('../controllers/driverController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// GET all drivers
router.get('/', authorize('admin', 'fleet_manager', 'dispatcher', 'safety_officer'), getDrivers);

// GET single driver
router.get('/:id', authorize('admin', 'fleet_manager', 'dispatcher', 'safety_officer'), getDriver);

// POST create new driver
router.post('/', authorize('admin', 'fleet_manager'), createDriver);

// PUT update driver
router.put('/:id', authorize('admin', 'fleet_manager'), updateDriver);

// DELETE driver
router.delete('/:id', authorize('admin', 'fleet_manager'), deleteDriver);

module.exports = router;

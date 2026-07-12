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

router.get('/', protect, authorize('admin', 'fleet_manager', 'safety_officer'), getDrivers);
router.get('/:id', protect, authorize('admin', 'fleet_manager', 'safety_officer'), getDriver);
router.post('/', protect, authorize('admin', 'fleet_manager'), createDriver);
router.put('/:id', protect, authorize('admin', 'fleet_manager'), updateDriver);
router.delete('/:id', protect, authorize('admin', 'fleet_manager'), deleteDriver);

module.exports = router;
// All routes are protected
router.use(protect);

// GET all drivers
router.get('/', getDrivers);

// GET single driver
router.get('/:id', getDriver);

// POST create new driver (admin only)
router.post('/', authorize('admin', 'fleet_manager'), createDriver);

// PUT update driver (admin only)
router.put('/:id', authorize('admin', 'fleet_manager'), updateDriver);

// DELETE driver (admin only)
router.delete('/:id', authorize('admin', 'fleet_manager'), deleteDriver);

module.exports = router;

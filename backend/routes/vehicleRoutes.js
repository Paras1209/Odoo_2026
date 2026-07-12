const express = require('express');
const router = express.Router();
const {
  createVehicle,
  getVehicles,
  getVehicle,
  updateVehicle,
  getVehicleOperationalCost,
  deleteVehicle
} = require('../controllers/vehicleController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('admin', 'fleet_manager', 'safety_officer'), getVehicles);
router.get('/:id', protect, authorize('admin', 'fleet_manager', 'safety_officer'), getVehicle);
router.get('/:id/operational-cost', protect, authorize('admin', 'fleet_manager', 'financial_analyst'), getVehicleOperationalCost);
router.post('/', protect, authorize('admin', 'fleet_manager'), createVehicle);
router.put('/:id', protect, authorize('admin', 'fleet_manager'), updateVehicle);
router.delete('/:id', protect, authorize('admin', 'fleet_manager'), deleteVehicle);

module.exports = router;
// All routes are protected
router.use(protect);

// GET all vehicles
router.get('/', getVehicles);

// GET single vehicle
router.get('/:id', getVehicle);

// POST create new vehicle (admin only)
router.post('/', authorize('admin', 'fleet_manager'), createVehicle);

// PUT update vehicle (admin only)
router.put('/:id', authorize('admin', 'fleet_manager'), updateVehicle);

// DELETE vehicle (admin only)
router.delete('/:id', authorize('admin', 'fleet_manager'), deleteVehicle);

module.exports = router;

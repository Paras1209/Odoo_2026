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

// All routes are protected
router.use(protect);

// GET all vehicles
router.get('/', authorize('admin', 'fleet_manager', 'dispatcher', 'safety_officer'), getVehicles);

// GET single vehicle
router.get('/:id', authorize('admin', 'fleet_manager', 'dispatcher', 'safety_officer'), getVehicle);

// GET vehicle operational cost
router.get('/:id/operational-cost', authorize('admin', 'fleet_manager', 'financial_analyst'), getVehicleOperationalCost);

// POST create new vehicle
router.post('/', authorize('admin', 'fleet_manager'), createVehicle);

// PUT update vehicle
router.put('/:id', authorize('admin', 'fleet_manager'), updateVehicle);

// DELETE vehicle
router.delete('/:id', authorize('admin', 'fleet_manager'), deleteVehicle);

module.exports = router;

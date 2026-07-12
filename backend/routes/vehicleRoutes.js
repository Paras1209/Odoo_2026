const express = require('express');
const router = express.Router();
const {
  getVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle
} = require('../controllers/vehicleController');
const { protect, authorize } = require('../middleware/auth');

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

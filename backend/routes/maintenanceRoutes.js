const express = require('express');
const router = express.Router();
const {
  createMaintenance,
  getMaintenanceRecords,
  getMaintenanceRecord,
  updateMaintenanceRecord,
  closeMaintenanceRecord,
  deleteMaintenanceRecord
} = require('../controllers/maintenanceController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('admin', 'fleet_manager', 'safety_officer'), getMaintenanceRecords);
router.get('/:id', protect, authorize('admin', 'fleet_manager', 'safety_officer'), getMaintenanceRecord);
router.post('/', protect, authorize('admin', 'fleet_manager'), createMaintenance);
router.put('/:id', protect, authorize('admin', 'fleet_manager'), updateMaintenanceRecord);
router.post('/:id/close', protect, authorize('admin', 'fleet_manager'), closeMaintenanceRecord);
router.delete('/:id', protect, authorize('admin', 'fleet_manager'), deleteMaintenanceRecord);

module.exports = router;
const express = require('express');
const router = express.Router();
const {
  createExpense,
  getExpenses,
  getExpense,
  updateExpense,
  deleteExpense
} = require('../controllers/expenseController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('admin', 'fleet_manager', 'financial_analyst'), getExpenses);
router.get('/:id', protect, authorize('admin', 'fleet_manager', 'financial_analyst'), getExpense);
router.post('/', protect, authorize('admin', 'fleet_manager', 'financial_analyst'), createExpense);
router.put('/:id', protect, authorize('admin', 'fleet_manager', 'financial_analyst'), updateExpense);
router.delete('/:id', protect, authorize('admin', 'fleet_manager', 'financial_analyst'), deleteExpense);

module.exports = router;
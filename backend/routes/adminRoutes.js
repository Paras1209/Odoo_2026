const express = require('express');
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getRoles,
  getPendingUsersCount
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

// Order matters: specific routes before parameterized routes
router.route('/users/pending/count').get(getPendingUsersCount);
router.route('/users').get(getUsers);
router.route('/users/:id').get(getUser).put(updateUser).delete(deleteUser);
router.route('/roles').get(getRoles);

module.exports = router;

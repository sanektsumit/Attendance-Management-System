const express = require('express');
const {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  updateLeaveStatus,
} = require('../controllers/leaveController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/', applyLeave);
router.get('/mine', getMyLeaves);
router.get('/', authorize('admin'), getAllLeaves);
router.put('/:id/status', authorize('admin'), updateLeaveStatus);

module.exports = router;

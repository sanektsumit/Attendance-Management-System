const express = require('express');
const {
  punchIn,
  punchOut,
  getTodayStatus,
  getMyAttendance,
  updateAttendancePhoto,
} = require('../controllers/attendanceController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/punch-in', punchIn);
router.put('/punch-out', punchOut);
router.put('/update-photo', updateAttendancePhoto);
router.get('/today', getTodayStatus);
router.get('/my-history', getMyAttendance);

module.exports = router;

const express = require('express');
const {
  getStats,
  getEmployees,
  updateEmployee,
  deleteEmployee,
  getAttendanceReport,
  getMapData,
  exportCSV,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/stats', getStats);
router.get('/employees', getEmployees);
router.put('/employees/:id', updateEmployee);
router.delete('/employees/:id', deleteEmployee);
router.get('/reports', getAttendanceReport);
router.get('/map-data', getMapData);
router.get('/export-csv', exportCSV);

module.exports = router;

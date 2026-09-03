const express = require('express');
const {
  login,
  registerEmployee,
  getMe,
  updateProfile,
  addDocument,
  deleteDocument,
  impersonateEmployee,
  requestOTP,
  verifyOTP,
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/login', login);
router.post('/register-employee', protect, authorize('admin'), registerEmployee);
router.post('/impersonate', protect, authorize('admin'), impersonateEmployee);
router.post('/send-otp', requestOTP);
router.post('/verify-otp', verifyOTP);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/documents', protect, addDocument);
router.delete('/documents/:docId', protect, deleteDocument);

module.exports = router;

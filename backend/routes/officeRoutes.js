const express = require('express');
const { getOfficeSettings, updateOfficeSettings } = require('../controllers/officeController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getOfficeSettings);
router.put('/', authorize('admin'), updateOfficeSettings);

module.exports = router;

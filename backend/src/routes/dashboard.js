const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const dc = require('../controllers/dashboardController');

router.get('/student', authenticate, authorize('student'), dc.getStudentDashboard);
router.get('/staff', authenticate, authorize('staff', 'manager'), dc.getStaffDashboard);
router.get('/manager', authenticate, authorize('manager'), dc.getManagerDashboard);

module.exports = router;

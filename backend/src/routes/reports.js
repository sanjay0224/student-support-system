const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.use(authorize('manager'));

router.get('/tickets', reportController.getTicketReport);
router.get('/categories', reportController.getCategoryReport);
router.get('/workload', reportController.getStaffWorkload);
router.get('/sla', reportController.getSLAReport);

module.exports = router;

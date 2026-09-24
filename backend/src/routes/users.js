const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/staff', authorize('staff', 'manager'), userController.getStaffList);
router.get('/all-staff', authorize('manager'), userController.getAllStaff);
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.post('/change-password', userController.changePassword);

module.exports = router;

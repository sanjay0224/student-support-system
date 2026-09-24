const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', notificationController.getNotifications);
// Support both PATCH (REST) and POST (frontend compat)
router.patch('/read-all', notificationController.markAllRead);
router.post('/read-all', notificationController.markAllRead);
router.patch('/:id/read', notificationController.markAsRead);
router.post('/:id/read', notificationController.markAsRead);

module.exports = router;

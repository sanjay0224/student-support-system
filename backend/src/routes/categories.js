const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const tc = require('../controllers/ticketController');

router.get('/', authenticate, tc.getCategories);

module.exports = router;

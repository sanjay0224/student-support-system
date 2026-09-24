const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const tc = require('../controllers/ticketController');

// Categories (public to authenticated users)
router.get('/categories', authenticate, tc.getCategories);

// Create ticket (student)
router.post('/', authenticate, authorize('student'), tc.createTicket);

// List tickets (role-based)
router.get('/', authenticate, tc.getTickets);

// Ticket detail
router.get('/:id', authenticate, tc.getTicketById);

// Reply (all roles)
router.post('/:id/reply', authenticate, tc.replyToTicket);

// Internal note (staff/manager only)
router.post('/:id/internal-note', authenticate, authorize('staff', 'manager'), tc.addInternalNote);

// Assign (staff/manager)
router.post('/:id/assign', authenticate, authorize('staff', 'manager'), tc.assignTicket);

// Status change (staff/manager)
router.post('/:id/status', authenticate, authorize('staff', 'manager'), tc.updateStatus);

// Priority change (staff/manager)
router.post('/:id/priority', authenticate, authorize('staff', 'manager'), tc.updatePriority);

// Resolve (staff/manager)
router.post('/:id/resolve', authenticate, authorize('staff', 'manager'), tc.resolveTicket);

// Reopen (staff/manager)
router.post('/:id/reopen', authenticate, authorize('staff', 'manager'), tc.reopenTicket);

// Escalate (staff/manager)
router.post('/:id/escalate', authenticate, authorize('staff', 'manager'), tc.escalateTicket);

module.exports = router;

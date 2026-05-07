const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { protect } = require('../middleware/auth');
const { isSupport, isAdmin } = require('../middleware/roles');
const { uploadMultipleDocuments } = require('../middleware/upload');

router.post('/', protect, uploadMultipleDocuments, ticketController.createTicket);
router.get('/', protect, ticketController.getTickets);
router.get('/:id', protect, ticketController.getTicket);
router.post('/:id/response', protect, uploadMultipleDocuments, ticketController.addResponse);
router.put('/:id/close', protect, ticketController.closeTicket);
router.post('/:id/rate', protect, ticketController.rateTicket);

// Support/Admin routes
router.get('/admin/all', protect, isSupport, ticketController.getAllTickets);
router.post('/:id/assign', protect, isSupport, ticketController.assignTicket);

module.exports = router;

const express = require('express');
const router = express.Router();
const invitationController = require('../controllers/invitationController');
const { protect, optionalAuth } = require('../middleware/auth');

router.post('/calculate', protect, invitationController.calculateCost);
router.post('/send', protect, invitationController.sendInvitations);
router.get('/', protect, invitationController.getInvitations);
router.get('/stats', protect, invitationController.getInvitationStats);
router.get('/link/:inviteCode', optionalAuth, invitationController.handleInviteLink);
router.post('/complete', protect, invitationController.completeInvitation);

module.exports = router;

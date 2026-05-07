const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const chatController = require('../controllers/chatController');

// Backward-compatible alias for the project detail API contract.
// Internally this project uses Chat as the conversation entity.
router.post('/direct', protect, chatController.createOrGetDirectConversation);

module.exports = router;

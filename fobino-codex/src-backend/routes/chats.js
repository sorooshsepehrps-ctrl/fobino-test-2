const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const Chat = require('../models/Chat');
const { protect } = require('../middleware/auth');
const { uploadChatAttachment } = require('../middleware/upload');
const { messageLimiter } = require('../middleware/rateLimit');
const { validate } = require('../middleware/validation');
const { chatIdValidator, postIdValidator } = require('../validators/chatValidator');

// Get all user chats
router.get('/', protect, chatController.getChats);
router.post('/user', protect, chatController.createUserChat);
router.post('/direct', protect, chatController.createOrGetDirectConversation);
// Add this to your chat routes temporarily:
router.get('/debug/schema', (req, res) => {
  const schemaPaths = {};
  
  Object.keys(Chat.schema.paths).forEach(path => {
    schemaPaths[path] = {
      type: Chat.schema.paths[path].instance,
      isRequired: Chat.schema.paths[path].isRequired,
      defaultValue: Chat.schema.paths[path].defaultValue
    };
  });
  
  res.json({
    stats_lastMessage: Chat.schema.path('stats.lastMessage'),
    stats_lastMessage_type: Chat.schema.path('stats.lastMessage').instance,
    stats_lastMessage_content: Chat.schema.path('stats.lastMessage.content'),
    allPaths: schemaPaths
  });
});
// Create new chat (post-based)
router.post('/', protect, chatController.createChat);

// Get chats for a specific post
router.get('/post/:postId', protect, postIdValidator, validate, chatController.getPostChats);

// Check if user can chat with post owner
router.get('/post/:postId/can-chat', protect, postIdValidator, validate, chatController.checkChatEligibility);

// Quick chat creation (simplified)
router.post('/post/:postId/quick-chat', protect, postIdValidator, validate, chatController.createQuickChat);

// Single chat operations
router.get('/:id', protect, chatIdValidator, validate, chatController.getChat);
router.get('/:id/messages', protect, chatIdValidator, validate, chatController.getMessages);
router.post('/:id/messages', protect, chatIdValidator, validate, messageLimiter, chatController.sendMessage);
router.post('/:id/attachments', protect, chatIdValidator, validate, uploadChatAttachment, chatController.uploadAttachment);
router.put('/:id/close', protect, chatIdValidator, validate, chatController.closeChat);
router.post('/:id/read', protect, chatIdValidator, validate, chatController.markAsRead);
router.post('/:id/typing', protect, chatIdValidator, validate, chatController.setTyping);

module.exports = router;



// const express = require('express');
// const router = express.Router();
// const chatController = require('../controllers/chatController');
// const { protect } = require('../middleware/auth');
// const { uploadChatAttachment } = require('../middleware/upload');
// const { messageLimiter } = require('../middleware/rateLimit');

// router.get('/', protect, chatController.getChats);
// router.post('/', protect, chatController.createChat);
// router.get('/:id', protect, chatController.getChat);
// router.get('/:id/messages', protect, chatController.getMessages);
// router.post('/:id/messages', protect, messageLimiter, chatController.sendMessage);
// router.post('/:id/attachments', protect, uploadChatAttachment, chatController.uploadAttachment);
// router.put('/:id/close', protect, chatController.closeChat);
// router.post('/:id/read', protect, chatController.markAsRead);
// router.post('/:id/typing', protect, chatController.setTyping);

// module.exports = router;

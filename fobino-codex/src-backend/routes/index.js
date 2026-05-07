const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth'));
router.use('/users', require('./users'));
router.use('/posts', require('./posts'));
router.use('/categories', require('./categories'));
router.use('/chats', require('./chats'));
router.use('/conversations', require('./conversations'));
router.use('/offers', require('./offers'));
router.use('/deals', require('./deals'));
router.use('/subscriptions', require('./subscriptions'));
router.use('/wallet', require('./wallet'));
router.use('/disputes', require('./disputes'));
router.use('/tickets', require('./tickets'));
router.use('/notifications', require('./notifications'));
router.use('/invitations', require('./invitations'));
router.use('/admin', require('./admin'));
router.use('/marketing-requests', require('./marketingRequests'));
router.use('/rfps', require('./rfps'));
router.use('/trade-contracts', require('./tradeContracts'));
router.use('/marketer', require('./marketer'));
router.use('/dropshipping', require('./dropshipping'));
router.use('/', require('./userPublicProfileRoutes'));
router.use('/', require('./userReviewRoutes'));

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;

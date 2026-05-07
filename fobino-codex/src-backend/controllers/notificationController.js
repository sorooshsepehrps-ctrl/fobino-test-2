const notificationService = require('../services/notificationService');
const { asyncHandler } = require('../middleware/errorHandler');
const response = require('../utils/responseFormatter');

exports.getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly = 'false' } = req.query;
  const result = await notificationService.getUserNotifications(req.user._id, { page: parseInt(page), limit: parseInt(limit), unreadOnly: unreadOnly === 'true' });
  return response.paginated(res, result.notifications, { ...result.pagination, unreadCount: result.unreadCount });
});

exports.getUnreadCount = asyncHandler(async (req, res) => {
  const count = await notificationService.getUnreadCount(req.user._id);
  return response.success(res, { unreadCount: count });
});

exports.markAsRead = asyncHandler(async (req, res) => {
  await notificationService.markAsRead(req.params.id, req.user._id);
  return response.success(res, null, 'خوانده شد');
});

exports.markAllAsRead = asyncHandler(async (req, res) => {
  await notificationService.markAllAsRead(req.user._id);
  return response.success(res, null, 'همه خوانده شدند');
});

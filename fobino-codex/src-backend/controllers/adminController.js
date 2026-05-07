const User = require('../models/User');
const Post = require('../models/Post');
const Deal = require('../models/Deal');
const Transaction = require('../models/Transaction');
const VerificationRequest = require('../models/VerificationRequest');
const AdminLog = require('../models/AdminLog');
const { asyncHandler } = require('../middleware/errorHandler');
const response = require('../utils/responseFormatter');
const { paginate, paginationResponse } = require('../utils/helpers');
const notificationService = require('../services/notificationService');


const Wallet = require('../models/Wallet');

const ledgerService = require('../services/transactionLedgerService');


// تایید درخواست برداشت
exports.approveWithdrawal = asyncHandler(async (req, res) => {
  const { transactionId } = req.params;
  const { trackingCode } = req.body;

  const transaction = await Transaction.findOne({
    _id: transactionId,
    type: 'withdrawal',
    flow: 'withdraw_request',
    status: 'pending',
  });

  if (!transaction) {
    return response.notFound(res, 'درخواست برداشت پیدا نشد یا قبلاً بررسی شده است');
  }

  const wallet = await Wallet.findById(transaction.wallet);
  if (!wallet) {
    return response.notFound(res, 'کیف پول مربوطه پیدا نشد');
  }

  const amount = Math.abs(transaction.grossAmount || transaction.amount || 0);
  wallet.assertSufficientBlockedBalance(amount, transaction.currency || 'IRR');

  // برداشت تایید شده => مبلغ از blocked خارج می‌شود و از سیستم خارج می‌شود
  await wallet.releaseBlockedAmount(amount, transaction.currency || 'IRR');

  const presented = await ledgerService.recordWithdrawalCompleted({
    transaction,
    wallet,
    processedBy: req.user._id,
    trackingCode,
    notes: 'برداشت توسط ادمین تایید شد و مبلغ از کیف پول کاربر خارج شد.',
  });

  return response.success(
    res,
    {
      transaction: presented,
      balances: wallet.getBalance(transaction.currency || 'IRR'),
    },
    'برداشت با موفقیت تایید شد'
  );
});

// رد درخواست برداشت
exports.rejectWithdrawal = asyncHandler(async (req, res) => {
  const { transactionId } = req.params;
  const { reason } = req.body;

  const transaction = await Transaction.findOne({
    _id: transactionId,
    type: 'withdrawal',
    flow: 'withdraw_request',
    status: 'pending',
  });

  if (!transaction) {
    return response.notFound(res, 'درخواست برداشت پیدا نشد یا قبلاً بررسی شده است');
  }

  const wallet = await Wallet.findById(transaction.wallet);
  if (!wallet) {
    return response.notFound(res, 'کیف پول مربوطه پیدا نشد');
  }

  const amount = Math.abs(transaction.grossAmount || transaction.amount || 0);
  wallet.assertSufficientBlockedBalance(amount, transaction.currency || 'IRR');

  // برداشت رد شده => blocked به available برمی‌گردد
  await wallet.unblockAmount(amount, transaction.currency || 'IRR');

  const presented = await ledgerService.recordWithdrawalRejected({
    transaction,
    wallet,
    processedBy: req.user._id,
    rejectionReason: reason || 'درخواست برداشت توسط ادمین رد شد و مبلغ به کیف پول برگشت.',
  });

  return response.success(
    res,
    {
      transaction: presented,
      balances: wallet.getBalance(transaction.currency || 'IRR'),
    },
    'درخواست برداشت رد شد'
  );
});


// Users
exports.getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, level, role, search } = req.query;
  const query = {};
  if (status) query.status = status;
  if (level) query.level = parseInt(level);
  if (role) query.roles = role;
  if (search) {
    query.$or = [
      { phone: { $regex: search, $options: 'i' } },
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } }
    ];
  }
  const total = await User.countDocuments(query);
  const users = await User.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit)).select('-password -refreshToken');
  return response.paginated(res, users, paginationResponse(total, page, limit));
});

exports.getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password -refreshToken');
  if (!user) return response.notFound(res, 'کاربر یافت نشد');
  return response.success(res, { user });
});

exports.updateUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
  await AdminLog.log(req.user._id, 'user_updated', 'user', req.params.id, 'ویرایش کاربر', { changes: req.body, ip: req.ip });
  return response.success(res, { user }, 'کاربر به‌روزرسانی شد');
});

exports.banUser = asyncHandler(async (req, res) => {
  const { reason, duration } = req.body;
  const bannedUntil = duration ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000) : null;
  await User.findByIdAndUpdate(req.params.id, {
    status: 'banned',
    banInfo: { isBanned: true, reason, bannedUntil, bannedBy: req.user._id }
  });
  await AdminLog.log(req.user._id, 'user_banned', 'user', req.params.id, `مسدودسازی: ${reason}`, { ip: req.ip });
  return response.success(res, null, 'کاربر مسدود شد');
});

exports.unbanUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, {
    status: 'active',
    banInfo: { isBanned: false, reason: null, bannedUntil: null, bannedBy: null }
  });
  await AdminLog.log(req.user._id, 'user_unbanned', 'user', req.params.id, 'رفع مسدودیت', { ip: req.ip });
  return response.success(res, null, 'مسدودیت برداشته شد');
});

// Verification
exports.getVerificationRequests = asyncHandler(async (req, res) => {
  const result = await VerificationRequest.getPendingRequests(req.query);
  return response.paginated(res, result.requests, result.pagination);
});

exports.approveVerification = asyncHandler(async (req, res) => {
  const request = await VerificationRequest.findById(req.params.id);
  if (!request) return response.notFound(res, 'درخواست یافت نشد');
  await request.approve(req.user._id);
  // await notificationService.notifyVerificationApproved(request.user, request.targetLevel);
  await AdminLog.log(req.user._id, 'user_verified', 'user', request.user, `تایید سطح ${request.targetLevel}`, { ip: req.ip });
  return response.success(res, { request }, 'احراز هویت تایید شد');
});

exports.rejectVerification = asyncHandler(async (req, res) => {
  const { reason, details } = req.body;
  const request = await VerificationRequest.findById(req.params.id);
  if (!request) return response.notFound(res, 'درخواست یافت نشد');
  await request.reject(req.user._id, reason, details);
  // await notificationService.notifyVerificationRejected(request.user, reason);
  await AdminLog.log(req.user._id, 'user_rejected', 'user', request.user, `رد احراز: ${reason}`, { ip: req.ip });
  return response.success(res, { request }, 'احراز هویت رد شد');
});

// Posts
exports.getPosts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, type } = req.query;
  const query = {};
  if (status) query.status = status;
  if (type) query.type = type;
  const total = await Post.countDocuments(query);
  const posts = await Post.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit)).populate('user', 'firstName lastName phone');
  return response.paginated(res, posts, paginationResponse(total, page, limit));
});

exports.updatePost = asyncHandler(async (req, res) => {
  const post = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true });
  await AdminLog.log(req.user._id, 'post_updated', 'post', req.params.id, 'ویرایش آگهی', { changes: req.body, ip: req.ip });
  return response.success(res, { post }, 'آگهی به‌روزرسانی شد');
});

exports.deletePost = asyncHandler(async (req, res) => {
  await Post.findByIdAndUpdate(req.params.id, { status: 'deleted' });
  await AdminLog.log(req.user._id, 'post_deleted', 'post', req.params.id, 'حذف آگهی', { ip: req.ip });
  return response.success(res, null, 'آگهی حذف شد');
});

// Financial
exports.getWithdrawals = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status = 'pending' } = req.query;
  const query = { type: 'withdrawal', status };
  const total = await Transaction.countDocuments(query);
  const transactions = await Transaction.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit)).populate('user', 'firstName lastName phone');
  return response.paginated(res, transactions, paginationResponse(total, page, limit));
});

exports.processWithdrawal = asyncHandler(async (req, res) => {
  const { action, trackingCode, rejectionReason } = req.body;
  const transaction = await Transaction.findById(req.params.id);
  if (!transaction || transaction.type !== 'withdrawal') return response.notFound(res, 'تراکنش یافت نشد');
  
  if (action === 'approve') {
    transaction.status = 'completed';
    transaction.withdrawal.processedAt = new Date();
    transaction.withdrawal.processedBy = req.user._id;
    transaction.withdrawal.trackingCode = trackingCode;
    transaction.completedAt = new Date();
    const Wallet = require('../models/Wallet');
    const wallet = await Wallet.findById(transaction.wallet);
    await wallet.releaseBlockedAmount(Math.abs(transaction.amount), 'IRR');
  } else {
    transaction.status = 'failed';
    transaction.withdrawal.rejectionReason = rejectionReason;
    const Wallet = require('../models/Wallet');
    const wallet = await Wallet.findById(transaction.wallet);
    await wallet.unblockAmount(Math.abs(transaction.amount), 'IRR');
  }
  await transaction.save();
  await AdminLog.log(req.user._id, action === 'approve' ? 'withdrawal_approved' : 'withdrawal_rejected', 'transaction', req.params.id, action === 'approve' ? 'تایید برداشت' : 'رد برداشت', { ip: req.ip });
  return response.success(res, { transaction }, action === 'approve' ? 'برداشت تایید شد' : 'برداشت رد شد');
});

// Dashboard Stats
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const [usersCount, postsCount, dealsCount, pendingVerifications] = await Promise.all([
    User.countDocuments(),
    Post.countDocuments({ status: 'active' }),
    Deal.countDocuments(),
    VerificationRequest.countDocuments({ status: 'pending' })
  ]);
  return response.success(res, { usersCount, postsCount, dealsCount, pendingVerifications });
});

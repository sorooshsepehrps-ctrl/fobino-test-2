const User = require('../models/User');
const asyncHandler = require('express-async-handler');

exports.requestMarketerVerification = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'کاربر یافت نشد'
    });
  }

  if (user.level < 5) {
    return res.status(403).json({
      success: false,
      message: 'برای درخواست تایید بازاریاب باید سطح ۵ داشته باشید'
    });
  }

  if (user.isMarketer) {
    return res.status(400).json({
      success: false,
      message: 'شما در حال حاضر بازاریاب هستید'
    });
  }

  if (user.marketerVerification.status === 'pending') {
    return res.status(400).json({
      success: false,
      message: 'درخواست شما در حال بررسی است'
    });
  }

  user.marketerVerification = {
    status: 'pending',
    requestedAt: new Date()
  };

  await user.save();

  res.status(200).json({
    success: true,
    message: 'درخواست تایید بازاریاب با موفقیت ثبت شد'
  });
});

exports.approveMarketerVerification = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'کاربر یافت نشد'
    });
  }

  if (user.marketerVerification.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: 'درخواست در وضعیت مناسبی نیست'
    });
  }

  user.isMarketer = true;
  user.marketerVerification = {
    status: 'approved',
    approvedAt: new Date(),
    verifiedBy: req.user.id
  };

  await user.save();

  res.status(200).json({
    success: true,
    message: 'کاربر به عنوان بازاریاب تایید شد',
    data: user
  });
});

exports.rejectMarketerVerification = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { reason } = req.body;

  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'کاربر یافت نشد'
    });
  }

  if (user.marketerVerification.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: 'درخواست در وضعیت مناسبی نیست'
    });
  }

  user.marketerVerification = {
    status: 'rejected',
    rejectedAt: new Date(),
    rejectionReason: reason,
    verifiedBy: req.user.id
  };

  await user.save();

  res.status(200).json({
    success: true,
    message: 'درخواست بازاریاب رد شد'
  });
});

exports.getPendingMarketerRequests = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  
  const skip = (page - 1) * limit;
  
  const users = await User.find({
    'marketerVerification.status': 'pending'
  })
    .select('firstName lastName phone email level profileImage marketerVerification createdAt')
    .sort({ 'marketerVerification.requestedAt': -1 })
    .skip(skip)
    .limit(parseInt(limit));
  
  const total = await User.countDocuments({
    'marketerVerification.status': 'pending'
  });
  
  res.status(200).json({
    success: true,
    data: users,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

exports.getMyMarketerStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)
    .select('isMarketer marketerVerification level');

  res.status(200).json({
    success: true,
    data: {
      isMarketer: user.isMarketer,
      verification: user.marketerVerification,
      level: user.level,
      canRequest: user.level >= 5 && !user.isMarketer && user.marketerVerification.status !== 'pending'
    }
  });
});

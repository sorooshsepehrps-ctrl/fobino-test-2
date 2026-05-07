const VisitCard = require('../models/VisitCard');
const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.createVisitCard = catchAsync(async (req, res, next) => {
  const existingCard = await VisitCard.findOne({ user: req.user._id });
  
  if (existingCard) {
    return next(new AppError('شما قبلاً کارت ویزیت ایجاد کرده‌اید', 400));
  }
  
  const user = await User.findById(req.user._id);
  if (!user.verificationLevel || user.verificationLevel !== 'final') {
    return next(new AppError('برای ایجاد کارت ویزیت باید تایید نهایی را داشته باشید', 403));
  }
  
  const visitCard = await VisitCard.create({
    user: req.user._id,
    businessName: req.body.businessName,
    logo: req.body.logo,
    socialMedia: req.body.socialMedia,
    description: req.body.description,
    status: 'pending'
  });
  
  res.status(201).json({
    status: 'success',
    data: visitCard
  });
});

exports.getMyVisitCard = catchAsync(async (req, res, next) => {
  const visitCard = await VisitCard.findOne({ user: req.user._id })
    .populate('user', 'firstName lastName email phone');
  
  if (!visitCard) {
    return next(new AppError('کارت ویزیت یافت نشد', 404));
  }
  
  res.json({
    status: 'success',
    data: visitCard
  });
});

exports.getVisitCardByCode = catchAsync(async (req, res, next) => {
  const visitCard = await VisitCard.findOne({ cardCode: req.params.code })
    .populate('user', 'firstName lastName');
  
  if (!visitCard) {
    return next(new AppError('کارت ویزیت یافت نشد', 404));
  }
  
  if (visitCard.status !== 'active') {
    return next(new AppError('این کارت ویزیت فعال نیست', 400));
  }
  
  await visitCard.incrementViews();
  
  res.json({
    status: 'success',
    data: visitCard
  });
});

exports.updateVisitCard = catchAsync(async (req, res, next) => {
  const visitCard = await VisitCard.findOne({ user: req.user._id });
  
  if (!visitCard) {
    return next(new AppError('کارت ویزیت یافت نشد', 404));
  }
  
  const allowedUpdates = ['businessName', 'logo', 'description', 'socialMedia'];
  const updates = {};
  
  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });
  
  Object.assign(visitCard, updates);
  
  if (req.body.socialMedia) {
    visitCard.socialMedia.forEach(sm => {
      sm.verified = false;
      sm.verifiedAt = null;
      sm.verifiedBy = null;
    });
    visitCard.status = 'pending';
  }
  
  await visitCard.save();
  
  res.json({
    status: 'success',
    data: visitCard
  });
});

exports.getAllPendingVisitCards = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 20 } = req.query;
  
  const total = await VisitCard.countDocuments({ status: 'pending' });
  const visitCards = await VisitCard.find({ status: 'pending' })
    .populate('user', 'firstName lastName email phone')
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(parseInt(limit));
  
  res.json({
    status: 'success',
    data: visitCards,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      limit: parseInt(limit)
    }
  });
});

exports.verifySocialMedia = catchAsync(async (req, res, next) => {
  const { platformIndex } = req.body;
  const visitCard = await VisitCard.findById(req.params.id);
  
  if (!visitCard) {
    return next(new AppError('کارت ویزیت یافت نشد', 404));
  }
  
  await visitCard.verifySocialMedia(platformIndex, req.user._id);
  
  const allVerified = visitCard.socialMedia.every(sm => sm.verified);
  if (allVerified) {
    visitCard.status = 'active';
    await visitCard.save();
    
    await User.findByIdAndUpdate(visitCard.user, {
      isDropshipper: true,
      dropshipperVerifiedAt: new Date()
    });
  }
  
  res.json({
    status: 'success',
    data: visitCard
  });
});

exports.rejectVisitCard = catchAsync(async (req, res, next) => {
  const { reason } = req.body;
  const visitCard = await VisitCard.findById(req.params.id);
  
  if (!visitCard) {
    return next(new AppError('کارت ویزیت یافت نشد', 404));
  }
  
  visitCard.status = 'rejected';
  visitCard.rejectionReason = reason;
  await visitCard.save();
  
  res.json({
    status: 'success',
    data: visitCard
  });
});

exports.trackClick = catchAsync(async (req, res, next) => {
  const visitCard = await VisitCard.findOne({ cardCode: req.params.code });
  
  if (!visitCard) {
    return next(new AppError('کارت ویزیت یافت نشد', 404));
  }
  
  await visitCard.incrementClicks();
  
  res.json({
    status: 'success',
    message: 'کلیک ثبت شد'
  });
});

exports.trackShare = catchAsync(async (req, res, next) => {
  const visitCard = await VisitCard.findOne({ user: req.user._id });
  
  if (!visitCard) {
    return next(new AppError('کارت ویزیت یافت نشد', 404));
  }
  
  await visitCard.incrementShares();
  
  res.json({
    status: 'success',
    message: 'اشتراک‌گذاری ثبت شد'
  });
});

const ProviderRating = require('../models/ProviderRating');
const DropshippingRFP = require('../models/DropshippingRFP');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.createRating = catchAsync(async (req, res, next) => {
  const rfp = await DropshippingRFP.findById(req.body.rfp);
  
  if (!rfp) {
    return next(new AppError('درخواست یافت نشد', 404));
  }
  
  if (rfp.dropshipper.toString() !== req.user._id.toString()) {
    return next(new AppError('شما اجازه ثبت نظر برای این درخواست را ندارید', 403));
  }
  
  if (rfp.status !== 'completed') {
    return next(new AppError('فقط می‌توانید برای سفارش‌های تکمیل شده نظر ثبت کنید', 400));
  }
  
  const existingRating = await ProviderRating.findOne({ rfp: req.body.rfp });
  if (existingRating) {
    return next(new AppError('شما قبلاً برای این سفارش نظر ثبت کرده‌اید', 400));
  }
  
  const rating = await ProviderRating.create({
    rfp: req.body.rfp,
    provider: rfp.provider,
    dropshipper: req.user._id,
    product: rfp.product,
    rating: req.body.rating,
    productQuality: req.body.productQuality,
    packaging: req.body.packaging,
    deliverySpeed: req.body.deliverySpeed,
    communication: req.body.communication,
    comment: req.body.comment,
    images: req.body.images
  });
  
  await rating.populate([
    { path: 'provider', select: 'firstName lastName businessName' },
    { path: 'dropshipper', select: 'firstName lastName' },
    { path: 'product', select: 'productName' }
  ]);
  
  res.status(201).json({
    status: 'success',
    data: rating
  });
});

exports.getProviderRatings = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 20 } = req.query;
  const providerId = req.params.providerId || req.user._id;
  
  const query = { provider: providerId, status: 'published' };
  
  const total = await ProviderRating.countDocuments(query);
  const ratings = await ProviderRating.find(query)
    .populate('dropshipper', 'firstName lastName')
    .populate('product', 'productName')
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(parseInt(limit));
  
  const stats = await ProviderRating.calculateProviderAverageRating(providerId);
  
  res.json({
    status: 'success',
    data: ratings,
    stats,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      limit: parseInt(limit)
    }
  });
});

exports.getMyRatings = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 20 } = req.query;
  
  const query = { dropshipper: req.user._id };
  
  const total = await ProviderRating.countDocuments(query);
  const ratings = await ProviderRating.find(query)
    .populate('provider', 'firstName lastName businessName')
    .populate('product', 'productName')
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(parseInt(limit));
  
  res.json({
    status: 'success',
    data: ratings,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      limit: parseInt(limit)
    }
  });
});

exports.updateRating = catchAsync(async (req, res, next) => {
  const rating = await ProviderRating.findById(req.params.id);
  
  if (!rating) {
    return next(new AppError('نظر یافت نشد', 404));
  }
  
  if (rating.dropshipper.toString() !== req.user._id.toString()) {
    return next(new AppError('شما اجازه ویرایش این نظر را ندارید', 403));
  }
  
  const allowedUpdates = ['rating', 'productQuality', 'packaging', 'deliverySpeed', 'communication', 'comment', 'images'];
  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      rating[field] = req.body[field];
    }
  });
  
  await rating.save();
  
  res.json({
    status: 'success',
    data: rating
  });
});

exports.respondToRating = catchAsync(async (req, res, next) => {
  const rating = await ProviderRating.findById(req.params.id);
  
  if (!rating) {
    return next(new AppError('نظر یافت نشد', 404));
  }
  
  if (rating.provider.toString() !== req.user._id.toString()) {
    return next(new AppError('شما اجازه پاسخ به این نظر را ندارید', 403));
  }
  
  rating.providerResponse = {
    comment: req.body.comment,
    respondedAt: new Date()
  };
  
  await rating.save();
  
  res.json({
    status: 'success',
    data: rating
  });
});

exports.markHelpful = catchAsync(async (req, res, next) => {
  const { helpful } = req.body;
  const rating = await ProviderRating.findById(req.params.id);
  
  if (!rating) {
    return next(new AppError('نظر یافت نشد', 404));
  }
  
  if (helpful) {
    rating.helpful += 1;
  } else {
    rating.notHelpful += 1;
  }
  
  await rating.save();
  
  res.json({
    status: 'success',
    data: rating
  });
});

exports.deleteRating = catchAsync(async (req, res, next) => {
  const rating = await ProviderRating.findById(req.params.id);
  
  if (!rating) {
    return next(new AppError('نظر یافت نشد', 404));
  }
  
  if (rating.dropshipper.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('شما اجازه حذف این نظر را ندارید', 403));
  }
  
  await rating.deleteOne();
  
  res.json({
    status: 'success',
    message: 'نظر با موفقیت حذف شد'
  });
});


const DropshippingRating = require('../models/DropshippingRating');
const DropshippingRFP = require('../models/DropshippingRFP');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.createRating = catchAsync(async (req, res, next) => {
  const { rfp: rfpId, stars } = req.body;

  const rfp = await DropshippingRFP.findById(rfpId);
  if (!rfp) {
    return next(new AppError('RFP یافت نشد', 404));
  }

  if (rfp.status !== 'completed') {
    return next(new AppError('فقط برای RFP تکمیل‌شده می‌توان امتیاز ثبت کرد', 400));
  }

  const isProvider = rfp.provider.toString() === req.user._id.toString();
  const isDropshipper = rfp.dropshipper.toString() === req.user._id.toString();

  if (!isProvider && !isDropshipper) {
    return next(new AppError('شما به این RFP دسترسی ندارید', 403));
  }

  const fromRole = isProvider ? 'provider' : 'dropshipper';
  const toRole = isProvider ? 'dropshipper' : 'provider';
  const toUser = isProvider ? rfp.dropshipper : rfp.provider;

  if (!rfp.canBeRatedBy(fromRole)) {
    return next(new AppError('امتیاز این RFP قبلاً ثبت شده است', 400));
  }

  const existing = await DropshippingRating.findOne({
    rfp: rfp._id,
    fromUser: req.user._id,
    toUser
  });

  if (existing) {
    return next(new AppError('امتیاز این RFP قبلاً ثبت شده است', 400));
  }

  const rating = await DropshippingRating.create({
    rfp: rfp._id,
    fromUser: req.user._id,
    toUser,
    fromRole,
    toRole,
    product: rfp.product,
    stars
  });

  if (fromRole === 'provider') {
    rfp.ratings.providerSubmitted = true;
    rfp.ratings.providerRatingId = rating._id;
  } else {
    rfp.ratings.dropshipperSubmitted = true;
    rfp.ratings.dropshipperRatingId = rating._id;
  }

  rfp.addTimeline('rating_submitted', fromRole, { stars, ratingId: rating._id });
  await rfp.save();

  res.status(201).json({
    status: 'success',
    data: rating
  });
});

exports.getMyReceivedRatingStats = catchAsync(async (req, res) => {
  const role = req.query.role === 'dropshipper' ? 'dropshipper' : 'provider';
  const stats = await DropshippingRating.calculateAverageForUser(req.user._id, role);

  res.json({
    status: 'success',
    data: stats
  });
});

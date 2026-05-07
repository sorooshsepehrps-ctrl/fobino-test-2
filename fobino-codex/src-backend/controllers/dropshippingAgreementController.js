
const DropshippingAgreement = require('../models/DropshippingAgreement');
const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.createAgreement = catchAsync(async (req, res, next) => {
  const existingAgreement = await DropshippingAgreement.findOne({
    user: req.user._id,
    role: req.body.role
  });

  if (existingAgreement) {
    return next(new AppError('شما قبلاً برای این نقش قرارداد دراپ‌شیپینگ ایجاد کرده‌اید', 400));
  }

  const agreement = await DropshippingAgreement.create({
    user: req.user._id,
    role: req.body.role,
    termsAccepted: req.body.termsAccepted,
    acceptedAt: req.body.termsAccepted ? new Date() : null,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    businessInfo: req.body.businessInfo,
    bankInfo: req.body.bankInfo,
    identityVerification: {
      nationalIdCard: req.body.nationalIdCard,
      businessLicense: req.body.businessLicense
    }
  });

  res.status(201).json({
    status: 'success',
    data: agreement
  });
});

exports.getMyAgreement = catchAsync(async (req, res, next) => {
  const { role } = req.query;
  const query = { user: req.user._id };
  if (role) query.role = role;

  const agreements = await DropshippingAgreement.find(query).sort('-createdAt');

  if (!agreements.length) {
    return next(new AppError('قرارداد یافت نشد', 404));
  }

  res.json({
    status: 'success',
    data: role ? agreements[0] : agreements
  });
});

exports.updateAgreement = catchAsync(async (req, res, next) => {
  const { role } = req.body;
  const agreement = await DropshippingAgreement.findOne({
    user: req.user._id,
    role
  });

  if (!agreement) {
    return next(new AppError('قرارداد یافت نشد', 404));
  }

  if (agreement.status === 'active') {
    return next(new AppError('نمی‌توانید قرارداد فعال را ویرایش کنید', 400));
  }

  const allowedUpdates = ['businessInfo', 'bankInfo'];
  allowedUpdates.forEach((field) => {
    if (req.body[field]) {
      agreement[field] = req.body[field];
    }
  });

  if (req.body.nationalIdCard) {
    agreement.identityVerification.nationalIdCard = req.body.nationalIdCard;
    agreement.identityVerification.nationalIdCard.verified = false;
  }

  if (req.body.businessLicense) {
    agreement.identityVerification.businessLicense = req.body.businessLicense;
    agreement.identityVerification.businessLicense.verified = false;
  }

  await agreement.save();

  res.json({
    status: 'success',
    data: agreement
  });
});

exports.getAllPendingAgreements = catchAsync(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const total = await DropshippingAgreement.countDocuments({ status: 'pending' });
  const agreements = await DropshippingAgreement.find({ status: 'pending' })
    .populate('user', 'firstName lastName email phone')
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(parseInt(limit, 10));

  res.json({
    status: 'success',
    data: agreements,
    pagination: {
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / limit),
      limit: parseInt(limit, 10)
    }
  });
});

exports.approveAgreement = catchAsync(async (req, res, next) => {
  const agreement = await DropshippingAgreement.findById(req.params.id);

  if (!agreement) {
    return next(new AppError('قرارداد یافت نشد', 404));
  }

  await agreement.activate(req.user._id);

  const updateData = {};
  if (agreement.role === 'provider') {
    updateData.isProvider = true;
    updateData.providerVerifiedAt = new Date();
  } else if (agreement.role === 'dropshipper') {
    updateData.isDropshipper = true;
    updateData.dropshipperVerifiedAt = new Date();
  }

  await User.findByIdAndUpdate(agreement.user, updateData, { new: true });

  res.json({
    status: 'success',
    data: agreement
  });
});

exports.rejectAgreement = catchAsync(async (req, res, next) => {
  const { reason } = req.body;
  const agreement = await DropshippingAgreement.findById(req.params.id);

  if (!agreement) {
    return next(new AppError('قرارداد یافت نشد', 404));
  }

  agreement.status = 'pending';
  agreement.notes.push({
    addedBy: req.user._id,
    note: `رد شده: ${reason}`,
    timestamp: new Date()
  });

  await agreement.save();

  res.json({
    status: 'success',
    data: agreement
  });
});

exports.suspendAgreement = catchAsync(async (req, res, next) => {
  const { reason } = req.body;
  const agreement = await DropshippingAgreement.findById(req.params.id);

  if (!agreement) {
    return next(new AppError('قرارداد یافت نشد', 404));
  }

  await agreement.suspend(reason || 'تعلیق توسط ادمین');

  res.json({
    status: 'success',
    data: agreement
  });
});

exports.unsuspendAgreement = catchAsync(async (req, res, next) => {
  const agreement = await DropshippingAgreement.findById(req.params.id);

  if (!agreement) {
    return next(new AppError('قرارداد یافت نشد', 404));
  }

  agreement.status = 'active';
  agreement.suspensionReason = undefined;
  agreement.suspendedAt = undefined;
  agreement.notes.push({
    addedBy: req.user._id,
    note: `رفع تعلیق: ${req.body?.reason || 'بدون توضیح'}`,
    timestamp: new Date()
  });

  await agreement.save();

  res.json({
    status: 'success',
    data: agreement
  });
});

exports.terminateAgreement = catchAsync(async (req, res, next) => {
  const { reason } = req.body;
  const agreement = await DropshippingAgreement.findById(req.params.id);

  if (!agreement) {
    return next(new AppError('قرارداد یافت نشد', 404));
  }

  await agreement.terminate(reason);

  res.json({
    status: 'success',
    data: agreement
  });
});

exports.addNote = catchAsync(async (req, res, next) => {
  const { note } = req.body;
  const agreement = await DropshippingAgreement.findById(req.params.id);

  if (!agreement) {
    return next(new AppError('قرارداد یافت نشد', 404));
  }

  agreement.notes.push({
    addedBy: req.user._id,
    note,
    timestamp: new Date()
  });

  await agreement.save();

  res.json({
    status: 'success',
    data: agreement
  });
});
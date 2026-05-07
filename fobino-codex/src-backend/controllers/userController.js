const User = require('../models/User');
const VerificationRequest = require('../models/VerificationRequest');
const Subscription = require('../models/Subscription');
const Wallet = require('../models/Wallet');
const { asyncHandler } = require('../middleware/errorHandler');
const response = require('../utils/responseFormatter');
const fileUploadService = require('../services/fileUploadService');
const { paginate, paginationResponse } = require('../utils/helpers');

const VERIFICATION_REQUIREMENTS = {
  1: {
    title: 'تکمیل پروفایل پایه',
    description: 'نام، نام خانوادگی و استان/شهر خود را تکمیل کنید.',
    documents: [],
    fields: ['firstName', 'lastName', 'province', 'city'],
  },
  2: {
    title: 'احراز هویت کاربری',
    description: 'کد ملی و تصاویر هویتی برای بررسی کارشناسان ارسال می‌شود.',
    documents: ['nationalCard', 'selfieWithCard'],
    fields: ['nationalCode', 'birthDate', 'fatherName'],
  },
  3: {
    title: 'احراز تولیدکنندگی / کسب‌وکار',
    description: 'اطلاعات کسب‌وکار و مجوز فعالیت برای افزایش اعتماد عمومی بررسی می‌شود.',
    documents: ['businessLicense', 'catalog'],
    optionalDocuments: ['businessPhotos'],
    fields: ['businessName', 'businessType', 'businessAddress', 'employeeCount', 'yearEstablished'],
  },
  4: {
    title: 'تأیید بانکی',
    description: 'اطلاعات بانکی مالک حساب برای تسویه امن بررسی می‌شود.',
    documents: ['bankCardImage'],
    fields: ['shaba', 'bankName', 'cardNumber', 'accountHolder'],
  },
};

const safeVerificationRequest = (request) => {
  if (!request) return null;
  const raw = typeof request.toObject === 'function' ? request.toObject() : request;
  return {
    id: raw._id,
    targetLevel: raw.targetLevel,
    currentLevel: raw.currentLevel,
    status: raw.status,
    documents: raw.documents || {},
    additionalInfo: raw.additionalInfo || {},
    rejectionReason: raw.rejectionReason || null,
    rejectionDetails: raw.rejectionDetails || null,
    resubmitCount: raw.resubmitCount || 0,
    reviewedAt: raw.reviewedAt || null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
};

const resolveNextVerificationLevel = (user) => {
  const current = Number(user?.level || 0);
  return Math.min(current + 1, 4);
};

const buildVerificationOverview = async (userId) => {
  const user = await User.findById(userId).select('-password -refreshToken');
  const requests = await VerificationRequest.find({ user: userId })
    .sort({ createdAt: -1 })
    .lean();

  const activeRequest = requests.find((item) => ['pending', 'in_review', 'requires_resubmit', 'rejected'].includes(item.status)) || null;
  const nextLevel = resolveNextVerificationLevel(user);

  return {
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      profileImage: user.profileImage,
      level: user.level || 0,
      levelStatus: user.levelStatus || 'none',
      verifications: user.verifications || {},
      identityVerificationStatus: user.identityVerificationStatus || 'none',
      producerVerificationStatus: user.producerVerificationStatus || 'none',
      profileCompletionPercent: user.profileCompletionPercent || user.profileCompletion || 0,
      location: user.location || {},
      publicProfile: user.publicProfile || {},
    },
    nextLevel,
    requirements: VERIFICATION_REQUIREMENTS,
    currentRequest: safeVerificationRequest(activeRequest),
    requests: requests.map(safeVerificationRequest),
  };
};

// @desc    Get user profile
// @route   GET /api/users/me
// @access  Private
exports.getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const subscription = await Subscription.findOne({
    user: req.user._id,
    status: 'active'
  });
  const wallet = await Wallet.getOrCreateWallet(req.user._id);

  return response.success(res, {
    user: user.toObject(),
    subscription,
    wallet: {
      balance: wallet.balances.IRR.available,
      blocked: wallet.balances.IRR.blocked
    }
  });
});

// @desc    Update user profile
// @route   PUT /api/users/me
// @access  Private
exports.updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = [
    'firstName', 'lastName', 'email', 'about', 'website',
    'location', 'settings', 'showPhoneToSellers', 'wantsCollaboration', 'sellerStatus'
  ];

  const updates = {};
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  // Handle nested location object
  if (req.body.province || req.body.city || req.body.address) {
    updates.location = {
      ...updates.location,
      province: req.body.province || req.body.location?.province,
      city: req.body.city || req.body.location?.city,
      address: req.body.address || req.body.location?.address,
    };
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    updates,
    { new: true, runValidators: true }
  );

  // Check if profile is complete enough for level 1
  if (user.level === 0 && user.firstName && user.lastName && user.location?.province) {
    user.level = 1;
    user.levelStatus = 'approved';
    await user.save();
  }

  return response.success(res, { user }, 'پروفایل با موفقیت به‌روزرسانی شد');
});

// @desc    Upload profile image
// @route   POST /api/users/me/profile-image
// @access  Private
exports.uploadProfileImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    return response.error(res, 'تصویر الزامی است', 400);
  }

  const result = await fileUploadService.uploadProfileImage(req.file);

  // Delete old image if exists
  if (req.user.profileImage) {
    // Extract publicId from URL and delete
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { profileImage: result.url },
    { new: true }
  );

  return response.success(res, { 
    profileImage: result.url,
    user 
  }, 'تصویر پروفایل با موفقیت آپلود شد');
});

// @desc    Get public profile
// @route   GET /api/users/:id/public
// @access  Public
exports.getPublicProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return response.notFound(res, 'کاربر یافت نشد');
  }

  return response.success(res, { 
    profile: user.getPublicProfile() 
  });
});

// @desc    Request level up
// @route   POST /api/users/level-up
// @access  Private
exports.requestLevelUp = asyncHandler(async (req, res) => {
  const { targetLevel } = req.body;
  const currentLevel = req.user.level;

  if (targetLevel <= currentLevel) {
    return response.error(res, 'سطح هدف باید بالاتر از سطح فعلی باشد', 400);
  }

  if (targetLevel > currentLevel + 1) {
    return response.error(res, 'باید مراحل را به ترتیب طی کنید', 400);
  }

  // Check for existing pending request
  const existingRequest = await VerificationRequest.findOne({
    user: req.user._id,
    targetLevel,
    status: { $in: ['pending', 'in_review'] }
  });

  if (existingRequest) {
    return response.error(res, 'درخواست قبلی شما در حال بررسی است', 400);
  }

  const verificationRequest = new VerificationRequest({
    user: req.user._id,
    targetLevel,
    currentLevel
  });

  await verificationRequest.save();

  // Update user level status
  await User.findByIdAndUpdate(req.user._id, {
    levelStatus: 'pending'
  });

  return response.created(res, { 
    requestId: verificationRequest._id 
  }, 'درخواست ارتقای سطح ثبت شد');
});

// @desc    Upload verification document
// @route   POST /api/users/upload-document
// @access  Private
exports.uploadDocument = asyncHandler(async (req, res) => {
  const docType = req.body.docType || req.body.documentType;

  if (!req.file) {
    return response.error(res, 'فایل الزامی است', 400);
  }

  const validDocTypes = [
    'nationalCard', 'birthCertificate', 'selfieWithCard',
    'businessLicense', 'businessPhotos', 'catalog', 'bankCardImage'
  ];

  if (!validDocTypes.includes(docType)) {
    return response.error(res, 'نوع سند نامعتبر است', 400);
  }

  const result = await fileUploadService.uploadVerificationDocument(
    req.file, req.user._id, docType
  );

  // Find or create verification request
  let verificationRequest = await VerificationRequest.findOne({
    user: req.user._id,
    ...(req.body.level || req.body.targetLevel ? { targetLevel: Number(req.body.level || req.body.targetLevel) } : {}),
    status: { $in: ['pending', 'in_review', 'requires_resubmit', 'rejected'] }
  });

  if (!verificationRequest) {
    return response.error(res, 'ابتدا درخواست ارتقای سطح ثبت کنید', 400);
  }

  // Update document in request
  if (docType === 'businessPhotos') {
    if (!verificationRequest.documents.businessPhotos) {
      verificationRequest.documents.businessPhotos = [];
    }
    verificationRequest.documents.businessPhotos.push({
      url: result.url,
      publicId: result.publicId,
      uploadedAt: new Date()
    });
  } else {
    verificationRequest.documents[docType] = {
      url: result.url,
      publicId: result.publicId,
      uploadedAt: new Date()
    };
  }

  if (verificationRequest.status === 'rejected') {
    verificationRequest.status = 'requires_resubmit';
  }

  await verificationRequest.save();

  return response.success(res, {
    request: safeVerificationRequest(verificationRequest),
    url: result.url,
    docType
  }, 'سند با موفقیت آپلود شد');
});

// @desc    Submit additional info for verification
// @route   POST /api/users/verification-info
// @access  Private
exports.submitVerificationInfo = asyncHandler(async (req, res) => {
  let verificationRequest = await VerificationRequest.findOne({
    user: req.user._id,
    ...(req.body.level || req.body.targetLevel ? { targetLevel: Number(req.body.level || req.body.targetLevel) } : {}),
    status: { $in: ['pending', 'in_review', 'requires_resubmit', 'rejected'] }
  });

  if (!verificationRequest) {
    const targetLevel = Number(req.body.level || req.body.targetLevel || resolveNextVerificationLevel(req.user));
    verificationRequest = await VerificationRequest.create({
      user: req.user._id,
      targetLevel,
      currentLevel: req.user.level || 0,
      status: 'requires_resubmit'
    });
  }

  // Update additional info
  const allowedFields = [
    'nationalCode', 'birthDate', 'fatherName',
    'businessName', 'businessType', 'businessAddress', 'employeeCount', 'yearEstablished',
    'shaba', 'bankName', 'cardNumber', 'accountHolder'
  ];

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      verificationRequest.additionalInfo[field] = req.body[field];
    }
  });

  if (verificationRequest.status === 'rejected') {
    verificationRequest.status = 'requires_resubmit';
  }

  await verificationRequest.save();

  return response.success(res, { 
    request: safeVerificationRequest(verificationRequest) 
  }, 'اطلاعات با موفقیت ثبت شد');
});


// @desc    Get verification overview and request history
// @route   GET /api/users/verification/status
// @access  Private
exports.getVerificationStatus = asyncHandler(async (req, res) => {
  const overview = await buildVerificationOverview(req.user._id);
  return response.success(res, overview);
});

// @desc    Create or get current verification request
// @route   POST /api/users/verification/request
// @access  Private
exports.createVerificationRequest = asyncHandler(async (req, res) => {
  const targetLevel = Number(req.body.targetLevel || resolveNextVerificationLevel(req.user));
  const currentLevel = Number(req.user.level || 0);

  if (!targetLevel || targetLevel < 1 || targetLevel > 4) {
    return response.error(res, 'سطح احراز نامعتبر است', 400);
  }

  if (targetLevel <= currentLevel) {
    return response.error(res, 'این سطح قبلاً برای شما تأیید شده است', 400);
  }

  if (targetLevel > currentLevel + 1) {
    return response.error(res, 'مراحل احراز هویت باید به‌ترتیب تکمیل شوند', 400);
  }

  let verificationRequest = await VerificationRequest.findOne({
    user: req.user._id,
    targetLevel,
    status: { $in: ['pending', 'in_review', 'requires_resubmit', 'rejected'] }
  });

  if (!verificationRequest) {
    verificationRequest = await VerificationRequest.create({
      user: req.user._id,
      targetLevel,
      currentLevel,
      status: 'requires_resubmit'
    });
  }

  await User.findByIdAndUpdate(req.user._id, {
    levelStatus: 'pending',
    ...(targetLevel === 2 ? { identityVerificationStatus: 'pending' } : {}),
    ...(targetLevel === 3 ? { producerVerificationStatus: 'pending' } : {}),
  });

  const overview = await buildVerificationOverview(req.user._id);
  return response.success(res, overview, 'درخواست احراز هویت آماده تکمیل است');
});

// @desc    Submit verification request for admin review
// @route   POST /api/users/verification/submit
// @access  Private
exports.submitVerificationRequest = asyncHandler(async (req, res) => {
  const targetLevel = Number(req.body.targetLevel || resolveNextVerificationLevel(req.user));
  const verificationRequest = await VerificationRequest.findOne({
    user: req.user._id,
    targetLevel,
    status: { $in: ['pending', 'requires_resubmit', 'rejected'] }
  });

  if (!verificationRequest) {
    return response.error(res, 'درخواست احراز هویت یافت نشد', 404);
  }

  try {
    await verificationRequest.submit();
  } catch (error) {
    return response.validationError(res, null, error.message || 'مدارک یا اطلاعات احراز هویت ناقص است');
  }

  await User.findByIdAndUpdate(req.user._id, {
    levelStatus: 'pending',
    ...(targetLevel === 2 ? { identityVerificationStatus: 'pending' } : {}),
    ...(targetLevel === 3 ? { producerVerificationStatus: 'pending' } : {}),
  });

  const overview = await buildVerificationOverview(req.user._id);
  return response.success(res, overview, 'درخواست شما برای بررسی ارسال شد');
});

// @desc    Get user documents
// @route   GET /api/users/documents
// @access  Private
exports.getDocuments = asyncHandler(async (req, res) => {
  const verificationRequests = await VerificationRequest.find({
    user: req.user._id
  }).sort({ createdAt: -1 });

  return response.success(res, { 
    documents: req.user.documents,
    verificationRequests 
  });
});

// @desc    Get user activity history
// @route   GET /api/users/activity
// @access  Private
exports.getActivity = asyncHandler(async (req, res) => {
  const { page, limit } = paginate(req.query.page, req.query.limit);

  // This would aggregate from various collections
  // For now, return basic stats
  const stats = req.user.stats;

  return response.success(res, { stats });
});

// @desc    Search users (admin)
// @route   GET /api/users/search
// @access  Admin
exports.searchUsers = asyncHandler(async (req, res) => {
  const { q, page = 1, limit = 20 } = req.query;

  const query = {};
  if (q) {
    query.$or = [
      { phone: { $regex: q, $options: 'i' } },
      { firstName: { $regex: q, $options: 'i' } },
      { lastName: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } }
    ];
  }

  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .select('-password -refreshToken');

  return response.paginated(res, users, paginationResponse(total, page, limit));
});

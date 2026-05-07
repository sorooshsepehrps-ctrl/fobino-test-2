const MarketingRequest = require('../models/MarketingRequest');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');

exports.createMarketingRequest = asyncHandler(async (req, res) => {
  // Parse FormData fields
  const {
    productName,
    brand,
    description,
    commissionPercent
  } = req.body;

  // Parse JSON strings from FormData
  let categories = {};
  let cityOfProduction = {};
  let shippingTimeAvailable = {};
  let priceVolumes = [];
  let specifications = [];
  let paymentTypes = [];

  try {
    if (req.body.categories) {
      categories = JSON.parse(req.body.categories);
    }
    if (req.body.cityOfProduction) {
      cityOfProduction = JSON.parse(req.body.cityOfProduction);
    }
    if (req.body.shippingTimeAvailable) {
      shippingTimeAvailable = JSON.parse(req.body.shippingTimeAvailable);
    }
    if (req.body.priceVolumes) {
      priceVolumes = JSON.parse(req.body.priceVolumes);
    }
    if (req.body.specifications) {
      specifications = JSON.parse(req.body.specifications);
    }
    if (req.body.paymentTypes) {
      paymentTypes = JSON.parse(req.body.paymentTypes);
    }
  } catch (error) {
    console.error('Error parsing JSON fields:', error);
    return res.status(400).json({
      success: false,
      message: 'خطا در پردازش داده‌ها: ' + error.message
    });
  }

  const user = await User.findById(req.user.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'کاربر یافت نشد'
    });
  }

  if (user.level < 2) {
    return res.status(403).json({
      success: false,
      message: 'برای ایجاد درخواست بازاریابی باید سطح ۲ یا بالاتر داشته باشید'
    });
  }

  // Validate required fields
  if (!productName || !brand || !description || !commissionPercent) {
    return res.status(400).json({
      success: false,
      message: 'تمام فیلدهای الزامی باید تکمیل شوند'
    });
  }

  if (!categories.level1) {
    return res.status(400).json({
      success: false,
      message: 'دسته سطح 1 الزامی است'
    });
  }

  const marketingRequest = await MarketingRequest.create({
    seller: req.user.id,
    productName,
    brand,
    description,
    images: req.files?.images || [],
    catalogue: req.files?.document?.[0] || null,
    priceVolumes,
    cityOfProduction,
    shippingTimeAvailable,
    specifications,
    paymentTypes,
    categories,
    commissionPercent
  });

  res.status(201).json({
    success: true,
    message: 'درخواست بازاریابی با موفقیت ایجاد شد',
    data: marketingRequest
  });
});

exports.getMyMarketingRequests = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10, includeRfps } = req.query;
  const shouldIncludeRfps = includeRfps === 'true';
  
  const query = { seller: req.user.id };
  if (status) query.status = status;
  
  const skip = (page - 1) * limit;
  
  let marketingRequestsQuery = MarketingRequest.find(query)
    .populate('categories.level1 categories.level2 categories.level3', 'name')
    .populate('acceptedBy.marketer', 'firstName lastName profileImage phone')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  if (shouldIncludeRfps) {
    marketingRequestsQuery = marketingRequestsQuery.populate({
      path: 'rfps',
      populate: [
        { path: 'marketer', select: 'firstName lastName profileImage' },
        { path: 'tradeContract', select: 'status contractCode commission' }
      ]
    });
  }

  const marketingRequests = await marketingRequestsQuery;
  
  const total = await MarketingRequest.countDocuments(query);
  
  res.status(200).json({
    success: true,
    data: marketingRequests,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

exports.getMarketingRequestById = asyncHandler(async (req, res) => {
  const marketingRequest = await MarketingRequest.findById(req.params.id)
    .populate('seller', 'firstName lastName profileImage level scores')
    .populate('categories.level1 categories.level2 categories.level3', 'name')
    .populate('acceptedBy.marketer', 'firstName lastName profileImage phone')
    .populate({
      path: 'rfps',
      populate: [
        { path: 'marketer', select: 'firstName lastName profileImage' },
        { path: 'tradeContract', select: 'status contractCode commission' }
      ]
    });
  
  if (!marketingRequest) {
    return res.status(404).json({
      success: false,
      message: 'درخواست بازاریابی یافت نشد'
    });
  }

  if (marketingRequest.seller._id.toString() === req.user.id) {
    return res.status(200).json({
      success: true,
      data: marketingRequest
    });
  }

  await marketingRequest.incrementViews();
  
  const user = await User.findById(req.user.id);
  if (!user.isMarketer) {
    return res.status(403).json({
      success: false,
      message: 'فقط بازاریاب‌ها می‌توانند درخواست‌های بازاریابی را مشاهده کنند'
    });
  }

  const sanitizedRequest = marketingRequest.toObject();
  delete sanitizedRequest.seller;
  if (Array.isArray(sanitizedRequest.rfps)) {
    sanitizedRequest.rfps = sanitizedRequest.rfps.filter(rfp =>
      rfp.marketer && rfp.marketer._id.toString() === req.user.id
    );
  }
  
  res.status(200).json({
    success: true,
    data: sanitizedRequest
  });
});

exports.updateMarketingRequest = asyncHandler(async (req, res) => {
  const marketingRequest = await MarketingRequest.findById(req.params.id);
  
  if (!marketingRequest) {
    return res.status(404).json({
      success: false,
      message: 'درخواست بازاریابی یافت نشد'
    });
  }

  if (marketingRequest.seller.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'شما مجاز به ویرایش این درخواست نیستید'
    });
  }

  const allowedUpdates = [
    'productName', 'brand', 'description', 'images', 'catalogue',
    'priceVolumes', 'cityOfProduction', 'shippingTimeAvailable',
    'specifications', 'paymentTypes', 'categories', 'commissionPercent', 'status'
  ];
  
  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      marketingRequest[field] = req.body[field];
    }
  });
  
  await marketingRequest.save();
  
  res.status(200).json({
    success: true,
    message: 'درخواست بازاریابی با موفقیت به‌روزرسانی شد',
    data: marketingRequest
  });
});

exports.deleteMarketingRequest = asyncHandler(async (req, res) => {
  const marketingRequest = await MarketingRequest.findById(req.params.id);
  
  if (!marketingRequest) {
    return res.status(404).json({
      success: false,
      message: 'درخواست بازاریابی یافت نشد'
    });
  }

  if (marketingRequest.seller.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'شما مجاز به حذف این درخواست نیستید'
    });
  }

  marketingRequest.status = 'deleted';
  await marketingRequest.save();
  
  res.status(200).json({
    success: true,
    message: 'درخواست بازاریابی با موفقیت حذف شد'
  });
});

exports.getAllMarketingRequestsForMarketers = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  
  if (!user.isMarketer) {
    return res.status(403).json({
      success: false,
      message: 'فقط بازاریاب‌ها می‌توانند لیست درخواست‌های بازاریابی را مشاهده کنند'
    });
  }

  const { 
    category1, 
    category2, 
    category3, 
    province, 
    city,
    minCommission,
    maxCommission,
    page = 1, 
    limit = 20 
  } = req.query;
  
  const query = { status: 'active' };
  
  if (category1) query['categories.level1'] = category1;
  if (category2) query['categories.level2'] = category2;
  if (category3) query['categories.level3'] = category3;
  if (province) query['cityOfProduction.province'] = province;
  if (city) query['cityOfProduction.city'] = city;
  if (minCommission || maxCommission) {
    query.commissionPercent = {};
    if (minCommission) query.commissionPercent.$gte = parseFloat(minCommission);
    if (maxCommission) query.commissionPercent.$lte = parseFloat(maxCommission);
  }
  
  const skip = (page - 1) * limit;
  
  const marketingRequests = await MarketingRequest.find(query)
    .select('-seller')
    .populate('categories.level1 categories.level2 categories.level3', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
  
  const total = await MarketingRequest.countDocuments(query);
  
  res.status(200).json({
    success: true,
    data: marketingRequests,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

exports.acceptMarketingRequest = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  
  if (!user.isMarketer) {
    return res.status(403).json({
      success: false,
      message: 'فقط بازاریاب‌ها می‌توانند درخواست بازاریابی را بپذیرند'
    });
  }

  const marketingRequest = await MarketingRequest.findById(req.params.id);
  
  if (!marketingRequest) {
    return res.status(404).json({
      success: false,
      message: 'درخواست بازاریابی یافت نشد'
    });
  }

  if (marketingRequest.status !== 'active') {
    return res.status(400).json({
      success: false,
      message: 'این درخواست بازاریابی فعال نیست'
    });
  }

  const alreadyAcceptedByCurrent = marketingRequest.acceptedBy?.some(entry =>
    entry.marketer.toString() === req.user.id
  );
  if (alreadyAcceptedByCurrent) {
    return res.status(200).json({
      success: true,
      message: 'این درخواست قبلاً توسط شما پذیرفته شده است',
      data: marketingRequest
    });
  }

  await marketingRequest.acceptByMarketer(req.user.id);
  
  res.status(200).json({
    success: true,
    message: 'درخواست بازاریابی با موفقیت پذیرفته شد',
    data: marketingRequest
  });
});

exports.getMyAcceptedRequests = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10, search, hasRFP } = req.query;
  
  const query = { 'acceptedBy.marketer': req.user.id };
  if (status && status !== 'all') query.status = status;
  if (search) {
    query.$or = [
      { productName: { $regex: search, $options: 'i' } },
      { brand: { $regex: search, $options: 'i' } }
    ];
  }
  
  const skip = (page - 1) * limit;
  
  const marketingRequests = await MarketingRequest.find(query)
    .populate('categories.level1 categories.level2 categories.level3', 'name')
    .populate('seller', 'firstName lastName profileImage')
    .populate({
      path: 'rfps',
      populate: [
        { path: 'marketer', select: 'firstName lastName profileImage' },
        { path: 'tradeContract', select: 'status contractCode commission' }
      ]
    })
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const mappedRequests = marketingRequests.map(request => {
    const requestObj = request.toObject();
    const acceptedEntry = requestObj.acceptedBy?.find(entry =>
      entry.marketer && entry.marketer._id.toString() === req.user.id
    );
    const rfpsForMarketer = (requestObj.rfps || []).filter(rfp =>
      rfp.marketer && rfp.marketer._id.toString() === req.user.id
    );
    return {
      ...requestObj,
      acceptedAt: acceptedEntry?.acceptedAt,
      rfps: rfpsForMarketer
    };
  });

  const filteredRequests = mappedRequests.filter(request => {
    if (hasRFP === 'has') {
      return request.rfps?.length > 0;
    }
    if (hasRFP === 'none') {
      return !request.rfps || request.rfps.length === 0;
    }
    return true;
  });

  const total = await MarketingRequest.countDocuments(query);
  
  res.status(200).json({
    success: true,
    data: filteredRequests,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

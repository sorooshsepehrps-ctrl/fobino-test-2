const RFP = require('../models/RFP');
const MarketingRequest = require('../models/MarketingRequest');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');

exports.createRFP = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  
  if (!user.isMarketer) {
    return res.status(403).json({
      success: false,
      message: 'فقط بازاریاب‌ها می‌توانند RFP ایجاد کنند'
    });
  }

  const { marketingRequestId, clientInfo, proposedTerms } = req.body;

  const marketingRequest = await MarketingRequest.findById(marketingRequestId);
  
  if (!marketingRequest) {
    return res.status(404).json({
      success: false,
      message: 'درخواست بازاریابی یافت نشد'
    });
  }

  const acceptedEntries = marketingRequest.acceptedBy || [];
  const isAcceptedByMarketer = acceptedEntries.some(entry =>
    entry.marketer.toString() === req.user.id
  );
  if (!isAcceptedByMarketer) {
    return res.status(403).json({
      success: false,
      message: 'شما این درخواست بازاریابی را قبول نکرده‌اید'
    });
  }

  const commissionAmount = Math.floor(
    (proposedTerms.totalPrice * marketingRequest.commissionPercent) / 100
  );

  const rfp = await RFP.create({
    marketingRequest: marketingRequestId,
    seller: marketingRequest.seller,
    marketer: req.user.id,
    clientInfo,
    proposedTerms,
    commission: {
      percent: marketingRequest.commissionPercent,
      amount: commissionAmount
    },
    status: 'waiting_seller_approval',
    negotiationHistory: [{
      editedBy: req.user.id,
      action: 'created',
      changes: { clientInfo, proposedTerms },
      comment: 'RFP created by marketer',
      timestamp: new Date()
    }]
  });

  await rfp.populate('seller', 'firstName lastName profileImage phone email');
  await rfp.populate('marketer', 'firstName lastName profileImage');
  await rfp.populate('marketingRequest', 'productName brand');

  res.status(201).json({
    success: true,
    message: 'RFP با موفقیت ایجاد شد و برای فروشنده ارسال شد',
    data: rfp
  });
});

exports.getMyRFPs = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  
  const user = await User.findById(req.user.id);
  
  const query = {
    $or: [
      { seller: req.user.id },
      { marketer: req.user.id }
    ]
  };
  
  if (status) query.status = status;
  
  const skip = (page - 1) * limit;
  
  const rfps = await RFP.find(query)
    .populate('seller', 'firstName lastName profileImage')
    .populate('marketer', 'firstName lastName profileImage')
    .populate('marketingRequest', 'productName brand commissionPercent')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
  
  const total = await RFP.countDocuments(query);
  
  res.status(200).json({
    success: true,
    data: rfps,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

exports.getRFPById = asyncHandler(async (req, res) => {
  const rfp = await RFP.findById(req.params.id)
    .populate('seller', 'firstName lastName profileImage phone email')
    .populate('marketer', 'firstName lastName profileImage phone email')
    .populate('marketingRequest', 'productName brand images commissionPercent');
  
  if (!rfp) {
    return res.status(404).json({
      success: false,
      message: 'RFP یافت نشد'
    });
  }

  if (
    rfp.seller._id.toString() !== req.user.id &&
    rfp.marketer._id.toString() !== req.user.id
  ) {
    return res.status(403).json({
      success: false,
      message: 'شما مجاز به مشاهده این RFP نیستید'
    });
  }

  res.status(200).json({
    success: true,
    data: rfp
  });
});

exports.approveRFP = asyncHandler(async (req, res) => {
  const rfp = await RFP.findById(req.params.id);
  
  if (!rfp) {
    return res.status(404).json({
      success: false,
      message: 'RFP یافت نشد'
    });
  }

  const isSeller = rfp.seller.toString() === req.user.id;
  const isMarketer = rfp.marketer.toString() === req.user.id;

  if (!isSeller && !isMarketer) {
    return res.status(403).json({
      success: false,
      message: 'شما مجاز به تایید این RFP نیستید'
    });
  }

  if (isSeller) {
    await rfp.approveAsSeller(req.user.id);
  } else {
    await rfp.approveAsMarketer(req.user.id);
  }

  await rfp.populate('seller', 'firstName lastName profileImage');
  await rfp.populate('marketer', 'firstName lastName profileImage');
  await rfp.populate('marketingRequest', 'productName brand');

  res.status(200).json({
    success: true,
    message: 'RFP با موفقیت تایید شد',
    data: rfp
  });
});

exports.editRFP = asyncHandler(async (req, res) => {
  const rfp = await RFP.findById(req.params.id);
  
  if (!rfp) {
    return res.status(404).json({
      success: false,
      message: 'RFP یافت نشد'
    });
  }

  const isSeller = rfp.seller.toString() === req.user.id;
  const isMarketer = rfp.marketer.toString() === req.user.id;

  if (!isSeller && !isMarketer) {
    return res.status(403).json({
      success: false,
      message: 'شما مجاز به ویرایش این RFP نیستید'
    });
  }

  const { clientInfo, proposedTerms, comment } = req.body;
  
  const updates = {};
  if (clientInfo) updates.clientInfo = clientInfo;
  if (proposedTerms) {
    updates.proposedTerms = proposedTerms;
    if (proposedTerms.totalPrice && rfp.commission.percent) {
      updates.commission = {
        percent: rfp.commission.percent,
        amount: Math.floor((proposedTerms.totalPrice * rfp.commission.percent) / 100)
      };
    }
  }

  if (isSeller) {
    await rfp.editAsSeller(req.user.id, updates, comment);
  } else {
    await rfp.editAsMarketer(req.user.id, updates, comment);
  }

  await rfp.populate('seller', 'firstName lastName profileImage');
  await rfp.populate('marketer', 'firstName lastName profileImage');
  await rfp.populate('marketingRequest', 'productName brand');

  res.status(200).json({
    success: true,
    message: 'RFP با موفقیت ویرایش شد',
    data: rfp
  });
});

exports.rejectRFP = asyncHandler(async (req, res) => {
  const rfp = await RFP.findById(req.params.id);
  
  if (!rfp) {
    return res.status(404).json({
      success: false,
      message: 'RFP یافت نشد'
    });
  }

  const isSeller = rfp.seller.toString() === req.user.id;
  const isMarketer = rfp.marketer.toString() === req.user.id;

  if (!isSeller && !isMarketer) {
    return res.status(403).json({
      success: false,
      message: 'شما مجاز به رد این RFP نیستید'
    });
  }

  const { reason } = req.body;

  if (isSeller) {
    await rfp.rejectAsSeller(req.user.id, reason);
  } else {
    await rfp.rejectAsMarketer(req.user.id, reason);
  }

  await rfp.populate('seller', 'firstName lastName profileImage');
  await rfp.populate('marketer', 'firstName lastName profileImage');
  await rfp.populate('marketingRequest', 'productName brand');

  res.status(200).json({
    success: true,
    message: 'RFP رد شد',
    data: rfp
  });
});

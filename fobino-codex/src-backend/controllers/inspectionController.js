const Deal = require('../models/Deal');
const Inspection = require('../models/Inspection');
const Wallet = require('../models/Wallet');
const { asyncHandler } = require('../middleware/errorHandler');
const response = require('../utils/responseFormatter');
const { paginationResponse } = require('../utils/helpers');
const ledgerService = require('../services/transactionLedgerService');

// ==================== BUYER ENDPOINTS ====================

// @desc    Buyer requests fobino inspection add-on
// @route   POST /api/deals/:id/inspection
// @access  Private (buyer only)
exports.requestInspection = asyncHandler(async (req, res) => {
  const { location } = req.body;

  const deal = await Deal.findById(req.params.id);
  if (!deal) {
    return response.notFound(res, 'قرارداد یافت نشد');
  }

  if (deal.buyer.toString() !== req.user._id.toString()) {
    return response.forbidden(res, 'فقط خریدار می‌تواند درخواست بازرسی فوبینو بدهد');
  }

  if (['shipped', 'delivered', 'confirmed', 'cancelled', 'refunded'].includes(deal.status)) {
    return response.error(res, 'در این مرحله امکان فعال‌سازی بازرسی فوبینو وجود ندارد', 400);
  }

  if (deal.inspection) {
    return response.error(res, 'بازرسی فوبینو قبلاً برای این قرارداد فعال شده است', 400);
  }

  const inspection = new Inspection({
    deal: deal._id,
    buyer: req.user._id,
    location
  });

  inspection.history.push({
    action: 'requested',
    status: 'pending',
    description: 'درخواست بازرسی فوبینو ثبت شد',
    performedBy: req.user._id
  });

  await inspection.save();

  deal.inspection = inspection._id;
  await deal.save();

  return response.created(res, { inspection }, 'درخواست بازرسی فوبینو ثبت شد');
});

// @desc    Buyer pays for inspection
// @route   POST /api/deals/:id/inspection/pay
// @access  Private (buyer only)
exports.payInspection = asyncHandler(async (req, res) => {
  const deal = await Deal.findById(req.params.id).populate('inspection');
  if (!deal) {
    return response.notFound(res, 'قرارداد یافت نشد');
  }

  if (deal.buyer.toString() !== req.user._id.toString()) {
    return response.forbidden(res, 'فقط خریدار می‌تواند هزینه بازرسی را پرداخت کند');
  }

  const inspection = deal.inspection;
  if (!inspection) {
    return response.notFound(res, 'درخواست بازرسی یافت نشد');
  }

  if (inspection.status !== 'estimated') {
    return response.error(res, 'فقط درخواست‌های تخمین زده شده قابل پرداخت هستند', 400);
  }

  const buyerWallet = await Wallet.getOrCreateWallet(req.user._id);
  if (!buyerWallet.hasSufficientBalance(inspection.price, 'IRR')) {
    return response.error(res, 'موجودی کیف پول کافی نیست', 400);
  }

  await buyerWallet.withdraw(inspection.price, 'IRR');

  const transaction = await ledgerService.recordInspectionPayment({
    userId: req.user._id,
    walletId: buyerWallet._id,
    inspectionId: inspection._id,
    dealId: deal._id,
    dealNumber: deal.dealNumber,
    amount: inspection.price,
    location: inspection.location,
    metadata: {
      source: 'inspectionController.payInspection'
    }
  });

  inspection.status = 'paid';
  inspection.paymentStatus = 'paid';
  inspection.inspectionFee = inspection.price;
  inspection.paymentTransactionId = transaction.transactionNumber;
  inspection.paidAt = new Date();
  inspection.history.push({
    action: 'paid',
    status: 'paid',
    description: `هزینه بازرسی پرداخت شد: ${inspection.price} تومان`,
    performedBy: req.user._id,
    metadata: { transactionId: transaction.transactionNumber }
  });
  await inspection.save();

  return response.success(res, { inspection }, 'هزینه بازرسی پرداخت شد');
});

// @desc    Buyer requests factor for inspection
// @route   POST /api/deals/:id/inspection/request-factor
// @access  Private (buyer only)
exports.requestInspectionFactor = asyncHandler(async (req, res) => {
  const deal = await Deal.findById(req.params.id).populate('inspection');
  if (!deal) {
    return response.notFound(res, 'قرارداد یافت نشد');
  }

  if (deal.buyer.toString() !== req.user._id.toString()) {
    return response.forbidden(res, 'فقط خریدار می‌تواند فاکتور درخواست کند');
  }

  const inspection = deal.inspection;
  if (!inspection) {
    return response.notFound(res, 'درخواست بازرسی یافت نشد');
  }

  if (inspection.status !== 'inspected') {
    return response.error(res, 'فقط بعد از انجام بازرسی می‌توانید فاکتور درخواست کنید', 400);
  }

  inspection.status = 'waiting_for_factor';
  inspection.history.push({
    action: 'factor_requested',
    status: 'waiting_for_factor',
    description: 'خریدار فاکتور بازرسی را درخواست کرد',
    performedBy: req.user._id
  });
  await inspection.save();

  return response.success(res, { inspection }, 'درخواست فاکتور ثبت شد');
});

// @desc    Get inspection details for a deal
// @route   GET /api/deals/:id/inspection
// @access  Private
exports.getInspection = asyncHandler(async (req, res) => {
  const deal = await Deal.findById(req.params.id).populate('inspection');
  if (!deal) {
    return response.notFound(res, 'قرارداد یافت نشد');
  }

  const isBuyer = deal.buyer.toString() === req.user._id.toString();
  const isSeller = deal.seller.toString() === req.user._id.toString();

  if (!isBuyer && !isSeller) {
    return response.forbidden(res, 'شما در این قرارداد شرکت‌کننده نیستید');
  }

  if (!deal.inspection) {
    return response.notFound(res, 'بازرسی فوبینو برای این قرارداد فعال نشده است');
  }

  return response.success(res, { inspection: deal.inspection });
});

// ==================== ADMIN ENDPOINTS ====================

// @desc    Admin gets all inspection requests
// @route   GET /api/admin/inspections
// @access  Admin
exports.getInspectionRequests = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;

  const query = {};
  if (status) query.status = status;

  const total = await Inspection.countDocuments(query);
  const requests = await Inspection.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .populate('deal', 'dealNumber title totalPrice status')
    .populate('buyer', 'firstName lastName phone')
    .lean();

  return response.paginated(res, requests, paginationResponse(total, page, limit));
});

// @desc    Admin estimates inspection price
// @route   POST /api/admin/inspections/:id/estimate
// @access  Admin
exports.estimateInspectionPrice = asyncHandler(async (req, res) => {
  const { price } = req.body;

  const inspection = await Inspection.findById(req.params.id);
  if (!inspection) {
    return response.notFound(res, 'درخواست بازرسی یافت نشد');
  }

  if (inspection.status !== 'pending') {
    return response.error(res, 'فقط درخواست‌های در انتظار قابل تخمین هستند', 400);
  }

  inspection.price = price;
  inspection.inspectionFee = price;
  inspection.status = 'estimated';
  inspection.history.push({
    action: 'estimated',
    status: 'estimated',
    description: `قیمت بازرسی تخمین زده شد: ${price} تومان`,
    performedBy: req.user._id,
    metadata: { price }
  });
  await inspection.save();

  return response.success(res, { inspection }, 'قیمت بازرسی تخمین زده شد');
});

// @desc    Admin provides inspection result
// @route   POST /api/admin/inspections/:id/result
// @access  Admin
exports.provideInspectionResult = asyncHandler(async (req, res) => {
  const { result } = req.body;

  const inspection = await Inspection.findById(req.params.id);
  if (!inspection) {
    return response.notFound(res, 'درخواست بازرسی یافت نشد');
  }

  if (inspection.status !== 'paid') {
    return response.error(res, 'فقط درخواست‌های پرداخت شده قابل ثبت نتیجه هستند', 400);
  }

  inspection.result = result;
  inspection.status = 'inspected';
  inspection.history.push({
    action: 'inspected',
    status: 'inspected',
    description: 'نتیجه بازرسی ثبت شد',
    performedBy: req.user._id,
    metadata: { result }
  });
  await inspection.save();

  return response.success(res, { inspection }, 'نتیجه بازرسی ثبت شد');
});

// @desc    Admin uploads factor for inspection
// @route   POST /api/admin/inspections/:id/factor
// @access  Admin
exports.uploadInspectionFactor = asyncHandler(async (req, res) => {
  const { imageUrl, cloudinaryId } = req.body;

  const inspection = await Inspection.findById(req.params.id);
  if (!inspection) {
    return response.notFound(res, 'درخواست بازرسی یافت نشد');
  }

  if (inspection.status !== 'waiting_for_factor') {
    return response.error(res, 'فقط درخواست‌های در انتظار فاکتور قابل آپلود فاکتور هستند', 400);
  }

  inspection.factor = {
    imageUrl,
    cloudinaryId,
    uploadedAt: new Date()
  };
  inspection.status = 'factored';
  inspection.history.push({
    action: 'factored',
    status: 'factored',
    description: 'فاکتور بازرسی آپلود شد',
    performedBy: req.user._id
  });
  await inspection.save();

  return response.success(res, { inspection }, 'فاکتور بازرسی آپلود شد');
});
const Deal = require('../models/Deal');
const Shipping = require('../models/Shipping');
const Wallet = require('../models/Wallet');
const { asyncHandler } = require('../middleware/errorHandler');
const response = require('../utils/responseFormatter');
const { paginationResponse } = require('../utils/helpers');
const ledgerService = require('../services/transactionLedgerService');

// ==================== BUYER ENDPOINTS ====================

// @desc    Buyer requests fobino shipping add-on
// @route   POST /api/deals/:id/shipping
// @access  Private (buyer only)
exports.requestShipping = asyncHandler(async (req, res) => {
  const { shippingCity, deliveryCity } = req.body;

  const deal = await Deal.findById(req.params.id);
  if (!deal) {
    return response.notFound(res, 'قرارداد یافت نشد');
  }

  if (deal.buyer.toString() !== req.user._id.toString()) {
    return response.forbidden(res, 'فقط خریدار می‌تواند درخواست ارسال فوبینو بدهد');
  }

  if (['shipped', 'delivered', 'confirmed', 'cancelled', 'refunded'].includes(deal.status)) {
    return response.error(res, 'در این مرحله امکان فعال‌سازی ارسال فوبینو وجود ندارد', 400);
  }

  if (deal.shipping) {
    return response.error(res, 'ارسال فوبینو قبلاً برای این قرارداد فعال شده است', 400);
  }

  const shipping = new Shipping({
    deal: deal._id,
    buyer: req.user._id,
    payer: req.user._id,
    beneficiary: null,
    shippingCity,
    deliveryCity
  });

  shipping.history.push({
    action: 'requested',
    status: 'pending',
    description: 'درخواست ارسال فوبینو ثبت شد',
    performedBy: req.user._id
  });
  await shipping.save();

  deal.shipping = shipping._id;
  await deal.save();

  return response.created(res, { shipping }, 'درخواست ارسال فوبینو ثبت شد');
});

// @desc    Buyer agrees or disagrees with shipping price
// @route   POST /api/deals/:id/shipping/respond
// @access  Private (buyer only)
exports.respondToShippingPrice = asyncHandler(async (req, res) => {
  const { agree } = req.body;

  const deal = await Deal.findById(req.params.id).populate('shipping');
  if (!deal) {
    return response.notFound(res, 'قرارداد یافت نشد');
  }

  if (deal.buyer.toString() !== req.user._id.toString()) {
    return response.forbidden(res, 'فقط خریدار می‌تواند به قیمت ارسال پاسخ دهد');
  }

  const shipping = deal.shipping;
  if (!shipping) {
    return response.notFound(res, 'درخواست ارسال یافت نشد');
  }

  if (shipping.status !== 'estimated') {
    return response.error(res, 'فقط درخواست‌های تخمین زده شده قابل پاسخ هستند', 400);
  }

  if (agree) {
    const buyerWallet = await Wallet.getOrCreateWallet(req.user._id);

    if (!buyerWallet.hasSufficientBalance(shipping.price, 'IRR')) {
      return response.error(res, 'موجودی کیف پول کافی نیست', 400);
    }

    await buyerWallet.withdraw(shipping.price, 'IRR');

    const transaction = await ledgerService.recordShippingPayment({
      userId: req.user._id,
      walletId: buyerWallet._id,
      shippingId: shipping._id,
      dealId: deal._id,
      dealNumber: deal.dealNumber,
      amount: shipping.price,
      shippingCity: shipping.shippingCity,
      deliveryCity: shipping.deliveryCity,
      metadata: {
        source: 'shippingController.respondToShippingPrice'
      }
    });

    shipping.status = 'agreed';
    shipping.paymentStatus = 'paid';
    shipping.settlementStatus = 'paid';
    shipping.shippingFee = shipping.price;
    shipping.paymentTransactionId = transaction.transactionNumber;
    shipping.paidAt = new Date();
    shipping.history.push({
      action: 'agreed',
      status: 'agreed',
      description: 'خریدار با قیمت ارسال موافقت کرد و هزینه ارسال را پرداخت کرد',
      performedBy: req.user._id,
      metadata: { transactionId: transaction.transactionNumber, price: shipping.price }
    });
  } else {
    shipping.status = 'disagreed';
    shipping.history.push({
      action: 'disagreed',
      status: 'disagreed',
      description: 'خریدار با قیمت ارسال موافقت نکرد',
      performedBy: req.user._id
    });
  }

  await shipping.save();

  return response.success(
    res,
    { shipping },
    agree ? 'موافقت با قیمت ارسال و پرداخت انجام شد' : 'عدم موافقت با قیمت ارسال'
  );
});

// @desc    Buyer requests factor for shipping
// @route   POST /api/deals/:id/shipping/request-factor
// @access  Private (buyer only)
exports.requestShippingFactor = asyncHandler(async (req, res) => {
  const deal = await Deal.findById(req.params.id).populate('shipping');
  if (!deal) {
    return response.notFound(res, 'قرارداد یافت نشد');
  }

  if (deal.buyer.toString() !== req.user._id.toString()) {
    return response.forbidden(res, 'فقط خریدار می‌تواند فاکتور درخواست کند');
  }

  const shipping = deal.shipping;
  if (!shipping) {
    return response.notFound(res, 'درخواست ارسال یافت نشد');
  }

  if (shipping.status !== 'shipped') {
    return response.error(res, 'فقط بعد از ارسال می‌توانید فاکتور درخواست کنید', 400);
  }

  shipping.status = 'waiting_for_factor';
  shipping.history.push({
    action: 'factor_requested',
    status: 'waiting_for_factor',
    description: 'خریدار فاکتور ارسال را درخواست کرد',
    performedBy: req.user._id
  });
  await shipping.save();

  return response.success(res, { shipping }, 'درخواست فاکتور ثبت شد');
});

// @desc    Get shipping details for a deal
// @route   GET /api/deals/:id/shipping
// @access  Private
exports.getShipping = asyncHandler(async (req, res) => {
  const deal = await Deal.findById(req.params.id).populate('shipping');
  if (!deal) {
    return response.notFound(res, 'قرارداد یافت نشد');
  }

  const isBuyer = deal.buyer.toString() === req.user._id.toString();
  const isSeller = deal.seller.toString() === req.user._id.toString();

  if (!isBuyer && !isSeller) {
    return response.forbidden(res, 'شما در این قرارداد شرکت‌کننده نیستید');
  }

  if (!deal.shipping) {
    return response.notFound(res, 'ارسال فوبینو برای این قرارداد فعال نشده است');
  }

  return response.success(res, { shipping: deal.shipping });
});

// ==================== ADMIN ENDPOINTS ====================

// @desc    Admin gets all shipping requests
// @route   GET /api/admin/shipping
// @access  Admin
exports.getShippingRequests = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;

  const query = {};
  if (status) query.status = status;

  const total = await Shipping.countDocuments(query);
  const requests = await Shipping.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .populate('deal', 'dealNumber title totalPrice status')
    .populate('buyer', 'firstName lastName phone')
    .lean();

  return response.paginated(res, requests, paginationResponse(total, page, limit));
});

// @desc    Admin estimates shipping price
// @route   POST /api/admin/shipping/:id/estimate
// @access  Admin
exports.estimateShippingPrice = asyncHandler(async (req, res) => {
  const { price } = req.body;

  const shipping = await Shipping.findById(req.params.id);
  if (!shipping) {
    return response.notFound(res, 'درخواست ارسال یافت نشد');
  }

  if (shipping.status !== 'pending') {
    return response.error(res, 'فقط درخواست‌های در انتظار قابل تخمین هستند', 400);
  }

  shipping.price = price;
  shipping.shippingFee = price;
  shipping.status = 'estimated';
  shipping.history.push({
    action: 'estimated',
    status: 'estimated',
    description: `قیمت ارسال تخمین زده شد: ${price} تومان`,
    performedBy: req.user._id,
    metadata: { price }
  });
  await shipping.save();

  return response.success(res, { shipping }, 'قیمت ارسال تخمین زده شد');
});

// @desc    Admin adds tracking code and marks as shipped
// @route   POST /api/admin/shipping/:id/ship
// @access  Admin
exports.adminShipOrder = asyncHandler(async (req, res) => {
  const { trackingCode } = req.body;

  const shipping = await Shipping.findById(req.params.id);
  if (!shipping) {
    return response.notFound(res, 'درخواست ارسال یافت نشد');
  }

  if (shipping.status !== 'agreed') {
    return response.error(res, 'فقط درخواست‌های تایید شده قابل ارسال هستند', 400);
  }

  shipping.trackingCode = trackingCode;
  shipping.status = 'shipped';
  shipping.history.push({
    action: 'shipped',
    status: 'shipped',
    description: `سفارش ارسال شد - کد رهگیری: ${trackingCode}`,
    performedBy: req.user._id,
    metadata: { trackingCode }
  });
  await shipping.save();

  const deal = await Deal.findById(shipping.deal);
  if (deal && deal.status === 'open') {
    deal.status = 'shipped';
    await deal.addHistory('shipped', 'shipped', 'سفارش توسط ارسال فوبینو ارسال شد', req.user._id);
  }

  return response.success(res, { shipping }, 'سفارش ارسال شد و کد رهگیری ثبت شد');
});

// @desc    Admin uploads factor for shipping
// @route   POST /api/admin/shipping/:id/factor
// @access  Admin
exports.uploadShippingFactor = asyncHandler(async (req, res) => {
  const { imageUrl, cloudinaryId } = req.body;

  const shipping = await Shipping.findById(req.params.id);
  if (!shipping) {
    return response.notFound(res, 'درخواست ارسال یافت نشد');
  }

  if (shipping.status !== 'waiting_for_factor') {
    return response.error(res, 'فقط درخواست‌های در انتظار فاکتور قابل آپلود فاکتور هستند', 400);
  }

  shipping.factor = {
    imageUrl,
    cloudinaryId,
    uploadedAt: new Date()
  };
  shipping.status = 'factored';
  shipping.history.push({
    action: 'factored',
    status: 'factored',
    description: 'فاکتور ارسال آپلود شد',
    performedBy: req.user._id
  });
  await shipping.save();

  return response.success(res, { shipping }, 'فاکتور ارسال آپلود شد');
});
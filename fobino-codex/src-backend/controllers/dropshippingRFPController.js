

const DropshippingRFP = require('../models/DropshippingRFP');
const DropshippingProduct = require('../models/DropshippingProduct');
const Wallet = require('../models/Wallet');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const ledgerService = require('../services/transactionLedgerService');
const dropshippingSettlementService = require('../services/dropshippingSettlementService');
const { pickRfpSummary, pickRfpDetail } = require('../utils/dropshippingPresenter');

function normalizeShipmentFields(body = {}) {
  return {
    agreedShipmentDate: body.agreedShipmentDate ? new Date(body.agreedShipmentDate) : undefined,
    agreedShipmentDateJalali: body.agreedShipmentDateJalali,
  };
}

function actorRole(user, rfp) {
  if (String(rfp.provider) === String(user._id)) return 'provider';
  if (String(rfp.dropshipper) === String(user._id)) return 'dropshipper';
  return null;
}

exports.createRFP = catchAsync(async (req, res, next) => {
  const product = await DropshippingProduct.findById(req.body.product);

  if (!product) return next(new AppError('محصول یافت نشد', 404));
  if (product.status !== 'active') return next(new AppError('این محصول در حال حاضر فعال نیست', 400));
  if (product.stockQuantity < req.body.quantity) return next(new AppError('موجودی کافی نیست', 400));
  if (!req.body.agreedShipmentDate || !req.body.agreedShipmentDateJalali) {
    return next(new AppError('تاریخ ارسال توافقی باید ثبت شود', 400));
  }

  const totalAmount = product.retailPrice * req.body.quantity;
  const fobinoFee = totalAmount * ((product.fobinoFeePercent || 10) / 100);
  const providerAmount = totalAmount - fobinoFee;

  const rfp = await DropshippingRFP.create({
    product: product._id,
    provider: product.provider,
    dropshipper: req.user._id,
    quantity: req.body.quantity,
    agreedPrice: product.retailPrice,
    totalAmount,
    fobinoFee,
    providerAmount,
    paymentAmount: 0,
    feeAmount: fobinoFee,
    providerNetAmount: providerAmount,
    productLocation: {
      province: product.location.province,
      city: product.location.city,
      address: product.location.address,
      postalCode: product.location.postalCode,
    },
    shippingLocation: req.body.shippingLocation,
    proposedTerms: req.body.proposedTerms,
    ...normalizeShipmentFields(req.body),
    status: 'pending_provider_approval',
  });

  await product.incrementRequests();

  res.status(201).json({
    status: 'success',
    data: pickRfpDetail(rfp, 'dropshipper', product),
  });
});

exports.getMyRFPs = catchAsync(async (req, res) => {
  const { page = 1, limit = 20, status, role, productId } = req.query;
  const effectiveRole = role === 'provider' ? 'provider' : 'dropshipper';

  const query = effectiveRole === 'provider'
    ? { provider: req.user._id }
    : { dropshipper: req.user._id };

  if (status) query.status = status;
  if (productId) query.product = productId;

  const total = await DropshippingRFP.countDocuments(query);
  const rfps = await DropshippingRFP.find(query)
    .populate('product')
    .sort('-createdAt')
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  res.json({
    status: 'success',
    data: rfps.map((rfp) => pickRfpSummary(rfp, effectiveRole)),
    pagination: {
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      limit: Number(limit),
    },
  });
});

exports.getRFPById = catchAsync(async (req, res, next) => {
  const rfp = await DropshippingRFP.findById(req.params.id).populate('product');
  if (!rfp) return next(new AppError('درخواست یافت نشد', 404));

  const role = actorRole(req.user, rfp);
  const isAdmin = req.user.role === 'admin' || req.user.roles?.includes('admin');

  if (!role && !isAdmin) return next(new AppError('شما اجازه دسترسی ندارید', 403));

  res.json({
    status: 'success',
    data: pickRfpDetail(rfp, role || 'provider', rfp.product),
  });
});

exports.getRFPTimeline = catchAsync(async (req, res, next) => {
  const rfp = await DropshippingRFP.findById(req.params.id).select('timeline provider dropshipper');
  if (!rfp) return next(new AppError('درخواست یافت نشد', 404));

  const role = actorRole(req.user, rfp);
  const isAdmin = req.user.role === 'admin' || req.user.roles?.includes('admin');
  if (!role && !isAdmin) return next(new AppError('شما اجازه دسترسی ندارید', 403));

  res.json({
    status: 'success',
    data: rfp.timeline || [],
  });
});

exports.approveRFP = catchAsync(async (req, res, next) => {
  const rfp = await DropshippingRFP.findById(req.params.id).populate('product');
  if (!rfp) return next(new AppError('درخواست یافت نشد', 404));
  if (!rfp.agreedShipmentDate || !rfp.agreedShipmentDateJalali) {
    return next(new AppError('تاریخ ارسال توافقی باید قبل از تایید ثبت شده باشد', 400));
  }

  const role = actorRole(req.user, rfp);
  if (role === 'provider') await rfp.approveAsProvider();
  else if (role === 'dropshipper') await rfp.approveAsDropshipper();
  else return next(new AppError('شما اجازه دسترسی ندارید', 403));

  res.json({ status: 'success', data: pickRfpDetail(rfp, role, rfp.product) });
});

exports.editRFP = catchAsync(async (req, res, next) => {
  const rfp = await DropshippingRFP.findById(req.params.id).populate('product');
  if (!rfp) return next(new AppError('درخواست یافت نشد', 404));

  if (
    ['completed', 'shipped', 'delivered_pending_confirmation', 'refunded_due_to_no_tracking'].includes(rfp.status) ||
    String(rfp.status).includes('rejected')
  ) {
    return next(new AppError('نمی‌توانید این درخواست را ویرایش کنید', 400));
  }

  const changes = { ...req.body, ...normalizeShipmentFields(req.body) };
  const role = actorRole(req.user, rfp);

  if (role === 'provider') await rfp.editAsProvider(changes);
  else if (role === 'dropshipper') await rfp.editAsDropshipper(changes);
  else return next(new AppError('شما اجازه دسترسی ندارید', 403));

  res.json({ status: 'success', data: pickRfpDetail(rfp, role, rfp.product) });
});

exports.rejectRFP = catchAsync(async (req, res, next) => {
  const { reason } = req.body;
  const rfp = await DropshippingRFP.findById(req.params.id).populate('product');
  if (!rfp) return next(new AppError('درخواست یافت نشد', 404));

  const role = actorRole(req.user, rfp);
  if (!role) return next(new AppError('شما اجازه دسترسی ندارید', 403));

  const hadBlockedPayment =
    rfp.paymentStatus === 'blocked' &&
    rfp.payment?.amount > 0 &&
    ['payment_completed', 'shipment_deadline_passed', 'late_ticket_created', 'shipped', 'delivered_pending_confirmation'].includes(rfp.status);

  if (hadBlockedPayment) {
    const dropshipperWallet = await Wallet.getOrCreateWallet(rfp.dropshipper);
    const amount = Math.abs(rfp.payment.amount);

    await dropshipperWallet.unblockAmount(amount, 'IRR');

    await ledgerService.recordDropshippingRefunded({
      dropshipperId: rfp.dropshipper,
      dropshipperWalletId: dropshipperWallet._id,
      providerId: rfp.provider,
      amount,
      dropshippingRFPId: rfp._id,
      rfpCode: rfp.rfpCode,
      productName: rfp.product?.productName,
      reason: reason || 'لغو سفارش دراپ‌شیپینگ',
      metadata: { source: 'dropshippingRFPController.rejectRFP.refund' },
    });

    await ledgerService.markDropshippingPendingIncomingResolved({
      dropshippingRFPId: rfp._id,
      providerId: rfp.provider,
      finalStatus: 'refunded',
      explainer: 'این مبلغ به دلیل لغو سفارش، به کیف پول شما واریز نشد.',
      badge: 'danger',
    });

    await rfp.markRefunded(reason || 'لغو سفارش دراپ‌شیپینگ');

    const product = await DropshippingProduct.findById(rfp.product._id || rfp.product);
    if (product && rfp.quantity > 0) await product.updateStock(rfp.quantity);
  } else if (role === 'provider') {
    await rfp.rejectAsProvider(reason);
  } else {
    await rfp.rejectAsDropshipper(reason);
  }

  res.json({ status: 'success', data: pickRfpDetail(rfp, role, rfp.product) });
});

exports.processPayment = catchAsync(async (req, res, next) => {
  const rfp = await DropshippingRFP.findById(req.params.id).populate('product');
  if (!rfp) return next(new AppError('درخواست یافت نشد', 404));
  if (String(rfp.dropshipper) !== String(req.user._id)) return next(new AppError('شما اجازه دسترسی ندارید', 403));
  if (rfp.status !== 'approved') return next(new AppError('درخواست هنوز تایید نشده است', 400));

  const dropshipperWallet = await Wallet.getOrCreateWallet(req.user._id);
  const providerWallet = await Wallet.getOrCreateWallet(rfp.provider);
  const settlement = dropshippingSettlementService.calculateAmounts(rfp);

  if (!dropshipperWallet.hasSufficientBalance(settlement.grossAmount, 'IRR')) {
    return next(new AppError('موجودی کیف پول کافی نیست', 400));
  }

  await dropshipperWallet.blockAmount(settlement.grossAmount, 'IRR');

  const buyerTx = await ledgerService.recordDropshippingBlocked({
    dropshipperId: req.user._id,
    dropshipperWalletId: dropshipperWallet._id,
    providerId: rfp.provider,
    amount: settlement.grossAmount,
    feeAmount: settlement.feeAmount,
    netAmount: settlement.providerNetAmount,
    dropshippingRFPId: rfp._id,
    rfpCode: rfp.rfpCode,
    productName: rfp.product?.productName,
    metadata: { source: 'dropshippingRFPController.processPayment' },
  });

  await ledgerService.recordDropshippingPendingIncoming({
    providerId: rfp.provider,
    providerWalletId: providerWallet._id,
    dropshipperId: rfp.dropshipper,
    amount: settlement.grossAmount,
    feeAmount: settlement.feeAmount,
    netAmount: settlement.providerNetAmount,
    dropshippingRFPId: rfp._id,
    rfpCode: rfp.rfpCode,
    productName: rfp.product?.productName,
    metadata: { source: 'dropshippingRFPController.processPayment.pendingIncoming' },
  });

  await rfp.processPayment(buyerTx.transactionNumber, settlement.grossAmount, buyerTx._id);
  rfp.paymentAmount = settlement.grossAmount;
  rfp.feeAmount = settlement.feeAmount;
  rfp.providerNetAmount = settlement.providerNetAmount;
  await rfp.save();

  const product = await DropshippingProduct.findById(rfp.product._id || rfp.product);
  await product.updateStock(-rfp.quantity);

  res.json({ status: 'success', data: pickRfpDetail(rfp, 'dropshipper', rfp.product) });
});

exports.markShipped = catchAsync(async (req, res, next) => {
  const { trackingCode } = req.body;
  const rfp = await DropshippingRFP.findById(req.params.id).populate('product');
  if (!rfp) return next(new AppError('درخواست یافت نشد', 404));
  if (String(rfp.provider) !== String(req.user._id)) return next(new AppError('شما اجازه دسترسی ندارید', 403));
  if (!trackingCode) return next(new AppError('کد رهگیری الزامی است', 400));

  if (!['payment_completed', 'shipment_deadline_passed', 'late_ticket_created'].includes(rfp.status)) {
    return next(new AppError('در وضعیت فعلی ثبت کد رهگیری مجاز نیست', 400));
  }

  await rfp.markShipped(trackingCode);
  res.json({ status: 'success', data: pickRfpDetail(rfp, 'provider', rfp.product) });
});

exports.confirmDelivery = catchAsync(async (req, res, next) => {
  const rfp = await DropshippingRFP.findById(req.params.id).populate('product');
  if (!rfp) return next(new AppError('درخواست یافت نشد', 404));

  if (rfp.status !== 'shipped' && rfp.status !== 'delivered_pending_confirmation') {
    return next(new AppError('محصول هنوز ارسال نشده است', 400));
  }

  const role = actorRole(req.user, rfp);
  if (!role) return next(new AppError('شما اجازه دسترسی ندارید', 403));

  const wasCompleted = rfp.status === 'completed';

  if (role === 'provider') await rfp.confirmDeliveryByProvider();
  else await rfp.confirmDeliveryByDropshipper();

  if (!wasCompleted && rfp.status === 'completed') {
    const settlement = dropshippingSettlementService.calculateAmounts(rfp);
    const dropshipperWallet = await Wallet.getOrCreateWallet(rfp.dropshipper);
    const providerWallet = await Wallet.getOrCreateWallet(rfp.provider);

    await dropshipperWallet.releaseBlockedAmount(settlement.grossAmount, 'IRR');
    await providerWallet.deposit(settlement.providerNetAmount, 'IRR');

    await ledgerService.recordDropshippingReleased({
      providerId: rfp.provider,
      providerWalletId: providerWallet._id,
      dropshipperId: rfp.dropshipper,
      amount: settlement.grossAmount,
      feeAmount: settlement.feeAmount,
      netAmount: settlement.providerNetAmount,
      dropshippingRFPId: rfp._id,
      rfpCode: rfp.rfpCode,
      productName: rfp.product?.productName,
      metadata: { source: 'dropshippingRFPController.confirmDelivery.release' },
    });

    await ledgerService.recordDropshippingFee({
      providerId: rfp.provider,
      providerWalletId: providerWallet._id,
      dropshipperId: rfp.dropshipper,
      feeAmount: settlement.feeAmount,
      dropshippingRFPId: rfp._id,
      rfpCode: rfp.rfpCode,
      productName: rfp.product?.productName,
      metadata: { source: 'dropshippingRFPController.confirmDelivery.fee' },
    });

    await ledgerService.markDropshippingPendingIncomingResolved({
      dropshippingRFPId: rfp._id,
      providerId: rfp.provider,
      finalStatus: 'released',
      explainer: 'سفارش تکمیل شد و این مبلغ به کیف پول شما واریز شد.',
      badge: 'success',
    });

    await rfp.save();
  }

  res.json({ status: 'success', data: pickRfpDetail(rfp, role, rfp.product) });
});

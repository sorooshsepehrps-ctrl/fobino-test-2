const TradeContract = require('../models/TradeContract');
const RFP = require('../models/RFP');
const Wallet = require('../models/Wallet');
const Chat = require('../models/Chat');
const asyncHandler = require('express-async-handler');
const ledgerService = require('../services/transactionLedgerService');

exports.createTradeContract = asyncHandler(async (req, res) => {
  const rfp = await RFP.findById(req.params.rfpId)
    .populate('marketingRequest');

  if (!rfp) {
    return res.status(404).json({
      success: false,
      message: 'RFP یافت نشد'
    });
  }

  if (rfp.status !== 'approved') {
    return res.status(400).json({
      success: false,
      message: 'RFP باید تایید شده باشد'
    });
  }

  const isSeller = rfp.seller.toString() === req.user.id;
  const isMarketer = rfp.marketer.toString() === req.user.id;

  if (!isSeller && !isMarketer) {
    return res.status(403).json({
      success: false,
      message: 'فقط فروشنده یا بازاریاب می‌توانند قرارداد ایجاد کنند'
    });
  }

  const existingContract = await TradeContract.findOne({ rfp: rfp._id });
  if (existingContract) {
    return res.status(400).json({
      success: false,
      message: 'قرارداد برای این RFP قبلا ایجاد شده است',
      data: existingContract
    });
  }

  const tradeContract = await TradeContract.create({
    rfp: rfp._id,
    marketingRequest: rfp.marketingRequest._id,
    seller: rfp.seller,
    marketer: rfp.marketer,
    contractTerms: rfp.proposedTerms,
    commission: {
      percent: rfp.commission.percent,
      amount: rfp.commission.amount,
      status: 'pending'
    },
    financials: {
      commissionGrossAmount: rfp.commission.amount || 0,
      platformFeeAmount: 0,
      marketerNetAmount: rfp.commission.amount || 0,
      settlementStatus: 'none'
    },
    status: 'waiting_buyer'
  });

  tradeContract.addToTimeline(
    'contract_created',
    'Trade contract created and waiting for buyer',
    req.user.id
  );

  await tradeContract.save();

  await tradeContract.populate('seller', 'firstName lastName profileImage');
  await tradeContract.populate('marketer', 'firstName lastName profileImage');
  await tradeContract.populate('marketingRequest', 'productName brand');

  res.status(201).json({
    success: true,
    message: 'قرارداد تجاری با موفقیت ایجاد شد',
    data: tradeContract
  });
});

exports.connectBuyerToContract = asyncHandler(async (req, res) => {
  const { contractCode } = req.body;

  const tradeContract = await TradeContract.findOne({ contractCode })
    .populate('seller', 'firstName lastName profileImage')
    .populate('marketer', 'firstName lastName profileImage')
    .populate('marketingRequest', 'productName brand images');

  if (!tradeContract) {
    return res.status(404).json({
      success: false,
      message: 'کد قرارداد نامعتبر است'
    });
  }

  if (tradeContract.status !== 'waiting_buyer') {
    return res.status(400).json({
      success: false,
      message: 'این قرارداد در حالت انتظار خریدار نیست'
    });
  }

  await tradeContract.connectBuyer(req.user.id);

  res.status(200).json({
    success: true,
    message: 'شما با موفقیت به قرارداد متصل شدید',
    data: tradeContract
  });
});

exports.approveBuyerContract = asyncHandler(async (req, res) => {
  const tradeContract = await TradeContract.findById(req.params.id)
    .populate('seller', 'firstName lastName profileImage')
    .populate('marketer', 'firstName lastName profileImage')
    .populate('marketingRequest', 'productName brand');

  if (!tradeContract) {
    return res.status(404).json({
      success: false,
      message: 'قرارداد یافت نشد'
    });
  }

  if (tradeContract.buyer.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'فقط خریدار می‌تواند قرارداد را تایید کند'
    });
  }

  if (tradeContract.status !== 'buyer_connected') {
    return res.status(400).json({
      success: false,
      message: 'وضعیت قرارداد مناسب نیست'
    });
  }

  await tradeContract.approveBuyer();

  res.status(200).json({
    success: true,
    message: 'قرارداد با موفقیت تایید شد. لطفا کمیسیون را واریز کنید',
    data: tradeContract
  });
});

exports.rejectBuyerContract = asyncHandler(async (req, res) => {
  const tradeContract = await TradeContract.findById(req.params.id);

  if (!tradeContract) {
    return res.status(404).json({
      success: false,
      message: 'قرارداد یافت نشد'
    });
  }

  if (tradeContract.buyer.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'فقط خریدار می‌تواند قرارداد را رد کند'
    });
  }

  const { reason } = req.body;
  await tradeContract.rejectBuyer(reason || 'عدم تمایل خریدار');

  res.status(200).json({
    success: true,
    message: 'قرارداد رد شد'
  });
});

exports.depositCommission = asyncHandler(async (req, res) => {
  const tradeContract = await TradeContract.findById(req.params.id)
    .populate('seller', 'firstName lastName profileImage phone email')
    .populate('marketer', 'firstName lastName profileImage phone email')
    .populate('marketingRequest', 'productName brand');

  if (!tradeContract) {
    return res.status(404).json({
      success: false,
      message: 'قرارداد یافت نشد'
    });
  }

  if (tradeContract.buyer.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'فقط خریدار می‌تواند کمیسیون را واریز کند'
    });
  }

  if (tradeContract.status !== 'buyer_approved') {
    return res.status(400).json({
      success: false,
      message: 'ابتدا باید قرارداد را تایید کنید'
    });
  }

  const buyerWallet = await Wallet.getOrCreateWallet(req.user.id);
  const marketerWallet = await Wallet.getOrCreateWallet(tradeContract.marketer);
  const commissionAmount = tradeContract.commission.amount;

  if (!buyerWallet.hasSufficientBalance(commissionAmount, 'IRR')) {
    return res.status(400).json({
      success: false,
      message: 'موجودی کیف پول شما کافی نیست',
      required: commissionAmount,
      available: buyerWallet.balances.IRR.available
    });
  }

  await buyerWallet.blockAmount(commissionAmount, 'IRR');

  const buyerTx = await ledgerService.recordMarketingBlocked({
    buyerId: req.user.id,
    buyerWalletId: buyerWallet._id,
    marketerId: tradeContract.marketer._id || tradeContract.marketer,
    amount: commissionAmount,
    feeAmount: 0,
    netAmount: commissionAmount,
    tradeContractId: tradeContract._id,
    contractCode: tradeContract.contractCode,
    metadata: {
      source: 'tradeContractController.depositCommission'
    }
  });

  await ledgerService.recordMarketingPendingIncoming({
    marketerId: tradeContract.marketer._id || tradeContract.marketer,
    marketerWalletId: marketerWallet._id,
    buyerId: tradeContract.buyer,
    amount: commissionAmount,
    feeAmount: 0,
    netAmount: commissionAmount,
    tradeContractId: tradeContract._id,
    contractCode: tradeContract.contractCode,
    metadata: {
      source: 'tradeContractController.depositCommission.pendingIncoming'
    }
  });

  await tradeContract.depositCommission(
    buyerTx.transactionNumber,
    commissionAmount,
    buyerTx._id
  );

  const chat = await Chat.getOrCreateTradeContractChat(
    tradeContract._id,
    [
      { user: tradeContract.buyer, role: 'buyer' },
      { user: tradeContract.seller, role: 'seller' }
    ],
    'marketing_contract'
  );

  await tradeContract.shareContacts(chat._id);

  await tradeContract.populate('seller', 'firstName lastName profileImage phone email');

  res.status(200).json({
    success: true,
    message: 'کمیسیون با موفقیت واریز شد. اطلاعات تماس فروشنده در دسترس است',
    data: {
      contract: tradeContract,
      chat: chat,
      sellerContact: {
        name: `${tradeContract.seller.firstName} ${tradeContract.seller.lastName}`,
        phone: tradeContract.seller.phone,
        email: tradeContract.seller.email
      }
    }
  });
});

exports.getMyContracts = asyncHandler(async (req, res) => {
  const { status, role, page = 1, limit = 10 } = req.query;

  let query = {};

  if (role === 'seller') {
    query.seller = req.user.id;
  } else if (role === 'buyer') {
    query.buyer = req.user.id;
  } else if (role === 'marketer') {
    query.marketer = req.user.id;
  } else {
    query.$or = [
      { seller: req.user.id },
      { buyer: req.user.id },
      { marketer: req.user.id }
    ];
  }

  if (status) query.status = status;

  const skip = (page - 1) * limit;

  const contracts = await TradeContract.find(query)
    .populate('seller', 'firstName lastName profileImage')
    .populate('buyer', 'firstName lastName profileImage')
    .populate('marketer', 'firstName lastName profileImage')
    .populate('marketingRequest', 'productName brand')
    .populate('deal')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await TradeContract.countDocuments(query);

  res.status(200).json({
    success: true,
    data: contracts,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

exports.getContractById = asyncHandler(async (req, res) => {
  const tradeContract = await TradeContract.findById(req.params.id)
    .populate('seller', 'firstName lastName profileImage phone email')
    .populate('buyer', 'firstName lastName profileImage phone email')
    .populate('marketer', 'firstName lastName profileImage phone email')
    .populate('marketingRequest', 'productName brand images')
    .populate('rfp')
    .populate('chat')
    .populate('deal');

  if (!tradeContract) {
    return res.status(404).json({
      success: false,
      message: 'قرارداد یافت نشد'
    });
  }

  const normalize = (value) => {
    if (!value) return null;
    if (value._id) value = value._id;
    return value.toString();
  };

  const userId = req.user.id;
  const sellerId = normalize(tradeContract.seller);
  const marketerId = normalize(tradeContract.marketer);
  const buyerId = normalize(tradeContract.buyer);

  const isParticipant = sellerId === userId || marketerId === userId || buyerId === userId;

  if (!isParticipant) {
    return res.status(403).json({
      success: false,
      message: 'شما مجاز به مشاهده این قرارداد نیستید'
    });
  }

  res.status(200).json({
    success: true,
    data: tradeContract
  });
});

exports.markContractPaymentMethod = asyncHandler(async (req, res) => {
  const { paymentMethod, dealId } = req.body;

  const tradeContract = await TradeContract.findById(req.params.id);

  if (!tradeContract) {
    return res.status(404).json({
      success: false,
      message: 'قرارداد یافت نشد'
    });
  }

  const isSeller = tradeContract.seller.toString() === req.user.id;
  const isBuyer = tradeContract.buyer?.toString() === req.user.id;

  if (!isSeller && !isBuyer) {
    return res.status(403).json({
      success: false,
      message: 'فقط خریدار یا فروشنده می‌توانند روش پرداخت را ثبت کنند'
    });
  }

  await tradeContract.markPaymentMethod(paymentMethod);

  if (dealId) {
    await tradeContract.createDeal(dealId);
  }

  res.status(200).json({
    success: true,
    message: 'روش پرداخت ثبت شد',
    data: tradeContract
  });
});

exports.releaseCommission = asyncHandler(async (req, res) => {
  const tradeContract = await TradeContract.findById(req.params.id)
    .populate('marketer');

  if (!tradeContract) {
    return res.status(404).json({
      success: false,
      message: 'قرارداد یافت نشد'
    });
  }

  if (
    tradeContract.commission.status === 'released' ||
    tradeContract.commission.status === 'released_with_fee'
  ) {
    return res.status(400).json({
      success: false,
      message: 'کمیسیون قبلا آزاد شده است'
    });
  }

  if (tradeContract.commission.status !== 'deposited') {
    return res.status(400).json({
      success: false,
      message: 'کمیسیون هنوز واریز نشده است'
    });
  }

  const usedFobinoSecure = tradeContract.paymentMethodUsed === 'fobino_secure';
  const netCommission = await tradeContract.releaseCommission(usedFobinoSecure);

  const buyerWallet = await Wallet.getOrCreateWallet(tradeContract.buyer);
  await buyerWallet.releaseBlockedAmount(tradeContract.commission.amount, 'IRR');

  const marketerWallet = await Wallet.getOrCreateWallet(tradeContract.marketer);
  await marketerWallet.deposit(netCommission, 'IRR');

  await ledgerService.recordMarketingReleased({
    marketerId: tradeContract.marketer._id || tradeContract.marketer,
    marketerWalletId: marketerWallet._id,
    buyerId: tradeContract.buyer,
    amount: tradeContract.commission.amount,
    feeAmount: tradeContract.commission.fobinoFee,
    netAmount: netCommission,
    tradeContractId: tradeContract._id,
    contractCode: tradeContract.contractCode,
    metadata: {
      usedFobinoSecure,
      source: 'tradeContractController.releaseCommission'
    }
  });

  await ledgerService.recordMarketingFee({
    marketerId: tradeContract.marketer._id || tradeContract.marketer,
    marketerWalletId: marketerWallet._id,
    buyerId: tradeContract.buyer,
    feeAmount: tradeContract.commission.fobinoFee,
    tradeContractId: tradeContract._id,
    contractCode: tradeContract.contractCode,
    metadata: {
      usedFobinoSecure,
      source: 'tradeContractController.releaseCommission.fee'
    }
  });

  await ledgerService.markMarketingPendingIncomingResolved({
    tradeContractId: tradeContract._id,
    marketerId: tradeContract.marketer._id || tradeContract.marketer,
    finalStatus: 'released',
    explainer: 'این کمیسیون آزاد شد و به کیف پول شما واریز شد.',
    badge: 'success',
  });

  res.status(200).json({
    success: true,
    message: 'کمیسیون با موفقیت آزاد شد',
    data: {
      grossCommission: tradeContract.commission.amount,
      fobinoFee: tradeContract.commission.fobinoFee,
      netCommission,
      usedFobinoSecure
    }
  });
});

exports.cancelContract = asyncHandler(async (req, res) => {
  const tradeContract = await TradeContract.findById(req.params.id);

  if (!tradeContract) {
    return res.status(404).json({
      success: false,
      message: 'قرارداد یافت نشد'
    });
  }

  const isParticipant =
    tradeContract.seller.toString() === req.user.id ||
    tradeContract.buyer?.toString() === req.user.id ||
    tradeContract.marketer.toString() === req.user.id;

  if (!isParticipant) {
    return res.status(403).json({
      success: false,
      message: 'شما مجاز به لغو این قرارداد نیستید'
    });
  }

  const { reason } = req.body;
  await tradeContract.cancel(reason || 'درخواست کاربر', req.user.id);

  if (tradeContract.commission.status === 'deposited' || tradeContract.commissionDeposit?.amount) {
    const buyerWallet = await Wallet.getOrCreateWallet(tradeContract.buyer);
    const refundAmount = tradeContract.commission.amount;

    await buyerWallet.unblockAmount(refundAmount, 'IRR');

    await ledgerService.recordMarketingRefunded({
      buyerId: tradeContract.buyer,
      buyerWalletId: buyerWallet._id,
      marketerId: tradeContract.marketer,
      amount: refundAmount,
      tradeContractId: tradeContract._id,
      contractCode: tradeContract.contractCode,
      reason: reason || 'لغو قرارداد و بازگشت کمیسیون',
      metadata: {
        source: 'tradeContractController.cancelContract.refund'
      }
    });

    await ledgerService.markMarketingPendingIncomingResolved({
      tradeContractId: tradeContract._id,
      marketerId: tradeContract.marketer,
      finalStatus: 'refunded',
      explainer: 'این کمیسیون به دلیل لغو قرارداد به کیف پول شما واریز نشد.',
      badge: 'danger',
    });
  }

  res.status(200).json({
    success: true,
    message: 'قرارداد با موفقیت لغو شد'
  });
});
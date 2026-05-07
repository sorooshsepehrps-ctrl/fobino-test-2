const Deal = require('../models/Deal');
const Chat = require('../models/Chat');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const TradeContract = require('../models/TradeContract');

const { asyncHandler } = require('../middleware/errorHandler');
const response = require('../utils/responseFormatter');
const notificationService = require('../services/notificationService');
const { paginationResponse } = require('../utils/helpers');




const escrowService = require('../services/escrowService');
const ledgerService = require('../services/transactionLedgerService');
const userReviewService = require('../services/userReviewService');
const reviewPresenter = require('../utils/presenters/reviewPresenter');
// @desc    Create deal inside a chat (buyer creates)
// @route   POST /api/deals
// @access  Private
exports.createDeal = asyncHandler(async (req, res) => {
  const {
    chatId,
    title,
    unit,
    pricePerUnit,
    count,
    paymentMethod,
    preContractPercentage,
    terms,
    categoryLevel1,
    categoryLevel2,
    categoryLevel3,
    contractCode,
    tradeContractId,
    buyerId,
    sellerId
  } = req.body;

  // Validate chat exists and user is participant
  const chat = await Chat.findById(chatId);
  if (!chat) {
    return response.notFound(res, 'گفتگو یافت نشد');
  }

  if (!chat.isParticipant(req.user._id)) {
    return response.forbidden(res, 'شما در این گفتگو شرکت‌کننده نیستید');
  }

  let finalBuyerId, finalSellerId;
  let rolesExplicitlySet = false;
  
  // Check if roles are defined in the chat
  const buyerParticipant = chat.participants.find(p => p.role === 'buyer');
  const sellerParticipant = chat.participants.find(p => p.role === 'seller');

  // Case 1: Roles are defined in chat participants (for backward compatibility)
  if (buyerParticipant && sellerParticipant) {
    finalBuyerId = buyerParticipant.user;
    finalSellerId = sellerParticipant.user;
    rolesExplicitlySet = false;
    
    // Only buyer can create a deal when roles are predefined
    if (req.user._id.toString() !== finalBuyerId.toString()) {
      return response.forbidden(res, 'فقط خریدار می‌تواند قرارداد ایجاد کند');
    }
  } 
  // Case 2: Roles are NOT defined, use explicit buyerId and sellerId from request
  else {
    if (!buyerId || !sellerId) {
      return response.error(res, 'شناسه خریدار و فروشنده الزامی است', 400);
    }
    
    finalBuyerId = buyerId;
    finalSellerId = sellerId;
    rolesExplicitlySet = true;
    
    // Verify that the current user is either the buyer or seller
    if (req.user._id.toString() !== finalBuyerId.toString() && 
        req.user._id.toString() !== finalSellerId.toString()) {
      return response.forbidden(res, 'شما باید خریدار یا فروشنده معامله باشید');
    }
    
    // Verify that both buyer and seller are participants in the chat
    const isBuyerInChat = chat.participants.some(p => 
      p.user.toString() === finalBuyerId.toString()
    );
    const isSellerInChat = chat.participants.some(p => 
      p.user.toString() === finalSellerId.toString()
    );
    
    if (!isBuyerInChat || !isSellerInChat) {
      return response.error(res, 'خریدار و فروشنده باید هر دو در گفتگو عضو باشند', 400);
    }
  }

  // Ensure buyer and seller are different
  if (finalBuyerId.toString() === finalSellerId.toString()) {
    return response.error(res, 'خریدار و فروشنده نمی‌توانند یک شخص باشند', 400);
  }

  const totalPrice = pricePerUnit * count;
  let tradeContract = null;
  const chatTradeContractId = chat.tradeContract?._id || chat.tradeContract;

  if (chatTradeContractId) {
    if (!tradeContractId) {
      return response.error(res, 'شناسه قرارداد بازاریابی الزامی است', 400);
    }

    tradeContract = await TradeContract.findById(chatTradeContractId);
    if (!tradeContract) {
      return response.error(res, 'قرارداد بازاریابی یافت نشد', 400);
    }

    if (tradeContractId && tradeContractId.toString() !== tradeContract._id.toString()) {
      return response.error(res, 'شناسه قرارداد بازاریابی نامعتبر است', 400);
    }

    if (!contractCode || tradeContract.contractCode !== contractCode) {
      return response.error(res, 'کد قرارداد بازاریابی نامعتبر است', 400);
    }

    if (!['commission_deposited', 'contacts_shared'].includes(tradeContract.status)) {
      return response.error(res, 'وضعیت قرارداد بازاریابی اجازه ایجاد معامله را نمی‌دهد', 400);
    }

    if (tradeContract.deal) {
      return response.error(res, 'برای این قرارداد بازاریابی قبلاً معامله ایجاد شده است', 400);
    }

    if (tradeContract.buyer && tradeContract.buyer.toString() !== finalBuyerId.toString()) {
      return response.error(res, 'خریدار قرارداد بازاریابی با گفتگو مطابقت ندارد', 400);
    }

    if (tradeContract.seller.toString() !== finalSellerId.toString()) {
      return response.error(res, 'فروشنده قرارداد بازاریابی با گفتگو مطابقت ندارد', 400);
    }
  }

  // Build deal object - store roles in the deal itself
  const dealData = {
    buyer: finalBuyerId,
    seller: finalSellerId,
    chat: chatId,
    title,
    unit,
    pricePerUnit,
    count,
    totalPrice,
    paymentMethod,
    terms,
    category: {
      level1: categoryLevel1 || undefined,
      level2: categoryLevel2 || undefined,
      level3: categoryLevel3 || undefined
    },
    ...(tradeContract ? { tradeContract: tradeContract._id } : {})
  };

  // Add deal-specific roles if explicitly set
  if (rolesExplicitlySet) {
    dealData.dealRoles = {
      buyer: finalBuyerId,
      seller: finalSellerId,
      explicitlySet: true
    };
  }

  // Handle fobino_secure payment
  if (paymentMethod === 'fobino_secure') {
    if (!preContractPercentage || preContractPercentage < 1 || preContractPercentage > 100) {
      return response.error(res, 'درصد پیش‌قرارداد باید بین ۱ تا ۱۰۰ باشد', 400);
    }

    const preContractAmount = Math.floor(totalPrice * (preContractPercentage / 100));
    const commissionRate = 1;
    const commissionAmount = Math.floor(preContractAmount * (commissionRate / 100));
    const sellerNetAmount = preContractAmount - commissionAmount;

    const buyerWallet = await Wallet.getOrCreateWallet(finalBuyerId);
    if (!buyerWallet.hasSufficientBalance(preContractAmount, 'IRR')) {
      return response.error(res, 'موجودی کیف پول کافی نیست', 400);
    }

    await buyerWallet.blockAmount(preContractAmount, 'IRR');

    dealData.preContract = {
      percentage: preContractPercentage,
      amount: preContractAmount,
      depositedAt: new Date()
    };

    dealData.commission = {
      rate: commissionRate,
      amount: commissionAmount
    };

    dealData.financials = {
      escrowAmount: preContractAmount,
      platformFeeAmount: commissionAmount,
      sellerNetAmount,
      settlementStatus: 'blocked_for_future_release'
    };
  }

  const deal = new Deal(dealData);
  await deal.save();

  if (deal.paymentMethod === 'fobino_secure' && deal.preContract?.amount > 0) {
    const buyerWallet = await Wallet.getOrCreateWallet(deal.buyer);
    const sellerWallet = await Wallet.getOrCreateWallet(deal.seller);

    const buyerTx = await ledgerService.recordSecureDealBlocked({
      buyerId: deal.buyer,
      buyerWalletId: buyerWallet._id,
      sellerId: deal.seller,
      amount: deal.preContract.amount,
      feeAmount: deal.financials?.platformFeeAmount || deal.commission?.amount || 0,
      netAmount: deal.financials?.sellerNetAmount || (deal.preContract.amount - (deal.commission?.amount || 0)),
      dealId: deal._id,
      dealNumber: deal.dealNumber,
      title: deal.title,
      preContractPercentage: deal.preContract.percentage,
      metadata: {
        source: 'dealController.createDeal',
      },
    });

    await ledgerService.recordSecureDealPendingIncoming({
      sellerId: deal.seller,
      sellerWalletId: sellerWallet._id,
      buyerId: deal.buyer,
      amount: deal.preContract.amount,
      feeAmount: deal.financials?.platformFeeAmount || deal.commission?.amount || 0,
      netAmount: deal.financials?.sellerNetAmount || (deal.preContract.amount - (deal.commission?.amount || 0)),
      dealId: deal._id,
      dealNumber: deal.dealNumber,
      title: deal.title,
      metadata: {
        source: 'dealController.createDeal.pendingIncoming',
      },
    });

    deal.preContract.transactionId = buyerTx.transactionNumber;
    await deal.save();
  }

  await deal.addHistory('created', 'pending', 'قرارداد ایجاد شد - در انتظار تایید فروشنده', req.user._id);

  if (tradeContract) {
    await tradeContract.markPaymentMethod(paymentMethod === 'fobino_secure' ? 'fobino_secure' : 'external');
    await tradeContract.createDeal(deal._id);
  }

  // Add deal to chat's deals array
  await Chat.findByIdAndUpdate(chatId, {
    $push: { deals: deal._id }
  });

  // IMPORTANT: Do NOT update chat participant roles
  // Each deal maintains its own roles independently

  return response.created(res, { 
    deal,
    message: rolesExplicitlySet 
      ? 'قرارداد با موفقیت ایجاد شد (نقش‌ها برای این قرارداد ثبت شد)'
      : 'قرارداد با موفقیت ایجاد شد'
  }, 'قرارداد با موفقیت ایجاد شد');
});

// Additional helper method to get deal with proper role resolution
exports.getDeal = asyncHandler(async (req, res) => {
  const { dealId } = req.params;
  
  const deal = await Deal.findById(dealId)
    .populate('buyer', 'fullName name username avatar')
    .populate('seller', 'fullName name username avatar')
    .populate('dealRoles.buyer', 'fullName name username avatar')
    .populate('dealRoles.seller', 'fullName name username avatar')
    .populate('chat')
    .populate('shipping')
    .populate('inspection');
  
  if (!deal) {
    return response.notFound(res, 'قرارداد یافت نشد');
  }
  
  // Check if user is participant
  if (!deal.isParticipant(req.user._id)) {
    return response.forbidden(res, 'شما دسترسی به این قرارداد ندارید');
  }
  
  // Add resolved roles to response
  const dealResponse = deal.toObject();
  dealResponse.resolvedRoles = {
    buyer: deal.getEffectiveBuyer(),
    seller: deal.getEffectiveSeller()
  };
  
  return response.success(res, dealResponse);
});
// @desc    Seller verifies/opens the deal
// @route   POST /api/deals/:id/verify
// @access  Private (seller only)
exports.verifyDeal = asyncHandler(async (req, res) => {
  const deal = await Deal.findById(req.params.id);

  if (!deal) {
    return response.notFound(res, 'قرارداد یافت نشد');
  }

  if (deal.seller.toString() !== req.user._id.toString()) {
    return response.forbidden(res, 'فقط فروشنده می‌تواند قرارداد را تایید کند');
  }

  if (deal.status !== 'pending') {
    return response.error(res, 'فقط قراردادهای در انتظار تایید قابل تایید هستند', 400);
  }

  deal.status = 'open';
  await deal.addHistory('verified', 'open', 'قرارداد توسط فروشنده تایید شد', req.user._id);

  // Notify buyer (disabled for now)
  // await notificationService.notifyDealCreated(deal.buyer, deal.dealNumber, deal._id);

  return response.success(res, { deal }, 'قرارداد تایید و باز شد');
});

// @desc    Seller marks deal as shipped
// @route   POST /api/deals/:id/ship
// @access  Private (seller only)
exports.shipDeal = asyncHandler(async (req, res) => {
  const deal = await Deal.findById(req.params.id);

  if (!deal) {
    return response.notFound(res, 'قرارداد یافت نشد');
  }

  if (deal.seller.toString() !== req.user._id.toString()) {
    return response.forbidden(res, 'فقط فروشنده می‌تواند وضعیت ارسال را تغییر دهد');
  }

  if (deal.status !== 'open') {
    return response.error(res, 'فقط قراردادهای باز قابل ارسال هستند', 400);
  }

  deal.status = 'shipped';
  await deal.addHistory('shipped', 'shipped', 'سفارش ارسال شد', req.user._id);

  // Notify buyer (temporarily disabled)
  // await notificationService.notifyProductShipped(deal.buyer, deal.dealNumber, deal._id);

  return response.success(res, { deal }, 'وضعیت به ارسال شده تغییر کرد');
});

// @desc    Buyer marks deal as delivered
// @route   POST /api/deals/:id/deliver
// @access  Private (buyer only)
exports.deliverDeal = asyncHandler(async (req, res) => {
  const deal = await Deal.findById(req.params.id);

  if (!deal) {
    return response.notFound(res, 'قرارداد یافت نشد');
  }

  if (deal.buyer.toString() !== req.user._id.toString()) {
    return response.forbidden(res, 'فقط خریدار می‌تواند تحویل را تایید کند');
  }

  if (deal.status !== 'shipped') {
    return response.error(res, 'فقط قراردادهای ارسال شده قابل تحویل هستند', 400);
  }

  deal.status = 'delivered';
  await deal.addHistory('delivered', 'delivered', 'سفارش تحویل داده شد', req.user._id);

  // Notify seller (temporarily disabled)
  // await notificationService.notifyDeliveryConfirmed(deal.seller, deal.dealNumber, deal._id);

  return response.success(res, { deal }, 'وضعیت به تحویل داده شده تغییر کرد');
});

// @desc    Buyer confirms the deal (releases money to seller)
// @route   POST /api/deals/:id/confirm
// @access  Private (buyer only)
exports.confirmDeal = asyncHandler(async (req, res) => {
  const deal = await Deal.findById(req.params.id);

  if (!deal) {
    return response.notFound(res, 'قرارداد یافت نشد');
  }

  if (deal.buyer.toString() !== req.user._id.toString()) {
    return response.forbidden(res, 'فقط خریدار می‌تواند قرارداد را تایید نهایی کند');
  }

  if (deal.status !== 'delivered') {
    return response.error(res, 'فقط قراردادهای تحویل داده شده قابل تایید نهایی هستند', 400);
  }

  // Handle fobino_secure payment release
  if (deal.paymentMethod === 'fobino_secure' && deal.preContract.amount > 0) {
    await escrowService.release(deal._id, req.user._id);
    deal.financials = {
      ...(deal.financials || {}),
      settlementStatus: 'released_to_beneficiary',
      escrowAmount: deal.preContract.amount,
      platformFeeAmount: deal.commission.amount,
      sellerNetAmount: deal.preContract.amount - deal.commission.amount,
    };
  }

  if (deal.tradeContract) {
    const tradeContract = await TradeContract.findById(deal.tradeContract);
    if (tradeContract) {
      if (tradeContract.paymentMethodUsed === 'unknown') {
        await tradeContract.markPaymentMethod(deal.paymentMethod === 'fobino_secure' ? 'fobino_secure' : 'external');
      }

      if (tradeContract.commission.status !== 'deposited') {
        return response.error(res, 'کمیسیون قرارداد بازاریابی هنوز واریز نشده است', 400);
      }

      const usedFobinoSecure = deal.paymentMethod === 'fobino_secure';
      const netCommission = await tradeContract.releaseCommission(usedFobinoSecure);

      const buyerWallet = await Wallet.getOrCreateWallet(tradeContract.buyer);
      await buyerWallet.releaseBlockedAmount(tradeContract.commission.amount, 'IRR');

      const marketerWallet = await Wallet.getOrCreateWallet(tradeContract.marketer);
      await marketerWallet.deposit(netCommission, 'IRR');

      await Transaction.create({
        user: tradeContract.marketer,
        wallet: marketerWallet._id,
        type: 'commission_received',
        amount: netCommission,
        currency: 'IRR',
        status: 'completed',
        description: `دریافت کمیسیون برای قرارداد ${tradeContract.contractCode}`,
        relatedTradeContract: tradeContract._id,
        completedAt: new Date(),
        metadata: {
          grossCommission: tradeContract.commission.amount,
          fobinoFee: tradeContract.commission.fobinoFee,
          usedFobinoSecure
        }
      });

      if (tradeContract.commission.fobinoFee > 0) {
        await Transaction.create({
          user: tradeContract.marketer,
          wallet: marketerWallet._id,
          type: 'platform_fee',
          amount: -tradeContract.commission.fobinoFee,
          currency: 'IRR',
          status: 'completed',
          description: `کارمزد فوبینو برای قرارداد ${tradeContract.contractCode}`,
          relatedTradeContract: tradeContract._id,
          completedAt: new Date()
        });
      }
    }
  }

  deal.status = 'confirmed';
  deal.completedAt = new Date();
  await deal.addHistory('confirmed', 'confirmed', 'قرارداد تایید نهایی شد و وجه آزاد گردید', req.user._id, {
    sellerReceived: deal.preContract.amount - deal.commission.amount,
    commission: deal.commission.amount
  });

  // Update user stats
  const User = require('../models/User');
  await User.findByIdAndUpdate(deal.buyer, {
    $inc: { 'stats.totalDeals': 1, 'stats.successfulDeals': 1 }
  });
  await User.findByIdAndUpdate(deal.seller, {
    $inc: {
      'stats.totalDeals': 1,
      'stats.successfulDeals': 1,
      'stats.totalRevenue': deal.preContract.amount - deal.commission.amount
    }
  });

  // Notify seller (temporarily disabled)
  // await notificationService.notifyDeliveryConfirmed(deal.seller, deal.dealNumber, deal._id);

  return response.success(res, { deal }, 'قرارداد تایید نهایی شد');
});

// @desc    Get completed deals that still need user's review
// @route   GET /api/deals/reviewable
// @access  Private
exports.getReviewableDeals = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
  const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);

  const query = {
    status: { $in: ['confirmed', 'completed'] },
    $or: [
      { buyer: req.user._id },
      { seller: req.user._id }
    ]
  };

  const [total, deals] = await Promise.all([
    Deal.countDocuments(query),
    Deal.find(query)
      .sort({ completedAt: -1, updatedAt: -1 })
      .skip((parsedPage - 1) * parsedLimit)
      .limit(parsedLimit)
      .populate('buyer', 'firstName lastName profileImage publicSlug publicProfile')
      .populate('seller', 'firstName lastName profileImage publicSlug publicProfile')
      .populate('shipping')
      .lean()
  ]);

  const items = [];
  for (const deal of deals) {
    const eligibility = await userReviewService.getDealReviewEligibility({ dealId: deal._id, userId: req.user._id });
    items.push({
      ...deal,
      userRole: deal.buyer?._id?.toString?.() === req.user._id.toString() ? 'buyer' : 'seller',
      reviewEligibility: reviewPresenter.presentEligibility(eligibility)
    });
  }

  return response.paginated(
    res,
    items,
    paginationResponse(total, parsedPage, parsedLimit),
    'معاملات قابل نظر دریافت شد'
  );
});

// @desc    Get user's deals
// @route   GET /api/deals
// @access  Private
exports.getDeals = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, role } = req.query;

  const query = {
    $or: [
      { buyer: req.user._id },
      { seller: req.user._id }
    ]
  };

  if (status) query.status = status;
  if (role === 'buyer') {
    delete query.$or;
    query.buyer = req.user._id;
  } else if (role === 'seller') {
    delete query.$or;
    query.seller = req.user._id;
  }

  const total = await Deal.countDocuments(query);
  const deals = await Deal.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .populate('buyer', 'firstName lastName profileImage')
    .populate('seller', 'firstName lastName profileImage')
    .populate('chat', '_id')
    .populate('shipping')
    .populate('inspection')
    .lean();

  const dealsWithRole = deals.map(deal => ({
    ...deal,
    userRole: deal.buyer._id.toString() === req.user._id.toString() ? 'buyer' : 'seller'
  }));

  return response.paginated(res, dealsWithRole, paginationResponse(total, page, limit));
});

// @desc    Get single deal
// @route   GET /api/deals/:id
// @access  Private
exports.getDeal = asyncHandler(async (req, res) => {
  const deal = await Deal.findById(req.params.id)
    .populate('buyer', 'firstName lastName profileImage phone verifications')
    .populate('seller', 'firstName lastName profileImage phone verifications')
    .populate('chat')
    .populate('shipping')
    .populate('inspection')
    .populate('dispute')
    .populate('category.level1', 'name')
    .populate('category.level2', 'name')
    .populate('category.level3', 'name');

  if (!deal) {
    return response.notFound(res, 'قرارداد یافت نشد');
  }

  const isBuyer = deal.buyer._id.toString() === req.user._id.toString();
  const isSeller = deal.seller._id.toString() === req.user._id.toString();

  if (!isBuyer && !isSeller) {
    return response.forbidden(res, 'شما در این قرارداد شرکت‌کننده نیستید');
  }

  const reviewEligibility = await userReviewService.getDealReviewEligibility({
    dealId: deal._id,
    userId: req.user._id
  });

  return response.success(res, {
    deal,
    userRole: isBuyer ? 'buyer' : 'seller',
    reviewEligibility: reviewPresenter.presentEligibility(reviewEligibility)
  });
});

// @desc    Get deal timeline
// @route   GET /api/deals/:id/timeline
// @access  Private
exports.getTimeline = asyncHandler(async (req, res) => {
  const deal = await Deal.findById(req.params.id)
    .populate('history.performedBy', 'firstName lastName');

  if (!deal) {
    return response.notFound(res, 'قرارداد یافت نشد');
  }

  const isBuyer = deal.buyer.toString() === req.user._id.toString();
  const isSeller = deal.seller.toString() === req.user._id.toString();

  if (!isBuyer && !isSeller) {
    return response.forbidden(res, 'شما در این قرارداد شرکت‌کننده نیستید');
  }

  return response.success(res, { timeline: deal.history });
});

// @desc    Cancel deal
// @route   POST /api/deals/:id/cancel
// @access  Private
exports.cancelDeal = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const deal = await Deal.findById(req.params.id);

  if (!deal) {
    return response.notFound(res, 'قرارداد یافت نشد');
  }

  const isBuyer = deal.buyer.toString() === req.user._id.toString();
  const isSeller = deal.seller.toString() === req.user._id.toString();

  if (!isBuyer && !isSeller) {
    return response.forbidden(res, 'شما در این قرارداد شرکت‌کننده نیستید');
  }

  if (!['pending', 'open'].includes(deal.status)) {
    return response.error(res, 'در این مرحله امکان لغو وجود ندارد', 400);
  }

  // If fobino_secure and money was blocked, refund
  if (deal.paymentMethod === 'fobino_secure' && deal.preContract.amount > 0) {
    await escrowService.refund(deal._id, req.user._id, reason || 'لغو قرارداد');
    deal.financials = {
      ...(deal.financials || {}),
      settlementStatus: 'refunded_to_buyer',
      escrowAmount: deal.preContract.amount,
      platformFeeAmount: 0,
      sellerNetAmount: 0,
    };
  }

  deal.status = 'cancelled';
  deal.cancellation = {
    cancelledBy: req.user._id,
    cancelledAt: new Date(),
    reason
  };
  await deal.addHistory('cancelled', 'cancelled', reason, req.user._id);

  // Notify other party (temporarily disabled)
  // const otherParty = isBuyer ? deal.seller : deal.buyer;
  // await notificationService.notifyDealCreated(otherParty, deal.dealNumber, deal._id);

  return response.success(res, { deal }, 'قرارداد لغو شد');
});

// @desc    Open dispute
// @route   POST /api/deals/:id/dispute
// @access  Private
exports.openDispute = asyncHandler(async (req, res) => {
  const { reason, description } = req.body;

  const deal = await Deal.findById(req.params.id);

  if (!deal) {
    return response.notFound(res, 'قرارداد یافت نشد');
  }

  const isBuyer = deal.buyer.toString() === req.user._id.toString();
  const isSeller = deal.seller.toString() === req.user._id.toString();

  if (!isBuyer && !isSeller) {
    return response.forbidden(res, 'شما در این قرارداد شرکت‌کننده نیستید');
  }

  if (deal.status === 'disputed') {
    return response.error(res, 'اختلاف قبلاً ثبت شده است', 400);
  }

  const Dispute = require('../models/Dispute');
  const dispute = new Dispute({
    deal: deal._id,
    buyer: deal.buyer,
    seller: deal.seller,
    openedBy: req.user._id,
    reason,
    description
  });

  await dispute.save();
  await deal.openDispute(dispute._id, req.user._id, reason);

  // Notify other party (temporarily disabled)
  // const otherParty = isBuyer ? deal.seller : deal.buyer;
  // await notificationService.notifyDisputeOpened(otherParty, deal.dealNumber, dispute._id, deal._id);

  return response.created(res, { dispute, deal }, 'اختلاف ثبت شد');
});
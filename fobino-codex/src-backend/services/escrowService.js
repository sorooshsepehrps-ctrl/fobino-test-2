const Deal = require('../models/Deal');
const Wallet = require('../models/Wallet');
const notificationService = require('./notificationService');
const logger = require('../utils/logger');
const ledgerService = require('./transactionLedgerService');

class EscrowService {
  calculateSettlement(amount, feePercent = 1) {
    const grossAmount = Math.abs(amount || 0);
    const feeAmount = Math.floor(grossAmount * (feePercent / 100));
    const netAmount = grossAmount - feeAmount;

    return {
      grossAmount,
      feePercent,
      feeAmount,
      netAmount,
    };
  }

  buildDealSnapshot(deal) {
    const grossAmount = deal?.preContract?.amount || deal?.escrow?.amount || 0;
    const feePercent = deal?.commission?.rate || 1;
    const settlement = this.calculateSettlement(grossAmount, feePercent);

    return {
      grossAmount: settlement.grossAmount,
      feePercent: settlement.feePercent,
      feeAmount: settlement.feeAmount,
      netAmount: settlement.netAmount,
      dealNumber: deal.dealNumber,
      title: deal.title,
    };
  }

  async deposit(dealId, userId, paymentMethod = 'wallet') {
    const deal = await Deal.findById(dealId);

    if (!deal) {
      throw new Error('معامله یافت نشد');
    }

    if (deal.buyer.toString() !== userId.toString()) {
      throw new Error('فقط خریدار می‌تواند به حساب امن واریز کند');
    }

    if (!['pending', 'open'].includes(deal.status)) {
      throw new Error('وضعیت معامله اجازه بلوکه شدن مبلغ را نمی‌دهد');
    }

    const amount =
      deal.preContract?.amount ||
      deal.escrow?.amount ||
      deal.totalPrice;

    if (paymentMethod !== 'wallet') {
      throw new Error('روش پرداخت پشتیبانی نمی‌شود');
    }

    const buyerWallet = await Wallet.getOrCreateWallet(userId);
    if (!buyerWallet.hasSufficientBalance(amount, 'IRR')) {
      throw new Error('موجودی کیف پول کافی نیست');
    }

    const sellerWallet = await Wallet.getOrCreateWallet(deal.seller);
    const settlement = this.buildDealSnapshot(deal);

    await buyerWallet.blockAmount(amount, 'IRR');

    const buyerTx = await ledgerService.recordSecureDealBlocked({
      buyerId: userId,
      buyerWalletId: buyerWallet._id,
      sellerId: deal.seller,
      amount,
      feeAmount: settlement.feeAmount,
      netAmount: settlement.netAmount,
      dealId: deal._id,
      dealNumber: deal.dealNumber,
      title: deal.title,
      preContractPercentage: deal.preContract?.percentage || 100,
      metadata: {
        source: 'escrowService.deposit',
      },
    });

    await ledgerService.recordSecureDealPendingIncoming({
      sellerId: deal.seller,
      sellerWalletId: sellerWallet._id,
      buyerId: deal.buyer,
      amount,
      feeAmount: settlement.feeAmount,
      netAmount: settlement.netAmount,
      dealId: deal._id,
      dealNumber: deal.dealNumber,
      title: deal.title,
      metadata: {
        source: 'escrowService.deposit.pendingIncoming',
      },
    });

    if (!deal.preContract) deal.preContract = {};
    deal.preContract.transactionId = buyerTx.transactionNumber;
    deal.preContract.depositedAt = new Date();

    if (!deal.financials) deal.financials = {};
    deal.financials.escrowAmount = settlement.grossAmount;
    deal.financials.platformFeeAmount = settlement.feeAmount;
    deal.financials.sellerNetAmount = settlement.netAmount;
    deal.financials.settlementStatus = 'blocked_for_future_release';

    await deal.addHistory(
      'escrow_blocked',
      deal.status,
      `مبلغ ${settlement.grossAmount} ریال برای قرارداد بلوکه شد`,
      userId,
      {
        grossAmount: settlement.grossAmount,
        feeAmount: settlement.feeAmount,
        netAmount: settlement.netAmount,
      }
    );

    await deal.save();

    await notificationService.notifyPaymentReceived?.(deal.seller, amount, dealId);

    return {
      success: true,
      transactionId: buyerTx.transactionNumber,
      deal,
      settlement,
    };
  }

  async release(dealId, adminId = null) {
    const deal = await Deal.findById(dealId);

    if (!deal) {
      throw new Error('معامله یافت نشد');
    }

    const amount =
      deal.preContract?.amount ||
      deal.escrow?.amount ||
      deal.totalPrice;

    const settlement = this.buildDealSnapshot(deal);
    const buyerWallet = await Wallet.getOrCreateWallet(deal.buyer);
    const sellerWallet = await Wallet.getOrCreateWallet(deal.seller);

    await buyerWallet.releaseBlockedAmount(amount, 'IRR');
    await sellerWallet.deposit(settlement.netAmount, 'IRR');

    const releaseTx = await ledgerService.recordSecureDealReleased({
      sellerId: deal.seller,
      sellerWalletId: sellerWallet._id,
      buyerId: deal.buyer,
      amount,
      feeAmount: settlement.feeAmount,
      netAmount: settlement.netAmount,
      dealId: deal._id,
      dealNumber: deal.dealNumber,
      title: deal.title,
      metadata: {
        source: 'escrowService.release',
      },
    });

    await ledgerService.recordDealCommission({
      sellerId: deal.seller,
      sellerWalletId: sellerWallet._id,
      buyerId: deal.buyer,
      feeAmount: settlement.feeAmount,
      dealId: deal._id,
      dealNumber: deal.dealNumber,
      title: deal.title,
      metadata: {
        source: 'escrowService.release.commission',
      },
    });

    await ledgerService.markDealPendingIncomingResolved({
      dealId: deal._id,
      sellerId: deal.seller,
      finalStatus: 'released',
      explainer: 'معامله نهایی شد و این دریافتی به کیف پول شما واریز شد.',
      badge: 'success',
    });

    if (!deal.financials) deal.financials = {};
    deal.financials.escrowAmount = settlement.grossAmount;
    deal.financials.platformFeeAmount = settlement.feeAmount;
    deal.financials.sellerNetAmount = settlement.netAmount;
    deal.financials.settlementStatus = 'released_to_beneficiary';

    deal.status = 'confirmed';
    deal.completedAt = new Date();

    await deal.addHistory(
      'escrow_released',
      'confirmed',
      `وجه قرارداد آزاد شد. مبلغ خالص فروشنده: ${settlement.netAmount} ریال`,
      adminId || deal.buyer,
      {
        grossAmount: settlement.grossAmount,
        feeAmount: settlement.feeAmount,
        netAmount: settlement.netAmount,
      }
    );

    await deal.save();

    return {
      success: true,
      releasedAmount: settlement.netAmount,
      commission: settlement.feeAmount,
      transactionId: releaseTx.transactionNumber,
    };
  }

  async refund(dealId, adminId, reason = '') {
    const deal = await Deal.findById(dealId);

    if (!deal) {
      throw new Error('معامله یافت نشد');
    }

    const amount =
      deal.preContract?.amount ||
      deal.escrow?.amount ||
      deal.totalPrice;

    const buyerWallet = await Wallet.getOrCreateWallet(deal.buyer);

    await buyerWallet.unblockAmount(amount, 'IRR');

    const refundTx = await ledgerService.recordSecureDealRefunded({
      buyerId: deal.buyer,
      buyerWalletId: buyerWallet._id,
      sellerId: deal.seller,
      amount,
      dealId: deal._id,
      dealNumber: deal.dealNumber,
      title: deal.title,
      reason,
      metadata: {
        source: 'escrowService.refund',
      },
    });

    await ledgerService.markDealPendingIncomingResolved({
      dealId: deal._id,
      sellerId: deal.seller,
      finalStatus: 'refunded',
      explainer: 'این دریافتی به دلیل لغو یا بازگشت وجه، به کیف پول شما واریز نشد.',
      badge: 'danger',
    });

    if (!deal.financials) deal.financials = {};
    deal.financials.escrowAmount = amount;
    deal.financials.platformFeeAmount = 0;
    deal.financials.sellerNetAmount = 0;
    deal.financials.settlementStatus = 'refunded_to_buyer';

    deal.status = 'refunded';
    deal.cancellation = {
      cancelledBy: adminId,
      cancelledAt: new Date(),
      reason,
      refundAmount: amount,
      refundTransactionId: refundTx.transactionNumber,
    };

    await deal.addHistory(
      'refunded',
      'refunded',
      `وجه به خریدار بازگردانده شد: ${reason}`,
      adminId,
      { refundAmount: amount }
    );

    await deal.save();

    return {
      success: true,
      refundedAmount: amount,
      transactionId: refundTx.transactionNumber,
    };
  }

  async getStatus(dealId, userId) {
    const deal = await Deal.findById(dealId);

    if (!deal) {
      throw new Error('معامله یافت نشد');
    }

    if (
      deal.buyer.toString() !== userId.toString() &&
      deal.seller.toString() !== userId.toString()
    ) {
      throw new Error('شما در این معامله شرکت‌کننده نیستید');
    }

    return {
      dealNumber: deal.dealNumber,
      amount: deal.preContract?.amount || deal.escrow?.amount || deal.totalPrice,
      status: deal.financials?.settlementStatus || deal.status,
      depositedAt: deal.preContract?.depositedAt,
      releasedAt: deal.completedAt,
      releasedAmount: deal.financials?.sellerNetAmount || 0,
      commission: deal.financials?.platformFeeAmount || deal.commission?.amount || 0,
    };
  }
}

module.exports = new EscrowService();
const Transaction = require('../models/Transaction');
const { presentTransaction } = require('../utils/transactionPresenter');

function createDisplay({ title, subtitle, explainer, badge, previewNetAmount, previewFeeAmount }) {
  return {
    title,
    subtitle,
    explainer,
    badge,
    previewNetAmount,
    previewFeeAmount,
  };
}

async function createEntry(payload) {
  return Transaction.create(payload);
}

async function recordWalletDepositInitiated({
  userId,
  walletId,
  amount,
  currency = 'IRR',
  gatewayName = 'zarinpal',
  authority = null,
  metadata = {},
}) {
  return createEntry({
    user: userId,
    wallet: walletId,
    type: 'deposit',
    domain: 'wallet',
    flow: 'deposit_init',
    direction: 'in',
    impact: 'no_balance_change',
    amount: Math.abs(amount),
    grossAmount: Math.abs(amount),
    netAmount: Math.abs(amount),
    currency,
    description: 'شارژ کیف پول',
    status: 'pending',
    settlementStatus: 'pending',
    referenceType: 'deposit',
    gateway: {
      name: gatewayName,
      authority,
    },
    display: createDisplay({
      title: 'شارژ کیف پول',
      subtitle: 'در انتظار تایید درگاه',
      explainer: 'پس از تایید درگاه، مبلغ به موجودی قابل استفاده کیف پول اضافه می‌شود.',
      badge: 'pending',
      previewNetAmount: Math.abs(amount),
    }),
    metadata,
  });
}

async function completeWalletDeposit({
  transaction,
  wallet,
  refId = null,
  cardPan = null,
  gatewayFee = null,
}) {
  transaction.flow = 'deposit_verify';
  transaction.status = 'completed';
  transaction.settlementStatus = 'completed';
  transaction.impact = 'available_increase';
  transaction.balanceAfter = wallet.getBalance(transaction.currency).available;
  transaction.completedAt = new Date();
  transaction.timeline = transaction.timeline || {};
  transaction.timeline.settledAt = new Date();

  transaction.gateway = transaction.gateway || {};
  if (refId) transaction.gateway.refId = refId;
  if (cardPan) transaction.gateway.cardPan = cardPan;
  if (gatewayFee !== null && gatewayFee !== undefined) transaction.gateway.fee = gatewayFee;

  transaction.display = createDisplay({
    title: 'شارژ کیف پول',
    subtitle: 'موفق',
    explainer: 'مبلغ با موفقیت به کیف پول اضافه شد.',
    badge: 'success',
    previewNetAmount: Math.abs(transaction.amount),
  });

  await transaction.save();
  return presentTransaction(transaction.toObject());
}

async function failWalletDeposit({ transaction, reason = 'خطا در پرداخت' }) {
  transaction.flow = 'deposit_fail';
  transaction.status = 'failed';
  transaction.settlementStatus = 'failed';
  transaction.failedAt = new Date();
  transaction.timeline = transaction.timeline || {};
  transaction.timeline.failedAt = new Date();
  transaction.metadata = transaction.metadata || {};
  transaction.metadata.notes = reason;

  transaction.display = createDisplay({
    title: 'شارژ کیف پول',
    subtitle: 'ناموفق',
    explainer: reason,
    badge: 'danger',
    previewNetAmount: Math.abs(transaction.amount),
  });

  await transaction.save();
  return presentTransaction(transaction.toObject());
}

async function recordWithdrawalRequested({
  userId,
  walletId,
  amount,
  currency = 'IRR',
  shaba,
  bankName,
  accountHolder,
  metadata = {},
}) {
  return createEntry({
    user: userId,
    wallet: walletId,
    type: 'withdrawal',
    domain: 'withdrawal',
    flow: 'withdraw_request',
    direction: 'hold',
    impact: 'available_to_blocked',
    amount: -Math.abs(amount),
    grossAmount: Math.abs(amount),
    netAmount: Math.abs(amount),
    currency,
    description: 'درخواست برداشت از کیف پول',
    status: 'pending',
    settlementStatus: 'pending',
    referenceType: 'withdrawal',
    withdrawal: {
      shaba,
      bankName,
      accountHolder,
    },
    display: createDisplay({
      title: 'درخواست برداشت',
      subtitle: 'در انتظار بررسی',
      explainer: 'این مبلغ از موجودی قابل استفاده کسر و تا زمان بررسی مسدود شده است.',
      badge: 'pending',
      previewNetAmount: Math.abs(amount),
    }),
    metadata,
  });
}

async function recordWithdrawalCompleted({
  transaction,
  wallet,
  processedBy = null,
  trackingCode = null,
  notes = 'برداشت توسط ادمین تایید شد.',
}) {
  transaction.status = 'completed';
  transaction.flow = 'withdraw_complete';
  transaction.direction = 'out';
  transaction.impact = 'blocked_decrease';
  transaction.settlementStatus = 'completed';
  transaction.completedAt = new Date();
  transaction.timeline = transaction.timeline || {};
  transaction.timeline.settledAt = new Date();
  transaction.balanceAfter = wallet.getBalance(transaction.currency).available;

  transaction.withdrawal = transaction.withdrawal || {};
  if (processedBy) transaction.withdrawal.processedBy = processedBy;
  transaction.withdrawal.processedAt = new Date();
  if (trackingCode) transaction.withdrawal.trackingCode = trackingCode;

  transaction.metadata = transaction.metadata || {};
  transaction.metadata.notes = notes;

  transaction.display = createDisplay({
    title: 'برداشت از کیف پول',
    subtitle: 'تکمیل شده',
    explainer: notes,
    badge: 'success',
    previewNetAmount: Math.abs(transaction.netAmount || transaction.grossAmount || transaction.amount),
  });

  await transaction.save();
  return presentTransaction(transaction.toObject());
}

async function recordWithdrawalRejected({
  transaction,
  wallet,
  processedBy = null,
  rejectionReason = 'درخواست برداشت رد شد و مبلغ به کیف پول برگشت.',
}) {
  transaction.status = 'cancelled';
  transaction.flow = 'withdraw_reject';
  transaction.direction = 'release';
  transaction.impact = 'blocked_to_available';
  transaction.settlementStatus = 'rejected';
  transaction.cancelledAt = new Date();
  transaction.timeline = transaction.timeline || {};
  transaction.timeline.cancelledAt = new Date();
  transaction.balanceAfter = wallet.getBalance(transaction.currency).available;

  transaction.withdrawal = transaction.withdrawal || {};
  if (processedBy) transaction.withdrawal.processedBy = processedBy;
  transaction.withdrawal.processedAt = new Date();
  transaction.withdrawal.rejectionReason = rejectionReason;

  transaction.metadata = transaction.metadata || {};
  transaction.metadata.notes = rejectionReason;

  transaction.display = createDisplay({
    title: 'درخواست برداشت',
    subtitle: 'رد شده',
    explainer: rejectionReason,
    badge: 'danger',
    previewNetAmount: Math.abs(transaction.netAmount || transaction.grossAmount || transaction.amount),
  });

  await transaction.save();
  return presentTransaction(transaction.toObject());
}

async function recordSubscriptionPayment({
  userId,
  walletId,
  subscriptionId = null,
  amount,
  currency = 'IRR',
  planId,
  planName,
  paymentMethod = 'wallet',
  status = 'completed',
  gateway = null,
  metadata = {},
}) {
  const isGatewayPending = paymentMethod === 'gateway' && status === 'pending';

  return createEntry({
    user: userId,
    wallet: walletId,
    type: 'subscription',
    domain: 'subscription',
    flow: isGatewayPending ? 'deposit_init' : 'wallet_payment',
    direction: 'out',
    impact: paymentMethod === 'wallet' ? 'available_decrease' : 'no_balance_change',
    amount: -Math.abs(amount),
    grossAmount: Math.abs(amount),
    netAmount: Math.abs(amount),
    currency,
    description: `خرید اشتراک ${planName}${paymentMethod === 'wallet' ? ' با کیف پول' : ' از طریق درگاه'}`,
    status,
    settlementStatus: status === 'completed' ? 'completed' : status,
    referenceType: 'subscription',
    relatedSubscription: subscriptionId,
    gateway: gateway || undefined,
    metadata: {
      ...metadata,
      paymentMethod,
      planId: String(planId),
      planName,
      source: metadata.source || 'transactionLedgerService.recordSubscriptionPayment',
    },
    display: createDisplay({
      title: 'خرید اشتراک',
      subtitle:
        paymentMethod === 'wallet'
          ? `${planName} · پرداخت با کیف پول`
          : status === 'pending'
          ? `${planName} · در انتظار پرداخت`
          : `${planName} · پرداخت موفق`,
      explainer:
        paymentMethod === 'wallet'
          ? 'هزینه اشتراک از موجودی قابل استفاده کیف پول کسر شد.'
          : status === 'pending'
          ? 'پس از بازگشت موفق از درگاه، اشتراک فعال خواهد شد.'
          : 'پرداخت اشتراک از طریق درگاه انجام شد و اشتراک فعال شد.',
      badge: status === 'completed' ? 'success' : status === 'pending' ? 'pending' : 'danger',
      previewNetAmount: Math.abs(amount),
    }),
    completedAt: status === 'completed' ? new Date() : undefined,
    timeline: {
      initiatedAt: new Date(),
      ...(status === 'completed' ? { settledAt: new Date() } : {}),
    },
  });
}

async function recordSecureDealBlocked({
  buyerId,
  buyerWalletId,
  sellerId,
  amount,
  feeAmount = 0,
  netAmount = null,
  dealId,
  dealNumber,
  title,
  preContractPercentage,
  metadata = {},
}) {
  return createEntry({
    user: buyerId,
    wallet: buyerWalletId,
    type: 'escrow_deposit',
    domain: 'deal',
    flow: 'block',
    direction: 'hold',
    impact: 'available_to_blocked',
    amount: -Math.abs(amount),
    grossAmount: Math.abs(amount),
    netAmount: Math.abs(amount),
    feeAmount: Math.abs(feeAmount || 0),
    currency: 'IRR',
    description: `بلوکه شدن پیش‌قرارداد ${preContractPercentage}% برای قرارداد ${dealNumber || title}`,
    status: 'completed',
    settlementStatus: 'blocked_for_future_release',
    referenceType: 'deal',
    relatedDeal: dealId,
    payerUser: buyerId,
    beneficiaryUser: sellerId,
    counterpartyUser: sellerId,
    counterpartyRole: 'seller',
    metadata: {
      ...metadata,
      source: metadata.source || 'transactionLedgerService.recordSecureDealBlocked',
    },
    display: createDisplay({
      title: 'بلوکه شدن مبلغ قرارداد',
      subtitle: `${dealNumber || title} · پیش‌قرارداد`,
      explainer: 'این مبلغ از موجودی قابل استفاده شما کسر و تا زمان تایید نهایی مسدود شد.',
      badge: 'hold',
      previewNetAmount: Math.abs(amount),
      previewFeeAmount: Math.abs(feeAmount || 0),
    }),
    completedAt: new Date(),
    timeline: {
      initiatedAt: new Date(),
      settledAt: new Date(),
    },
  });
}

async function recordSecureDealPendingIncoming({
  sellerId,
  sellerWalletId,
  buyerId,
  amount,
  feeAmount = 0,
  netAmount,
  dealId,
  dealNumber,
  title,
  metadata = {},
}) {
  return createEntry({
    user: sellerId,
    wallet: sellerWalletId,
    type: 'escrow_release',
    domain: 'deal',
    flow: 'incoming_pending',
    direction: 'info',
    impact: 'no_balance_change',
    amount: Math.abs(netAmount ?? amount),
    grossAmount: Math.abs(amount),
    netAmount: Math.abs(netAmount ?? amount),
    feeAmount: Math.abs(feeAmount || 0),
    commissionAmount: Math.abs(feeAmount || 0),
    currency: 'IRR',
    description: `دریافتی در انتظار از قرارداد ${dealNumber || title}`,
    status: 'pending',
    settlementStatus: 'blocked_for_future_release',
    referenceType: 'deal',
    relatedDeal: dealId,
    payerUser: buyerId,
    beneficiaryUser: sellerId,
    counterpartyUser: buyerId,
    counterpartyRole: 'buyer',
    isInformational: true,
    metadata: {
      ...metadata,
      source: metadata.source || 'transactionLedgerService.recordSecureDealPendingIncoming',
    },
    display: createDisplay({
      title: 'دریافتی در انتظار',
      subtitle: `${dealNumber || title} · هنوز واریز نشده`,
      explainer: 'در صورت تکمیل معامله، این مبلغ پس از کسر کارمزد به کیف پول شما واریز می‌شود.',
      badge: 'pending',
      previewNetAmount: Math.abs(netAmount ?? amount),
      previewFeeAmount: Math.abs(feeAmount || 0),
    }),
    timeline: {
      initiatedAt: new Date(),
      pendingAt: new Date(),
    },
  });
}

async function recordSecureDealReleased({
  sellerId,
  sellerWalletId,
  buyerId,
  amount,
  feeAmount = 0,
  netAmount,
  dealId,
  dealNumber,
  title,
  metadata = {},
}) {
  return createEntry({
    user: sellerId,
    wallet: sellerWalletId,
    type: 'escrow_release',
    domain: 'deal',
    flow: 'incoming_released',
    direction: 'in',
    impact: 'available_increase',
    amount: Math.abs(netAmount ?? amount),
    grossAmount: Math.abs(amount),
    netAmount: Math.abs(netAmount ?? amount),
    feeAmount: Math.abs(feeAmount || 0),
    commissionAmount: Math.abs(feeAmount || 0),
    currency: 'IRR',
    description: `آزادسازی وجه قرارداد ${dealNumber || title}`,
    status: 'completed',
    settlementStatus: 'released_to_beneficiary',
    referenceType: 'deal',
    relatedDeal: dealId,
    payerUser: buyerId,
    beneficiaryUser: sellerId,
    counterpartyUser: buyerId,
    counterpartyRole: 'buyer',
    metadata: {
      ...metadata,
      source: metadata.source || 'transactionLedgerService.recordSecureDealReleased',
    },
    display: createDisplay({
      title: 'واریز وجه قرارداد',
      subtitle: `${dealNumber || title} · آزاد شد`,
      explainer: 'این مبلغ پس از تایید نهایی معامله به کیف پول شما واریز شد.',
      badge: 'success',
      previewNetAmount: Math.abs(netAmount ?? amount),
      previewFeeAmount: Math.abs(feeAmount || 0),
    }),
    completedAt: new Date(),
    timeline: {
      initiatedAt: new Date(),
      settledAt: new Date(),
    },
  });
}

async function recordDealCommission({
  sellerId,
  sellerWalletId,
  buyerId,
  feeAmount,
  dealId,
  dealNumber,
  title,
  metadata = {},
}) {
  if (!feeAmount || feeAmount <= 0) return null;

  return createEntry({
    user: sellerId,
    wallet: sellerWalletId,
    type: 'commission',
    domain: 'deal',
    flow: 'fee',
    direction: 'out',
    impact: 'no_balance_change',
    amount: -Math.abs(feeAmount),
    grossAmount: Math.abs(feeAmount),
    netAmount: Math.abs(feeAmount),
    feeAmount: Math.abs(feeAmount),
    commissionAmount: Math.abs(feeAmount),
    currency: 'IRR',
    description: `کارمزد فوبینو برای قرارداد ${dealNumber || title}`,
    status: 'completed',
    settlementStatus: 'completed',
    referenceType: 'deal',
    relatedDeal: dealId,
    payerUser: buyerId,
    beneficiaryUser: sellerId,
    counterpartyUser: buyerId,
    counterpartyRole: 'buyer',
    metadata: {
      ...metadata,
      source: metadata.source || 'transactionLedgerService.recordDealCommission',
    },
    display: createDisplay({
      title: 'کارمزد فوبینو',
      subtitle: `${dealNumber || title} · کسر کارمزد`,
      explainer: 'این مبلغ به عنوان کارمزد فوبینو از مبلغ ناخالص این معامله کسر شد.',
      badge: 'fee',
      previewNetAmount: Math.abs(feeAmount),
      previewFeeAmount: Math.abs(feeAmount),
    }),
    completedAt: new Date(),
    timeline: {
      initiatedAt: new Date(),
      settledAt: new Date(),
    },
  });
}

async function recordSecureDealRefunded({
  buyerId,
  buyerWalletId,
  sellerId,
  amount,
  dealId,
  dealNumber,
  title,
  reason = '',
  metadata = {},
}) {
  return createEntry({
    user: buyerId,
    wallet: buyerWalletId,
    type: 'refund',
    domain: 'deal',
    flow: 'refund',
    direction: 'in',
    impact: 'blocked_to_available',
    amount: Math.abs(amount),
    grossAmount: Math.abs(amount),
    netAmount: Math.abs(amount),
    currency: 'IRR',
    description: `بازگشت وجه قرارداد ${dealNumber || title}`,
    status: 'completed',
    settlementStatus: 'refunded',
    referenceType: 'deal',
    relatedDeal: dealId,
    payerUser: buyerId,
    beneficiaryUser: buyerId,
    counterpartyUser: sellerId,
    counterpartyRole: 'seller',
    metadata: {
      ...metadata,
      notes: reason || metadata.notes,
      source: metadata.source || 'transactionLedgerService.recordSecureDealRefunded',
    },
    display: createDisplay({
      title: 'بازگشت وجه قرارداد',
      subtitle: `${dealNumber || title} · بازپرداخت`,
      explainer: reason || 'مبلغ مسدود شده این قرارداد به کیف پول شما برگشت.',
      badge: 'success',
      previewNetAmount: Math.abs(amount),
    }),
    completedAt: new Date(),
    timeline: {
      initiatedAt: new Date(),
      settledAt: new Date(),
    },
  });
}

async function markDealPendingIncomingResolved({
  dealId,
  sellerId,
  finalStatus,
  explainer,
  badge,
}) {
  const pending = await Transaction.findOne({
    relatedDeal: dealId,
    user: sellerId,
    domain: 'deal',
    flow: 'incoming_pending',
    status: 'pending',
  });

  if (!pending) return null;

  pending.status = finalStatus === 'released' ? 'completed' : 'cancelled';
  pending.settlementStatus =
    finalStatus === 'released' ? 'released_to_beneficiary' : 'refunded';
  pending.timeline = pending.timeline || {};
  if (finalStatus === 'released') {
    pending.completedAt = new Date();
    pending.timeline.settledAt = new Date();
  } else {
    pending.cancelledAt = new Date();
    pending.timeline.cancelledAt = new Date();
  }

  pending.display = {
    ...(pending.display || {}),
    subtitle: finalStatus === 'released' ? 'این دریافتی آزاد شد' : 'این دریافتی لغو شد',
    explainer,
    badge,
  };

  await pending.save();
  return pending;
}

async function recordMarketingBlocked({
  buyerId,
  buyerWalletId,
  marketerId,
  amount,
  feeAmount = 0,
  netAmount = null,
  tradeContractId,
  contractCode,
  metadata = {},
}) {
  return createEntry({
    user: buyerId,
    wallet: buyerWalletId,
    type: 'commission_deposit',
    domain: 'marketing',
    flow: 'block',
    direction: 'hold',
    impact: 'available_to_blocked',
    amount: -Math.abs(amount),
    grossAmount: Math.abs(amount),
    netAmount: Math.abs(amount),
    feeAmount: Math.abs(feeAmount || 0),
    commissionAmount: Math.abs(amount),
    currency: 'IRR',
    description: `بلوکه شدن کمیسیون قرارداد ${contractCode}`,
    status: 'completed',
    settlementStatus: 'blocked_for_future_release',
    referenceType: 'trade_contract',
    relatedTradeContract: tradeContractId,
    payerUser: buyerId,
    beneficiaryUser: marketerId,
    counterpartyUser: marketerId,
    counterpartyRole: 'marketer',
    metadata: {
      ...metadata,
      source: metadata.source || 'transactionLedgerService.recordMarketingBlocked',
    },
    display: createDisplay({
      title: 'بلوکه شدن کمیسیون بازاریاب',
      subtitle: `${contractCode} · کمیسیون در انتظار`,
      explainer: 'این مبلغ از موجودی شما کسر و تا نهایی شدن قرارداد مسدود شد.',
      badge: 'hold',
      previewNetAmount: Math.abs(amount),
      previewFeeAmount: Math.abs(feeAmount || 0),
    }),
    completedAt: new Date(),
    timeline: {
      initiatedAt: new Date(),
      settledAt: new Date(),
    },
  });
}

async function recordMarketingPendingIncoming({
  marketerId,
  marketerWalletId,
  buyerId,
  amount,
  feeAmount = 0,
  netAmount = null,
  tradeContractId,
  contractCode,
  metadata = {},
}) {
  return createEntry({
    user: marketerId,
    wallet: marketerWalletId,
    type: 'commission_received',
    domain: 'marketing',
    flow: 'incoming_pending',
    direction: 'info',
    impact: 'no_balance_change',
    amount: Math.abs(netAmount ?? amount),
    grossAmount: Math.abs(amount),
    netAmount: Math.abs(netAmount ?? amount),
    feeAmount: Math.abs(feeAmount || 0),
    commissionAmount: Math.abs(amount),
    currency: 'IRR',
    description: `کمیسیون در انتظار برای قرارداد ${contractCode}`,
    status: 'pending',
    settlementStatus: 'blocked_for_future_release',
    referenceType: 'trade_contract',
    relatedTradeContract: tradeContractId,
    payerUser: buyerId,
    beneficiaryUser: marketerId,
    counterpartyUser: buyerId,
    counterpartyRole: 'buyer',
    isInformational: true,
    metadata: {
      ...metadata,
      source: metadata.source || 'transactionLedgerService.recordMarketingPendingIncoming',
    },
display: createDisplay({
  title: 'دریافتی در انتظار',
  subtitle: `${rfpCode} · مبلغ هنوز آزاد نشده`,
  explainer: 'در صورت تکمیل سفارش، این مبلغ پس از کسر کارمزد به کیف پول شما واریز می‌شود.',
  badge: 'pending',
  previewNetAmount: Math.abs(netAmount ?? amount),
  previewFeeAmount: Math.abs(feeAmount || 0),
}),
    timeline: {
      initiatedAt: new Date(),
      pendingAt: new Date(),
    },
  });
}

async function recordMarketingReleased({
  marketerId,
  marketerWalletId,
  buyerId,
  amount,
  feeAmount = 0,
  netAmount = null,
  tradeContractId,
  contractCode,
  metadata = {},
}) {
  return createEntry({
    user: marketerId,
    wallet: marketerWalletId,
    type: 'commission_received',
    domain: 'marketing',
    flow: 'incoming_released',
    direction: 'in',
    impact: 'available_increase',
    amount: Math.abs(netAmount ?? amount),
    grossAmount: Math.abs(amount),
    netAmount: Math.abs(netAmount ?? amount),
    feeAmount: Math.abs(feeAmount || 0),
    commissionAmount: Math.abs(amount),
    currency: 'IRR',
    description: `آزادسازی کمیسیون قرارداد ${contractCode}`,
    status: 'completed',
    settlementStatus: 'released_to_beneficiary',
    referenceType: 'trade_contract',
    relatedTradeContract: tradeContractId,
    payerUser: buyerId,
    beneficiaryUser: marketerId,
    counterpartyUser: buyerId,
    counterpartyRole: 'buyer',
    metadata: {
      ...metadata,
      source: metadata.source || 'transactionLedgerService.recordMarketingReleased',
    },
    display: createDisplay({
      title: 'واریز کمیسیون',
      subtitle: `${contractCode} · آزاد شد`,
      explainer: 'کمیسیون این قرارداد به کیف پول شما واریز شد.',
      badge: 'success',
      previewNetAmount: Math.abs(netAmount ?? amount),
      previewFeeAmount: Math.abs(feeAmount || 0),
    }),
    completedAt: new Date(),
    timeline: {
      initiatedAt: new Date(),
      settledAt: new Date(),
    },
  });
}

async function recordMarketingFee({
  marketerId,
  marketerWalletId,
  buyerId,
  feeAmount,
  tradeContractId,
  contractCode,
  metadata = {},
}) {
  if (!feeAmount || feeAmount <= 0) return null;

  return createEntry({
    user: marketerId,
    wallet: marketerWalletId,
    type: 'platform_fee',
    domain: 'marketing',
    flow: 'fee',
    direction: 'out',
    impact: 'no_balance_change',
    amount: -Math.abs(feeAmount),
    grossAmount: Math.abs(feeAmount),
    netAmount: Math.abs(feeAmount),
    feeAmount: Math.abs(feeAmount),
    commissionAmount: Math.abs(feeAmount),
    currency: 'IRR',
    description: `کارمزد فوبینو برای قرارداد ${contractCode}`,
    status: 'completed',
    settlementStatus: 'completed',
    referenceType: 'trade_contract',
    relatedTradeContract: tradeContractId,
    payerUser: buyerId,
    beneficiaryUser: marketerId,
    counterpartyUser: buyerId,
    counterpartyRole: 'buyer',
    metadata: {
      ...metadata,
      source: metadata.source || 'transactionLedgerService.recordMarketingFee',
    },
    display: createDisplay({
      title: 'کارمزد فوبینو',
      subtitle: `${contractCode} · کسر کارمزد`,
      explainer: 'این مبلغ به عنوان کارمزد فوبینو از کمیسیون ناخالص کسر شد.',
      badge: 'fee',
      previewNetAmount: Math.abs(feeAmount),
      previewFeeAmount: Math.abs(feeAmount),
    }),
    completedAt: new Date(),
    timeline: {
      initiatedAt: new Date(),
      settledAt: new Date(),
    },
  });
}

async function recordMarketingRefunded({
  buyerId,
  buyerWalletId,
  marketerId,
  amount,
  tradeContractId,
  contractCode,
  reason = '',
  metadata = {},
}) {
  return createEntry({
    user: buyerId,
    wallet: buyerWalletId,
    type: 'commission_refund',
    domain: 'marketing',
    flow: 'refund',
    direction: 'in',
    impact: 'blocked_to_available',
    amount: Math.abs(amount),
    grossAmount: Math.abs(amount),
    netAmount: Math.abs(amount),
    currency: 'IRR',
    description: `بازگشت کمیسیون قرارداد ${contractCode}`,
    status: 'completed',
    settlementStatus: 'refunded',
    referenceType: 'trade_contract',
    relatedTradeContract: tradeContractId,
    payerUser: buyerId,
    beneficiaryUser: buyerId,
    counterpartyUser: marketerId,
    counterpartyRole: 'marketer',
    metadata: {
      ...metadata,
      notes: reason || metadata.notes,
      source: metadata.source || 'transactionLedgerService.recordMarketingRefunded',
    },
    display: createDisplay({
      title: 'بازگشت کمیسیون',
      subtitle: `${contractCode} · بازپرداخت`,
      explainer: reason || 'کمیسیون مسدود شده به کیف پول شما برگشت.',
      badge: 'success',
      previewNetAmount: Math.abs(amount),
    }),
    completedAt: new Date(),
    timeline: {
      initiatedAt: new Date(),
      settledAt: new Date(),
    },
  });
}

async function markMarketingPendingIncomingResolved({
  tradeContractId,
  marketerId,
  finalStatus,
  explainer,
  badge,
}) {
  const pending = await Transaction.findOne({
    relatedTradeContract: tradeContractId,
    user: marketerId,
    domain: 'marketing',
    flow: 'incoming_pending',
    status: 'pending',
  });

  if (!pending) return null;

  pending.status = finalStatus === 'released' ? 'completed' : 'cancelled';
  pending.settlementStatus =
    finalStatus === 'released' ? 'released_to_beneficiary' : 'refunded';
  pending.timeline = pending.timeline || {};

  if (finalStatus === 'released') {
    pending.completedAt = new Date();
    pending.timeline.settledAt = new Date();
  } else {
    pending.cancelledAt = new Date();
    pending.timeline.cancelledAt = new Date();
  }

  pending.display = {
    ...(pending.display || {}),
    subtitle: finalStatus === 'released' ? 'این کمیسیون آزاد شد' : 'این کمیسیون لغو شد',
    explainer,
    badge,
  };

  await pending.save();
  return pending;
}

async function recordInspectionPayment({
  userId,
  walletId,
  inspectionId,
  dealId,
  dealNumber,
  amount,
  location,
  metadata = {},
}) {
  return createEntry({
    user: userId,
    wallet: walletId,
    type: 'payment',
    domain: 'inspection',
    flow: 'wallet_payment',
    direction: 'out',
    impact: 'available_decrease',
    amount: -Math.abs(amount),
    grossAmount: Math.abs(amount),
    netAmount: Math.abs(amount),
    currency: 'IRR',
    description: `پرداخت هزینه بازرسی فوبینو - قرارداد ${dealNumber}`,
    status: 'completed',
    settlementStatus: 'completed',
    referenceType: 'deal',
    relatedDeal: dealId,
    relatedInspection: inspectionId,
    payerUser: userId,
    beneficiaryUser: null,
    counterpartyRole: 'platform',
    metadata: {
      ...metadata,
      location,
      source: metadata.source || 'transactionLedgerService.recordInspectionPayment',
    },
    display: createDisplay({
      title: 'پرداخت هزینه بازرسی',
      subtitle: `${dealNumber} · سرویس بازرسی`,
      explainer: 'هزینه سرویس بازرسی فوبینو از کیف پول شما پرداخت شد.',
      badge: 'success',
      previewNetAmount: Math.abs(amount),
    }),
    completedAt: new Date(),
    timeline: {
      initiatedAt: new Date(),
      settledAt: new Date(),
    },
  });
}

async function recordShippingPayment({
  userId,
  walletId,
  shippingId,
  dealId,
  dealNumber,
  amount,
  shippingCity,
  deliveryCity,
  metadata = {},
}) {
  return createEntry({
    user: userId,
    wallet: walletId,
    type: 'payment',
    domain: 'shipping',
    flow: 'wallet_payment',
    direction: 'out',
    impact: 'available_decrease',
    amount: -Math.abs(amount),
    grossAmount: Math.abs(amount),
    netAmount: Math.abs(amount),
    currency: 'IRR',
    description: `پرداخت هزینه ارسال فوبینو - قرارداد ${dealNumber}`,
    status: 'completed',
    settlementStatus: 'completed',
    referenceType: 'deal',
    relatedDeal: dealId,
    relatedShipping: shippingId,
    payerUser: userId,
    beneficiaryUser: null,
    counterpartyRole: 'platform',
    metadata: {
      ...metadata,
      shippingCity,
      deliveryCity,
      source: metadata.source || 'transactionLedgerService.recordShippingPayment',
    },
    display: createDisplay({
      title: 'پرداخت هزینه ارسال',
      subtitle: `${dealNumber} · سرویس ارسال`,
      explainer: 'هزینه سرویس ارسال فوبینو از کیف پول شما پرداخت شد.',
      badge: 'success',
      previewNetAmount: Math.abs(amount),
    }),
    completedAt: new Date(),
    timeline: {
      initiatedAt: new Date(),
      settledAt: new Date(),
    },
  });
}

async function recordDropshippingBlocked({
  dropshipperId,
  dropshipperWalletId,
  providerId,
  amount,
  feeAmount = 0,
  netAmount = null,
  dropshippingRFPId,
  rfpCode,
  productName,
  metadata = {},
}) {
  return createEntry({
    user: dropshipperId,
    wallet: dropshipperWalletId,
    type: 'escrow_deposit',
    domain: 'dropshipping',
    flow: 'block',
    direction: 'hold',
    impact: 'available_to_blocked',
    amount: -Math.abs(amount),
    grossAmount: Math.abs(amount),
    netAmount: Math.abs(amount),
    feeAmount: Math.abs(feeAmount || 0),
    currency: 'IRR',
    description: `بلوکه شدن مبلغ سفارش دراپ‌شیپینگ ${rfpCode}`,
    status: 'completed',
    settlementStatus: 'blocked_for_future_release',
    referenceType: 'dropshipping_rfp',
    relatedDropshippingRFP: dropshippingRFPId,
    payerUser: dropshipperId,
    beneficiaryUser: providerId,
    counterpartyUser: providerId,
    counterpartyRole: 'provider',
    metadata: {
      ...metadata,
      rfpCode,
      productName,
      source: metadata.source || 'transactionLedgerService.recordDropshippingBlocked',
    },
    display: createDisplay({
      title: 'بلوکه شدن مبلغ سفارش',
      subtitle: `${rfpCode} · سفارش دراپ‌شیپینگ`,
      explainer: 'این مبلغ از موجودی قابل استفاده شما کسر و تا تایید نهایی سفارش مسدود شد.',
      badge: 'hold',
      previewNetAmount: Math.abs(amount),
      previewFeeAmount: Math.abs(feeAmount || 0),
    }),
    completedAt: new Date(),
    timeline: {
      initiatedAt: new Date(),
      settledAt: new Date(),
    },
  });
}

async function recordDropshippingPendingIncoming({
  providerId,
  providerWalletId,
  dropshipperId,
  amount,
  feeAmount = 0,
  netAmount = null,
  dropshippingRFPId,
  rfpCode,
  productName,
  metadata = {},
}) {
  return createEntry({
    user: providerId,
    wallet: providerWalletId,
    type: 'escrow_release',
    domain: 'dropshipping',
    flow: 'incoming_pending',
    direction: 'info',
    impact: 'no_balance_change',
    amount: Math.abs(netAmount ?? amount),
    grossAmount: Math.abs(amount),
    netAmount: Math.abs(netAmount ?? amount),
    feeAmount: Math.abs(feeAmount || 0),
    commissionAmount: Math.abs(feeAmount || 0),
    currency: 'IRR',
    description: `دریافتی در انتظار سفارش دراپ‌شیپینگ ${rfpCode}`,
    status: 'pending',
    settlementStatus: 'blocked_for_future_release',
    referenceType: 'dropshipping_rfp',
    relatedDropshippingRFP: dropshippingRFPId,
    payerUser: dropshipperId,
    beneficiaryUser: providerId,
    counterpartyUser: dropshipperId,
    counterpartyRole: 'buyer',
    isInformational: true,
    metadata: {
      ...metadata,
      rfpCode,
      productName,
      source: metadata.source || 'transactionLedgerService.recordDropshippingPendingIncoming',
    },
    display: createDisplay({
      title: 'دریافتی در انتظار',
      subtitle: `${rfpCode} · هنوز واریز نشده`,
      explainer: 'در صورت تکمیل سفارش، این مبلغ پس از کسر کارمزد به کیف پول شما واریز می‌شود.',
      badge: 'pending',
      previewNetAmount: Math.abs(netAmount ?? amount),
      previewFeeAmount: Math.abs(feeAmount || 0),
    }),
    timeline: {
      initiatedAt: new Date(),
      pendingAt: new Date(),
    },
  });
}

async function recordDropshippingReleased({
  providerId,
  providerWalletId,
  dropshipperId,
  amount,
  feeAmount = 0,
  netAmount = null,
  dropshippingRFPId,
  rfpCode,
  productName,
  metadata = {},
}) {
  return createEntry({
    user: providerId,
    wallet: providerWalletId,
    type: 'escrow_release',
    domain: 'dropshipping',
    flow: 'incoming_released',
    direction: 'in',
    impact: 'available_increase',
    amount: Math.abs(netAmount ?? amount),
    grossAmount: Math.abs(amount),
    netAmount: Math.abs(netAmount ?? amount),
    feeAmount: Math.abs(feeAmount || 0),
    commissionAmount: Math.abs(feeAmount || 0),
    currency: 'IRR',
    description: `آزادسازی مبلغ سفارش دراپ‌شیپینگ ${rfpCode}`,
    status: 'completed',
    settlementStatus: 'released_to_beneficiary',
    referenceType: 'dropshipping_rfp',
    relatedDropshippingRFP: dropshippingRFPId,
    payerUser: dropshipperId,
    beneficiaryUser: providerId,
    counterpartyUser: dropshipperId,
    counterpartyRole: 'buyer',
    metadata: {
      ...metadata,
      rfpCode,
      productName,
      source: metadata.source || 'transactionLedgerService.recordDropshippingReleased',
    },
    display: createDisplay({
      title: 'واریز مبلغ سفارش',
      subtitle: `${rfpCode} · آزاد شد`,
      explainer: 'این مبلغ پس از تکمیل سفارش به کیف پول شما واریز شد.',
      badge: 'success',
      previewNetAmount: Math.abs(netAmount ?? amount),
      previewFeeAmount: Math.abs(feeAmount || 0),
    }),
    completedAt: new Date(),
    timeline: {
      initiatedAt: new Date(),
      settledAt: new Date(),
    },
  });
}

async function recordDropshippingFee({
  providerId,
  providerWalletId,
  dropshipperId,
  feeAmount,
  dropshippingRFPId,
  rfpCode,
  productName,
  metadata = {},
}) {
  if (!feeAmount || feeAmount <= 0) return null;

  return createEntry({
    user: providerId,
    wallet: providerWalletId,
    type: 'platform_fee',
    domain: 'dropshipping',
    flow: 'fee',
    direction: 'out',
    impact: 'no_balance_change',
    amount: -Math.abs(feeAmount),
    grossAmount: Math.abs(feeAmount),
    netAmount: Math.abs(feeAmount),
    feeAmount: Math.abs(feeAmount),
    commissionAmount: Math.abs(feeAmount),
    currency: 'IRR',
    description: `کارمزد فوبینو برای سفارش دراپ‌شیپینگ ${rfpCode}`,
    status: 'completed',
    settlementStatus: 'completed',
    referenceType: 'dropshipping_rfp',
    relatedDropshippingRFP: dropshippingRFPId,
    payerUser: dropshipperId,
    beneficiaryUser: providerId,
    counterpartyUser: dropshipperId,
    counterpartyRole: 'buyer',
    metadata: {
      ...metadata,
      rfpCode,
      productName,
      source: metadata.source || 'transactionLedgerService.recordDropshippingFee',
    },
    display: createDisplay({
      title: 'کارمزد فوبینو',
      subtitle: `${rfpCode} · کسر کارمزد`,
      explainer: 'این مبلغ به عنوان کارمزد فوبینو از مبلغ ناخالص سفارش کسر شد.',
      badge: 'fee',
      previewNetAmount: Math.abs(feeAmount),
      previewFeeAmount: Math.abs(feeAmount),
    }),
    completedAt: new Date(),
    timeline: {
      initiatedAt: new Date(),
      settledAt: new Date(),
    },
  });
}

async function recordDropshippingRefunded({
  dropshipperId,
  dropshipperWalletId,
  providerId,
  amount,
  dropshippingRFPId,
  rfpCode,
  productName,
  reason = '',
  metadata = {},
}) {
  return createEntry({
    user: dropshipperId,
    wallet: dropshipperWalletId,
    type: 'refund',
    domain: 'dropshipping',
    flow: 'refund',
    direction: 'in',
    impact: 'blocked_to_available',
    amount: Math.abs(amount),
    grossAmount: Math.abs(amount),
    netAmount: Math.abs(amount),
    currency: 'IRR',
    description: `بازگشت وجه سفارش دراپ‌شیپینگ ${rfpCode}`,
    status: 'completed',
    settlementStatus: 'refunded',
    referenceType: 'dropshipping_rfp',
    relatedDropshippingRFP: dropshippingRFPId,
    payerUser: dropshipperId,
    beneficiaryUser: dropshipperId,
    counterpartyUser: providerId,
    counterpartyRole: 'provider',
    metadata: {
      ...metadata,
      rfpCode,
      productName,
      notes: reason || metadata.notes,
      source: metadata.source || 'transactionLedgerService.recordDropshippingRefunded',
    },
display: createDisplay({
  title: 'بازگشت وجه سفارش',
  subtitle: `${rfpCode} · بازپرداخت به دراپ‌شیپر`,
  explainer: reason || 'مبلغ مسدود شده این سفارش به کیف پول شما برگشت.',
  badge: 'success',
  previewNetAmount: Math.abs(amount),
}),
    completedAt: new Date(),
    timeline: {
      initiatedAt: new Date(),
      settledAt: new Date(),
    },
  });
}

async function markDropshippingPendingIncomingResolved({
  dropshippingRFPId,
  providerId,
  finalStatus,
  explainer,
  badge,
}) {
  const pending = await Transaction.findOne({
    relatedDropshippingRFP: dropshippingRFPId,
    user: providerId,
    domain: 'dropshipping',
    flow: 'incoming_pending',
    status: 'pending',
  });

  if (!pending) return null;

  pending.status = finalStatus === 'released' ? 'completed' : 'cancelled';
  pending.settlementStatus =
    finalStatus === 'released' ? 'released_to_beneficiary' : 'refunded';
  pending.timeline = pending.timeline || {};

  if (finalStatus === 'released') {
    pending.completedAt = new Date();
    pending.timeline.settledAt = new Date();
  } else {
    pending.cancelledAt = new Date();
    pending.timeline.cancelledAt = new Date();
  }


pending.display = {
  ...(pending.display || {}),
  subtitle:
    finalStatus === 'released'
      ? 'این دریافتی به کیف پول شما واریز شد'
      : 'این دریافتی به دلیل بازگشت وجه لغو شد',
  explainer,
  badge,
};


  await pending.save();
  return pending;
}

module.exports = {
  createEntry,
  recordWalletDepositInitiated,
  completeWalletDeposit,
  failWalletDeposit,
  recordWithdrawalRequested,
  recordWithdrawalCompleted,
  recordWithdrawalRejected,
  recordSubscriptionPayment,
  recordSecureDealBlocked,
  recordSecureDealPendingIncoming,
  recordSecureDealReleased,
  recordDealCommission,
  recordSecureDealRefunded,
  markDealPendingIncomingResolved,
  recordMarketingBlocked,
  recordMarketingPendingIncoming,
  recordMarketingReleased,
  recordMarketingFee,
  recordMarketingRefunded,
  markMarketingPendingIncomingResolved,
  recordInspectionPayment,
  recordShippingPayment,
  recordDropshippingBlocked,
  recordDropshippingPendingIncoming,
  recordDropshippingReleased,
  recordDropshippingFee,
  recordDropshippingRefunded,
  markDropshippingPendingIncomingResolved,
};
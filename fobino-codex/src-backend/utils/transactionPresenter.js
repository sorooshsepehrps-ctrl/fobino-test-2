
const amountFormatter = new Intl.NumberFormat('fa-IR');

const STATUS_LABELS = {
  pending: 'در انتظار',
  completed: 'تکمیل شده',
  failed: 'ناموفق',
  cancelled: 'لغو شده',
  processing: 'در حال پردازش',
};

const STATUS_TONES = {
  pending: 'warning',
  completed: 'success',
  failed: 'danger',
  cancelled: 'danger',
  processing: 'info',
};

const DOMAIN_LABELS = {
  wallet: 'کیف پول',
  withdrawal: 'برداشت',
  subscription: 'اشتراک',
  deal: 'معامله امن',
  shipping: 'ارسال',
  inspection: 'بازرسی',
  marketing: 'مارکتینگ',
  dropshipping: 'دراپ‌شیپینگ',
  system: 'سیستم',
  post: 'آگهی',
  exchange: 'تبدیل ارز',
  invitation: 'دعوت',
};

const FLOW_LABELS = {
  deposit_init: 'شروع شارژ',
  deposit_verify: 'شارژ موفق',
  deposit_fail: 'شارژ ناموفق',
  withdraw_request: 'درخواست برداشت',
  withdraw_complete: 'برداشت تکمیل شده',
  withdraw_reject: 'برداشت رد شده',
  wallet_payment: 'پرداخت از کیف پول',
  block: 'بلوکه شدن مبلغ',
  release: 'آزادسازی مبلغ',
  refund: 'بازگشت وجه',
  fee: 'کارمزد',
  commission: 'کمیسیون',
  incoming_pending: 'دریافتی در انتظار',
  incoming_released: 'دریافتی آزاد شده',
  info: 'اطلاع مالی',
};

function formatMoney(amount, currency = 'IRR') {
  if (amount === null || amount === undefined) return null;
  return `${amountFormatter.format(Number(amount || 0))} ${currency}`;
}

function getAmountSign(direction, amount) {
  if (direction === 'in') return '+';
  if (direction === 'out' || direction === 'hold') return '-';
  if (direction === 'release' && amount < 0) return '+';
  if (amount > 0) return '+';
  return '';
}

function buildDropshippingExplainer(tx) {
  if (tx.flow === 'block') {
    return 'این مبلغ از موجودی قابل استفاده شما کسر و تا تکمیل سفارش دراپ‌شیپینگ مسدود شد.';
  }

  if (tx.flow === 'incoming_pending') {
    if (tx.settlementStatus === 'refunded') {
      return 'این دریافتی به دلیل بازگشت وجه به دراپ‌شیپر لغو شد و به کیف پول شما واریز نشد.';
    }
    return 'این مبلغ هنوز به کیف پول شما واریز نشده و در صورت تکمیل سفارش آزاد می‌شود.';
  }

  if (tx.flow === 'incoming_released') {
    return 'مبلغ خالص این سفارش پس از تکمیل فرآیند دراپ‌شیپینگ به کیف پول شما واریز شد.';
  }

  if (tx.flow === 'refund') {
    return tx.metadata?.notes || 'مبلغ این سفارش به کیف پول دراپ‌شیپر بازگشت داده شد.';
  }

  if (tx.flow === 'fee') {
    return 'این مبلغ به عنوان کارمزد فوبینو از سفارش دراپ‌شیپینگ کسر شد.';
  }

  return 'تراکنش مربوط به سیستم دراپ‌شیپینگ است.';
}

function buildExplainer(tx) {
  if (tx.display?.explainer) return tx.display.explainer;

  if (tx.domain === 'dropshipping') {
    return buildDropshippingExplainer(tx);
  }

  if (tx.flow === 'deposit_init') return 'در انتظار تایید درگاه پرداخت.';
  if (tx.flow === 'deposit_verify') return 'مبلغ با موفقیت به موجودی کیف پول اضافه شد.';
  if (tx.flow === 'deposit_fail') return 'پرداخت ناموفق بود و مبلغی به کیف پول اضافه نشد.';
  if (tx.flow === 'withdraw_request') return 'مبلغ از موجودی قابل استفاده کم و مسدود شده است.';
  if (tx.flow === 'withdraw_complete') return 'برداشت تایید و مبلغ از موجودی مسدود خارج شد.';
  if (tx.flow === 'withdraw_reject') return 'برداشت رد شد و مبلغ به موجودی قابل استفاده برگشت.';

  return 'توضیح تکمیلی برای این تراکنش ثبت نشده است.';
}

function presentTransaction(tx) {
  const amount = Number(tx.netAmount ?? tx.amount ?? 0);
  const grossAmount = Number(tx.grossAmount ?? tx.amount ?? 0);
  const feeAmount = Number(tx.feeAmount || 0);

  return {
    _id: tx._id,
    transactionNumber: tx.transactionNumber,
    domain: tx.domain,
    domainLabel: DOMAIN_LABELS[tx.domain] || tx.domain,
    flow: tx.flow,
    flowLabel: FLOW_LABELS[tx.flow] || tx.flow,
    status: tx.status,
    statusLabel: STATUS_LABELS[tx.status] || tx.status,
    statusTone: STATUS_TONES[tx.status] || 'default',
    settlementStatus: tx.settlementStatus || null,
    currency: tx.currency || 'IRR',
    amount,
    amountText: `${getAmountSign(tx.direction, amount)}${formatMoney(amount, tx.currency || 'IRR')}`,
    grossAmount,
    grossAmountText: formatMoney(grossAmount, tx.currency || 'IRR'),
    feeAmount,
    feeAmountText: feeAmount ? formatMoney(feeAmount, tx.currency || 'IRR') : null,
    title: tx.display?.title || tx.description || FLOW_LABELS[tx.flow] || 'تراکنش',
    subtitle: tx.display?.subtitle || tx.description || '',
    explainer: buildExplainer(tx),
    badge: tx.display?.badge || null,
    referenceType: tx.referenceType || null,
    relatedDropshippingRFP: tx.relatedDropshippingRFP || null,
    metadata: tx.metadata || {},
    createdAt: tx.createdAt,
    completedAt: tx.completedAt || null,
    cancelledAt: tx.cancelledAt || null,
  };
}

module.exports = {
  presentTransaction,
};

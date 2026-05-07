export function formatMoney(value, currency = 'ریال') {
  const numeric = Number(value || 0);
  return `${new Intl.NumberFormat('fa-IR').format(numeric)} ${currency}`;
}

export function formatTransactionDate(dateValue) {
  if (!dateValue) return '-';

  try {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateValue));
  } catch {
    return '-';
  }
}

export function getTransactionAmountDisplay(item) {
  const absoluteAmount = Math.abs(
    item?.netAmount ?? item?.grossAmount ?? item?.amount ?? 0
  );

  const sign =
    item?.amountSign ||
    (item?.direction === 'in'
      ? '+'
      : item?.direction === 'out' || item?.direction === 'hold'
      ? '-'
      : '');

  return `${sign}${formatMoney(absoluteAmount, item?.currency || 'IRR')}`;
}

export function getSettlementHint(item) {
  if (!item) return '';

  if (item.flow === 'incoming_pending') {
    return 'این مبلغ هنوز در کیف پول شما نیست و پس از تکمیل فرایند آزاد می‌شود.';
  }

  if (item.settlementStatus === 'refunded') {
    return 'این تراکنش با بازگشت وجه بسته شده است.';
  }

  if (item.flow === 'fee') {
    return 'این مبلغ به عنوان کارمزد از مبلغ ناخالص کسر شده است.';
  }

  return item.explainer || '';
}

export function getStatusToneClass(statusTone) {
  const map = {
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    warning: 'bg-amber-50 text-amber-700 border border-amber-100',
    danger: 'bg-red-50 text-red-700 border border-red-100',
    info: 'bg-blue-50 text-blue-700 border border-blue-100',
    muted: 'bg-gray-100 text-gray-600 border border-gray-200',
  };

  return map[statusTone] || map.muted;
}

export function getDomainFilterOptions() {
  return [
    { label: 'همه', value: '' },
    { label: 'شارژ کیف پول', value: 'wallet' },
    { label: 'برداشت', value: 'withdrawal' },
    { label: 'اشتراک', value: 'subscription' },
    { label: 'معامله امن', value: 'deal' },
    { label: 'ارسال', value: 'shipping' },
    { label: 'بازرسی', value: 'inspection' },
    { label: 'مارکتینگ', value: 'marketing' },
    { label: 'دراپ‌شیپینگ', value: 'dropshipping' },
  ];
}

export function getQuickFlowFilters() {
  return [
    { label: 'همه', value: '' },
    { label: 'بازگشت وجه', value: 'refund' },
    { label: 'کارمزدها', value: 'fee' },
    { label: 'دریافتی در انتظار', value: 'incoming_pending' },
  ];
}
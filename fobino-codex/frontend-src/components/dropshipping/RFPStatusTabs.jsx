
const STATUS_LABELS = {
  all: 'همه',
  pending_provider_approval: 'در انتظار تایید شما',
  pending_dropshipper_approval: 'در انتظار تایید طرف مقابل',
  provider_editing: 'ویرایش توسط شما',
  dropshipper_editing: 'ویرایش توسط دراپ‌شیپر',
  approved: 'تایید شده',
  payment_completed: 'پرداخت‌شده',
  shipment_deadline_passed: 'تاخیر در ارسال',
  late_ticket_created: 'تیکت تاخیر',
  shipped: 'ارسال‌شده',
  delivered_pending_confirmation: 'در انتظار تایید تحویل',
  completed: 'تکمیل‌شده',
  rejected_by_provider: 'ردشده توسط شما',
  rejected_by_dropshipper: 'ردشده توسط دراپ‌شیپر',
  refunded_due_to_no_tracking: 'برگشت وجه',
  cancelled: 'لغوشده',
};

export default function RFPStatusTabs({
  counts = {},
  value = 'all',
  onChange,
}) {
  const keys = ['all', ...Object.keys(counts).filter((item) => counts[item] > 0)];

  return (
    <div className="flex flex-wrap gap-2">
      {keys.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onChange?.(item)}
          className={[
            'rounded-2xl px-4 py-2 text-sm font-semibold transition-colors',
            value === item ? 'bg-blue-900 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50',
          ].join(' ')}
        >
          {STATUS_LABELS[item] || item}
          <span className={`mr-2 rounded-full px-2 py-0.5 text-xs ${value === item ? 'bg-white/15' : 'bg-slate-100'}`}>
            {item === 'all' ? Object.values(counts).reduce((sum, num) => sum + num, 0) : counts[item]}
          </span>
        </button>
      ))}
    </div>
  );
}

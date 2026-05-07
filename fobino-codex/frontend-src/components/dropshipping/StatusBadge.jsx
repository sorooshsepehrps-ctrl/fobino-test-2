
import React from 'react';

const STATUS_MAP = {
  draft: { label: 'پیش‌نویس', cls: 'bg-slate-100 text-slate-700' },
  pending_provider_approval: { label: 'در انتظار تایید تامین‌کننده', cls: 'bg-amber-100 text-amber-800' },
  pending_dropshipper_approval: { label: 'در انتظار تایید دراپ‌شیپر', cls: 'bg-amber-100 text-amber-800' },
  provider_editing: { label: 'در حال ویرایش توسط تامین‌کننده', cls: 'bg-sky-100 text-sky-800' },
  dropshipper_editing: { label: 'در حال ویرایش توسط دراپ‌شیپر', cls: 'bg-sky-100 text-sky-800' },
  approved: { label: 'تایید شده', cls: 'bg-emerald-100 text-emerald-800' },
  payment_pending: { label: 'در انتظار پرداخت', cls: 'bg-violet-100 text-violet-800' },
  payment_completed: { label: 'پرداخت انجام شده', cls: 'bg-indigo-100 text-indigo-800' },
  shipment_deadline_passed: { label: 'تاخیر در ارسال', cls: 'bg-rose-100 text-rose-800' },
  late_ticket_created: { label: 'تیکت تاخیر ایجاد شده', cls: 'bg-rose-100 text-rose-800' },
  shipped: { label: 'ارسال شده', cls: 'bg-cyan-100 text-cyan-800' },
  delivered_pending_confirmation: { label: 'در انتظار تایید تحویل', cls: 'bg-teal-100 text-teal-800' },
  completed: { label: 'تکمیل شده', cls: 'bg-emerald-100 text-emerald-800' },
  rejected_by_provider: { label: 'رد شده توسط تامین‌کننده', cls: 'bg-slate-200 text-slate-700' },
  rejected_by_dropshipper: { label: 'رد شده توسط دراپ‌شیپر', cls: 'bg-slate-200 text-slate-700' },
  refunded_due_to_no_tracking: { label: 'بازگشت وجه خودکار', cls: 'bg-rose-100 text-rose-800' },
  provider_suspended_due_to_no_tracking: { label: 'تعلیق تامین‌کننده', cls: 'bg-rose-100 text-rose-900' },
  cancelled: { label: 'لغو شده', cls: 'bg-slate-200 text-slate-700' },
  active: { label: 'فعال', cls: 'bg-emerald-100 text-emerald-800' },
  inactive: { label: 'غیرفعال', cls: 'bg-slate-200 text-slate-700' },
  blocked: { label: 'بلوکه شده', cls: 'bg-amber-100 text-amber-800' },
  released: { label: 'آزاد شده', cls: 'bg-emerald-100 text-emerald-800' },
  refunded: { label: 'برگشت خورده', cls: 'bg-rose-100 text-rose-800' },
};

const StatusBadge = ({ status, fallbackLabel }) => {
  const meta = STATUS_MAP[status] || {
    label: fallbackLabel || status || 'نامشخص',
    cls: 'bg-slate-100 text-slate-700',
  };

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${meta.cls}`}>
      {meta.label}
    </span>
  );
};

export default StatusBadge;

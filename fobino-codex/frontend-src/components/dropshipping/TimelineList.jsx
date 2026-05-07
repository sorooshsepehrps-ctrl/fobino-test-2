
import React from 'react';
import StatusBadge from './StatusBadge';

const EVENT_LABELS = {
  submitted_for_provider_approval: 'ارسال برای تایید تامین‌کننده',
  approved_by_provider: 'تایید توسط تامین‌کننده',
  approved_by_dropshipper: 'تایید توسط دراپ‌شیپر',
  fully_approved: 'توافق نهایی',
  edited_by_provider: 'ویرایش توسط تامین‌کننده',
  edited_by_dropshipper: 'ویرایش توسط دراپ‌شیپر',
  payment_completed: 'پرداخت انجام شد',
  shipped: 'کد رهگیری ثبت شد',
  shipment_deadline_passed: 'مهلت ارسال گذشته است',
  late_ticket_created: 'تیکت سیستمی ایجاد شد',
  delivery_confirmed_by_provider: 'تحویل توسط تامین‌کننده تایید شد',
  delivery_confirmed_by_dropshipper: 'تحویل توسط دراپ‌شیپر تایید شد',
  order_completed: 'RFP تکمیل شد',
  auto_refunded: 'بازگشت وجه خودکار',
  provider_suspended: 'تعلیق تامین‌کننده',
  rating_submitted: 'امتیاز ثبت شد',
};

const TimelineList = ({ items = [] }) => {
  if (!items.length) return null;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h3 className="text-sm font-black text-slate-900 md:text-base">تایم‌لاین RFP</h3>
        <StatusBadge status="approved" fallbackLabel="رویدادها" />
      </div>

      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={`${item.event}-${item.timestamp}-${index}`} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="h-3 w-3 rounded-full bg-slate-900" />
              {index !== items.length - 1 ? <div className="mt-2 h-full w-px bg-slate-200" /> : null}
            </div>

            <div className="min-w-0 flex-1 rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {EVENT_LABELS[item.event] || item.event}
                  </h4>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.timestamp ? new Date(item.timestamp).toLocaleString('fa-IR') : '---'}
                  </p>
                </div>

                <div className="text-xs font-medium text-slate-500">
                  {item.actor === 'provider'
                    ? 'تامین‌کننده'
                    : item.actor === 'dropshipper'
                    ? 'دراپ‌شیپر'
                    : 'سیستم'}
                </div>
              </div>

              {item.details && Object.keys(item.details).length ? (
                <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words rounded-2xl bg-white p-3 text-xs leading-6 text-slate-600">
                  {JSON.stringify(item.details, null, 2)}
                </pre>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimelineList;

import { AlertTriangle, CheckCircle2, X } from 'lucide-react';

export default function PaymentResultBanner({ result, planLabel, onClose }) {
  if (!result) return null;

  const isSuccess = result === 'success';

  return (
    <div className={`rounded-3xl border p-4 ${isSuccess ? 'border-blue-100 bg-blue-50 text-blue-900' : 'border-red-100 bg-red-50 text-red-700'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {isSuccess ? <CheckCircle2 className="mt-1 h-5 w-5" /> : <AlertTriangle className="mt-1 h-5 w-5" />}
          <div>
            <p className="font-black">
              {isSuccess ? 'پرداخت اشتراک با موفقیت ثبت شد' : 'پرداخت اشتراک ناموفق بود'}
            </p>
            <p className="mt-1 text-sm leading-7">
              {isSuccess
                ? `وضعیت اشتراک${planLabel ? ` ${planLabel}` : ''} بروزرسانی شد. اگر تغییر را نمی‌بینید صفحه را بروزرسانی کنید.`
                : 'می‌توانید دوباره تلاش کنید یا ابتدا کیف پول خود را شارژ کنید.'}
            </p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="rounded-xl p-1 hover:bg-white/60" aria-label="بستن پیام">
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

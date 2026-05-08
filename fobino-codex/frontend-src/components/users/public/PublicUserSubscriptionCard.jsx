import { BadgeCheck, CalendarClock, Crown, PackageCheck } from 'lucide-react';
import UserTrustBadges from '../../common/UserTrustBadges';

const formatDate = (value) => value ? new Date(value).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }) : 'نامشخص';

export default function PublicUserSubscriptionCard({ subscription, badges }) {
  const active = Boolean(subscription?.hasActiveSubscription || subscription?.status === 'active');
  const planName = subscription?.planName || subscription?.planType || 'اشتراک فعال';

  return (
    <section className="overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-100" dir="rtl">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
        <div>
          <h2 className="text-xl font-black text-slate-900">وضعیت اشتراک</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">نوع اشتراک عمومی کاربر، بدون نمایش جزئیات مالی یا خصوصی.</p>
        </div>
        <div className={`rounded-2xl p-3 ${active ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
          <Crown className="h-6 w-6" />
        </div>
      </div>

      {active ? (
        <div className="grid gap-4 p-5 md:grid-cols-3">
          <div className="rounded-3xl bg-gradient-to-br from-amber-50 to-white p-4 ring-1 ring-amber-100">
            <div className="flex items-center gap-2 text-amber-700"><BadgeCheck className="h-5 w-5" /><span className="text-sm font-black">اشتراک فعال</span></div>
            <p className="mt-3 text-lg font-black text-slate-900">{planName}</p>
            <UserTrustBadges badges={badges} compact className="mt-3" />
          </div>
          <div className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-100">
            <div className="flex items-center gap-2 text-slate-600"><PackageCheck className="h-5 w-5" /><span className="text-sm font-black">نوع پلن</span></div>
            <p className="mt-3 text-lg font-black text-slate-900">{subscription?.planType || 'عمومی'}</p>
          </div>
          <div className="rounded-3xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
            <div className="flex items-center gap-2 text-emerald-700"><CalendarClock className="h-5 w-5" /><span className="text-sm font-black">اعتبار تا</span></div>
            <p className="mt-3 text-lg font-black text-slate-900">{formatDate(subscription?.expiresAt)}</p>
          </div>
        </div>
      ) : (
        <div className="p-5">
          <div className="rounded-3xl bg-slate-50 p-5 text-center ring-1 ring-slate-100">
            <p className="font-black text-slate-800">اشتراک فعالی برای این کاربر ثبت نشده است.</p>
            <p className="mt-2 text-sm leading-7 text-slate-500">این پیام فقط وضعیت عمومی اشتراک را نشان می‌دهد و شامل اطلاعات خصوصی کاربر نیست.</p>
          </div>
        </div>
      )}
    </section>
  );
}

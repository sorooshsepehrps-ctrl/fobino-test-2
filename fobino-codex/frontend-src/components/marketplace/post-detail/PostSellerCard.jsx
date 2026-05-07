import { MessageCircle, PhoneCall, ShieldCheck, Store } from 'lucide-react';
import PosterInfo from '../posts/PosterInfo';
import { buildPosterMeta } from '../../../utils/marketplace';

export default function PostSellerCard({ post, onContactClick }) {
  const user = post?.user;

  return (
    <aside className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_25px_80px_-45px_rgba(15,23,42,0.28)] md:p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
          <Store className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-950">اطلاعات آگهی‌دهنده</h2>
          <p className="mt-1 text-sm text-slate-500">نمایش مشخصات و شروع ارتباط</p>
        </div>
      </div>

      <div className="rounded-[24px] border border-slate-100 bg-slate-50 p-4">
        <PosterInfo user={user} meta={buildPosterMeta(post)} />

        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
            <span className="text-xs font-bold text-slate-400">نام</span>
            <span className="text-sm font-black text-slate-900">
              {`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'کاربر فوبینو'}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
            <span className="text-xs font-bold text-slate-400">وضعیت حساب</span>
            <span className="inline-flex items-center gap-2 text-sm font-black text-blue-700">
              <ShieldCheck className="h-4 w-4" />
              {user?.verifications?.identity || user?.isVerified ? 'تأیید شده' : 'عادی'}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <button
          type="button"
          onClick={() => onContactClick?.(post)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-blue-700 to-blue-900 px-5 py-3.5 text-sm font-bold text-white shadow-[0_16px_34px_-20px_rgba(30,64,175,0.8)]"
        >
          <PhoneCall className="h-4 w-4" />
          اطلاعات تماس
        </button>

        <button
          type="button"
          onClick={() => onContactClick?.(post)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        >
          <MessageCircle className="h-4 w-4" />
          شروع چت
        </button>
      </div>

      <div className="mt-5 rounded-[24px] border border-blue-100 bg-blue-50 p-4">
        <p className="text-sm font-bold text-blue-900">نکته مهم</p>
        <p className="mt-2 text-sm leading-7 text-blue-800">
          در آگهی‌های فروش، مشاهده اطلاعات تماس محدودیت اشتراکی ندارد و کاربر می‌تواند مستقیم وارد
          جریان تماس و چت شود.
        </p>
      </div>
    </aside>
  );
}
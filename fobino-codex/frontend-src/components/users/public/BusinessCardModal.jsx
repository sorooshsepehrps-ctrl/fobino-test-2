import { Printer, QrCode, Star, X } from 'lucide-react';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';
import UserGradeBadge from '../analysis/UserGradeBadge';
import UserTrustBadges from '../../common/UserTrustBadges';

const avatarUrl = (avatar) => typeof avatar === 'string' ? avatar : avatar?.url || avatar?.secure_url || '';
const subscriptionLabel = (subscription) => subscription?.planName || subscription?.planType || (subscription?.hasActiveSubscription ? 'اشتراک فعال' : 'بدون اشتراک فعال');

export default function BusinessCardModal({ isOpen, onClose, card }) {
  const title = card?.businessName || card?.fullName || 'کاربر فوبینو';
  const avatar = avatarUrl(card?.avatar);

  function handlePrint() {
    window.print();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={null} size="lg" showClose={false}>
      <div className="relative" dir="rtl">
        <button type="button" onClick={onClose} className="absolute left-3 top-3 z-10 rounded-full bg-white/90 p-2 text-slate-500 shadow-sm transition hover:bg-white" aria-label="بستن"><X className="h-5 w-5" /></button>
        <div id="fobino-business-card-print" className="overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-2xl">
          <div className="relative min-h-[330px] p-7">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,.55),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,.2),transparent_35%)]" />
            <div className="relative flex items-center justify-between">
              <div>
                <div className="text-2xl font-black tracking-tight">Fobino</div>
                <div className="mt-1 text-xs font-bold uppercase tracking-[.28em] text-emerald-100">Public Trust Card</div>
              </div>
              <UserGradeBadge grade={card?.grade} />
            </div>

            <div className="relative mt-8 grid gap-6 md:grid-cols-[minmax(0,1fr)_170px] md:items-end">
              <div>
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 overflow-hidden rounded-3xl bg-white/10 ring-2 ring-white/20">
                    {avatar ? <img src={avatar} alt={title} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-3xl font-black">{title.slice(0, 1)}</div>}
                  </div>
                  <div>
                    <h3 className="text-3xl font-black leading-tight">{title}</h3>
                    {card?.fullName && card.fullName !== title && <p className="mt-1 text-sm font-bold text-emerald-100">{card.fullName}</p>}
                    <UserTrustBadges badges={card?.badges} compact className="mt-2" />
                  </div>
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/15"><p className="text-xs text-emerald-100">اشتراک</p><p className="mt-1 text-sm font-black">{subscriptionLabel(card?.subscription)}</p></div>
                  <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/15"><p className="text-xs text-emerald-100">امتیاز</p><p className="mt-1 inline-flex items-center gap-1 text-sm font-black"><Star className="h-4 w-4 fill-current text-amber-300" />{Number(card?.averageRating || 0).toFixed(1)}</p></div>
                  <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/15"><p className="text-xs text-emerald-100">نظرها</p><p className="mt-1 text-sm font-black">{card?.reviewsCount || 0} نظر</p></div>
                </div>
                <p className="mt-5 max-w-lg break-all rounded-2xl bg-black/20 px-3 py-2 text-xs leading-6 text-slate-200 ring-1 ring-white/10">{card?.publicProfileUrl}</p>
              </div>
              <div className="mx-auto rounded-[1.75rem] bg-white p-3 shadow-2xl shadow-black/20">
                {card?.qrCodeDataUrl ? <img src={card.qrCodeDataUrl} alt="QR Code" className="h-40 w-40 rounded-2xl object-contain" /> : <div className="flex h-40 w-40 items-center justify-center text-slate-300"><QrCode className="h-20 w-20" /></div>}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
          <p className="text-xs leading-6 text-slate-500">برای چاپ فقط کارت ویزیت در خروجی مرورگر نمایش داده می‌شود.</p>
          <Button onClick={handlePrint} icon={Printer} className="rounded-2xl font-black">چاپ کارت ویزیت</Button>
        </div>
      </div>
    </Modal>
  );
}

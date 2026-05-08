import { AlertTriangle, CalendarDays, Crown, Factory, Headset, PhoneCall, ShieldCheck } from 'lucide-react';
import { Button, Card } from '../ui';
import { toPersianNumber } from '../../utils/helpers';
import SubscriptionEntitlementMeter from './SubscriptionEntitlementMeter';
import { formatMinutesAsHours, getSubscriptionDates, PLAN_LABELS } from './subscriptionUtils';

export default function CurrentSubscriptionCard({
  subscription,
  limits,
  plans,
  daysRemaining,
  onBuyVip,
  onBuyProducer,
  onNavigate,
}) {
  const planId = subscription?.plan || 'free';
  const isPaid = ['vip', 'producer'].includes(planId) && subscription?.status === 'active';
  const plan = plans.find((item) => item.id === planId);
  const quota = subscription?.consultationQuota || {};
  const details = subscription?.planDetails || {};
  const contactTotal = details.accessToBuyPosts || plan?.accessToBuyPosts || 85;
  const contactUsed = subscription?.usage?.accessToBuyPostsUsed || limits?.usage?.accessToBuyPostsUsed || 0;
  const includedMinutes = quota.onlineIncludedMinutes || details.consultationOnlineIncludedMinutes || 0;
  const reservedMinutes = quota.onlineReservedMinutes || 0;
  const consumedMinutes = quota.onlineConsumedMinutes || 0;
  const releasedMinutes = quota.onlineReleasedMinutes || 0;
  const remainingMinutes = Math.max(0, includedMinutes - reservedMinutes - consumedMinutes + releasedMinutes);
  const planLabel = plan?.name || PLAN_LABELS[planId] || 'رایگان';
  const Icon = planId === 'producer' ? Factory : Crown;

  if (!isPaid) {
    return (
      <Card variant="wallet" padding="lg" className="rounded-3xl">
        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-900">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500">اشتراک فعلی شما</p>
                <h2 className="text-xl font-black text-slate-900">اشتراک فعال پولی ندارید</h2>
              </div>
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
              برای دریافت نشان عمومی، ۸۵ دسترسی تماس و ۲۰ ساعت مشاوره آنلاین رایگان، یکی از دو پلن سالانه VIP یا تولیدکننده را انتخاب کنید.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Button variant="brand" onClick={onBuyVip} className="bg-blue-900 hover:bg-blue-950">
              خرید اشتراک VIP
            </Button>
            <Button variant="danger" onClick={onBuyProducer} className="bg-red-600 hover:bg-red-700">
              خرید اشتراک تولیدکننده
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="wallet" padding="lg" className="rounded-3xl">
      <div className="grid gap-5 xl:grid-cols-[1fr_1.3fr]">
        <div>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-900 text-white">
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500">اشتراک فعلی شما</p>
                <h2 className="text-xl font-black text-slate-900">{planLabel}</h2>
              </div>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-900">
              {toPersianNumber(daysRemaining)} روز باقی‌مانده
            </span>
          </div>

          <div className="mt-5 space-y-3 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-blue-800" />
              <span>{getSubscriptionDates(subscription)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Headset className="h-4 w-4 text-blue-800" />
              <span>{formatMinutesAsHours(remainingMinutes)} مشاوره آنلاین رایگان باقی مانده است.</span>
            </div>
            <div className="flex items-center gap-2">
              <PhoneCall className="h-4 w-4 text-blue-800" />
              <span>{toPersianNumber(Math.max(0, contactTotal - contactUsed))} دسترسی تماس از این دوره باقی مانده است.</span>
            </div>
          </div>

          {planId === 'producer' && (
            <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm leading-7 text-red-700">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-1 h-5 w-5 flex-shrink-0" />
                <div>
                  خرید اشتراک تولیدکننده به معنی تأیید تولیدی نیست. برای نمایش ستاره‌ها در آگهی، پروفایل عمومی و کارت ویزیت، احراز تولیدکننده را تکمیل کنید.
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onNavigate('/dashboard/producer-verification')}
                    className="mr-2 text-red-700 hover:bg-red-100"
                  >
                    تکمیل احراز
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
          <SubscriptionEntitlementMeter
            label="دسترسی به اطلاعات تماس"
            helper="سهمیه مصرف تماس طبق منطق فعلی در دوره مصرف بازنشانی می‌شود."
            used={contactUsed}
            total={contactTotal}
          />
          <SubscriptionEntitlementMeter
            label="مشاوره آنلاین رایگان"
            helper={`رزرو شده: ${formatMinutesAsHours(reservedMinutes)} · مصرف شده: ${formatMinutesAsHours(consumedMinutes)}`}
            used={includedMinutes - remainingMinutes}
            total={includedMinutes}
            color="red"
          />
        </div>
      </div>
    </Card>
  );
}

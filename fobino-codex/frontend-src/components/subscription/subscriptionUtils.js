import { toPersianDate, toPersianNumber } from '../../utils/helpers';

export const PLAN_FEATURE_LABELS = {
  '85_contacts_per_month': '۸۵ دسترسی رایگان به اطلاعات تماس در هر دوره مصرف',
  vip_badge: 'نمایش نشان VIP در آگهی‌ها و بخش‌های عمومی',
  producer_badge: 'نمایش نشان تولیدکننده با ۳ سطح ستاره‌ای پس از احراز',
  '20_hours_online_consultation': '۲۰ ساعت مشاوره آنلاین رایگان',
  in_person_consultation_request: 'امکان ثبت درخواست مشاوره حضوری',
  producer_verification_flow: 'دسترسی به فلو احراز تولیدکننده',
  priority_support: 'پشتیبانی اولویت‌دار',
};

export const PLAN_LABELS = {
  free: 'رایگان',
  vip: 'VIP',
  producer: 'تولیدکننده',
};

export const PAYMENT_METHOD_LABELS = {
  wallet: 'کیف پول فوبینو',
  zarinpal: 'درگاه زرین‌پال',
};

export const formatToman = (price = 0) => {
  if (!price) return 'رایگان';
  return `${toPersianNumber(Math.round(Number(price) / 10).toLocaleString('fa-IR'))} تومان`;
};

export const formatMinutesAsHours = (minutes = 0) => {
  const normalized = Math.max(0, Number(minutes) || 0);
  const hours = Math.floor(normalized / 60);
  const remainder = normalized % 60;

  if (!remainder) return `${toPersianNumber(hours)} ساعت`;
  return `${toPersianNumber(hours)} ساعت و ${toPersianNumber(remainder)} دقیقه`;
};

export const normalizeBackendPlan = (plan) => ({
  id: plan.name,
  name: plan.nameFa || PLAN_LABELS[plan.name] || plan.name,
  durationDays: plan.duration || 365,
  duration: `${toPersianNumber(plan.duration || 365)} روزه`,
  price: Number(plan.price || 0),
  priceDisplay: formatToman(plan.price),
  features: (plan.features || []).map((feature) => PLAN_FEATURE_LABELS[feature] || feature),
  rawFeatures: plan.features || [],
  highlighted: plan.name === 'producer',
  accessToBuyPosts: plan.accessToBuyPosts || 0,
  consultationOnlineIncludedMinutes: plan.consultationOnlineIncludedMinutes || 0,
  consultationInPersonEligible: Boolean(plan.consultationInPersonEligible),
  badge: plan.badge,
});

export const normalizeFallbackPlan = (plan) => ({
  ...plan,
  durationDays: 365,
  price: Number(plan.price || 0),
  priceDisplay: plan.priceDisplay || formatToman(plan.price),
  features: plan.features?.filter(Boolean) || [],
  accessToBuyPosts: 85,
  consultationOnlineIncludedMinutes: 20 * 60,
  consultationInPersonEligible: plan.id === 'producer',
});

export const getSubscriptionDates = (subscription) => {
  if (!subscription?.startDate && !subscription?.endDate) return 'بدون بازه فعال';
  const start = subscription?.startDate ? toPersianDate(subscription.startDate) : '—';
  const end = subscription?.endDate ? toPersianDate(subscription.endDate) : 'بدون انقضا';
  return `${start} تا ${end}`;
};

export const getPlanCtaLabel = ({ isCurrentPlan, planId }) => {
  if (isCurrentPlan) return 'اشتراک فعلی شما';
  if (planId === 'producer') return 'خرید اشتراک تولیدکننده';
  return 'خرید اشتراک VIP';
};

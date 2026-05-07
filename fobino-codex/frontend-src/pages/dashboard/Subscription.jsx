import { useEffect, useState } from 'react';
import { Check, Crown, Sparkles, Building, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Card, Modal } from '../../components/ui';
import useAuthStore from '../../store/authStore';
import { SUBSCRIPTION_PLANS as FALLBACK_SUBSCRIPTION_PLANS } from '../../config/constants';
import { toPersianNumber, getDaysRemaining } from '../../utils/helpers';
import { subscriptionService } from '../../services';

const planIcons = {
  vip: Sparkles,
  producer: Building,
};

const planColors = {
  vip: 'from-blue-700 to-indigo-700',
  producer: 'from-blue-800 to-red-600',
};

const FEATURE_LABELS = {
  '85_contacts_per_month': '۸۵ دسترسی رایگان به اطلاعات تماس در هر دوره مصرف',
  vip_badge: 'نمایش نشان VIP در آگهی‌ها و بخش‌های عمومی',
  producer_badge: 'نمایش نشان تولیدکننده با ۳ سطح ستاره‌ای پس از احراز',
  '20_hours_online_consultation': '۲۰ ساعت مشاوره آنلاین رایگان',
  in_person_consultation_request: 'امکان ثبت درخواست مشاوره حضوری',
  producer_verification_flow: 'دسترسی به فلو احراز تولیدکننده',
  priority_support: 'پشتیبانی اولویت‌دار',
};

const formatPrice = (price) => {
  if (!price) return 'رایگان';
  return `${toPersianNumber(Math.round(price / 10).toLocaleString('fa-IR'))} تومان`;
};

const normalizeBackendPlan = (plan) => ({
  id: plan.name,
  name: plan.nameFa || plan.name,
  duration: `${toPersianNumber(plan.duration)} روزه`,
  price: plan.price,
  priceDisplay: formatPrice(plan.price),
  features: (plan.features || []).map((feature) => FEATURE_LABELS[feature] || feature),
  highlighted: plan.name === 'producer',
  consultationOnlineIncludedMinutes: plan.consultationOnlineIncludedMinutes || 0,
  consultationInPersonEligible: Boolean(plan.consultationInPersonEligible),
});

const getFallbackPlans = () => FALLBACK_SUBSCRIPTION_PLANS
  .filter((plan) => ['vip', 'producer'].includes(plan.id))
  .map((plan) => ({
    ...plan,
    features: plan.features?.filter(Boolean) || [],
  }));

export default function Subscription() {
  const { user } = useAuthStore();
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('zarinpal');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  const currentPlan = user?.subscription?.plan || 'free';
  const daysRemaining = getDaysRemaining(user?.subscription?.endDate);

  useEffect(() => {
    let isMounted = true;

    const loadPlans = async () => {
      setLoadingPlans(true);
      try {
        const result = await subscriptionService.getPlans();
        const apiPlans = result?.data?.plans || result?.plans || [];
        const purchasablePlans = apiPlans
          .filter((plan) => plan.isPurchasable && ['vip', 'producer'].includes(plan.name))
          .map(normalizeBackendPlan);

        if (isMounted) {
          setPlans(purchasablePlans.length ? purchasablePlans : getFallbackPlans());
        }
      } catch (error) {
        if (isMounted) {
          setPlans(getFallbackPlans());
          toast.error('دریافت پلن‌ها از سرور ناموفق بود؛ پلن‌های پیش‌فرض نمایش داده شد');
        }
      } finally {
        if (isMounted) setLoadingPlans(false);
      }
    };

    loadPlans();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSelectPlan = (plan) => {
    if (plan.id === currentPlan) return;
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  const handlePurchase = async () => {
    if (!selectedPlan) return;

    setProcessing(true);
    try {
      const response = await subscriptionService.purchase(selectedPlan.id, paymentMethod);
      const payload = response?.data || response;

      if (paymentMethod === 'zarinpal' && payload?.paymentUrl) {
        window.location.href = payload.paymentUrl;
      } else {
        toast.success('اشتراک با موفقیت خریداری شد');
        setShowPaymentModal(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطا در خرید اشتراک');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">اشتراک‌های فوبینو</h1>
      </div>

      {/* Current Plan */}
      {currentPlan && (
        <Card className="bg-gradient-to-l from-blue-900 to-blue-700 text-white">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-blue-100 text-sm">اشتراک فعلی شما</p>
              <h2 className="text-xl font-bold">
                {plans.find((plan) => plan.id === currentPlan)?.name || 'رایگان'}
              </h2>
              <p className="mt-2 text-sm text-blue-100">
                VIP و تولیدکننده شامل ۸۵ دسترسی تماس و ۲۰ ساعت مشاوره آنلاین رایگان هستند.
              </p>
            </div>
            <div className="text-left">
              <p className="text-blue-100 text-sm">مدت باقیمانده</p>
              <p className="text-2xl font-bold">{toPersianNumber(daysRemaining)} روز</p>
            </div>
          </div>
        </Card>
      )}

      {/* Plans Grid */}
      {loadingPlans ? (
        <Card className="flex items-center justify-center gap-3 py-10 text-blue-800">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>در حال دریافت پلن‌ها...</span>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {plans.map((plan) => {
            const Icon = planIcons[plan.id] || Crown;
            const isCurrentPlan = plan.id === currentPlan;

            return (
              <Card
                key={plan.id}
                className={`relative overflow-hidden border-blue-100 ${
                  plan.highlighted ? 'ring-2 ring-red-500' : ''
                } ${isCurrentPlan ? 'opacity-70' : ''}`}
              >
                {plan.highlighted && (
                  <div className="absolute left-0 right-0 top-0 bg-red-600 py-1 text-center text-sm text-white">
                    ویژه تولیدکنندگان
                  </div>
                )}

                {/* Plan Header */}
                <div className={`p-6 text-center ${plan.highlighted ? 'pt-10' : ''}`}>
                  <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br ${planColors[plan.id]} shadow-lg`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <p className="text-gray-500 text-sm">{plan.duration}</p>
                  <div className="mt-4">
                    <span className="text-3xl font-bold text-blue-900">{plan.priceDisplay}</span>
                  </div>
                </div>

                {/* Features */}
                <div className="border-t border-blue-50 p-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-700" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA */}
                <div className="p-6 pt-0">
                  <Button
                    className="w-full"
                    variant={isCurrentPlan ? 'secondary' : 'primary'}
                    disabled={isCurrentPlan}
                    onClick={() => handleSelectPlan(plan)}
                  >
                    {isCurrentPlan ? 'اشتراک فعلی' : 'خرید اشتراک سالانه'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="خرید اشتراک"
        size="md"
      >
        {selectedPlan && (
          <div className="space-y-6">
            <div className="rounded-lg bg-blue-50 p-4 text-center">
              <h3 className="font-semibold text-lg">{selectedPlan.name}</h3>
              <p className="text-gray-500">{selectedPlan.duration}</p>
              <p className="mt-2 text-2xl font-bold text-blue-900">
                {selectedPlan.priceDisplay}
              </p>
            </div>

            {selectedPlan.id === 'producer' && (
              <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">
                خرید اشتراک تولیدکننده به معنی تأیید تولیدی نیست؛ ستاره‌های نشان تولیدکننده پس از احراز سطح‌ها نمایش داده می‌شود.
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                روش پرداخت
              </label>
              <div className="space-y-2">
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-gray-50">
                  <input
                    type="radio"
                    name="payment"
                    value="zarinpal"
                    checked={paymentMethod === 'zarinpal'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="h-4 w-4 text-blue-700"
                  />
                  <span>درگاه پرداخت زرین‌پال</span>
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-gray-50">
                  <input
                    type="radio"
                    name="payment"
                    value="wallet"
                    checked={paymentMethod === 'wallet'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="h-4 w-4 text-blue-700"
                  />
                  <div className="flex flex-1 items-center justify-between">
                    <span>کیف پول فوبینو</span>
                    <span className="text-sm text-gray-500">
                      موجودی: {toPersianNumber(user?.wallet?.balance || 0)} تومان
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setShowPaymentModal(false)}
              >
                انصراف
              </Button>
              <Button
                className="flex-1"
                loading={processing}
                onClick={handlePurchase}
              >
                پرداخت
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

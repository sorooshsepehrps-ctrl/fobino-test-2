import { useState } from 'react';
import { Check, Crown, Star, Sparkles, Building, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Card, Modal } from '../../components/ui';
import useAuthStore from '../../store/authStore';
import { SUBSCRIPTION_PLANS } from '../../config/constants';
import { toPersianNumber, getDaysRemaining } from '../../utils/helpers';
import { subscriptionService } from '../../services';

const planIcons = {
  free: Zap,
  silver: Star,
  gold: Crown,
  vip: Sparkles,
  producer: Building,
};

const planColors = {
  free: 'from-gray-400 to-gray-500',
  silver: 'from-gray-300 to-gray-400',
  gold: 'from-yellow-400 to-amber-500',
  vip: 'from-purple-500 to-indigo-600',
  producer: 'from-emerald-500 to-teal-600',
};

export default function Subscription() {
  const { user } = useAuthStore();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('zarinpal');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  const currentPlan = user?.subscription?.plan?.name || 'free';
  const daysRemaining = getDaysRemaining(user?.subscription?.endDate);

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
      
      if (paymentMethod === 'zarinpal' && response.data?.paymentUrl) {
        window.location.href = response.data.paymentUrl;
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
        <h1 className="text-2xl font-bold text-gray-900">ارتقاء عضویت</h1>
      </div>

      {/* Current Plan */}
      {currentPlan && (
        <Card className="bg-gradient-to-l from-emerald-500 to-teal-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm">اشتراک فعلی شما</p>
              <h2 className="text-xl font-bold">
                {SUBSCRIPTION_PLANS.find(p => p.id === currentPlan)?.name || 'رایگان'}
              </h2>
            </div>
            <div className="text-left">
              <p className="text-emerald-100 text-sm">مدت باقیمانده</p>
              <p className="text-2xl font-bold">{toPersianNumber(daysRemaining)} روز</p>
            </div>
          </div>
        </Card>
      )}

      {/* Plans Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SUBSCRIPTION_PLANS.slice().reverse().map((plan) => {
          const Icon = planIcons[plan.id];
          const isCurrentPlan = plan.id === currentPlan;
          
          return (
            <Card
              key={plan.id}
              className={`relative overflow-hidden ${
                plan.highlighted ? 'ring-2 ring-emerald-500' : ''
              } ${isCurrentPlan ? 'opacity-60' : ''}`}
            >
              {plan.highlighted && (
                <div className="absolute top-0 left-0 right-0 bg-emerald-500 text-white text-center text-sm py-1">
                  پیشنهاد ویژه
                </div>
              )}
              
              {/* Plan Header */}
              <div className={`p-6 text-center ${plan.highlighted ? 'pt-10' : ''}`}>
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br ${planColors[plan.id]} flex items-center justify-center`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <p className="text-gray-500 text-sm">{plan.duration}</p>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-gray-900">{plan.priceDisplay}</span>
                </div>
              </div>

              {/* Features */}
              <div className="border-t p-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
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
                  {isCurrentPlan ? 'اشتراک فعلی' : 'ارتقا عضویت'}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="خرید اشتراک"
        size="md"
      >
        {selectedPlan && (
          <div className="space-y-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-lg">{selectedPlan.name}</h3>
              <p className="text-gray-500">{selectedPlan.duration}</p>
              <p className="text-2xl font-bold text-emerald-600 mt-2">
                {selectedPlan.priceDisplay}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                روش پرداخت
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="payment"
                    value="zarinpal"
                    checked={paymentMethod === 'zarinpal'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-4 h-4 text-emerald-600"
                  />
                  <span>درگاه پرداخت زرین‌پال</span>
                </label>
                {user?.level >= 2 && (
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="payment"
                      value="wallet"
                      checked={paymentMethod === 'wallet'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-4 h-4 text-emerald-600"
                    />
                    <div className="flex-1 flex items-center justify-between">
                      <span>کیف پول فوبینو</span>
                      <span className="text-sm text-gray-500">
                        موجودی: {toPersianNumber(user?.wallet?.balance || 0)} تومان
                      </span>
                    </div>
                  </label>
                )}
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

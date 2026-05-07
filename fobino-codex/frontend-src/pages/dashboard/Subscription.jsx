import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Card } from '../../components/ui';
import useAuthStore from '../../store/authStore';
import { SUBSCRIPTION_PLANS as FALLBACK_SUBSCRIPTION_PLANS } from '../../config/constants';
import { getDaysRemaining } from '../../utils/helpers';
import { subscriptionService, userService } from '../../services';
import SubscriptionHero from '../../components/subscription/SubscriptionHero';
import CurrentSubscriptionCard from '../../components/subscription/CurrentSubscriptionCard';
import PlanComparisonGrid from '../../components/subscription/PlanComparisonGrid';
import PurchaseSubscriptionModal from '../../components/subscription/PurchaseSubscriptionModal';
import InsufficientWalletModal from '../../components/subscription/InsufficientWalletModal';
import PaymentResultBanner from '../../components/subscription/PaymentResultBanner';
import DiscardPurchaseModal from '../../components/subscription/DiscardPurchaseModal';
import {
  normalizeBackendPlan,
  normalizeFallbackPlan,
  PAYMENT_METHOD_LABELS,
  PLAN_LABELS,
} from '../../components/subscription/subscriptionUtils';

const PURCHASABLE_PLAN_IDS = ['vip', 'producer'];

const getFallbackPlans = () => FALLBACK_SUBSCRIPTION_PLANS
  .filter((plan) => PURCHASABLE_PLAN_IDS.includes(plan.id))
  .map(normalizeFallbackPlan);

const getWalletAvailableBalance = (walletSummary, user) => {
  if (typeof walletSummary?.available === 'number') return walletSummary.available;
  if (typeof walletSummary?.balance?.available === 'number') return walletSummary.balance.available;
  if (typeof user?.wallet?.balance === 'number') return user.wallet.balance;
  if (typeof user?.wallet?.available === 'number') return user.wallet.available;
  return 0;
};

export default function Subscription() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const plansRef = useRef(null);
  const { user, fetchUser } = useAuthStore();

  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [subscriptionLimits, setSubscriptionLimits] = useState(null);
  const [walletSummary, setWalletSummary] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showInsufficientWalletModal, setShowInsufficientWalletModal] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  const paymentResult = searchParams.get('status');
  const queryPlan = searchParams.get('plan');
  const queryMethod = searchParams.get('method');
  const queryModal = searchParams.get('modal');

  const walletBalance = getWalletAvailableBalance(walletSummary, user);
  const effectiveSubscription = currentSubscription || user?.subscription || null;
  const currentPlan = effectiveSubscription?.plan || 'free';
  const daysRemaining = getDaysRemaining(effectiveSubscription?.endDate);
  const currentPlanLabel = plans.find((plan) => plan.id === currentPlan)?.name || PLAN_LABELS[currentPlan];
  const selectedPlanLabel = selectedPlan?.name || (queryPlan ? PLAN_LABELS[queryPlan] : '');

  const sortedPlans = useMemo(() => {
    const order = { vip: 1, producer: 2 };
    return [...plans].sort((a, b) => (order[a.id] || 99) - (order[b.id] || 99));
  }, [plans]);

  const loadSubscriptionOverview = useCallback(async () => {
    setLoadingOverview(true);
    try {
      const [subscriptionResult, walletResult] = await Promise.allSettled([
        subscriptionService.getMySubscription(),
        userService.getWalletSummary(),
      ]);

      if (subscriptionResult.status === 'fulfilled') {
        const payload = subscriptionResult.value?.data || subscriptionResult.value || {};
        setCurrentSubscription(payload.subscription || null);
        setSubscriptionLimits(payload.limits || null);
      }

      if (walletResult.status === 'fulfilled') {
        setWalletSummary(walletResult.value?.data || walletResult.value || null);
      }
    } catch (error) {
      toast.error('خطا در دریافت وضعیت اشتراک یا کیف پول');
    } finally {
      setLoadingOverview(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadPlans = async () => {
      setLoadingPlans(true);
      try {
        const result = await subscriptionService.getPlans();
        const apiPlans = result?.data?.plans || result?.plans || [];
        const purchasablePlans = apiPlans
          .filter((plan) => plan.isPurchasable && PURCHASABLE_PLAN_IDS.includes(plan.name))
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
    loadSubscriptionOverview();

    return () => {
      isMounted = false;
    };
  }, [loadSubscriptionOverview]);

  useEffect(() => {
    if (!plans.length || queryModal !== 'purchase' || !queryPlan) return;
    const plan = plans.find((item) => item.id === queryPlan);
    if (!plan) return;

    setSelectedPlan(plan);
    setPaymentMethod(['wallet', 'zarinpal'].includes(queryMethod) ? queryMethod : 'wallet');
    setShowPaymentModal(true);
  }, [plans, queryMethod, queryModal, queryPlan]);

  const updatePurchaseParams = useCallback((plan, method = paymentMethod) => {
    const next = new URLSearchParams(searchParams);
    next.set('modal', 'purchase');
    next.set('plan', plan.id);
    next.set('method', method);
    setSearchParams(next, { replace: false });
  }, [paymentMethod, searchParams, setSearchParams]);

  const clearPurchaseParams = useCallback((replace = true) => {
    const next = new URLSearchParams(searchParams);
    next.delete('modal');
    next.delete('plan');
    next.delete('method');
    setSearchParams(next, { replace });
  }, [searchParams, setSearchParams]);

  const handleSelectPlan = (plan) => {
    if (plan.id === currentPlan) return;
    setSelectedPlan(plan);
    setPaymentMethod('wallet');
    setShowPaymentModal(true);
    updatePurchaseParams(plan, 'wallet');
  };

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
    if (selectedPlan) updatePurchaseParams(selectedPlan, method);
  };

  const requestClosePurchaseModal = () => {
    if (selectedPlan) {
      setShowDiscardModal(true);
      return;
    }

    setShowPaymentModal(false);
    clearPurchaseParams();
  };

  const confirmClosePurchaseModal = () => {
    setShowDiscardModal(false);
    setShowPaymentModal(false);
    setSelectedPlan(null);
    clearPurchaseParams();
  };

  const handlePurchase = async () => {
    if (!selectedPlan) return;

    if (paymentMethod === 'wallet' && walletBalance < selectedPlan.price) {
      setShowInsufficientWalletModal(true);
      return;
    }

    setProcessing(true);
    try {
      const response = await subscriptionService.purchase(selectedPlan.id, paymentMethod);
      const payload = response?.data || response;

      if (paymentMethod === 'zarinpal' && payload?.paymentUrl) {
        window.location.href = payload.paymentUrl;
        return;
      }

      toast.success(`اشتراک ${selectedPlan.name} با پرداخت از ${PAYMENT_METHOD_LABELS[paymentMethod]} فعال شد`);
      setShowPaymentModal(false);
      setSelectedPlan(null);
      clearPurchaseParams();
      await Promise.all([loadSubscriptionOverview(), fetchUser?.()]);
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'خطا در خرید اشتراک';
      if (paymentMethod === 'wallet' && message.includes('موجودی')) {
        setShowInsufficientWalletModal(true);
      } else {
        toast.error(message);
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleChargeWallet = () => {
    const returnTo = `/dashboard/subscription?modal=purchase&plan=${selectedPlan?.id || queryPlan || 'vip'}&method=wallet`;
    navigate(`/dashboard/wallet?returnTo=${encodeURIComponent(returnTo)}`);
  };

  const handleDismissPaymentResult = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('status');
    setSearchParams(next, { replace: true });
  };

  const scrollToPlans = () => {
    plansRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="space-y-6">
      <SubscriptionHero onScrollToPlans={scrollToPlans} onNavigate={navigate} />

      <PaymentResultBanner
        result={paymentResult}
        planLabel={selectedPlanLabel || currentPlanLabel}
        onClose={handleDismissPaymentResult}
      />

      {loadingOverview ? (
        <Card variant="wallet" className="animate-pulse rounded-3xl p-8">
          <div className="h-6 w-52 rounded-full bg-blue-100" />
          <div className="mt-5 h-4 w-3/4 rounded-full bg-slate-100" />
          <div className="mt-3 h-4 w-1/2 rounded-full bg-slate-100" />
        </Card>
      ) : (
        <CurrentSubscriptionCard
          subscription={effectiveSubscription}
          limits={subscriptionLimits}
          plans={sortedPlans}
          daysRemaining={daysRemaining}
          onBuyVip={() => handleSelectPlan(sortedPlans.find((plan) => plan.id === 'vip') || getFallbackPlans()[0])}
          onBuyProducer={() => handleSelectPlan(sortedPlans.find((plan) => plan.id === 'producer') || getFallbackPlans()[1])}
          onNavigate={navigate}
        />
      )}

      <div ref={plansRef}>
        <PlanComparisonGrid
          plans={sortedPlans}
          loading={loadingPlans}
          currentPlan={currentPlan}
          onSelect={handleSelectPlan}
        />
      </div>

      <PurchaseSubscriptionModal
        isOpen={showPaymentModal}
        onClose={requestClosePurchaseModal}
        plan={selectedPlan}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={handlePaymentMethodChange}
        walletBalance={walletBalance}
        processing={processing}
        onSubmit={handlePurchase}
      />

      <InsufficientWalletModal
        isOpen={showInsufficientWalletModal}
        onClose={() => setShowInsufficientWalletModal(false)}
        plan={selectedPlan}
        walletBalance={walletBalance}
        onCharge={handleChargeWallet}
      />

      <DiscardPurchaseModal
        isOpen={showDiscardModal}
        onCancel={() => setShowDiscardModal(false)}
        onConfirm={confirmClosePurchaseModal}
      />
    </div>
  );
}

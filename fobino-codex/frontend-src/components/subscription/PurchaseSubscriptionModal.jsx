import { AlertTriangle, CheckCircle2, CreditCard, ShieldCheck, Wallet } from 'lucide-react';
import { Button, Modal } from '../ui';
import PlanFeatureList from './PlanFeatureList';
import { formatToman, PAYMENT_METHOD_LABELS } from './subscriptionUtils';

export default function PurchaseSubscriptionModal({
  isOpen,
  onClose,
  plan,
  paymentMethod,
  onPaymentMethodChange,
  walletBalance,
  processing,
  onSubmit,
}) {
  if (!plan) return null;

  const walletIsEnough = Number(walletBalance || 0) >= Number(plan.price || 0);
  const methods = [
    {
      id: 'wallet',
      title: PAYMENT_METHOD_LABELS.wallet,
      description: walletIsEnough
        ? 'پرداخت فوری از موجودی کیف پول و فعال‌سازی مستقیم اشتراک'
        : 'موجودی کافی نیست؛ برای ادامه باید کیف پول شارژ شود',
      icon: Wallet,
      disabled: false,
    },
    {
      id: 'zarinpal',
      title: PAYMENT_METHOD_LABELS.zarinpal,
      description: 'انتقال امن به درگاه پرداخت و بازگشت خودکار به صفحه اشتراک',
      icon: CreditCard,
      disabled: false,
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="خرید اشتراک سالانه" size="xl">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-[1fr_0.8fr]">
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm text-blue-700">خلاصه پلن انتخابی</p>
            <h3 className="mt-1 text-2xl font-black text-blue-950">{plan.name}</h3>
            <p className="mt-2 text-sm text-blue-700">مدت: {plan.duration} · قیمت: {plan.priceDisplay}</p>
            <div className="mt-4 flex items-center gap-2 rounded-2xl bg-white p-3 text-sm text-blue-900">
              <ShieldCheck className="h-5 w-5" />
              فعال‌سازی بر اساس اطلاعات رسمی backend انجام می‌شود.
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-sm font-bold text-slate-900">کیف پول شما</p>
            <p className="mt-2 text-2xl font-black text-slate-900">{formatToman(walletBalance)}</p>
            <p className={`mt-2 text-xs ${walletIsEnough ? 'text-blue-700' : 'text-red-600'}`}>
              {walletIsEnough ? 'موجودی برای پرداخت از کیف پول کافی است.' : 'برای پرداخت کیف پول موجودی کافی نیست.'}
            </p>
          </div>
        </div>

        {plan.id === 'producer' && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm leading-7 text-red-700">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-1 h-5 w-5 flex-shrink-0" />
              <div>
                خرید اشتراک تولیدکننده به معنی تأیید تولیدی نیست. نشان ستاره‌دار تولیدکننده بعد از احراز سطح‌های تولیدی نمایش داده می‌شود؛ اما خرید پلن برای همه کاربران مجاز است.
              </div>
            </div>
          </div>
        )}

        <div>
          <p className="mb-3 text-sm font-bold text-slate-900">مزایای پلن</p>
          <div className="rounded-2xl border border-blue-100 p-4">
            <PlanFeatureList features={plan.features} />
          </div>
        </div>

        <div>
          <p className="mb-3 text-sm font-bold text-slate-900">روش پرداخت</p>
          <div className="grid gap-3 md:grid-cols-2">
            {methods.map((method) => {
              const Icon = method.icon;
              const selected = paymentMethod === method.id;
              const walletWarning = method.id === 'wallet' && !walletIsEnough;

              return (
                <label
                  key={method.id}
                  className={`cursor-pointer rounded-2xl border p-4 transition ${selected ? 'border-blue-900 bg-blue-50' : 'border-slate-200 hover:border-blue-200'} ${walletWarning ? 'border-red-100 bg-red-50/60' : ''}`}
                >
                  <input
                    type="radio"
                    name="subscriptionPaymentMethod"
                    value={method.id}
                    checked={selected}
                    onChange={(event) => onPaymentMethodChange(event.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-start gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${selected ? 'bg-blue-900 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-900">{method.title}</p>
                        {selected && <CheckCircle2 className="h-4 w-4 text-blue-900" />}
                      </div>
                      <p className={`mt-1 text-xs leading-6 ${walletWarning ? 'text-red-600' : 'text-slate-500'}`}>
                        {method.description}
                      </p>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <Button variant="secondary" className="flex-1" onClick={onClose}>انصراف</Button>
          <Button
            variant={paymentMethod === 'wallet' ? 'brand' : 'danger'}
            loading={processing}
            onClick={onSubmit}
            className={`flex-1 ${paymentMethod === 'wallet' ? 'bg-blue-900 hover:bg-blue-950' : 'bg-red-600 hover:bg-red-700'}`}
          >
            {paymentMethod === 'wallet' ? 'پرداخت از کیف پول' : 'پرداخت از زرین‌پال'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

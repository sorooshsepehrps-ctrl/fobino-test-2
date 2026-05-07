import {
  ArrowDownLeft,
  ArrowUpRight,
  BadgeDollarSign,
  Clock3,
  CreditCard,
  Lock,
  Package,
  SearchCheck,
  ShieldCheck,
  Truck,
  Wallet,
} from 'lucide-react';

export const domainMeta = {
  wallet: {
    label: 'کیف پول',
    icon: Wallet,
    iconClass: 'bg-blue-50 text-blue-800',
  },
  withdrawal: {
    label: 'برداشت',
    icon: ArrowUpRight,
    iconClass: 'bg-red-50 text-red-700',
  },
  subscription: {
    label: 'اشتراک',
    icon: CreditCard,
    iconClass: 'bg-blue-50 text-blue-800',
  },
  deal: {
    label: 'معامله امن',
    icon: ShieldCheck,
    iconClass: 'bg-blue-50 text-blue-800',
  },
  inspection: {
    label: 'بازرسی',
    icon: SearchCheck,
    iconClass: 'bg-indigo-50 text-indigo-700',
  },
  shipping: {
    label: 'ارسال',
    icon: Truck,
    iconClass: 'bg-sky-50 text-sky-700',
  },
  marketing: {
    label: 'مارکتینگ',
    icon: BadgeDollarSign,
    iconClass: 'bg-purple-50 text-purple-700',
  },
  dropshipping: {
    label: 'دراپ‌شیپینگ',
    icon: Package,
    iconClass: 'bg-cyan-50 text-cyan-700',
  },
};

export const flowMeta = {
  block: {
    label: 'بلوکه شدن مبلغ',
    icon: Lock,
  },
  incoming_pending: {
    label: 'دریافتی در انتظار',
    icon: Clock3,
  },
  incoming_released: {
    label: 'دریافتی آزاد شده',
    icon: ArrowDownLeft,
  },
  refund: {
    label: 'بازگشت وجه',
    icon: ArrowDownLeft,
  },
  fee: {
    label: 'کارمزد',
    icon: ArrowUpRight,
  },
  wallet_payment: {
    label: 'پرداخت از کیف پول',
    icon: ArrowUpRight,
  },
};

export function getTransactionMeta(item) {
  return domainMeta[item?.domain] || domainMeta.wallet;
}
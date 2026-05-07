import { ArrowDownLeft, ArrowUpRight, Clock3, Wallet } from 'lucide-react';
import Card from '../ui/Card';
import { formatMoney } from '../../utils/wallet';

const cards = [
  {
    key: 'availableBalance',
    title: 'موجودی قابل برداشت',
    icon: Wallet,
    iconClass: 'bg-blue-100 text-blue-900',
  },
  {
    key: 'blockedBalance',
    title: 'موجودی بلوکه‌شده',
    icon: ArrowUpRight,
    iconClass: 'bg-red-100 text-red-700',
  },
  {
    key: 'incomingPendingTotal',
    title: 'دریافتی‌های در انتظار',
    icon: Clock3,
    iconClass: 'bg-blue-100 text-blue-800',
  },
  {
    key: 'totalFees',
    title: 'مجموع کارمزدها',
    icon: ArrowDownLeft,
    iconClass: 'bg-red-100 text-red-700',
  },
];

export default function WalletSummaryCards({ summary }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.key} variant="wallet" className="rounded-2xl" padding="lg">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-gray-500">{item.title}</p>
                <p className="mt-3 text-xl font-bold text-gray-900">
                  {formatMoney(summary?.[item.key] || 0)}
                </p>
              </div>
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${item.iconClass}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
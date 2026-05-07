
import { Package2, Clock3, CheckCircle2, Wallet2 } from 'lucide-react';
import Card from '../ui/Card';

function formatMoney(value) {
  return new Intl.NumberFormat('fa-IR').format(Number(value || 0)) + ' تومان';
}

const cards = [
  {
    key: 'totalProducts',
    title: 'کل محصولات',
    icon: Package2,
    tone: 'bg-blue-100 text-blue-900',
    money: false,
  },
  {
    key: 'activeRfps',
    title: 'RFP فعال',
    icon: Clock3,
    tone: 'bg-amber-100 text-amber-800',
    money: false,
  },
  {
    key: 'completedRfps',
    title: 'RFP تکمیل‌شده',
    icon: CheckCircle2,
    tone: 'bg-emerald-100 text-emerald-800',
    money: false,
  },
  {
    key: 'pendingIncoming',
    title: 'دریافتی در انتظار',
    icon: Wallet2,
    tone: 'bg-violet-100 text-violet-800',
    money: true,
  },
];

export default function ProviderSummaryCards({ summary }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((item) => {
        const Icon = item.icon;
        const value = summary?.[item.key] || 0;

        return (
          <Card key={item.key} className="rounded-3xl border border-slate-100" padding="lg">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">{item.title}</p>
                <p className="mt-3 text-2xl font-bold text-slate-900">
                  {item.money ? formatMoney(value) : value}
                </p>
              </div>

              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${item.tone}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

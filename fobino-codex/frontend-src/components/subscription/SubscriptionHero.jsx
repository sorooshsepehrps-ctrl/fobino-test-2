import { ArrowDown, BadgeCheck, Factory, Headset, Sparkles } from 'lucide-react';
import { Button, Card } from '../ui';

export default function SubscriptionHero({ onScrollToPlans, onNavigate }) {
  return (
    <Card variant="walletHero" padding="lg" className="overflow-hidden rounded-3xl">
      <div className="relative">
        <div className="absolute -left-10 -top-10 h-36 w-36 rounded-full bg-red-500/20 blur-3xl" />
        <div className="absolute -bottom-14 right-20 h-44 w-44 rounded-full bg-blue-300/20 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-blue-100">اشتراک‌های سالانه فوبینو</p>
                <h1 className="text-2xl font-black md:text-3xl">VIP یا تولیدکننده؛ مسیر حرفه‌ای‌تر در بازار فوبینو</h1>
              </div>
            </div>

            <p className="mt-4 text-sm leading-8 text-blue-100 md:text-base">
              با اشتراک‌های جدید، ۸۵ دسترسی تماس، نشان اعتماد عمومی و ۲۰ ساعت مشاوره آنلاین دریافت کنید.
              تولیدکنندگان علاوه بر این‌ها می‌توانند احراز ستاره‌ای و درخواست مشاوره حضوری را هم شروع کنند.
            </p>

            <div className="mt-5 grid gap-3 text-sm text-blue-50 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/10 p-3">
                <BadgeCheck className="mb-2 h-5 w-5" />
                <span>نمایش badge در بخش‌های عمومی</span>
              </div>
              <div className="rounded-2xl bg-white/10 p-3">
                <Headset className="mb-2 h-5 w-5" />
                <span>۲۰ ساعت مشاوره آنلاین رایگان</span>
              </div>
              <div className="rounded-2xl bg-white/10 p-3">
                <Factory className="mb-2 h-5 w-5" />
                <span>مسیر احراز تولیدکننده سه‌سطحی</span>
              </div>
            </div>
          </div>

          <div className="flex min-w-[230px] flex-col gap-3">
            <Button
              variant="danger"
              icon={ArrowDown}
              onClick={onScrollToPlans}
              className="bg-red-600 hover:bg-red-700"
            >
              مشاهده پلن‌ها
            </Button>
            <Button
              variant="secondary"
              icon={Headset}
              onClick={() => onNavigate('/dashboard/consultations')}
              className="bg-white text-blue-900 hover:bg-blue-50"
            >
              مشاوره‌های من
            </Button>
            <Button
              variant="secondary"
              icon={Factory}
              onClick={() => onNavigate('/dashboard/producer-verification')}
              className="bg-white/10 text-white hover:bg-white/20"
            >
              احراز تولیدکننده
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

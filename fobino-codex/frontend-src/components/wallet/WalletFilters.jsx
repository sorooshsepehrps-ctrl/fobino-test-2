import { Search, RotateCcw } from 'lucide-react';
import { Button, Input } from '../ui';
import { getDomainFilterOptions, getQuickFlowFilters } from '../../utils/wallet';

export default function WalletFilters({
  filters,
  onChange,
  onReset,
  loading = false,
}) {
  const domains = getDomainFilterOptions();
  const quickFlows = getQuickFlowFilters();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
        <Input
          value={filters.search}
          onChange={(e) => onChange({ search: e.target.value })}
          placeholder="جستجو در شماره تراکنش، عنوان یا مرجع"
          icon={Search}
        />

        <select
          value={filters.status}
          onChange={(e) => onChange({ status: e.target.value })}
          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">همه وضعیت‌ها</option>
          <option value="pending">در انتظار</option>
          <option value="completed">تکمیل شده</option>
          <option value="failed">ناموفق</option>
          <option value="cancelled">لغو شده</option>
        </select>

        <select
          value={filters.sort}
          onChange={(e) => onChange({ sort: e.target.value })}
          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="newest">جدیدترین</option>
          <option value="oldest">قدیمی‌ترین</option>
          <option value="amount_desc">بیشترین مبلغ</option>
          <option value="amount_asc">کمترین مبلغ</option>
        </select>

        <Button
          variant="brandOutline"
          icon={RotateCcw}
          onClick={onReset}
          disabled={loading}
          className="w-full"
        >
          پاک کردن فیلترها
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {domains.map((item) => (
          <Button
            key={item.value || 'all-domain'}
            size="sm"
            variant={filters.domain === item.value ? 'walletFilterActive' : 'walletFilter'}
            onClick={() => onChange({ domain: item.value })}
          >
            {item.label}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {quickFlows.map((item) => (
          <Button
            key={item.value || 'all-flow'}
            size="sm"
            variant={filters.flow === item.value ? 'walletFilterActive' : 'walletFilter'}
            onClick={() => onChange({ flow: item.value })}
          >
            {item.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
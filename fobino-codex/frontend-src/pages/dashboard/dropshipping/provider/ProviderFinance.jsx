

import { useCallback, useEffect, useState } from 'react';

import { dropshippingService } from '../../../../services';
import DropshippingFinanceSummary from '../../../../components/dropshipping/DropshippingFinanceSummary';
import DropshippingTransactionList from '../../../../components/dropshipping/DropshippingTransactionList';
import ErrorState from '../../../../components/dropshipping/ErrorState';
import FinancePageSkeleton from '../../../../components/dropshipping/FinancePageSkeleton';
import PageSectionHeader from '../../../../components/dropshipping/PageSectionHeader';

export default function ProviderFinance() {
  const [finance, setFinance] = useState({ summary: {}, items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchFinance = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const payload = await dropshippingService.getProviderFinance();
      setFinance({
        summary: payload?.data?.summary || {},
        items: payload?.data?.items || payload?.data?.transactions || [],
      });
    } catch (err) {
      setError(err.message || 'اطلاعات مالی دریافت نشد');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFinance();
  }, [fetchFinance]);

  if (loading) {
    return <FinancePageSkeleton />;
  }

  if (error) {
    return (
      <ErrorState
        title="اطلاعات مالی دریافت نشد"
        description={error}
        onRetry={fetchFinance}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-10 pt-6 md:px-6 xl:px-8">
      <div className="space-y-6 md:space-y-8">
        <PageSectionHeader
          title="مالی تامین‌کننده"
          subtitle="تمام تراکنش‌های مربوط به دراپ‌شیپینگ، درآمدهای آزادشده، مبالغ در انتظار تسویه و بازگشت وجه‌ها از اینجا قابل پیگیری است."
        />

        <DropshippingFinanceSummary summary={finance.summary} role="provider" />
        <DropshippingTransactionList items={finance.items} loading={false} />
      </div>
    </div>
  );
}
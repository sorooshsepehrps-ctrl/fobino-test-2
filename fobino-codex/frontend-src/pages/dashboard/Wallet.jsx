import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, RefreshCcw, Wallet as WalletIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Card, Input } from '../../components/ui';
import { userService } from '../../services';
import WalletSummaryCards from '../../components/wallet/WalletSummaryCards';
import WalletFilters from '../../components/wallet/WalletFilters';
import TransactionList from '../../components/wallet/TransactionList';
import TransactionDetailsDrawer from '../../components/wallet/TransactionDetailsDrawer';
import { formatMoney } from '../../utils/wallet';

const DEFAULT_FILTERS = {
  page: 1,
  limit: 10,
  status: '',
  domain: '',
  flow: '',
  search: '',
  sort: 'newest',
};

export default function Wallet() {
  const [searchParams] = useSearchParams();

  const [summary, setSummary] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [pagination, setPagination] = useState(null);

  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingLedger, setLoadingLedger] = useState(true);

  const [showChargeModal, setShowChargeModal] = useState(false);
  const [chargeAmount, setChargeAmount] = useState('');
  const [processingCharge, setProcessingCharge] = useState(false);

  const [selectedTransactionId, setSelectedTransactionId] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [loadingTransactionDetails, setLoadingTransactionDetails] = useState(false);

  useEffect(() => {
    handleCallbackToast();
    fetchSummary();
  }, []);

  useEffect(() => {
    fetchLedger(filters);
  }, [filters]);

  useEffect(() => {
    if (!selectedTransactionId) return;
    fetchTransactionDetails(selectedTransactionId);
  }, [selectedTransactionId]);

  const pageTitle = useMemo(() => {
    return `مرکز مالی و تراکنش‌ها`;
  }, []);

  const handleCallbackToast = () => {
    const status = searchParams.get('status');
    const amount = searchParams.get('amount');
    const error = searchParams.get('error');

    if (status === 'success') {
      toast.success(`کیف پول شما با موفقیت ${formatMoney(amount || 0)} شارژ شد`);
      window.history.replaceState({}, '', '/dashboard/wallet');
    }

    if (status === 'failed') {
      const errorMessages = {
        cancelled: 'پرداخت لغو شد',
        verification_failed: 'تایید پرداخت ناموفق بود',
        transaction_not_found: 'تراکنش یافت نشد',
        wallet_not_found: 'کیف پول یافت نشد',
        server_error: 'خطای سیستمی در بررسی تراکنش',
      };

      toast.error(errorMessages[error] || 'خطا در شارژ کیف پول');
      window.history.replaceState({}, '', '/dashboard/wallet');
    }
  };

  const fetchSummary = async () => {
    setLoadingSummary(true);
    try {
      const response = await userService.getWalletSummary();
      setSummary(response?.data || null);
    } catch (error) {
      toast.error('خطا در دریافت خلاصه کیف پول');
    } finally {
      setLoadingSummary(false);
    }
  };

  const fetchLedger = async (params) => {
    setLoadingLedger(true);
    try {
      const response = await userService.getWalletLedger(params);
      setLedger(response?.data?.items || []);
      setPagination(response?.pagination || null);
    } catch (error) {
      toast.error('خطا در دریافت تراکنش‌ها');
      setLedger([]);
      setPagination(null);
    } finally {
      setLoadingLedger(false);
    }
  };

  const fetchTransactionDetails = async (transactionId) => {
    setLoadingTransactionDetails(true);
    try {
      const response = await userService.getWalletTransactionDetails(transactionId);
      setSelectedTransaction(response?.data?.item || null);
    } catch (error) {
      toast.error('خطا در دریافت جزئیات تراکنش');
      setSelectedTransaction(null);
    } finally {
      setLoadingTransactionDetails(false);
    }
  };

  const handleCharge = async () => {
    const amount = Number(String(chargeAmount).replace(/\D/g, ''));

    if (!amount || amount < 10000) {
      toast.error('حداقل مبلغ شارژ ۱۰,۰۰۰ ریال است');
      return;
    }

    setProcessingCharge(true);
    try {
      const response = await userService.createWalletDeposit(amount);
      const paymentUrl = response?.data?.paymentUrl;

      if (paymentUrl) {
        window.location.href = paymentUrl;
        return;
      }

      toast.error('لینک پرداخت دریافت نشد');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'خطا در شارژ کیف پول');
    } finally {
      setProcessingCharge(false);
    }
  };

  const handleFilterChange = (patch) => {
    setFilters((prev) => ({
      ...prev,
      ...patch,
      page: patch.page ? patch.page : 1,
    }));
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const handleOpenDetails = (item) => {
    setSelectedTransactionId(item._id);
    setSelectedTransaction(item);
  };

  const handleCloseDetails = () => {
    setSelectedTransactionId(null);
    setSelectedTransaction(null);
  };

  const handleAmountInput = (value) => {
    const digits = String(value || '').replace(/\D/g, '');
    setChargeAmount(digits ? Number(digits).toLocaleString('en-US') : '');
  };

  return (
    <div className="space-y-6">
      <Card variant="walletHero" padding="lg" className="rounded-3xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                <WalletIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-blue-100">داشبورد مالی</p>
                <h1 className="text-2xl font-bold">{pageTitle}</h1>
              </div>
            </div>

            <p className="mt-4 max-w-3xl text-sm leading-7 text-blue-100">
              همه تراکنش‌های مالی، مبالغ بلوکه‌شده، دریافتی‌های در انتظار، کارمزدها و
              وضعیت نهایی هر جریان مالی از اینجا قابل مشاهده است.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              icon={RefreshCcw}
              onClick={() => {
                fetchSummary();
                fetchLedger(filters);
              }}
              className="bg-white text-blue-900 hover:bg-blue-50"
            >
              بروزرسانی
            </Button>

            <Button
              variant="danger"
              icon={Plus}
              onClick={() => setShowChargeModal(true)}
              className="bg-red-600 hover:bg-red-700"
            >
              شارژ کیف پول
            </Button>
          </div>
        </div>
      </Card>

      {loadingSummary ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <Card key={item} variant="wallet" className="animate-pulse rounded-2xl" padding="lg">
              <div className="h-24 rounded-xl bg-gray-100" />
            </Card>
          ))}
        </div>
      ) : (
        <WalletSummaryCards summary={summary} />
      )}

      <Card variant="wallet" className="rounded-2xl" padding="lg">
        <WalletFilters
          filters={filters}
          onChange={handleFilterChange}
          onReset={handleResetFilters}
          loading={loadingLedger}
        />
      </Card>

      <TransactionList
        items={ledger}
        loading={loadingLedger}
        onSelect={handleOpenDetails}
      />

      {pagination?.pages > 1 ? (
        <Card variant="wallet" className="rounded-2xl" padding="md">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-gray-500">
              صفحه {pagination.page} از {pagination.pages}
            </div>

            <div className="flex gap-2">
              <Button
                variant="brandOutline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => handleFilterChange({ page: pagination.page - 1 })}
              >
                صفحه قبل
              </Button>

              <Button
                variant="brand"
                size="sm"
                disabled={pagination.page >= pagination.pages}
                onClick={() => handleFilterChange({ page: pagination.page + 1 })}
              >
                صفحه بعد
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      <TransactionDetailsDrawer
        isOpen={Boolean(selectedTransactionId)}
        onClose={handleCloseDetails}
        item={selectedTransaction}
        loading={loadingTransactionDetails}
      />

      <TransactionDetailsDrawer
        isOpen={false}
        onClose={() => {}}
        item={null}
      />

      <div>
        {showChargeModal ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowChargeModal(false)}
            />

            <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl">
              <div className="border-b border-gray-100 p-4">
                <h3 className="text-lg font-semibold text-gray-900">شارژ کیف پول</h3>
              </div>

              <div className="space-y-4 p-4">
                <Input
                  value={chargeAmount}
                  onChange={(e) => handleAmountInput(e.target.value)}
                  placeholder="مبلغ را وارد کنید"
                />

                <div className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-900">
                  حداقل مبلغ شارژ: {formatMoney(10000)}
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setShowChargeModal(false)}
                  >
                    بستن
                  </Button>

                  <Button
                    variant="danger"
                    className="flex-1"
                    onClick={handleCharge}
                    loading={processingCharge}
                  >
                    انتقال به درگاه
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
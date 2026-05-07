import { useState, useEffect } from 'react';
import { Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { marketingService } from '../../../services';
import TradeContractCard from '../../../components/marketing/TradeContractCard';

export default function MyContracts() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    role: 'all',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    loadContracts();
  }, [pagination.page, filters.status, filters.role]);

  const loadContracts = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (filters.status !== 'all') {
        params.status = filters.status;
      }
      if (filters.role !== 'all') {
        params.role = filters.role;
      }

      const response = await marketingService.getMyContracts(params);
      setContracts(response.data || []);
      if (response.pagination) {
        setPagination(prev => ({
          ...prev,
          total: response.pagination.total,
          pages: response.pagination.pages,
        }));
      }

      // Determine user's primary role
      if (response.data?.length > 0) {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const contract = response.data[0];
        if (contract.seller?._id === user._id) {
          setUserRole('seller');
        } else if (contract.marketer?._id === user._id) {
          setUserRole('marketer');
        } else if (contract.buyer?._id === user._id) {
          setUserRole('buyer');
        }
      }
    } catch (error) {
      console.error('Error loading contracts:', error);
      toast.error('خطا در بارگذاری قراردادها');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
  };

  const totalCommission = contracts.reduce((sum, contract) => {
    if (contract.commission?.status === 'released' || contract.commission?.status === 'released_with_fee') {
      return sum + (contract.commission.amount - (contract.commission.fobinoFee || 0));
    }
    return sum;
  }, 0);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">قراردادهای تجاری من</h1>
        <p className="text-gray-600 mt-1">مدیریت قراردادهای بازاریابی</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-500" />
          
          <select
            value={filters.role}
            onChange={(e) => {
              setFilters({ ...filters, role: e.target.value });
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">همه نقش‌ها</option>
            <option value="seller">فروشنده</option>
            <option value="buyer">خریدار</option>
            <option value="marketer">بازاریاب</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => {
              setFilters({ ...filters, status: e.target.value });
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">همه وضعیت‌ها</option>
            <option value="waiting_buyer">در انتظار خریدار</option>
            <option value="buyer_connected">خریدار متصل شد</option>
            <option value="buyer_approved">تایید شده</option>
            <option value="commission_deposited">کمیسیون واریز شد</option>
            <option value="completed">تکمیل شده</option>
            <option value="cancelled">لغو شده</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">کل قراردادها</p>
          <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">فعال</p>
          <p className="text-2xl font-bold text-blue-600">
            {contracts.filter(c => !['completed', 'cancelled'].includes(c.status)).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">تکمیل شده</p>
          <p className="text-2xl font-bold text-green-600">
            {contracts.filter(c => c.status === 'completed').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">کل کمیسیون دریافتی</p>
          <p className="text-lg font-bold text-green-600">
            {formatPrice(totalCommission)}
          </p>
        </div>
      </div>

      {/* Contracts Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">در حال بارگذاری...</p>
        </div>
      ) : contracts.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-600">هیچ قرارداد تجاری یافت نشد</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contracts.map((contract) => (
              <TradeContractCard
                key={contract._id}
                contract={contract}
                userRole={userRole}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                قبلی
              </button>
              
              {[...Array(pagination.pages)].map((_, index) => (
                <button
                  key={index}
                  onClick={() => setPagination(prev => ({ ...prev, page: index + 1 }))}
                  className={`px-4 py-2 rounded-lg ${
                    pagination.page === index + 1
                      ? 'bg-purple-600 text-white'
                      : 'border hover:bg-gray-50'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
              
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.pages}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                بعدی
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

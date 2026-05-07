import { useState, useEffect } from 'react';
import { Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { marketingService } from '../../../services';
import RFPCard from '../../../components/marketing/RFPCard';

export default function MyRFPs() {
  const [rfps, setRfps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    loadRFPs();
  }, [pagination.page, filters.status]);

  const loadRFPs = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (filters.status !== 'all') {
        params.status = filters.status;
      }

      const response = await marketingService.getMyRFPs(params);
      setRfps(response.data || []);
      if (response.pagination) {
        setPagination(prev => ({
          ...prev,
          total: response.pagination.total,
          pages: response.pagination.pages,
        }));
      }

      // Determine user role from first RFP
      if (response.data?.length > 0) {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (response.data[0].seller?._id === user._id) {
          setUserRole('seller');
        } else if (response.data[0].marketer?._id === user._id) {
          setUserRole('marketer');
        }
      }
    } catch (error) {
      console.error('Error loading RFPs:', error);
      toast.error('خطا در بارگذاری RFP ها');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">RFP های من</h1>
        <p className="text-gray-600 mt-1">مدیریت درخواست‌های پیشنهادی</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <select
            value={filters.status}
            onChange={(e) => {
              setFilters({ ...filters, status: e.target.value });
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">همه وضعیت‌ها</option>
            <option value="waiting_seller_approval">در انتظار تایید فروشنده</option>
            <option value="waiting_marketer_approval">در انتظار تایید بازاریاب</option>
            <option value="approved">تایید شده</option>
            <option value="rejected_by_seller">رد شده توسط فروشنده</option>
            <option value="rejected_by_marketer">رد شده توسط بازاریاب</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">کل RFP ها</p>
          <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">در انتظار تایید</p>
          <p className="text-2xl font-bold text-yellow-600">
            {rfps.filter(r => r.status.includes('waiting')).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">تایید شده</p>
          <p className="text-2xl font-bold text-green-600">
            {rfps.filter(r => r.status === 'approved').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">رد شده</p>
          <p className="text-2xl font-bold text-red-600">
            {rfps.filter(r => r.status.includes('rejected')).length}
          </p>
        </div>
      </div>

      {/* RFPs Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">در حال بارگذاری...</p>
        </div>
      ) : rfps.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-600">هیچ RFP یافت نشد</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rfps.map((rfp) => (
              <RFPCard key={rfp._id} rfp={rfp} userRole={userRole} />
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
                      ? 'bg-blue-600 text-white'
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

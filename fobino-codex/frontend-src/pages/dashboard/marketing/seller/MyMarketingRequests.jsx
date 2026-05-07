import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Filter, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { marketingService } from '../../../../services';
import MarketingRequestCard from '../../../../components/marketing/MarketingRequestCard';

export default function MyMarketingRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    loadRequests();
  }, [pagination.page, filters.status]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (filters.status !== 'all') {
        params.status = filters.status;
      }

      const response = await marketingService.getMyMarketingRequests(params);
      setRequests(response.data || []);
      if (response.pagination) {
        setPagination(prev => ({
          ...prev,
          total: response.pagination.total,
          pages: response.pagination.pages,
        }));
      }
    } catch (error) {
      console.error('Error loading requests:', error);
      toast.error('خطا در بارگذاری درخواست‌ها');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید این درخواست را حذف کنید؟')) {
      return;
    }

    try {
      await marketingService.deleteMarketingRequest(id);
      toast.success('درخواست با موفقیت حذف شد');
      loadRequests();
    } catch (error) {
      console.error('Error deleting request:', error);
      toast.error('خطا در حذف درخواست');
    }
  };

  const handleEdit = (request) => {
    navigate(`/dashboard/marketing/requests/edit/${request._id}`);
  };

  const filteredRequests = requests.filter(req => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        req.productName?.toLowerCase().includes(searchLower) ||
        req.brand?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">درخواست‌های بازاریابی من</h1>
          <p className="text-gray-600 mt-1">مدیریت درخواست‌های بازاریابی خود</p>
        </div>
        <button
          onClick={() => navigate('/dashboard/marketing/requests/new')}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
        >
          <Plus className="w-5 h-5" />
          درخواست جدید
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="جستجو در نام محصول یا برند..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pr-10 pl-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">همه</option>
              <option value="active">فعال</option>
              <option value="inactive">غیرفعال</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">کل درخواست‌ها</p>
          <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">فعال</p>
          <p className="text-2xl font-bold text-green-600">
            {requests.filter(r => r.status === 'active').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">پذیرفته شده</p>
          <p className="text-2xl font-bold text-blue-600">
            {requests.filter(r => r.acceptedBy?.length).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">کل بازدیدها</p>
          <p className="text-2xl font-bold text-purple-600">
            {requests.reduce((sum, r) => sum + (r.stats?.views || 0), 0)}
          </p>
        </div>
      </div>

      {/* Requests Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">در حال بارگذاری...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-600 mb-4">هیچ درخواست بازاریابی یافت نشد</p>
          <button
            onClick={() => navigate('/dashboard/marketing/requests/new')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            اولین درخواست خود را ایجاد کنید
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRequests.map((request) => (
              <MarketingRequestCard
                key={request._id}
                request={request}
                isSeller={true}
                onDelete={handleDelete}
                onEdit={handleEdit}
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

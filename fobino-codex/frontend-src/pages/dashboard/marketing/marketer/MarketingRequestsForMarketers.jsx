import { useState, useEffect } from 'react';
import { Search, Filter, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { marketingService, postService } from '../../../../services';
import MarketingRequestCard from '../../../../components/marketing/MarketingRequestCard';

export default function MarketingRequestsForMarketers() {
  const currentUserId = JSON.parse(localStorage.getItem('user') || '{}')._id;
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    category1: '',
    category2: '',
    category3: '',
    province: '',
    city: '',
    minCommission: '',
    maxCommission: '',
    search: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    loadCategories();
    loadRequests();
  }, [pagination.page]);

  const loadCategories = async () => {
    try {
      const response = await postService.getCategories();
      // Backend returns { categories: [...] }
      const categoriesData = Array.isArray(response.data?.categories) ? response.data.categories : [];
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]); // Set empty array on error
    }
  };

  const loadRequests = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      };

      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });

      const response = await marketingService.getAllMarketingRequestsForMarketers(params);
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

  const handleAcceptRequest = async (id) => {
    if (!confirm('آیا می‌خواهید این درخواست بازاریابی را بپذیرید؟')) {
      return;
    }

    try {
      await marketingService.acceptMarketingRequest(id);
      toast.success('درخواست با موفقیت پذیرفته شد');
      loadRequests();
    } catch (error) {
      console.error('Error accepting request:', error);
      toast.error(error.response?.data?.message || 'خطا در پذیرش درخواست');
    }
  };

  const handleApplyFilters = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    loadRequests();
  };

  const handleResetFilters = () => {
    setFilters({
      category1: '',
      category2: '',
      category3: '',
      province: '',
      city: '',
      minCommission: '',
      maxCommission: '',
      search: '',
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const filteredRequests = requests.filter(req => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        req.productName?.toLowerCase().includes(searchLower) ||
        req.brand?.toLowerCase().includes(searchLower) ||
        req.description?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const isAcceptedByCurrent = (request) =>
    request.acceptedBy?.some(entry => entry.marketer?.toString?.() === currentUserId || entry.marketer === currentUserId);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">درخواست‌های بازاریابی</h1>
        <p className="text-gray-600 mt-1">درخواست‌های فعال برای بازاریاب‌ها</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-medium">فیلترها</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Search */}
          <div className="md:col-span-3 relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="جستجو در نام محصول، برند یا توضیحات..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pr-10 pl-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Province */}
          <div>
            <label className="block text-sm font-medium mb-2">استان</label>
            <input
              type="text"
              placeholder="مثال: تهران"
              value={filters.province}
              onChange={(e) => setFilters({ ...filters, province: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-medium mb-2">شهر</label>
            <input
              type="text"
              placeholder="مثال: تهران"
              value={filters.city}
              onChange={(e) => setFilters({ ...filters, city: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-2">دسته‌بندی</label>
            <select
              value={filters.category1}
              onChange={(e) => setFilters({ ...filters, category1: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">همه دسته‌ها</option>
              {(categories || []).map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Min Commission */}
          <div>
            <label className="block text-sm font-medium mb-2">حداقل کمیسیون (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              placeholder="0"
              value={filters.minCommission}
              onChange={(e) => setFilters({ ...filters, minCommission: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Max Commission */}
          <div>
            <label className="block text-sm font-medium mb-2">حداکثر کمیسیون (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              placeholder="100"
              value={filters.maxCommission}
              onChange={(e) => setFilters({ ...filters, maxCommission: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleApplyFilters}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            اعمال فیلترها
          </button>
          <button
            onClick={handleResetFilters}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            پاک کردن فیلترها
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">کل درخواست‌ها</p>
          <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">میانگین کمیسیون</p>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <p className="text-2xl font-bold text-green-600">
              {requests.length > 0
                ? (requests.reduce((sum, r) => sum + r.commissionPercent, 0) / requests.length).toFixed(1)
                : 0}%
            </p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">فرصت‌های جدید</p>
          <p className="text-2xl font-bold text-blue-600">
            {requests.filter(r => !isAcceptedByCurrent(r)).length}
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
          <p className="text-gray-600">هیچ درخواست بازاریابی یافت نشد</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRequests.map((request) => {
              const acceptedByCurrent = isAcceptedByCurrent(request);
              return (
              <div key={request._id} className="relative">
                <MarketingRequestCard
                  request={request}
                  isSeller={false}
                  showAcceptedBadge={acceptedByCurrent}
                />
                {!acceptedByCurrent && (
                  <div className="absolute bottom-4 left-4 right-4">
                    <button
                      onClick={() => handleAcceptRequest(request._id)}
                      className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 font-medium"
                    >
                      پذیرش این درخواست
                    </button>
                  </div>
                )}
              </div>
              );
            })}
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

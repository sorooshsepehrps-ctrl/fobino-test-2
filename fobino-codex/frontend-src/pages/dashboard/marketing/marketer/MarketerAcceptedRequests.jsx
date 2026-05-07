import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Search, TrendingUp, FileText, FileCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { marketingService } from '../../../../services';

export default function MarketerAcceptedRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const loadAcceptedRequests = useCallback(async () => {
    setLoading(true);
    try {
      const response = await marketingService.getMyAcceptedRequests({
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
      });
      setRequests(response.data || []);
      if (response.pagination) {
        setPagination(prev => ({
          ...prev,
          total: response.pagination.total,
          pages: response.pagination.pages,
        }));
      }
    } catch (error) {
      console.error('Error loading accepted requests:', error);
      toast.error('خطا در بارگذاری درخواست‌ها');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchTerm]);

  useEffect(() => {
    loadAcceptedRequests();
  }, [loadAcceptedRequests]);

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    loadAcceptedRequests();
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const filteredRequests = requests.filter(req => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      req.productName?.toLowerCase().includes(searchLower) ||
      req.brand?.toLowerCase().includes(searchLower)
    );
  });

  const getRequestStats = (request) => {
    const currentUserId = JSON.parse(localStorage.getItem('user') || '{}')._id;
    const myRfps = (request.rfps || []).filter(
      rfp => rfp.marketer?._id === currentUserId || rfp.marketer === currentUserId
    );
    const myContracts = myRfps.filter(rfp => rfp.tradeContract).length;
    return { rfpsCount: myRfps.length, contractsCount: myContracts };
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">درخواست‌های پذیرفته شده</h1>
        <p className="text-gray-600 mt-2">مدیریت درخواست‌های بازاریابی، RFP‌ها و قراردادهای خود</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">کل درخواست‌ها</p>
              <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
            </div>
            <Package className="w-10 h-10 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">کل RFP‌ها</p>
              <p className="text-2xl font-bold text-green-600">
                {requests.reduce((sum, req) => sum + getRequestStats(req).rfpsCount, 0)}
              </p>
            </div>
            <FileText className="w-10 h-10 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">قراردادهای فعال</p>
              <p className="text-2xl font-bold text-purple-600">
                {requests.reduce((sum, req) => sum + getRequestStats(req).contractsCount, 0)}
              </p>
            </div>
            <FileCheck className="w-10 h-10 text-purple-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">میانگین کمیسیون</p>
              <p className="text-2xl font-bold text-orange-600">
                {requests.length > 0
                  ? (requests.reduce((sum, r) => sum + r.commissionPercent, 0) / requests.length).toFixed(1)
                  : 0}%
              </p>
            </div>
            <TrendingUp className="w-10 h-10 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="جستجو در نام محصول یا برند..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pr-10 pl-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            جستجو
          </button>
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">هنوز درخواستی را نپذیرفته‌اید</p>
          <button
            onClick={() => navigate('/dashboard/marketing/browse-requests')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            مرور درخواست‌های موجود
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {filteredRequests.map((request) => {
              const stats = getRequestStats(request);
              const acceptedEntry = request.acceptedBy?.find(entry => 
                entry.marketer?._id === JSON.parse(localStorage.getItem('user') || '{}')._id
              );
              
              return (
                <div
                  key={request._id}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/dashboard/marketing/my-accepted-requests/${request._id}`)}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900">{request.productName}</h3>
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                            {request.brand}
                          </span>
                        </div>
                        <p className="text-gray-600 line-clamp-2">{request.description}</p>
                      </div>
                      <div className="text-left mr-4">
                        <div className="text-sm text-gray-500 mb-1">کمیسیون</div>
                        <div className="text-2xl font-bold text-green-600">{request.commissionPercent}%</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">RFP‌ها:</span>
                        <span className="font-bold text-gray-900">{stats.rfpsCount}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <FileCheck className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">قراردادها:</span>
                        <span className="font-bold text-gray-900">{stats.contractsCount}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        دسته: {request.categories?.level1?.name || 'نامشخص'}
                      </div>
                      <div className="text-sm text-gray-600">
                        پذیرفته در: {formatDate(acceptedEntry?.acceptedAt || request.createdAt)}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/dashboard/marketing/my-accepted-requests/${request._id}`);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                      >
                        مشاهده جزئیات
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/dashboard/marketing/rfps/create/${request._id}`);
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                      >
                        ایجاد RFP جدید
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
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

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, FileText, CheckCircle, Clock, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { marketingService } from '../../../../services';

export default function MyAcceptedRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    hasRFP: 'all',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0,
  });

  const loadAcceptedRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      };

      const response = await marketingService.getMyAcceptedRequests(params);
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
      toast.error('خطا در بارگذاری درخواست‌های پذیرفته');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  useEffect(() => {
    loadAcceptedRequests();
  }, [loadAcceptedRequests]);

  const handleSearch = (e) => {
    setFilters({ ...filters, search: e.target.value });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'green',
      inactive: 'red',
    };
    return colors[status] || 'gray';
  };

  const getRFPStatus = (request) => {
    if (!request.rfps || request.rfps.length === 0) {
      return { text: 'RFP ایجاد نشده', color: 'gray' };
    }
    
    const latestRFP = request.rfps[request.rfps.length - 1];
    if (latestRFP.status === 'approved') {
      return { text: 'RFP تایید شده', color: 'green' };
    }
    if (latestRFP.status.includes('waiting')) {
      return { text: 'در انتظار تایید', color: 'yellow' };
    }
    if (latestRFP.status.includes('rejected')) {
      return { text: 'RFP رد شده', color: 'red' };
    }
    return { text: 'RFP در حال بررسی', color: 'blue' };
  };

  const getRfpStatusInfo = (status) => {
    const statusMap = {
      draft: { label: 'پیش‌نویس', color: 'gray' },
      waiting_seller_approval: { label: 'در انتظار تایید فروشنده', color: 'yellow' },
      waiting_marketer_approval: { label: 'در انتظار تایید بازاریاب', color: 'yellow' },
      approved: { label: 'تایید شده', color: 'green' },
      rejected_by_seller: { label: 'رد شده توسط فروشنده', color: 'red' },
      rejected_by_marketer: { label: 'رد شده توسط بازاریاب', color: 'red' },
      seller_editing: { label: 'در حال ویرایش فروشنده', color: 'blue' },
      marketer_editing: { label: 'در حال ویرایش بازاریاب', color: 'blue' },
    };
    return statusMap[status] || { label: status, color: 'gray' };
  };

  const getContractStatusInfo = (status) => {
    const statusMap = {
      waiting_buyer: { label: 'در انتظار خریدار', color: 'yellow' },
      buyer_connected: { label: 'خریدار متصل شد', color: 'blue' },
      buyer_approved: { label: 'تایید شده توسط خریدار', color: 'green' },
      buyer_rejected: { label: 'رد شده توسط خریدار', color: 'red' },
      commission_deposited: { label: 'کمیسیون واریز شد', color: 'green' },
      contacts_shared: { label: 'اطلاعات تماس ارسال شد', color: 'green' },
      deal_created: { label: 'معامله ایجاد شد', color: 'blue' },
      completed: { label: 'تکمیل شده', color: 'green' },
      cancelled: { label: 'لغو شده', color: 'red' },
    };
    return statusMap[status] || { label: status, color: 'gray' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">درخواست‌های پذیرفته من</h1>
        <p className="text-gray-600 mt-1">مدیریت درخواست‌های بازاریابی که پذیرفته‌اید</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="جستجوی محصول یا برند..."
                value={filters.search}
                onChange={handleSearch}
                className="w-full pr-10 pl-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">همه وضعیت‌ها</option>
            <option value="active">فعال</option>
            <option value="inactive">غیرفعال</option>
          </select>

          <select
            value={filters.hasRFP}
            onChange={(e) => handleFilterChange('hasRFP', e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">همه RFP ها</option>
            <option value="has">دارای RFP</option>
            <option value="none">بدون RFP</option>
          </select>
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
          <p className="text-sm text-gray-600">دارای RFP</p>
          <p className="text-2xl font-bold text-blue-600">
            {requests.filter(r => r.rfps && r.rfps.length > 0).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">در انتظار تایید</p>
          <p className="text-2xl font-bold text-yellow-600">
            {requests.filter(r => {
              const status = getRFPStatus(r);
              return status.color === 'yellow';
            }).length}
          </p>
        </div>
      </div>

      {/* Requests Grid */}
      {requests.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">هیچ درخواست پذیرفته‌ای ندارید</p>
          <button
            onClick={() => navigate('/dashboard/marketing/browse-requests')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            مرور درخواست‌های جدید
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map((request) => {
              const rfpStatus = getRFPStatus(request);
              return (
                <div key={request._id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                  {/* Product Image */}
                  <div className="relative h-48 bg-gray-100">
                    {request.images?.[0] ? (
                      <img
                        src={request.images[0].url}
                        alt={request.productName}
                        className="w-full h-full object-cover rounded-t-lg"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                    <span className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium bg-${getStatusColor(request.status)}-100 text-${getStatusColor(request.status)}-800`}>
                      {request.status === 'active' ? 'فعال' : 'غیرفعال'}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-1 truncate">{request.productName}</h3>
                    <p className="text-gray-600 text-sm mb-2">{request.brand}</p>
                    <p className="text-gray-700 text-sm mb-3 line-clamp-2">{request.description}</p>

                    {/* Categories */}
                    <div className="text-xs text-gray-600 mb-3">
                      {request.categories?.level1?.name} → {request.categories?.level2?.name || ''}
                    </div>

                    {/* Location and Commission */}
                    <div className="flex justify-between text-sm mb-3">
                      <span className="text-gray-600">{request.cityOfProduction?.city}</span>
                      <span className="text-green-600 font-medium">{request.commissionPercent}% کمیسیون</span>
                    </div>

                    {/* RFP Status */}
                    <div className={`p-2 rounded-lg bg-${rfpStatus.color}-50 border border-${rfpStatus.color}-200 mb-3`}>
                      <div className="flex items-center gap-2">
                        {rfpStatus.color === 'green' && <CheckCircle className="w-4 h-4 text-green-600" />}
                        {rfpStatus.color === 'yellow' && <Clock className="w-4 h-4 text-yellow-600" />}
                        {rfpStatus.color === 'red' && <CheckCircle className="w-4 h-4 text-red-600" />}
                        {rfpStatus.color === 'blue' && <FileText className="w-4 h-4 text-blue-600" />}
                        <span className={`text-sm font-medium text-${rfpStatus.color}-700`}>
                          {rfpStatus.text}
                        </span>
                      </div>
                    </div>

                    {/* RFPs */}
                    {request.rfps?.length ? (
                      <div className="space-y-2 mb-3">
                        {request.rfps.map((rfp) => {
                          const rfpInfo = getRfpStatusInfo(rfp.status);
                          const contract = rfp.tradeContract;
                          const contractInfo = contract ? getContractStatusInfo(contract.status) : null;
                          return (
                            <div key={rfp._id} className="border rounded-lg p-2 bg-gray-50 text-xs">
                              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                <span className={`px-2 py-0.5 rounded-full bg-${rfpInfo.color}-100 text-${rfpInfo.color}-700`}>
                                  {rfpInfo.label}
                                </span>
                                {contractInfo ? (
                                  <span className={`px-2 py-0.5 rounded-full bg-${contractInfo.color}-100 text-${contractInfo.color}-700`}>
                                    {contractInfo.label}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">بدون قرارداد</span>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <button
                                  onClick={() => navigate(`/dashboard/marketing/rfps/${rfp._id}`)}
                                  className="px-2 py-1 border border-gray-300 rounded hover:bg-white"
                                >
                                  مشاهده RFP
                                </button>
                                {contract && (
                                  <button
                                    onClick={() => navigate(`/dashboard/marketing/contracts/${contract._id}`)}
                                    className="px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                                  >
                                    مشاهده قرارداد
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 mb-3">هنوز RFPی ایجاد نکرده‌اید.</p>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => navigate(`/dashboard/marketing/requests/${request._id}`)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm flex items-center justify-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        جزئیات
                      </button>
                      <button
                        onClick={() => navigate(`/dashboard/marketing/rfps/create/${request._id}`)}
                        className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                      >
                        ایجاد RFP
                      </button>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-4 pb-4">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>پذیرفته: {formatDate(request.acceptedAt)}</span>
                      <span>بازدید: {request.stats?.views || 0}</span>
                    </div>
                  </div>
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

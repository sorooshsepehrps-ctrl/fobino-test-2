import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Package, FileText, FileCheck, Plus, Eye, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { marketingService } from '../../../../services';

export default function MarketerRequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const currentUserId = JSON.parse(localStorage.getItem('user') || '{}')._id;

  const loadRequest = useCallback(async () => {
    setLoading(true);
    try {
      const response = await marketingService.getMarketingRequestById(id);
      setRequest(response.data);
    } catch (error) {
      console.error('Error loading request:', error);
      toast.error('خطا در بارگذاری درخواست');
      navigate('/dashboard/marketing/my-accepted-requests');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadRequest();
  }, [loadRequest]);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
  };

  const getRfpStatusInfo = (status) => {
    const statusMap = {
      draft: { label: 'پیش‌نویس', color: 'bg-gray-100 text-gray-800', icon: '📝' },
      waiting_seller_approval: { label: 'در انتظار تایید فروشنده', color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
      waiting_marketer_approval: { label: 'در انتظار تایید شما', color: 'bg-orange-100 text-orange-800', icon: '⏰' },
      approved: { label: 'تایید شده', color: 'bg-green-100 text-green-800', icon: '✅' },
      rejected_by_seller: { label: 'رد شده توسط فروشنده', color: 'bg-red-100 text-red-800', icon: '❌' },
      rejected_by_marketer: { label: 'رد شده توسط بازاریاب', color: 'bg-red-100 text-red-800', icon: '❌' },
      seller_editing: { label: 'در حال ویرایش فروشنده', color: 'bg-blue-100 text-blue-800', icon: '✏️' },
      marketer_editing: { label: 'در حال ویرایش', color: 'bg-blue-100 text-blue-800', icon: '✏️' },
    };
    return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800', icon: '❓' };
  };

  const getContractStatusInfo = (status) => {
    const statusMap = {
      waiting_buyer: { label: 'در انتظار خریدار', color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
      buyer_connected: { label: 'خریدار متصل شد', color: 'bg-blue-100 text-blue-800', icon: '🔗' },
      buyer_approved: { label: 'تایید شده توسط خریدار', color: 'bg-green-100 text-green-800', icon: '✅' },
      buyer_rejected: { label: 'رد شده توسط خریدار', color: 'bg-red-100 text-red-800', icon: '❌' },
      commission_deposited: { label: 'کمیسیون واریز شد', color: 'bg-green-100 text-green-800', icon: '💰' },
      contacts_shared: { label: 'اطلاعات تماس ارسال شد', color: 'bg-purple-100 text-purple-800', icon: '📞' },
      deal_created: { label: 'معامله ایجاد شد', color: 'bg-indigo-100 text-indigo-800', icon: '🤝' },
      completed: { label: 'تکمیل شده', color: 'bg-green-100 text-green-800', icon: '🎉' },
      cancelled: { label: 'لغو شده', color: 'bg-red-100 text-red-800', icon: '🚫' },
    };
    return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800', icon: '❓' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">درخواست یافت نشد</p>
          <button onClick={() => navigate(-1)} className="text-blue-600 hover:text-blue-700">
            بازگشت
          </button>
        </div>
      </div>
    );
  }

  const myRfps = (request.rfps || []).filter(
    rfp => rfp.marketer?._id === currentUserId || rfp.marketer === currentUserId
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/dashboard/marketing/my-accepted-requests')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowRight className="w-6 h-6" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{request.productName}</h1>
          <p className="text-gray-600">{request.brand}</p>
        </div>
        <button
          onClick={() => navigate(`/dashboard/marketing/rfps/create/${id}`)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          ایجاد RFP جدید
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Info */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Package className="w-6 h-6 text-blue-600" />
                اطلاعات محصول
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">توضیحات</p>
                <p className="text-gray-900">{request.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">دسته‌بندی</p>
                  <p className="font-medium text-gray-900">
                    {request.categories?.level1?.name || 'نامشخص'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">کمیسیون</p>
                  <p className="font-medium text-green-600 text-xl">{request.commissionPercent}%</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">شهر تولید</p>
                  <p className="font-medium text-gray-900">
                    {request.cityOfProduction?.city}, {request.cityOfProduction?.province}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">زمان ارسال</p>
                  <p className="font-medium text-gray-900">
                    {request.shippingTimeAvailable?.value} {request.shippingTimeAvailable?.unit}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Price Volumes */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">قیمت‌های عمده‌فروشی</h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {request.priceVolumes?.map((pv, index) => (
                  <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-900">{pv.volume} {pv.unit}</span>
                    <span className="text-blue-600 font-bold text-lg">{formatPrice(pv.pricePerUnit)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* My RFPs Section */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FileText className="w-6 h-6 text-green-600" />
                RFP های من ({myRfps.length})
              </h2>
              <button
                onClick={() => navigate(`/dashboard/marketing/rfps/create/${id}`)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                ایجاد RFP
              </button>
            </div>
            <div className="p-6">
              {myRfps.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">هنوز RFP ای برای این درخواست ایجاد نکرده‌اید</p>
                  <button
                    onClick={() => navigate(`/dashboard/marketing/rfps/create/${id}`)}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    ایجاد اولین RFP
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {myRfps.map((rfp) => {
                    const rfpStatus = getRfpStatusInfo(rfp.status);
                    const contract = rfp.tradeContract;
                    const contractStatus = contract ? getContractStatusInfo(contract.status) : null;

                    return (
                      <div key={rfp._id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                        <div className="bg-gray-50 p-4 border-b">
                          <div className="flex items-center justify-between mb-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${rfpStatus.color}`}>
                              {rfpStatus.icon} {rfpStatus.label}
                            </span>
                            <span className="text-sm text-gray-600">
                              {formatDate(rfp.createdAt)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-medium text-gray-900">شرکت: {rfp.clientInfo?.companyName || 'نامشخص'}</p>
                          </div>
                          {rfp.proposedTerms && (
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-gray-600">تعداد: </span>
                                <span className="font-medium">{rfp.proposedTerms.quantity} {rfp.proposedTerms.unit}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">قیمت کل: </span>
                                <span className="font-medium text-blue-600">{formatPrice(rfp.proposedTerms.totalPrice)}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Contract Section */}
                        {contract ? (
                          <div className="bg-purple-50 p-4 border-t border-purple-100">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <FileCheck className="w-5 h-5 text-purple-600" />
                                <span className="font-medium text-gray-900">قرارداد تجاری</span>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${contractStatus.color}`}>
                                {contractStatus.icon} {contractStatus.label}
                              </span>
                            </div>
                            <div className="text-sm text-gray-700 mb-3">
                              <p>کد قرارداد: <span className="font-mono font-medium">{contract.contractCode}</span></p>
                              <p>کمیسیون: <span className="font-medium text-green-600">{formatPrice(contract.commission?.amount || 0)}</span></p>
                            </div>
                            <button
                              onClick={() => navigate(`/dashboard/marketing/contracts/${contract._id}`)}
                              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              مشاهده قرارداد
                            </button>
                          </div>
                        ) : (
                          <div className="p-4 bg-gray-50 border-t">
                            <p className="text-sm text-gray-600 text-center">هنوز قراردادی برای این RFP ایجاد نشده</p>
                          </div>
                        )}

                        <div className="p-4 bg-white">
                          <button
                            onClick={() => navigate(`/dashboard/marketing/rfps/${rfp._id}`)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            مشاهده جزئیات RFP
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Seller Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold mb-4">اطلاعات فروشنده</h3>
            {request.seller ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  {request.seller.profileImage ? (
                    <img src={request.seller.profileImage} alt="" className="w-12 h-12 rounded-full" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-600 font-medium">
                        {request.seller.firstName?.[0]}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{request.seller.firstName} {request.seller.lastName}</p>
                    <p className="text-sm text-gray-600">سطح {request.seller.level || 'نامشخص'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-600 text-sm">اطلاعات فروشنده در دسترس نیست</p>
            )}
          </div>

          {/* Statistics */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold mb-4">آمار</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-gray-700">RFP های من</span>
                <span className="font-bold text-green-600 text-xl">{myRfps.length}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="text-gray-700">قراردادهای فعال</span>
                <span className="font-bold text-purple-600 text-xl">
                  {myRfps.filter(rfp => rfp.tradeContract).length}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-gray-700">کمیسیون</span>
                <span className="font-bold text-blue-600 text-xl">{request.commissionPercent}%</span>
              </div>
            </div>
          </div>

          {/* Images */}
          {request.images && request.images.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold mb-4">تصاویر محصول</h3>
              <div className="grid grid-cols-2 gap-2">
                {request.images.slice(0, 4).map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image.url}
                      alt={`Product ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    {image.isPrimary && (
                      <span className="absolute top-1 right-1 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                        اصلی
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold mb-4">اقدامات سریع</h3>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/dashboard/marketing/my-accepted-requests')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                بازگشت به لیست
              </button>
              <button
                onClick={() => navigate(`/dashboard/marketing/rfps/create/${id}`)}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                ایجاد RFP جدید
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

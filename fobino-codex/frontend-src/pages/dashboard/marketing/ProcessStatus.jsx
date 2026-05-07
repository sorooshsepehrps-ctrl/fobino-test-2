import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Users, FileText, FileSignature, Clock, CheckCircle, AlertCircle, MessageCircle, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { marketingService } from '../../../services';

export default function ProcessStatus() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [processData, setProcessData] = useState({
    myRequests: [],
    myRFPs: [],
    myContracts: [],
    acceptedRequests: [],
  });

  const loadProcessData = useCallback(async () => {
    setLoading(true);
    try {
      // Determine user role
      let role = 'unknown';
      try {
        const marketerStatus = await marketingService.getMyMarketerStatus();
        if (marketerStatus.data.isMarketer) {
          role = 'marketer';
        } else {
          role = 'seller';
        }
      } catch (error) {
        role = 'seller';
      }
      setUserRole(role);

      // Load data based on role
      const promises = [];
      
      if (role === 'seller') {
        promises.push(marketingService.getMyMarketingRequests({ limit: 5 }));
        promises.push(marketingService.getMyRFPs({ limit: 5 }));
        promises.push(marketingService.getMyContracts({ limit: 5 }));
      } else if (role === 'marketer') {
        promises.push(marketingService.getMyAcceptedRequests({ limit: 5 }));
        promises.push(marketingService.getMyRFPs({ limit: 5 }));
        promises.push(marketingService.getMyContracts({ limit: 5 }));
      }

      const results = await Promise.all(promises);
      
      if (role === 'seller') {
        setProcessData({
          myRequests: results[0]?.data || [],
          myRFPs: results[1]?.data || [],
          myContracts: results[2]?.data || [],
        });
      } else if (role === 'marketer') {
        setProcessData({
          acceptedRequests: results[0]?.data || [],
          myRFPs: results[1]?.data || [],
          myContracts: results[2]?.data || [],
        });
      }
    } catch (err) {
      console.error('Error loading process data:', err);
      toast.error('خطا در بارگذاری اطلاعات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProcessData();
  }, [loadProcessData]);

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
      waiting_seller_approval: 'yellow',
      waiting_marketer_approval: 'yellow',
      approved: 'green',
      rejected_by_seller: 'red',
      rejected_by_marketer: 'red',
      waiting_buyer: 'blue',
      buyer_connected: 'blue',
      buyer_approved: 'green',
      commission_deposited: 'green',
      completed: 'green',
      cancelled: 'red',
    };
    return colors[status] || 'gray';
  };

  const getStatusText = (status) => {
    const texts = {
      active: 'فعال',
      inactive: 'غیرفعال',
      waiting_seller_approval: 'در انتظار تایید فروشنده',
      waiting_marketer_approval: 'در انتظار تایید بازاریاب',
      approved: 'تایید شده',
      rejected_by_seller: 'رد شده توسط فروشنده',
      rejected_by_marketer: 'رد شده توسط بازاریاب',
      waiting_buyer: 'در انتظار خریدار',
      buyer_connected: 'خریدار متصل شد',
      buyer_approved: 'تایید شده توسط خریدار',
      commission_deposited: 'کمیسیون واریز شد',
      completed: 'تکمیل شده',
      cancelled: 'لغو شده',
    };
    return texts[status] || status;
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
        <h1 className="text-2xl font-bold text-gray-900">وضعیت فرآیند بازاریابی</h1>
        <p className="text-gray-600 mt-1">
          {userRole === 'seller' ? 'پیگیری درخواست‌های بازاریابی شما' : 'مدیریت فرآیندهای بازاریابی شما'}
        </p>
      </div>

      {/* Process Flow Visualization */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-bold mb-4">مراحل فرآیند</h2>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
            <span className="text-sm">درخواست بازاریابی</span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
            <span className="text-sm">پذیرش بازاریاب</span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
            <span className="text-sm">ایجاد RFP</span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
            <span className="text-sm">مذاکره و تایید</span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">5</div>
            <span className="text-sm">قرارداد تجاری</span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">6</div>
            <span className="text-sm">اتصال خریدار</span>
          </div>
        </div>
      </div>

      {/* Seller View */}
      {userRole === 'seller' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* My Marketing Requests */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h3 className="font-bold flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                درخواست‌های من
              </h3>
            </div>
            <div className="p-4">
              {processData.myRequests.length === 0 ? (
                <div className="text-center py-4">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm mb-3">هنوز درخواستی ندارید</p>
                  <button
                    onClick={() => navigate('/dashboard/marketing/requests/new')}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    ایجاد درخواست جدید
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {processData.myRequests.map((request) => (
                    <div key={request._id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-sm">{request.productName}</p>
                          <p className="text-xs text-gray-600">{request.brand}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${getStatusColor(request.status)}-100 text-${getStatusColor(request.status)}-800`}>
                          {getStatusText(request.status)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>{formatDate(request.createdAt)}</span>
                        <div className="flex gap-1">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {request.acceptedBy?.length || 0}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => navigate(`/dashboard/marketing/requests/${request._id}`)}
                          className="text-blue-600 hover:text-blue-700 text-xs flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          جزئیات
                        </button>
                        {request.acceptedBy?.length > 0 && (
                          <button
                            onClick={() => navigate(`/dashboard/marketing/rfps?requestId=${request._id}`)}
                            className="text-green-600 hover:text-green-700 text-xs"
                          >
                            RFP ها
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => navigate('/dashboard/marketing/my-requests')}
                className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
              >
                مشاهده همه
              </button>
            </div>
          </div>

          {/* My RFPs */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h3 className="font-bold flex items-center gap-2">
                <FileText className="w-5 h-5 text-yellow-500" />
                RFP های من
              </h3>
            </div>
            <div className="p-4">
              {processData.myRFPs.length === 0 ? (
                <div className="text-center py-4">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm">هنوز RFPی ندارید</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {processData.myRFPs.map((rfp) => (
                    <div key={rfp._id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-sm">{rfp.marketingRequest?.productName}</p>
                          <p className="text-xs text-gray-600">مشتری: {rfp.clientInfo?.companyName}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${getStatusColor(rfp.status)}-100 text-${getStatusColor(rfp.status)}-800`}>
                          {getStatusText(rfp.status)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>{formatDate(rfp.createdAt)}</span>
                        <span>کمیسیون: {rfp.commission?.percent}%</span>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => navigate(`/dashboard/marketing/rfps/${rfp._id}`)}
                          className="text-blue-600 hover:text-blue-700 text-xs"
                        >
                          جزئیات
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => navigate('/dashboard/marketing/rfps')}
                className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
              >
                مشاهده همه
              </button>
            </div>
          </div>

          {/* My Contracts */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h3 className="font-bold flex items-center gap-2">
                <FileSignature className="w-5 h-5 text-purple-500" />
                قراردادهای من
              </h3>
            </div>
            <div className="p-4">
              {processData.myContracts.length === 0 ? (
                <div className="text-center py-4">
                  <FileSignature className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm">هنوز قراردادی ندارید</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {processData.myContracts.map((contract) => (
                    <div key={contract._id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-sm">{contract.marketingRequest?.productName}</p>
                          <p className="text-xs text-gray-600">کد: {contract.contractCode}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${getStatusColor(contract.status)}-100 text-${getStatusColor(contract.status)}-800`}>
                          {getStatusText(contract.status)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>{formatDate(contract.createdAt)}</span>
                        <span>کمیسیون: {contract.commission?.amount ? `${contract.commission.amount / 1000000}M` : '-'}</span>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => navigate(`/dashboard/marketing/contracts/${contract._id}`)}
                          className="text-blue-600 hover:text-blue-700 text-xs"
                        >
                          جزئیات
                        </button>
                        {contract.chat && (
                          <button
                            onClick={() => navigate(`/dashboard/chats/${contract.chat._id}`)}
                            className="text-green-600 hover:text-green-700 text-xs flex items-center gap-1"
                          >
                            <MessageCircle className="w-3 h-3" />
                            گفتگو
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => navigate('/dashboard/marketing/contracts')}
                className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
              >
                مشاهده همه
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Marketer View */}
      {userRole === 'marketer' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Accepted Requests */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h3 className="font-bold flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                درخواست‌های پذیرفته
              </h3>
            </div>
            <div className="p-4">
              {processData.acceptedRequests.length === 0 ? (
                <div className="text-center py-4">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm mb-3">هنوز درخواستی نپذیرفته‌اید</p>
                  <button
                    onClick={() => navigate('/dashboard/marketing/browse-requests')}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    مرور درخواست‌ها
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {processData.acceptedRequests.map((request) => (
                    <div key={request._id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-sm">{request.productName}</p>
                          <p className="text-xs text-gray-600">{request.brand}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${getStatusColor(request.status)}-100 text-${getStatusColor(request.status)}-800`}>
                          {getStatusText(request.status)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>{formatDate(request.acceptedAt)}</span>
                        <span>کمیسیون: {request.commissionPercent}%</span>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => navigate(`/dashboard/marketing/requests/${request._id}`)}
                          className="text-blue-600 hover:text-blue-700 text-xs"
                        >
                          جزئیات
                        </button>
                        <button
                          onClick={() => navigate(`/dashboard/marketing/rfps/create/${request._id}`)}
                          className="text-green-600 hover:text-green-700 text-xs"
                        >
                          ایجاد RFP
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => navigate('/dashboard/marketing/accepted-requests')}
                className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
              >
                مشاهده همه
              </button>
            </div>
          </div>

          {/* My RFPs */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h3 className="font-bold flex items-center gap-2">
                <FileText className="w-5 h-5 text-yellow-500" />
                RFP های من
              </h3>
            </div>
            <div className="p-4">
              {processData.myRFPs.length === 0 ? (
                <div className="text-center py-4">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm">هنوز RFPی ندارید</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {processData.myRFPs.map((rfp) => (
                    <div key={rfp._id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-sm">{rfp.marketingRequest?.productName}</p>
                          <p className="text-xs text-gray-600">مشتری: {rfp.clientInfo?.companyName}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${getStatusColor(rfp.status)}-100 text-${getStatusColor(rfp.status)}-800`}>
                          {getStatusText(rfp.status)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>{formatDate(rfp.createdAt)}</span>
                        <span>کمیسیون: {rfp.commission?.percent}%</span>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => navigate(`/dashboard/marketing/rfps/${rfp._id}`)}
                          className="text-blue-600 hover:text-blue-700 text-xs"
                        >
                          جزئیات
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => navigate('/dashboard/marketing/rfps')}
                className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
              >
                مشاهده همه
              </button>
            </div>
          </div>

          {/* My Contracts */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h3 className="font-bold flex items-center gap-2">
                <FileSignature className="w-5 h-5 text-purple-500" />
                قراردادهای من
              </h3>
            </div>
            <div className="p-4">
              {processData.myContracts.length === 0 ? (
                <div className="text-center py-4">
                  <FileSignature className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm">هنوز قراردادی ندارید</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {processData.myContracts.map((contract) => (
                    <div key={contract._id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-sm">{contract.marketingRequest?.productName}</p>
                          <p className="text-xs text-gray-600">کد: {contract.contractCode}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${getStatusColor(contract.status)}-100 text-${getStatusColor(contract.status)}-800`}>
                          {getStatusText(contract.status)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>{formatDate(contract.createdAt)}</span>
                        <span>کمیسیون: {contract.commission?.amount ? `${contract.commission.amount / 1000000}M` : '-'}</span>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => navigate(`/dashboard/marketing/contracts/${contract._id}`)}
                          className="text-blue-600 hover:text-blue-700 text-xs"
                        >
                          جزئیات
                        </button>
                        {contract.chat && (
                          <button
                            onClick={() => navigate(`/dashboard/chats/${contract.chat._id}`)}
                            className="text-green-600 hover:text-green-700 text-xs flex items-center gap-1"
                          >
                            <MessageCircle className="w-3 h-3" />
                            گفتگو
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => navigate('/dashboard/marketing/contracts')}
                className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
              >
                مشاهده همه
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <h3 className="font-bold mb-4">اقدامات سریع</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {userRole === 'seller' ? (
            <>
              <button
                onClick={() => navigate('/dashboard/marketing/requests/new')}
                className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-center"
              >
                <FileText className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="font-medium">درخواست جدید</p>
                <p className="text-xs text-gray-600">ایجاد درخواست بازاریابی</p>
              </button>
              <button
                onClick={() => navigate('/dashboard/marketing/my-requests')}
                className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-center"
              >
                <FileText className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                <p className="font-medium">درخواست‌های من</p>
                <p className="text-xs text-gray-600">مدیریت درخواست‌ها</p>
              </button>
              <button
                onClick={() => navigate('/dashboard/marketing/rfps')}
                className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-center"
              >
                <FileText className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <p className="font-medium">RFP ها</p>
                <p className="text-xs text-gray-600">مشاهده پیشنهادها</p>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate('/dashboard/marketing/browse-requests')}
                className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-center"
              >
                <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="font-medium">مرور درخواست‌ها</p>
                <p className="text-xs text-gray-600">پیدا کردن فرصت‌ها</p>
              </button>
              <button
                onClick={() => navigate('/dashboard/marketing/accepted-requests')}
                className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-center"
              >
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="font-medium">درخواست‌های پذیرفته</p>
                <p className="text-xs text-gray-600">مدیریت پروژه‌ها</p>
              </button>
              <button
                onClick={() => navigate('/dashboard/marketing/rfps')}
                className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-center"
              >
                <FileText className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <p className="font-medium">RFP ها</p>
                <p className="text-xs text-gray-600">مشاهده پیشنهادها</p>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

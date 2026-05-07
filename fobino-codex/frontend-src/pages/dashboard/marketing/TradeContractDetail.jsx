import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, FileSignature, DollarSign, MessageCircle, CheckCircle, XCircle, Copy, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { marketingService } from '../../../services';
import useAuthStore from '../../../store/authStore';

export default function TradeContractDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [userRole, setUserRole] = useState(null);

  const currentUser = useAuthStore((state) => state.user);
  const fetchUser = useAuthStore((state) => state.fetchUser);

  const normalizeId = (value) => {
    if (!value) return null;
    if (value._id) value = value._id;
    return value?.toString();
  };

  const loadContract = useCallback(async () => {
    setLoading(true);
    try {
      const response = await marketingService.getContractById(id);
      setContract(response.data);
      
      const user = currentUser || JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user?._id;
      const sellerId = normalizeId(response.data.seller);
      const marketerId = normalizeId(response.data.marketer);
      const buyerId = normalizeId(response.data.buyer);

      if (buyerId === userId) {
        setUserRole('buyer');
      } else if (sellerId === userId) {
        setUserRole('seller');
      } else if (marketerId === userId) {
        setUserRole('marketer');
      }

      console.log('TradeContractDetail role check', {
        requestedContractId: id,
        currentUserId: userId,
        buyerId,
        sellerId,
        marketerId,
        determinedRole: buyerId === userId ? 'buyer' : sellerId === userId ? 'seller' : marketerId === userId ? 'marketer' : null,
        status: response.data.status
      });
    } catch (error) {
      console.error('Error loading contract:', error);
      toast.error('خطا در بارگذاری قرارداد');
    } finally {
      setLoading(false);
    }
  }, [id, currentUser]);

  useEffect(() => {
    const hasToken = Boolean(localStorage.getItem('accessToken'));
    if (!currentUser && hasToken) {
      fetchUser();
      return;
    }
    loadContract();
  }, [loadContract, currentUser, fetchUser]);

  const copyContractCode = () => {
    navigator.clipboard.writeText(contract.contractCode);
    toast.success('کد قرارداد کپی شد');
  };

  const handleApprove = async () => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید این قرارداد را تایید کنید؟')) {
      return;
    }

    setActionLoading(true);
    try {
      await marketingService.approveBuyerContract(id);
      toast.success('قرارداد با موفقیت تایید شد');
      loadContract();
    } catch (error) {
      console.error('Error approving contract:', error);
      toast.error(error.response?.data?.message || 'خطا در تایید قرارداد');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    const reason = prompt('لطفاً دلیل رد قرارداد را وارد کنید:');
    if (!reason) return;

    setActionLoading(true);
    try {
      await marketingService.rejectBuyerContract(id, reason);
      toast.success('قرارداد رد شد');
      navigate('/dashboard/marketing/contracts');
    } catch (error) {
      console.error('Error rejecting contract:', error);
      toast.error(error.response?.data?.message || 'خطا در رد قرارداد');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDepositCommission = async () => {
    if (!confirm(`آیا مطمئن هستید که می‌خواهید کمیسیون ${formatPrice(contract.commission.amount)} را واریز کنید؟`)) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await marketingService.depositCommission(id);
      toast.success('کمیسیون با موفقیت واریز شد. اطلاعات فروشنده در دسترس است');
      
      if (response.data?.chat) {
        navigate(`/dashboard/chats/${response.data.chat._id}`);
      } else {
        loadContract();
      }
    } catch (error) {
      console.error('Error depositing commission:', error);
      toast.error(error.response?.data?.message || 'خطا در واریز کمیسیون');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenChat = () => {
    if (contract.chat) {
      navigate(`/dashboard/chats/${contract.chat._id}`);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      waiting_buyer: 'yellow',
      buyer_connected: 'blue',
      buyer_approved: 'green',
      buyer_rejected: 'red',
      commission_deposited: 'green',
      contacts_shared: 'green',
      deal_created: 'blue',
      completed: 'green',
      cancelled: 'red',
    };
    return colors[status] || 'gray';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">قرارداد یافت نشد</p>
          <button onClick={() => navigate(-1)} className="text-purple-600 hover:text-purple-700">
            بازگشت
          </button>
        </div>
      </div>
    );
  }

  const statusColor = getStatusColor(contract.status);

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowRight className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">قرارداد تجاری</h1>
            <p className="text-gray-600">{contract.marketingRequest?.productName}</p>
          </div>
        </div>

        <span className={`px-4 py-2 rounded-full text-sm font-medium bg-${statusColor}-100 text-${statusColor}-800`}>
          {contract.status === 'waiting_buyer' && 'در انتظار اتصال خریدار'}
          {contract.status === 'buyer_connected' && 'خریدار متصل شد'}
          {contract.status === 'buyer_approved' && 'تایید شده توسط خریدار'}
          {contract.status === 'commission_deposited' && 'کمیسیون واریز شد'}
          {contract.status === 'contacts_shared' && 'اطلاعات به اشتراک گذاشته شد'}
          {contract.status === 'completed' && 'تکمیل شده'}
        </span>
      </div>

      {/* Action Alerts */}
      {userRole === 'buyer' && contract.status === 'buyer_connected' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-900 mb-1">لطفاً قرارداد را بررسی کنید</p>
              <p className="text-sm text-yellow-800">
                جزئیات قرارداد را مطالعه کنید و در صورت موافقت، آن را تایید کنید.
              </p>
            </div>
          </div>
        </div>
      )}

      {userRole === 'buyer' && contract.status === 'buyer_approved' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <DollarSign className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900 mb-1">واریز کمیسیون</p>
              <p className="text-sm text-blue-800">
                برای دریافت اطلاعات تماس فروشنده، لطفاً کمیسیون بازاریاب را واریز کنید.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contract Code */}
          {contract.status === 'waiting_buyer' && (userRole === 'seller' || userRole === 'marketer') && (
            <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6">
              <h2 className="text-lg font-bold mb-3">کد قرارداد برای خریدار</h2>
              <div className="bg-white rounded-lg p-4 flex items-center justify-between">
                <code className="text-2xl font-mono font-bold text-purple-700">
                  {contract.contractCode}
                </code>
                <button
                  onClick={copyContractCode}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                  title="کپی کد"
                >
                  <Copy className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              <p className="text-sm text-purple-800 mt-3">
                این کد را برای خریدار ارسال کنید تا به قرارداد متصل شود
              </p>
            </div>
          )}

          {/* Contract Terms */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <FileSignature className="w-5 h-5 text-purple-500" />
              شرایط قرارداد
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">محصول</p>
                  <p className="font-medium">{contract.contractTerms?.productName}</p>
                </div>
                <div>
                  <p className="text-gray-600">مقدار</p>
                  <p className="font-medium">
                    {contract.contractTerms?.quantity} {contract.contractTerms?.unit}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">قیمت واحد</p>
                  <p className="font-medium">{formatPrice(contract.contractTerms?.pricePerUnit)}</p>
                </div>
                <div>
                  <p className="text-gray-600">قیمت کل</p>
                  <p className="font-bold text-purple-600 text-lg">
                    {formatPrice(contract.contractTerms?.totalPrice)}
                  </p>
                </div>
                {contract.contractTerms?.deliveryTime && (
                  <div>
                    <p className="text-gray-600">زمان تحویل</p>
                    <p className="font-medium">{contract.contractTerms.deliveryTime}</p>
                  </div>
                )}
                {contract.contractTerms?.paymentTerms && (
                  <div>
                    <p className="text-gray-600">شرایط پرداخت</p>
                    <p className="font-medium">{contract.contractTerms.paymentTerms}</p>
                  </div>
                )}
              </div>
              
              {contract.contractTerms?.warranties && (
                <div>
                  <p className="text-gray-600 text-sm">گارانتی‌ها</p>
                  <p className="font-medium">{contract.contractTerms.warranties}</p>
                </div>
              )}
            </div>
          </div>

          {/* Seller Contact (if available) */}
          {contract.status !== 'waiting_buyer' && contract.status !== 'buyer_connected' && contract.status !== 'buyer_approved' && contract.seller && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold mb-4">اطلاعات تماس فروشنده</h2>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-gray-600">نام</p>
                  <p className="font-medium">
                    {contract.seller.firstName} {contract.seller.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">شماره تماس</p>
                  <p className="font-medium direction-ltr text-right">{contract.seller.phone}</p>
                </div>
                {contract.seller.email && (
                  <div>
                    <p className="text-gray-600">ایمیل</p>
                    <p className="font-medium">{contract.seller.email}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timeline */}
          {contract.timeline?.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold mb-4">تاریخچه قرارداد</h2>
              <div className="space-y-4">
                {contract.timeline.map((entry, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      {index < contract.timeline.length - 1 && (
                        <div className="w-0.5 h-full bg-purple-200 mt-2"></div>
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="font-medium">{entry.description}</p>
                      <p className="text-sm text-gray-500">{formatDate(entry.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Commission */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold mb-4">کمیسیون بازاریاب</h3>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600 mb-1">مبلغ کمیسیون</p>
              <p className="text-2xl font-bold text-green-700">
                {formatPrice(contract.commission?.amount)}
              </p>
              <p className="text-xs text-gray-600 mt-2">
                {contract.commission?.percent}% از قیمت کل
              </p>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">وضعیت:</span>
                <span className="font-medium">
                  {contract.commission?.status === 'pending' && 'در انتظار'}
                  {contract.commission?.status === 'deposited' && 'واریز شده'}
                  {contract.commission?.status === 'released' && 'آزاد شده'}
                  {contract.commission?.status === 'released_with_fee' && 'آزاد شده با کارمزد'}
                </span>
              </div>
              
              {contract.commission?.fobinoFee > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>کارمزد فوبینو:</span>
                  <span className="font-medium">{formatPrice(contract.commission.fobinoFee)}</span>
                </div>
              )}
              
              {contract.commission?.status === 'released' || contract.commission?.status === 'released_with_fee' ? (
                <div className="flex justify-between text-green-600 pt-2 border-t">
                  <span className="font-medium">دریافتی خالص:</span>
                  <span className="font-bold">
                    {formatPrice(contract.commission.amount - (contract.commission.fobinoFee || 0))}
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Participants */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold mb-4">طرفین قرارداد</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-600">فروشنده</p>
                <p className="font-medium">
                  {contract.seller?.firstName} {contract.seller?.lastName}
                </p>
              </div>
              <div>
                <p className="text-gray-600">بازاریاب</p>
                <p className="font-medium">
                  {contract.marketer?.firstName} {contract.marketer?.lastName}
                </p>
              </div>
              {contract.buyer && (
                <div>
                  <p className="text-gray-600">خریدار</p>
                  <p className="font-medium">
                    {contract.buyer.firstName} {contract.buyer.lastName}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Method */}
          {contract.paymentMethodUsed && contract.paymentMethodUsed !== 'unknown' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold mb-4">روش پرداخت</h3>
              <div className={`p-3 rounded-lg ${
                contract.paymentMethodUsed === 'fobino_secure'
                  ? 'bg-blue-50 border border-blue-200'
                  : 'bg-gray-50 border border-gray-200'
              }`}>
                <p className="font-medium">
                  {contract.paymentMethodUsed === 'fobino_secure' ? 'پرداخت امن فوبینو' : 'پرداخت خارجی'}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {contract.paymentMethodUsed === 'fobino_secure'
                    ? 'کمیسیون کامل به بازاریاب تعلق می‌گیرد'
                    : '10% کارمزد از کمیسیون کسر می‌شود'}
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="bg-white rounded-lg shadow p-6 space-y-3">
            <h3 className="font-bold mb-4">اقدامات</h3>
            
            {userRole === 'buyer' && contract.status === 'buyer_connected' && (
              <>
                <button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  تایید قرارداد
                </button>
                <button
                  onClick={handleReject}
                  disabled={actionLoading}
                  className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
                >
                  <XCircle className="w-5 h-5" />
                  رد قرارداد
                </button>
              </>
            )}
            
            {userRole === 'buyer' && contract.status === 'buyer_approved' && (
              <button
                onClick={handleDepositCommission}
                disabled={actionLoading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
              >
                <DollarSign className="w-5 h-5" />
                واریز کمیسیون
              </button>
            )}
            
            {contract.chat && (
              <button
                onClick={handleOpenChat}
                className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 font-medium flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                باز کردن گفتگو
              </button>
            )}
          </div>

          {/* Metadata */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold mb-4">اطلاعات تکمیلی</h3>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-gray-600">کد قرارداد</p>
                <p className="font-mono font-medium">{contract.contractCode}</p>
              </div>
              <div>
                <p className="text-gray-600">تاریخ ایجاد</p>
                <p className="font-medium">{formatDate(contract.createdAt)}</p>
              </div>
              {contract.completedAt && (
                <div>
                  <p className="text-gray-600">تاریخ تکمیل</p>
                  <p className="font-medium">{formatDate(contract.completedAt)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { FileSignature, User, Clock, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TradeContractCard({ contract, userRole }) {
  const navigate = useNavigate();

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fa-IR');
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      waiting_buyer: { label: 'در انتظار اتصال خریدار', color: 'yellow', icon: Clock },
      buyer_connected: { label: 'خریدار متصل شد', color: 'blue', icon: User },
      buyer_approved: { label: 'تایید شده توسط خریدار', color: 'green', icon: CheckCircle },
      buyer_rejected: { label: 'رد شده توسط خریدار', color: 'red', icon: AlertCircle },
      commission_deposited: { label: 'کمیسیون واریز شد', color: 'green', icon: DollarSign },
      contacts_shared: { label: 'اطلاعات تماس به اشتراک گذاشته شد', color: 'green', icon: CheckCircle },
      deal_created: { label: 'معامله ایجاد شد', color: 'blue', icon: FileSignature },
      completed: { label: 'تکمیل شده', color: 'green', icon: CheckCircle },
      cancelled: { label: 'لغو شده', color: 'red', icon: AlertCircle },
    };
    return statusMap[status] || statusMap.waiting_buyer;
  };

  const statusInfo = getStatusInfo(contract.status);
  const StatusIcon = statusInfo.icon;

  const needsAction = 
    (userRole === 'buyer' && contract.status === 'buyer_connected') ||
    (userRole === 'buyer' && contract.status === 'buyer_approved');

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow ${
      needsAction ? 'border-2 border-yellow-400' : ''
    }`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileSignature className="w-5 h-5 text-purple-500" />
              <h3 className="text-lg font-bold text-gray-900">
                {contract.marketingRequest?.productName || 'قرارداد تجاری'}
              </h3>
            </div>
            <p className="text-xs text-gray-500">کد قرارداد: {contract.contractCode}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium bg-${statusInfo.color}-100 text-${statusInfo.color}-800 flex items-center gap-1`}>
            <StatusIcon className="w-3 h-3" />
            {statusInfo.label}
          </span>
        </div>

        {needsAction && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mb-3">
            <p className="text-sm text-yellow-800 font-medium">
              {contract.status === 'buyer_connected' && 'لطفاً قرارداد را بررسی و تایید کنید'}
              {contract.status === 'buyer_approved' && 'لطفاً کمیسیون را واریز کنید'}
            </p>
          </div>
        )}

        {/* Contract Terms Summary */}
        {contract.contractTerms && (
          <div className="mb-3 bg-gray-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">شرایط قرارداد:</p>
            <div className="text-xs text-gray-600 space-y-1">
              <div className="flex justify-between">
                <span>محصول:</span>
                <span className="font-medium">{contract.contractTerms.productName}</span>
              </div>
              <div className="flex justify-between">
                <span>مقدار:</span>
                <span className="font-medium">{contract.contractTerms.quantity} {contract.contractTerms.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">قیمت کل:</span>
                <span className="font-bold text-blue-600">{formatPrice(contract.contractTerms.totalPrice)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Commission Info */}
        {contract.commission && (
          <div className="mb-3">
            <div className="flex items-center justify-between bg-green-50 p-2 rounded-lg">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  کمیسیون: {formatPrice(contract.commission.amount)}
                </span>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                contract.commission.status === 'deposited' || contract.commission.status === 'released'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {contract.commission.status === 'pending' && 'در انتظار'}
                {contract.commission.status === 'deposited' && 'واریز شده'}
                {contract.commission.status === 'released' && 'آزاد شده'}
                {contract.commission.status === 'released_with_fee' && 'آزاد شده با کارمزد'}
              </span>
            </div>
            {contract.commission.fobinoFee > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                کارمزد فوبینو: {formatPrice(contract.commission.fobinoFee)}
              </p>
            )}
          </div>
        )}

        {/* Participants */}
        <div className="mb-3 text-xs text-gray-600 space-y-1">
          <div className="flex items-center gap-2">
            <User className="w-3 h-3" />
            <span>فروشنده: {contract.seller?.firstName} {contract.seller?.lastName}</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-3 h-3" />
            <span>بازاریاب: {contract.marketer?.firstName} {contract.marketer?.lastName}</span>
          </div>
          {contract.buyer && (
            <div className="flex items-center gap-2">
              <User className="w-3 h-3" />
              <span>خریدار: {contract.buyer?.firstName} {contract.buyer?.lastName}</span>
            </div>
          )}
        </div>

        {/* Payment Method */}
        {contract.paymentMethodUsed && contract.paymentMethodUsed !== 'unknown' && (
          <div className="mb-3 text-xs">
            <span className={`px-2 py-1 rounded-full ${
              contract.paymentMethodUsed === 'fobino_secure'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              روش پرداخت: {contract.paymentMethodUsed === 'fobino_secure' ? 'پرداخت امن فوبینو' : 'پرداخت خارجی'}
            </span>
          </div>
        )}

        {/* Metadata */}
        <div className="text-xs text-gray-400 mb-3">
          <p>ایجاد شده: {formatDate(contract.createdAt)}</p>
          {contract.completedAt && <p>تکمیل شده: {formatDate(contract.completedAt)}</p>}
        </div>

        {/* Action Button */}
        <button
          onClick={() => navigate(`/dashboard/marketing/contracts/${contract._id}`)}
          className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
            needsAction
              ? 'bg-yellow-500 text-white hover:bg-yellow-600'
              : 'bg-purple-500 text-white hover:bg-purple-600'
          }`}
        >
          {needsAction ? 'اقدام کنید' : 'مشاهده جزئیات'}
        </button>
      </div>
    </div>
  );
}

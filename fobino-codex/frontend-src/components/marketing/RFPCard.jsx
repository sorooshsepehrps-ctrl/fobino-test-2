import { useState } from 'react';
import { FileText, User, Clock, TrendingUp, CheckCircle, XCircle, Edit2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function RFPCard({ rfp, userRole }) {
  const navigate = useNavigate();

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fa-IR');
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      draft: { label: 'پیش‌نویس', color: 'gray', icon: Edit2 },
      waiting_seller_approval: { label: 'در انتظار تایید فروشنده', color: 'yellow', icon: Clock },
      waiting_marketer_approval: { label: 'در انتظار تایید بازاریاب', color: 'yellow', icon: Clock },
      approved: { label: 'تایید شده', color: 'green', icon: CheckCircle },
      rejected_by_seller: { label: 'رد شده توسط فروشنده', color: 'red', icon: XCircle },
      rejected_by_marketer: { label: 'رد شده توسط بازاریاب', color: 'red', icon: XCircle },
    };
    return statusMap[status] || statusMap.draft;
  };

  const statusInfo = getStatusInfo(rfp.status);
  const StatusIcon = statusInfo.icon;

  const needsAction = 
    (userRole === 'seller' && rfp.status === 'waiting_seller_approval') ||
    (userRole === 'marketer' && rfp.status === 'waiting_marketer_approval');

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow ${
      needsAction ? 'border-2 border-yellow-400' : ''
    }`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-bold text-gray-900">
              {rfp.marketingRequest?.productName || 'RFP'}
            </h3>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium bg-${statusInfo.color}-100 text-${statusInfo.color}-800 flex items-center gap-1`}>
            <StatusIcon className="w-3 h-3" />
            {statusInfo.label}
          </span>
        </div>

        {needsAction && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mb-3">
            <p className="text-sm text-yellow-800 font-medium">
              نیاز به اقدام شما دارد
            </p>
          </div>
        )}

        {/* Client Info */}
        {rfp.clientInfo && (
          <div className="mb-3 bg-gray-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-1">اطلاعات مشتری:</p>
            <div className="text-xs text-gray-600 space-y-1">
              <p><span className="font-medium">شرکت:</span> {rfp.clientInfo.companyName}</p>
              <p><span className="font-medium">موقعیت:</span> {rfp.clientInfo.province} - {rfp.clientInfo.city}</p>
              {rfp.clientInfo.estimatedOrderSize && (
                <p><span className="font-medium">حجم تخمینی:</span> {rfp.clientInfo.estimatedOrderSize}</p>
              )}
            </div>
          </div>
        )}

        {/* Proposed Terms */}
        {rfp.proposedTerms && (
          <div className="mb-3">
            <p className="text-sm font-medium text-gray-700 mb-1">شرایط پیشنهادی:</p>
            <div className="text-xs text-gray-600 space-y-1">
              <div className="flex justify-between">
                <span>مقدار:</span>
                <span className="font-medium">{rfp.proposedTerms.quantity} {rfp.proposedTerms.unit}</span>
              </div>
              <div className="flex justify-between">
                <span>قیمت واحد:</span>
                <span className="font-medium">{formatPrice(rfp.proposedTerms.pricePerUnit)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">قیمت کل:</span>
                <span className="font-bold text-blue-600">{formatPrice(rfp.proposedTerms.totalPrice)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Commission */}
        {rfp.commission && (
          <div className="flex items-center gap-2 bg-green-50 p-2 rounded-lg mb-3">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">
              کمیسیون: {formatPrice(rfp.commission.amount)} ({rfp.commission.percent}%)
            </span>
          </div>
        )}

        {/* Participants */}
        <div className="mb-3 text-xs text-gray-500 space-y-1">
          <div className="flex items-center gap-2">
            <User className="w-3 h-3" />
            <span>فروشنده: {rfp.seller?.firstName} {rfp.seller?.lastName}</span>
            {rfp.approvedBySeller && <CheckCircle className="w-3 h-3 text-green-500" />}
          </div>
          <div className="flex items-center gap-2">
            <User className="w-3 h-3" />
            <span>بازاریاب: {rfp.marketer?.firstName} {rfp.marketer?.lastName}</span>
            {rfp.approvedByMarketer && <CheckCircle className="w-3 h-3 text-green-500" />}
          </div>
        </div>

        {/* Metadata */}
        <div className="text-xs text-gray-400 mb-3">
          <p>ایجاد شده: {formatDate(rfp.createdAt)}</p>
          <p>نسخه: {rfp.currentVersion}</p>
        </div>

        {/* Action Button */}
        <button
          onClick={() => navigate(`/dashboard/marketing/rfps/${rfp._id}`)}
          className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
            needsAction
              ? 'bg-yellow-500 text-white hover:bg-yellow-600'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {needsAction ? 'بررسی و اقدام' : 'مشاهده جزئیات'}
        </button>
      </div>
    </div>
  );
}

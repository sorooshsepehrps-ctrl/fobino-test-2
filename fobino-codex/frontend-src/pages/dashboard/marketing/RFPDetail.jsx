import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle, XCircle, Edit2, Clock, FileText, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { marketingService } from '../../../services';

export default function RFPDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rfp, setRfp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [editData, setEditData] = useState({});
  const [rejectReason, setRejectReason] = useState('');
  const [userRole, setUserRole] = useState(null);

  const loadRFP = useCallback(async () => {
    setLoading(true);
    try {
      const response = await marketingService.getRFPById(id);
      setRfp(response.data);
      
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user._id?.toString();
      const sellerId = response.data.seller?._id?.toString() || response.data.marketingRequest?.seller?._id?.toString();
      const marketerId = response.data.marketer?._id?.toString();
      console.log('Normalized IDs', { userId, sellerId, marketerId });
      if (sellerId && userId === sellerId) {
        setUserRole('seller');
      } else if (marketerId && userId === marketerId) {
        setUserRole('marketer');
      } else if (sellerId) {
        setUserRole('seller');
      } else {
        setUserRole(null);
      }
      
      setEditData({
        clientInfo: response.data.clientInfo,
        proposedTerms: response.data.proposedTerms,
        comment: '',
      });
    } catch (error) {
      console.error('Error loading RFP:', error);
      toast.error('خطا در بارگذاری RFP');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadRFP();
  }, [loadRFP]);

  const handleApprove = async () => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید این RFP را تایید کنید؟')) {
      return;
    }

    setActionLoading(true);
    try {
      await marketingService.approveRFP(id);
      toast.success('RFP با موفقیت تایید شد');
      loadRFP();
    } catch (error) {
      console.error('Error approving RFP:', error);
      toast.error(error.response?.data?.message || 'خطا در تایید RFP');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!editData.comment?.trim()) {
      toast.error('لطفاً توضیحات تغییرات را وارد کنید');
      return;
    }

    setActionLoading(true);
    try {
      await marketingService.editRFP(id, editData);
      toast.success('RFP با موفقیت ویرایش شد');
      setShowEditModal(false);
      loadRFP();
    } catch (error) {
      console.error('Error editing RFP:', error);
      toast.error(error.response?.data?.message || 'خطا در ویرایش RFP');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('لطفاً دلیل رد را وارد کنید');
      return;
    }

    setActionLoading(true);
    try {
      await marketingService.rejectRFP(id, rejectReason);
      toast.success('RFP رد شد');
      setShowRejectModal(false);
      navigate('/dashboard/marketing/rfps');
    } catch (error) {
      console.error('Error rejecting RFP:', error);
      toast.error(error.response?.data?.message || 'خطا در رد RFP');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateContract = async () => {
    if (!confirm('آیا می‌خواهید قرارداد تجاری برای این RFP ایجاد کنید؟')) {
      return;
    }

    if (rfp?.status !== 'approved') {
      toast.error('برای ایجاد قرارداد، وضعیت RFP باید تایید شده باشد. لطفاً صفحه را مجدداً بارگذاری کنید.');
      return;
    }

    setActionLoading(true);
    try {
      const response = await marketingService.createTradeContract(id);
      toast.success('قرارداد تجاری با موفقیت ایجاد شد');
      navigate(`/dashboard/marketing/contracts/${response.data._id}`);
    } catch (error) {
      console.error('Error creating contract:', error);
      toast.error(error.response?.data?.message || 'خطا در ایجاد قرارداد');
    } finally {
      setActionLoading(false);
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

  const canApprove = 
    (userRole === 'seller' && rfp?.status === 'waiting_seller_approval') ||
    (userRole === 'marketer' && rfp?.status === 'waiting_marketer_approval');

  const canEdit = userRole && ['waiting_seller_approval', 'waiting_marketer_approval'].includes(rfp?.status);
  const canReject = canEdit;
  const canCreateContract = rfp?.status === 'approved' && (userRole === 'seller' || userRole === 'marketer');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!rfp) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">RFP یافت نشد</p>
          <button onClick={() => navigate(-1)} className="text-blue-600 hover:text-blue-700">
            بازگشت
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowRight className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">جزئیات RFP</h1>
            <p className="text-gray-600">{rfp.marketingRequest?.productName}</p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          {rfp.status === 'approved' && <CheckCircle className="w-5 h-5 text-green-500" />}
          {rfp.status.includes('rejected') && <XCircle className="w-5 h-5 text-red-500" />}
          {rfp.status.includes('waiting') && <Clock className="w-5 h-5 text-yellow-500" />}
          <span className="text-sm font-medium">
            {rfp.status === 'approved' && 'تایید شده'}
            {rfp.status === 'waiting_seller_approval' && 'در انتظار تایید فروشنده'}
            {rfp.status === 'waiting_marketer_approval' && 'در انتظار تایید بازاریاب'}
            {rfp.status === 'rejected_by_seller' && 'رد شده توسط فروشنده'}
            {rfp.status === 'rejected_by_marketer' && 'رد شده توسط بازاریاب'}
          </span>
        </div>
      </div>

      {/* Action Alert */}
      {canApprove && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-900 font-medium mb-2">
            این RFP نیاز به تایید شما دارد
          </p>
          <p className="text-sm text-yellow-800">
            لطفاً جزئیات را بررسی کنید و در صورت موافقت، آن را تایید کنید یا ویرایش کنید.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-500" />
              اطلاعات مشتری
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">نام شرکت</p>
                <p className="font-medium">{rfp.clientInfo?.companyName || '-'}</p>
              </div>
              <div>
                <p className="text-gray-600">صنعت</p>
                <p className="font-medium">{rfp.clientInfo?.industry || '-'}</p>
              </div>
              <div>
                <p className="text-gray-600">موقعیت</p>
                <p className="font-medium">
                  {rfp.clientInfo?.province} - {rfp.clientInfo?.city}
                </p>
              </div>
              <div>
                <p className="text-gray-600">حجم تخمینی سفارش</p>
                <p className="font-medium">{rfp.clientInfo?.estimatedOrderSize || '-'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-600">توضیحات نیازمندی‌ها</p>
                <p className="font-medium">{rfp.clientInfo?.requirementsDescription || '-'}</p>
              </div>
              {rfp.clientInfo?.timeline && (
                <div className="col-span-2">
                  <p className="text-gray-600">زمان‌بندی</p>
                  <p className="font-medium">{rfp.clientInfo.timeline}</p>
                </div>
              )}
            </div>
          </div>

          {/* Proposed Terms */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-500" />
              شرایط پیشنهادی
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">نام محصول</p>
                  <p className="font-medium">{rfp.proposedTerms?.productName}</p>
                </div>
                <div>
                  <p className="text-gray-600">مقدار</p>
                  <p className="font-medium">
                    {rfp.proposedTerms?.quantity} {rfp.proposedTerms?.unit}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">قیمت واحد</p>
                  <p className="font-medium">{formatPrice(rfp.proposedTerms?.pricePerUnit)}</p>
                </div>
                <div>
                  <p className="text-gray-600">قیمت کل</p>
                  <p className="font-bold text-blue-600 text-lg">
                    {formatPrice(rfp.proposedTerms?.totalPrice)}
                  </p>
                </div>
                {rfp.proposedTerms?.deliveryTime && (
                  <div>
                    <p className="text-gray-600">زمان تحویل</p>
                    <p className="font-medium">{rfp.proposedTerms.deliveryTime}</p>
                  </div>
                )}
                {rfp.proposedTerms?.paymentTerms && (
                  <div>
                    <p className="text-gray-600">شرایط پرداخت</p>
                    <p className="font-medium">{rfp.proposedTerms.paymentTerms}</p>
                  </div>
                )}
              </div>
              
              {rfp.proposedTerms?.warranties && (
                <div>
                  <p className="text-gray-600 text-sm">گارانتی‌ها</p>
                  <p className="font-medium">{rfp.proposedTerms.warranties}</p>
                </div>
              )}
              
              {rfp.proposedTerms?.additionalServices?.length > 0 && (
                <div>
                  <p className="text-gray-600 text-sm mb-2">خدمات اضافی</p>
                  <ul className="list-disc list-inside space-y-1">
                    {rfp.proposedTerms.additionalServices.map((service, index) => (
                      <li key={index} className="text-sm">{service}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Negotiation History */}
          {rfp.negotiationHistory?.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold mb-4">تاریخچه مذاکرات</h2>
              <div className="space-y-4">
                {rfp.negotiationHistory.map((entry, index) => (
                  <div key={index} className="border-r-4 border-blue-500 pr-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">
                        {entry.action === 'created' && 'ایجاد شد'}
                        {entry.action === 'edited' && 'ویرایش شد'}
                        {entry.action === 'approved' && 'تایید شد'}
                        {entry.action === 'rejected' && 'رد شد'}
                      </span>
                      <span className="text-sm text-gray-500">
                        نسخه {rfp.negotiationHistory.length - index}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{entry.comment}</p>
                    <p className="text-xs text-gray-400">
                      {formatDate(entry.timestamp)}
                    </p>
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
            <h3 className="font-bold mb-4">کمیسیون</h3>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">مبلغ کمیسیون</p>
              <p className="text-2xl font-bold text-green-700">
                {formatPrice(rfp.commission?.amount)}
              </p>
              <p className="text-xs text-gray-600 mt-2">
                {rfp.commission?.percent}% از قیمت کل
              </p>
            </div>
          </div>

          {/* Participants */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold mb-4">طرفین</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">فروشنده</p>
                  <p className="font-medium">
                    {rfp.seller?.firstName} {rfp.seller?.lastName}
                  </p>
                </div>
                {rfp.approvedBySeller && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">بازاریاب</p>
                  <p className="font-medium">
                    {rfp.marketer?.firstName} {rfp.marketer?.lastName}
                  </p>
                </div>
                {rfp.approvedByMarketer && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg shadow p-6 space-y-3">
            <h3 className="font-bold mb-4">اقدامات</h3>
            
            {canApprove && (
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                تایید RFP
              </button>
            )}
            
            {canEdit && (
              <button
                onClick={() => setShowEditModal(true)}
                disabled={actionLoading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
              >
                <Edit2 className="w-5 h-5" />
                ویرایش RFP
              </button>
            )}
            
            {canReject && (
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={actionLoading}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
              >
                <XCircle className="w-5 h-5" />
                رد RFP
              </button>
            )}
            
            {canCreateContract && (
              <button
                onClick={handleCreateContract}
                disabled={actionLoading}
                className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium"
              >
                ایجاد قرارداد تجاری
              </button>
            )}
          </div>

          {/* Metadata */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold mb-4">اطلاعات تکمیلی</h3>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-gray-600">نسخه</p>
                <p className="font-medium">{rfp.currentVersion}</p>
              </div>
              <div>
                <p className="text-gray-600">تاریخ ایجاد</p>
                <p className="font-medium">{formatDate(rfp.createdAt)}</p>
              </div>
              {rfp.approvedAt && (
                <div>
                  <p className="text-gray-600">تاریخ تایید</p>
                  <p className="font-medium">{formatDate(rfp.approvedAt)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold mb-4">ویرایش RFP</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">توضیحات تغییرات *</label>
                <textarea
                  value={editData.comment}
                  onChange={(e) => setEditData({ ...editData, comment: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="توضیح دهید چه تغییراتی اعمال کرده‌اید..."
                  required
                />
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  پس از ویرایش، RFP به طرف دیگر ارسال می‌شود و باید مجدداً تایید شود.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleEdit}
                disabled={actionLoading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoading ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">رد RFP</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">دلیل رد *</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                rows={4}
                placeholder="لطفاً دلیل رد را توضیح دهید..."
                required
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleReject}
                disabled={actionLoading}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? 'در حال رد...' : 'تایید رد'}
              </button>
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

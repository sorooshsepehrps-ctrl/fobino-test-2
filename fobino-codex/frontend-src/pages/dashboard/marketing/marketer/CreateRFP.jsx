import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { marketingService } from '../../../../services';

export default function CreateRFP() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [marketingRequest, setMarketingRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    clientInfo: {
      companyName: '',
      industry: '',
      province: '',
      city: '',
      estimatedOrderSize: '',
      estimatedBudget: '',
      requirementsDescription: '',
      timeline: '',
      additionalNotes: '',
    },
    proposedTerms: {
      productName: '',
      quantity: '',
      unit: 'kg',
      pricePerUnit: '',
      totalPrice: 0,
      deliveryTime: '',
      paymentTerms: '',
      warranties: '',
      additionalServices: [],
    },
  });

  useEffect(() => {
    loadMarketingRequest();
  }, [requestId]);

  useEffect(() => {
    calculateTotalPrice();
  }, [formData.proposedTerms.quantity, formData.proposedTerms.pricePerUnit]);

  const loadMarketingRequest = async () => {
    setLoading(true);
    try {
      const response = await marketingService.getMarketingRequestById(requestId);
      setMarketingRequest(response.data);
      
      setFormData(prev => ({
        ...prev,
        proposedTerms: {
          ...prev.proposedTerms,
          productName: response.data.productName,
        },
      }));
    } catch (error) {
      console.error('Error loading marketing request:', error);
      toast.error('خطا در بارگذاری درخواست بازاریابی');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalPrice = () => {
    const quantity = parseFloat(formData.proposedTerms.quantity) || 0;
    const pricePerUnit = parseFloat(formData.proposedTerms.pricePerUnit) || 0;
    const totalPrice = quantity * pricePerUnit;
    
    setFormData(prev => ({
      ...prev,
      proposedTerms: {
        ...prev.proposedTerms,
        totalPrice,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.clientInfo.companyName || !formData.clientInfo.province || !formData.clientInfo.city) {
      toast.error('لطفاً اطلاعات اولیه مشتری را تکمیل کنید');
      return;
    }

    if (!formData.proposedTerms.quantity || !formData.proposedTerms.pricePerUnit) {
      toast.error('لطفاً شرایط پیشنهادی را کامل کنید');
      return;
    }

    setSubmitting(true);

    try {
      const data = {
        marketingRequestId: requestId,
        clientInfo: formData.clientInfo,
        proposedTerms: formData.proposedTerms,
      };

      const response = await marketingService.createRFP(data);
      toast.success('RFP با موفقیت ایجاد شد و برای فروشنده ارسال شد');
      navigate(`/dashboard/marketing/rfps/${response.data._id}`);
    } catch (error) {
      console.error('Error creating RFP:', error);
      toast.error(error.response?.data?.message || 'خطا در ایجاد RFP');
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowRight className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">ایجاد RFP جدید</h1>
          <p className="text-gray-600">برای: {marketingRequest?.productName}</p>
        </div>
      </div>

      {/* Marketing Request Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-blue-900 mb-2">اطلاعات درخواست بازاریابی</h3>
        <div className="grid grid-cols-2 gap-3 text-sm text-blue-800">
          <div>
            <span className="text-blue-600">محصول:</span> {marketingRequest?.productName}
          </div>
          <div>
            <span className="text-blue-600">برند:</span> {marketingRequest?.brand}
          </div>
          <div>
            <span className="text-blue-600">کمیسیون:</span> {marketingRequest?.commissionPercent}%
          </div>
          <div>
            <span className="text-blue-600">موقعیت:</span> {marketingRequest?.cityOfProduction?.province}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client Information */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-bold mb-4">اطلاعات مشتری</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">نام شرکت *</label>
              <input
                type="text"
                value={formData.clientInfo.companyName}
                onChange={(e) => setFormData({
                  ...formData,
                  clientInfo: { ...formData.clientInfo, companyName: e.target.value }
                })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">صنعت</label>
              <input
                type="text"
                value={formData.clientInfo.industry}
                onChange={(e) => setFormData({
                  ...formData,
                  clientInfo: { ...formData.clientInfo, industry: e.target.value }
                })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">استان *</label>
              <input
                type="text"
                value={formData.clientInfo.province}
                onChange={(e) => setFormData({
                  ...formData,
                  clientInfo: { ...formData.clientInfo, province: e.target.value }
                })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">شهر *</label>
              <input
                type="text"
                value={formData.clientInfo.city}
                onChange={(e) => setFormData({
                  ...formData,
                  clientInfo: { ...formData.clientInfo, city: e.target.value }
                })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">حجم تخمینی سفارش</label>
              <input
                type="number"
                value={formData.clientInfo.estimatedOrderSize}
                onChange={(e) => setFormData({
                  ...formData,
                  clientInfo: { ...formData.clientInfo, estimatedOrderSize: e.target.value }
                })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">بودجه تخمینی (تومان)</label>
              <input
                type="number"
                value={formData.clientInfo.estimatedBudget}
                onChange={(e) => setFormData({
                  ...formData,
                  clientInfo: { ...formData.clientInfo, estimatedBudget: e.target.value }
                })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">توضیحات نیازمندی‌ها</label>
            <textarea
              value={formData.clientInfo.requirementsDescription}
              onChange={(e) => setFormData({
                ...formData,
                clientInfo: { ...formData.clientInfo, requirementsDescription: e.target.value }
              })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">زمان‌بندی</label>
              <input
                type="text"
                value={formData.clientInfo.timeline}
                onChange={(e) => setFormData({
                  ...formData,
                  clientInfo: { ...formData.clientInfo, timeline: e.target.value }
                })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="مثال: یک ماه"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">یادداشت‌های اضافی</label>
              <input
                type="text"
                value={formData.clientInfo.additionalNotes}
                onChange={(e) => setFormData({
                  ...formData,
                  clientInfo: { ...formData.clientInfo, additionalNotes: e.target.value }
                })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Proposed Terms */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-bold mb-4">شرایط پیشنهادی</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">مقدار *</label>
              <input
                type="number"
                value={formData.proposedTerms.quantity}
                onChange={(e) => setFormData({
                  ...formData,
                  proposedTerms: { ...formData.proposedTerms, quantity: e.target.value }
                })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">واحد</label>
              <select
                value={formData.proposedTerms.unit}
                onChange={(e) => setFormData({
                  ...formData,
                  proposedTerms: { ...formData.proposedTerms, unit: e.target.value }
                })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="ton">تن</option>
                <option value="kg">کیلوگرم</option>
                <option value="gram">گرم</option>
                <option value="piece">عدد</option>
                <option value="pack">بسته</option>
                <option value="box">جعبه</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">قیمت واحد (تومان) *</label>
              <input
                type="number"
                value={formData.proposedTerms.pricePerUnit}
                onChange={(e) => setFormData({
                  ...formData,
                  proposedTerms: { ...formData.proposedTerms, pricePerUnit: e.target.value }
                })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Total Price Display */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="font-medium text-blue-900">قیمت کل:</span>
              <span className="text-2xl font-bold text-blue-700">
                {formatPrice(formData.proposedTerms.totalPrice)}
              </span>
            </div>
            {marketingRequest?.commissionPercent && (
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-blue-200">
                <span className="text-sm text-blue-700">کمیسیون ({marketingRequest.commissionPercent}%):</span>
                <span className="text-lg font-semibold text-green-700">
                  {formatPrice(formData.proposedTerms.totalPrice * marketingRequest.commissionPercent / 100)}
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">زمان تحویل</label>
              <input
                type="text"
                value={formData.proposedTerms.deliveryTime}
                onChange={(e) => setFormData({
                  ...formData,
                  proposedTerms: { ...formData.proposedTerms, deliveryTime: e.target.value }
                })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="مثال: 7 روز"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">شرایط پرداخت</label>
              <input
                type="text"
                value={formData.proposedTerms.paymentTerms}
                onChange={(e) => setFormData({
                  ...formData,
                  proposedTerms: { ...formData.proposedTerms, paymentTerms: e.target.value }
                })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="مثال: پرداخت نقدی"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">گارانتی‌ها</label>
            <textarea
              value={formData.proposedTerms.warranties}
              onChange={(e) => setFormData({
                ...formData,
                proposedTerms: { ...formData.proposedTerms, warranties: e.target.value }
              })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="گارانتی‌های ارائه شده..."
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'در حال ارسال...' : 'ارسال RFP به فروشنده'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-8 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
          >
            انصراف
          </button>
        </div>
      </form>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Award, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { marketingService } from '../../../services';

export default function MarketerVerification() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    loadMarketerStatus();
  }, []);

  const loadMarketerStatus = async () => {
    setLoading(true);
    try {
      const response = await marketingService.getMyMarketerStatus();
      setStatus(response.data);
    } catch (error) {
      console.error('Error loading marketer status:', error);
      toast.error('خطا در بارگذاری وضعیت');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestVerification = async () => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید درخواست تایید بازاریاب کنید؟')) {
      return;
    }

    setRequesting(true);
    try {
      await marketingService.requestMarketerVerification();
      toast.success('درخواست با موفقیت ثبت شد');
      loadMarketerStatus();
    } catch (error) {
      console.error('Error requesting verification:', error);
      toast.error(error.response?.data?.message || 'خطا در ثبت درخواست');
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const getStatusIcon = () => {
    if (status?.isMarketer) return <CheckCircle className="w-16 h-16 text-green-500" />;
    if (status?.verification?.status === 'pending') return <Clock className="w-16 h-16 text-yellow-500" />;
    if (status?.verification?.status === 'rejected') return <XCircle className="w-16 h-16 text-red-500" />;
    return <Award className="w-16 h-16 text-purple-500" />;
  };

  const getStatusMessage = () => {
    if (status?.isMarketer) {
      return {
        title: 'شما یک بازاریاب تایید شده هستید',
        description: 'اکنون می‌توانید درخواست‌های بازاریابی را مشاهده و قبول کنید',
        color: 'green',
      };
    }
    if (status?.verification?.status === 'pending') {
      return {
        title: 'درخواست شما در حال بررسی است',
        description: 'لطفاً منتظر بمانید تا مدیران فوبینو درخواست شما را بررسی کنند',
        color: 'yellow',
      };
    }
    if (status?.verification?.status === 'rejected') {
      return {
        title: 'درخواست شما رد شد',
        description: status.verification.rejectionReason || 'درخواست شما مورد تایید قرار نگرفت',
        color: 'red',
      };
    }
    return {
      title: 'درخواست تایید بازاریاب',
      description: 'برای فعالیت به عنوان بازاریاب، ابتدا باید تایید شوید',
      color: 'purple',
    };
  };

  const statusMessage = getStatusMessage();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Icon and Status */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            {getStatusIcon()}
          </div>
          <h1 className={`text-2xl font-bold mb-2 text-${statusMessage.color}-900`}>
            {statusMessage.title}
          </h1>
          <p className="text-gray-600">{statusMessage.description}</p>
        </div>

        {/* Requirements */}
        {!status?.isMarketer && (
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4">شرایط بازاریاب شدن</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                {status?.level >= 5 ? (
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                )}
                <div>
                  <p className="font-medium">سطح کاربری 5</p>
                  <p className="text-sm text-gray-600">
                    سطح فعلی شما: {status?.level || 0}
                    {status?.level < 5 && ' (باید به سطح 5 برسید)'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">تکمیل اطلاعات پروفایل</p>
                  <p className="text-sm text-gray-600">
                    اطلاعات شخصی و بانکی کامل باشد
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">تایید هویت</p>
                  <p className="text-sm text-gray-600">
                    مدارک هویتی تایید شده باشد
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Benefits */}
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4">مزایای بازاریاب شدن</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-medium text-purple-900 mb-2">دسترسی به درخواست‌های بازاریابی</h3>
              <p className="text-sm text-purple-800">
                می‌توانید درخواست‌های بازاریابی فروشندگان را مشاهده و قبول کنید
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-medium text-green-900 mb-2">کسب درآمد از کمیسیون</h3>
              <p className="text-sm text-green-800">
                با معرفی خریدار، کمیسیون خود را دریافت کنید
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">مدیریت چند پروژه</h3>
              <p className="text-sm text-blue-800">
                می‌توانید چندین درخواست بازاریابی را همزمان مدیریت کنید
              </p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-medium text-yellow-900 mb-2">پشتیبانی فوبینو</h3>
              <p className="text-sm text-yellow-800">
                از پشتیبانی اختصاصی و ابزارهای بازاریابی بهره‌مند شوید
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        {!status?.isMarketer && status?.verification?.status !== 'pending' && (
          <div>
            {status?.canRequest ? (
              <button
                onClick={handleRequestVerification}
                disabled={requesting}
                className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {requesting ? 'در حال ارسال درخواست...' : 'درخواست تایید بازاریاب'}
              </button>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-900">شرایط لازم را ندارید</p>
                  <p className="text-sm text-yellow-800 mt-1">
                    برای درخواست تایید بازاریاب، ابتدا باید به سطح 5 برسید و اطلاعات خود را تکمیل کنید.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Timeline for Pending */}
        {status?.verification?.status === 'pending' && status.verification.requestedAt && (
          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-gray-600">
              تاریخ درخواست: {new Date(status.verification.requestedAt).toLocaleDateString('fa-IR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        )}

        {/* Approved Status */}
        {status?.isMarketer && (
          <div className="mt-6 pt-6 border-t">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="font-medium text-green-900 mb-2">شما اکنون می‌توانید:</p>
              <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
                <li>درخواست‌های بازاریابی را مشاهده کنید</li>
                <li>درخواست‌ها را قبول و RFP ایجاد کنید</li>
                <li>با فروشندگان مذاکره کنید</li>
                <li>قراردادهای تجاری ایجاد کنید</li>
                <li>کمیسیون‌های خود را دریافت کنید</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

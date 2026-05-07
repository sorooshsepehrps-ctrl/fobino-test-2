import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Crown, 
  ShieldCheck, 
  Share2, 
  CreditCard, 
  Copy, 
  Check,
  HelpCircle,
  Headphones,
  Package
} from 'lucide-react';
import { QRCodeCanvas } from 'react-qrcode-logo';
import toast from 'react-hot-toast';
import { Button, Card, Modal } from '../../components/ui';
import useAuthStore from '../../store/authStore';
import { 
  toPersianDate, 
  toPersianNumber, 
  getProfileStatus, 
  getProfileShareUrl,
  copyToClipboard,
  getDaysRemaining 
} from '../../utils/helpers';

export default function MyFobino() {
  const { user } = useAuthStore();
  const [showVisitCard, setShowVisitCard] = useState(false);
  const [copied, setCopied] = useState(false);

  const profileUrl = getProfileShareUrl(user?._id);
  const profileStatus = getProfileStatus(user?.profileCompletion || 0);
  const subscriptionDays = getDaysRemaining(user?.subscription?.endDate);

  const handleCopyLink = async () => {
    await copyToClipboard(profileUrl);
    setCopied(true);
    toast.success('لینک کپی شد');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = `پروفایل من در فوبینو: ${profileUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShareTelegram = () => {
    const text = `پروفایل من در فوبینو: ${profileUrl}`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(profileUrl)}&text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">فوبینو من</h1>
      </div>

      {/* User Summary Card */}
      <Card className="bg-gradient-to-l from-emerald-500 to-teal-600 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold mb-2">{user?.fullName}</h2>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-emerald-100">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                تاریخ عضویت: {toPersianDate(user?.createdAt)}
              </span>
              <span>
                مدت عضویت: {toPersianNumber(user?.membershipDays || 0)} روز
              </span>
            </div>
          </div>
          <div className="text-left">
            <div className="text-sm text-emerald-100 mb-1">
              اشتراک فعلی: {user?.subscription?.plan?.nameFa || 'رایگان'}
            </div>
            <div className="text-lg font-semibold">
              مدت باقیمانده: {toPersianNumber(subscriptionDays)} روز
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Profile Completion */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-600">تکمیل پروفایل</span>
            <span className={`px-2 py-1 rounded text-sm font-medium ${profileStatus.bg} ${profileStatus.color}`}>
              {profileStatus.text}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className="bg-emerald-500 h-2 rounded-full transition-all"
              style={{ width: `${user?.profileCompletion || 0}%` }}
            />
          </div>
          <p className="text-sm text-gray-500">
            {toPersianNumber(user?.profileCompletion || 0)}% تکمیل شده
          </p>
        </Card>

        {/* Verification Status */}
        <Card>
          <div className="flex items-center gap-3 mb-3">
            <ShieldCheck className={`w-8 h-8 ${user?.level >= 2 ? 'text-emerald-500' : 'text-gray-400'}`} />
            <div>
              <h3 className="font-medium text-gray-900">احراز هویت</h3>
              <p className="text-sm text-gray-500">
                سطح {toPersianNumber(user?.level || 0)}
              </p>
            </div>
          </div>
          {user?.level < 2 && (
            <p className="text-sm text-amber-600 mb-3">
              هویت حساب کاربری خود را احراز کنید.
            </p>
          )}
          <Link to="/dashboard/verification">
            <Button variant="outline" size="sm" className="w-full">
              احراز هویت
            </Button>
          </Link>
        </Card>

        {/* Remaining Posts */}
        <Card>
          <div className="flex items-center gap-3 mb-3">
            <Package className="w-8 h-8 text-blue-500" />
            <div>
              <h3 className="font-medium text-gray-900">محصولات قابل تعریف</h3>
              <p className="text-2xl font-bold text-blue-600">
                {toPersianNumber(user?.subscription?.remainingPosts || 5)}
              </p>
            </div>
          </div>
          <Link to="/dashboard/subscription">
            <Button variant="outline" size="sm" className="w-full">
              ارتقاء عضویت
            </Button>
          </Link>
        </Card>
      </div>

      {/* Share Profile */}
      <Card>
        <h3 className="font-semibold text-gray-900 mb-3">
          با قرار دادن لینک زیر در سایت و صفحات اجتماعی خود، به دیده شدن خود کمک کنید
        </h3>
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg mb-4">
          <input
            type="text"
            value={profileUrl}
            readOnly
            className="flex-1 bg-transparent border-none text-sm text-gray-600 focus:outline-none"
            dir="ltr"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyLink}
            icon={copied ? Check : Copy}
          >
            {copied ? 'کپی شد' : 'کپی'}
          </Button>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowVisitCard(true)}
            icon={CreditCard}
          >
            کارت ویزیت
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleShareWhatsApp}
          >
            اشتراک در واتس‌اپ
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleShareTelegram}
          >
            اشتراک در تلگرام
          </Button>
        </div>
      </Card>

      {/* Quick Links */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link to="/help" className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <HelpCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">راهنما</h3>
              <p className="text-sm text-gray-500">آموزش استفاده از فوبینو</p>
            </div>
          </Link>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link to="/dashboard/tickets/new" className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <Headphones className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">پشتیبانی</h3>
              <p className="text-sm text-gray-500">ارتباط با تیم پشتیبانی</p>
            </div>
          </Link>
        </Card>
      </div>

      {/* Visit Card Modal */}
      <Modal
        isOpen={showVisitCard}
        onClose={() => setShowVisitCard(false)}
        title="کارت ویزیت"
        size="sm"
      >
        <div className="text-center">
          <p className="text-gray-600 mb-4">عضو سامانه خرید و فروش فوبینو</p>
          
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-6 rounded-xl mb-4">
            <h3 className="text-xl font-bold mb-2">{user?.fullName}</h3>
            <p className="text-emerald-100 text-sm mb-4" dir="ltr">{user?.phone}</p>
            <div className="bg-white p-3 rounded-lg inline-block">
              <QRCodeCanvas
                value={profileUrl}
                size={120}
                bgColor="#ffffff"
                fgColor="#059669"
              />
            </div>
            <p className="text-xs text-emerald-200 mt-3">اسکن کنید</p>
          </div>

          <div className="flex flex-col gap-2">
            <Button variant="outline" onClick={handleShareTelegram}>
              اشتراک در تلگرام
            </Button>
            <Button variant="outline" onClick={handleShareWhatsApp}>
              اشتراک در واتس‌اپ
            </Button>
            <Button variant="outline" onClick={handleCopyLink}>
              ذخیره کارت ویزیت
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

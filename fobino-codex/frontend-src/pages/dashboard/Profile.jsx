import { useState, useEffect } from 'react';
import { Camera, Save, User as UserIcon, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Input, Card, CardHeader, CardTitle } from '../../components/ui';
import useAuthStore from '../../store/authStore';
import { PROVINCES, SELLER_STATUS_OPTIONS, USER_TYPE_LABELS } from '../../config/constants';
import { toPersianNumber } from '../../utils/helpers';
import { userService } from '../../services';

export default function Profile() {
  const { user, updateProfile, isLoading } = useAuthStore();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    website: '',
    about: '',
    province: '',
    city: '',
    address: '',
    showPhoneToSellers: false,
    wantsCollaboration: false,
    sellerStatus: 'available',
  });
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        website: user.website || '',
        about: user.about || '',
        province: user.location?.province || '',
        city: user.location?.city || '',
        address: user.location?.address || '',
        showPhoneToSellers: user.showPhoneToSellers || false,
        wantsCollaboration: user.wantsCollaboration || false,
        sellerStatus: user.sellerStatus || 'available',
      });
      setImagePreview(user.profileImage);
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('حجم تصویر نباید بیشتر از ۵ مگابایت باشد');
        return;
      }
      setProfileImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleImageUpload = async () => {
    if (!profileImage) return;
    
    setUploading(true);
    try {
      await userService.uploadProfileImage(profileImage);
      toast.success('تصویر پروفایل آپلود شد');
      setProfileImage(null);
    } catch {
      toast.error('خطا در آپلود تصویر');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const updateData = {
      ...formData,
      location: {
        province: formData.province,
        city: formData.city,
        address: formData.address,
      }
    };
    
    const result = await updateProfile(updateData);
    if (result.success) {
      toast.success('اطلاعات با موفقیت ذخیره شد');
      if (profileImage) {
        await handleImageUpload();
      }
    } else {
      toast.error(result.error || 'خطا در ذخیره اطلاعات');
    }
  };

  const profileCompletion = user?.profileCompletion || 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">اطلاعات حساب</h1>

      {/* Profile Completion */}
      <Card>
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-700">میزان تکمیل پروفایل</span>
          <span className="font-bold text-emerald-600">{toPersianNumber(profileCompletion)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-emerald-500 h-3 rounded-full transition-all"
            style={{ width: `${profileCompletion}%` }}
          />
        </div>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Image */}
        <Card>
          <CardHeader>
            <CardTitle>تصویر پروفایل</CardTitle>
          </CardHeader>
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden">
                {imagePreview ? (
                  <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <UserIcon className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </div>
              <label className="absolute bottom-0 left-0 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-emerald-600 transition-colors">
                <Camera className="w-4 h-4 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{user?.fullName}</h3>
              <p className="text-sm text-gray-500">
                نحوه نمایش پروفایل: {USER_TYPE_LABELS[user?.userType] || 'حقیقی'}
              </p>
              {user?.userType === 'company' && user?.companyInfo?.companyName && (
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                  <Building2 className="w-4 h-4" />
                  {user.companyInfo.companyName}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Personal Info */}
        <Card>
          <CardHeader>
            <CardTitle>اطلاعات شما</CardTitle>
          </CardHeader>
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="شماره موبایل"
              value={user?.phone || ''}
              disabled
              dir="ltr"
              className="text-left bg-gray-50"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                نمایش شماره به فروشندگان
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="showPhoneToSellers"
                  checked={formData.showPhoneToSellers}
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className={formData.showPhoneToSellers ? 'text-emerald-600' : 'text-gray-500'}>
                  {formData.showPhoneToSellers ? 'فعال' : 'غیر فعال'}
                </span>
              </label>
            </div>
            <Input
              label="نام"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="نام خود را وارد کنید"
            />
            <Input
              label="نام خانوادگی"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="نام خانوادگی خود را وارد کنید"
            />
          </div>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle>آدرس</CardTitle>
          </CardHeader>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                انتخاب استان
              </label>
              <select
                name="province"
                value={formData.province}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- انتخاب کنید --</option>
                {PROVINCES.map(province => (
                  <option key={province} value={province}>{province}</option>
                ))}
              </select>
            </div>
            <Input
              label="انتخاب شهر"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="شهر خود را وارد کنید"
            />
            <div className="md:col-span-2">
              <Input
                label="آدرس"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="آدرس را وارد کنید"
              />
            </div>
          </div>
        </Card>

        {/* About Business */}
        <Card>
          <CardHeader>
            <CardTitle>درباره کسب و کارتان بنویسید</CardTitle>
          </CardHeader>
          <p className="text-sm text-gray-500 mb-3">
            در بخش (درباره کسب و کارتان بنویسید) به این سوالات پاسخ دهید:
          </p>
          <ul className="text-sm text-gray-500 list-disc list-inside mb-4 space-y-1">
            <li>در چه زمینه ای فعالیت می کنید؟</li>
            <li>بازار فعالیت شما داخلی است یا خارجی؟</li>
            <li>چند سال سابقه فعالیت دارید؟</li>
          </ul>
          <textarea
            name="about"
            value={formData.about}
            onChange={handleChange}
            rows={5}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            placeholder="درباره کسب و کارتان بنویسید..."
          />
        </Card>

        {/* Other Info */}
        <Card>
          <CardHeader>
            <CardTitle>سایر اطلاعات</CardTitle>
          </CardHeader>
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="آدرس ایمیل"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="پست الکترونیک خود را وارد کنید"
              dir="ltr"
              className="text-left"
            />
            <Input
              label="لینک سایت"
              name="website"
              value={formData.website}
              onChange={handleChange}
              placeholder="لینک سایت خود را جهت نمایش وارد کنید"
              dir="ltr"
              className="text-left"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                آیا تمایل به همکاری در فروش دارید؟
              </label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="wantsCollaboration"
                    checked={formData.wantsCollaboration}
                    onChange={() => setFormData(prev => ({ ...prev, wantsCollaboration: true }))}
                    className="w-4 h-4 text-emerald-600"
                  />
                  تمایل دارم
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="wantsCollaboration"
                    checked={!formData.wantsCollaboration}
                    onChange={() => setFormData(prev => ({ ...prev, wantsCollaboration: false }))}
                    className="w-4 h-4 text-emerald-600"
                  />
                  تمایل ندارم
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                وضعیت فروشنده
              </label>
              <select
                name="sellerStatus"
                value={formData.sellerStatus}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- انتخاب کنید --</option>
                {SELLER_STATUS_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Submit */}
        <div className="flex justify-end">
          <Button
            type="submit"
            size="lg"
            loading={isLoading || uploading}
            icon={Save}
          >
            ثبت تغییرات
          </Button>
        </div>
      </form>
    </div>
  );
}

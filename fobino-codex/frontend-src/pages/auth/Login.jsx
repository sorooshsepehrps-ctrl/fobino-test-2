import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Input } from '../../components/ui';
import useAuthStore from '../../store/authStore';
import { isValidPhone } from '../../utils/helpers';

export default function Login() {
  const [phone, setPhone] = useState('');
  const { requestCode, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    if (!isValidPhone(phone)) {
      toast.error('شماره موبایل نامعتبر است');
      return;
    }

    const result = await requestCode(phone);
    if (result.success) {
      toast.success('کد تایید ارسال شد');
      navigate('/verify');
    } else {
      toast.error(result.error || 'خطا در ارسال کد');
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
        ورود / ثبت‌نام
      </h2>
      <p className="text-gray-600 text-center mb-8">
        شماره موبایل خود را وارد کنید
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          type="tel"
          label="شماره موبایل"
          placeholder="۰۹۱۲۳۴۵۶۷۸۹"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          icon={Phone}
          error={error}
          required
          dir="ltr"
          className="text-left"
          maxLength={11}
        />

        <Button
          type="submit"
          className="w-full"
          size="lg"
          loading={isLoading}
        >
          دریافت کد تایید
        </Button>
      </form>

      <p className="text-sm text-gray-500 text-center mt-6">
        با ورود به فوبینو، شما
        <a href="/terms" className="text-emerald-600 hover:underline mx-1">
          قوانین و مقررات
        </a>
        را می‌پذیرید.
      </p>
    </div>
  );
}

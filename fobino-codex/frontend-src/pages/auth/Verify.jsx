import { useState, useEffect, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { ArrowRight, Building2, User as UserIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Input } from '../../components/ui';
import useAuthStore from '../../store/authStore';
import { USER_TYPES, USER_TYPE_LABELS } from '../../config/constants';

export default function Verify() {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [userData, setUserData] = useState({
    userType: 'individual',
    firstName: '',
    lastName: '',
    companyName: '',
    economicCode: '',
  });
  const [timer, setTimer] = useState(120);
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  
  const {
    pendingPhone,
    isNewUser,
    verifyCode,
    resendCode,
    isLoading,
    error,
    clearError,
  } = useAuthStore();

  // Redirect if no pending phone
  if (!pendingPhone) {
    return <Navigate to="/login" replace />;
  }

  // Timer countdown
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  // Handle code input
  const handleCodeChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (/^\d+$/.test(pastedData)) {
      const newCode = pastedData.split('').concat(Array(6).fill('')).slice(0, 6);
      setCode(newCode);
      inputRefs.current[Math.min(pastedData.length, 5)]?.focus();
    }
  };

  // Handle resend
  const handleResend = async () => {
    const result = await resendCode();
    if (result.success) {
      toast.success('کد جدید ارسال شد');
      setTimer(120);
      setCode(['', '', '', '', '', '']);
    } else {
      toast.error('خطا در ارسال مجدد کد');
    }
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      toast.error('کد ۶ رقمی را وارد کنید');
      return;
    }

    // Validate new user data
    if (isNewUser) {
      if (!userData.firstName || !userData.lastName) {
        toast.error('نام و نام خانوادگی الزامی است');
        return;
      }
      if (userData.userType === 'company') {
        if (!userData.companyName || !userData.economicCode) {
          toast.error('نام شرکت و کد اقتصادی الزامی است');
          return;
        }
      }
    }

    const result = await verifyCode(
      pendingPhone,
      fullCode,
      isNewUser ? userData : null
    );

    if (result.success) {
      toast.success('خوش آمدید!');
      navigate('/dashboard');
    } else {
      toast.error(result.error || 'کد نامعتبر است');
    }
  };

  const formatTimer = () => {
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div>
      {/* Back button */}
      <button
        onClick={() => navigate('/login')}
        className="flex items-center gap-1 text-gray-600 hover:text-emerald-600 mb-6"
      >
        <ArrowRight className="w-4 h-4" />
        بازگشت
      </button>

      <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
        کد تایید
      </h2>
      <p className="text-gray-600 text-center mb-6">
        کد ارسال شده به <span dir="ltr" className="font-medium">{pendingPhone}</span> را وارد کنید
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* New user form */}
        {isNewUser && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg mb-6">
            <p className="text-sm font-medium text-gray-700 mb-3">
              نوع حساب کاربری:
            </p>
            
            {/* User type selection */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setUserData({ ...userData, userType: 'individual' })}
                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                  userData.userType === 'individual'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <UserIcon className="w-5 h-5" />
                {USER_TYPE_LABELS.individual}
              </button>
              <button
                type="button"
                onClick={() => setUserData({ ...userData, userType: 'company' })}
                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                  userData.userType === 'company'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Building2 className="w-5 h-5" />
                {USER_TYPE_LABELS.company}
              </button>
            </div>

            {/* Individual fields */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="نام"
                placeholder="نام"
                value={userData.firstName}
                onChange={(e) => setUserData({ ...userData, firstName: e.target.value })}
                required
              />
              <Input
                label="نام خانوادگی"
                placeholder="نام خانوادگی"
                value={userData.lastName}
                onChange={(e) => setUserData({ ...userData, lastName: e.target.value })}
                required
              />
            </div>

            {/* Company fields */}
            {userData.userType === 'company' && (
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="نام شرکت"
                  placeholder="نام شرکت"
                  value={userData.companyName}
                  onChange={(e) => setUserData({ ...userData, companyName: e.target.value })}
                  required
                />
                <Input
                  label="کد اقتصادی"
                  placeholder="کد اقتصادی"
                  value={userData.economicCode}
                  onChange={(e) => setUserData({ ...userData, economicCode: e.target.value })}
                  required
                  dir="ltr"
                />
              </div>
            )}
          </div>
        )}

        {/* OTP Input */}
        <div className="flex justify-center gap-2" dir="ltr">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              value={digit}
              onChange={(e) => handleCodeChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className="w-12 h-14 text-center text-xl font-semibold border-2 rounded-lg focus:outline-none focus:border-emerald-500 transition-colors"
              maxLength={1}
            />
          ))}
        </div>

        {error && (
          <p className="text-red-500 text-center text-sm">{error}</p>
        )}

        {/* Timer and resend */}
        <div className="text-center">
          {timer > 0 ? (
            <p className="text-gray-500 text-sm">
              ارسال مجدد کد در <span className="font-medium">{formatTimer()}</span>
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
            >
              ارسال مجدد کد
            </button>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          loading={isLoading}
        >
          تایید و ورود
        </Button>
      </form>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scan, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { marketingService } from '../../../../services';

export default function ConnectToBuyerContract() {
  const navigate = useNavigate();
  const [contractCode, setContractCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConnect = async (e) => {
    e.preventDefault();
    
    if (!contractCode.trim()) {
      toast.error('لطفاً کد قرارداد را وارد کنید');
      return;
    }

    setLoading(true);

    try {
      const response = await marketingService.connectBuyerToContract(contractCode.trim());
      toast.success('با موفقیت به قرارداد متصل شدید');
      navigate(`/dashboard/marketing/contracts/${response.data._id}`);
    } catch (error) {
      console.error('Error connecting to contract:', error);
      toast.error(error.response?.data?.message || 'خطا در اتصال به قرارداد');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowRight className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold">اتصال به قرارداد تجاری</h1>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Scan className="w-10 h-10 text-purple-600" />
          </div>
          <h2 className="text-xl font-bold mb-2">ورود کد قرارداد</h2>
          <p className="text-gray-600">
            کد قرارداد را که از بازاریاب دریافت کرده‌اید وارد کنید
          </p>
        </div>

        <form onSubmit={handleConnect} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">کد قرارداد</label>
            <input
              type="text"
              value={contractCode}
              onChange={(e) => setContractCode(e.target.value)}
              placeholder="مثال: TC1708534123456789"
              className="w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 text-lg font-mono"
              required
            />
            <p className="text-xs text-gray-500 mt-2">
              کد قرارداد معمولاً با TC شروع می‌شود و شامل اعداد است
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">مراحل بعدی:</h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>بررسی جزئیات قرارداد</li>
              <li>تایید شرایط قرارداد</li>
              <li>واریز کمیسیون بازاریاب</li>
              <li>دریافت اطلاعات تماس فروشنده</li>
              <li>شروع گفتگو و معامله</li>
            </ol>
          </div>

          <button
            type="submit"
            disabled={loading || !contractCode.trim()}
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'در حال اتصال...' : 'اتصال به قرارداد'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t">
          <h3 className="font-medium mb-3">سوالات متداول</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <details className="group">
              <summary className="cursor-pointer font-medium text-gray-900">
                چگونه کد قرارداد را دریافت کنم؟
              </summary>
              <p className="mt-2 pr-4">
                کد قرارداد توسط بازاریاب برای شما ارسال می‌شود. این کد منحصر به فرد است و شما را به یک قرارداد خاص متصل می‌کند.
              </p>
            </details>
            
            <details className="group">
              <summary className="cursor-pointer font-medium text-gray-900">
                آیا باید هزینه‌ای پرداخت کنم؟
              </summary>
              <p className="mt-2 pr-4">
                پس از تایید قرارداد، باید کمیسیون بازاریاب را به عنوان ودیعه واریز کنید. این مبلغ تا زمان تکمیل معامله در کیف پول شما مسدود می‌شود.
              </p>
            </details>
            
            <details className="group">
              <summary className="cursor-pointer font-medium text-gray-900">
                اگر کد اشتباه وارد کنم چه می‌شود؟
              </summary>
              <p className="mt-2 pr-4">
                در صورت وارد کردن کد نامعتبر، پیام خطا دریافت خواهید کرد. مطمئن شوید کد را دقیقاً همانطور که دریافت کرده‌اید وارد کنید.
              </p>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}

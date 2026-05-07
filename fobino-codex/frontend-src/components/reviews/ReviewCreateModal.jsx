import { useEffect, useMemo, useState } from 'react';
import { CheckCircle, MessageSquareText, ShieldCheck, Sparkles, XCircle } from 'lucide-react';
import { Button, Modal } from '../ui';
import RatingStarsInput from './RatingStarsInput';
import userReviewService from '../../services/userReviewService';

const ROLE_LABELS = {
  buyer: 'خریدار',
  seller: 'فروشنده',
};

function getErrorMessage(error) {
  return error?.response?.data?.message || error?.message || 'خطا در ثبت نظر. لطفاً دوباره تلاش کنید.';
}

export default function ReviewCreateModal({ isOpen, onClose, deal, eligibility, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRating(0);
      setText('');
      setError('');
      setSuccess(false);
      setLoading(false);
    }
  }, [isOpen]);

  const revieweeName = useMemo(() => {
    const reviewee = eligibility?.reviewee;
    return reviewee?.businessName || reviewee?.fullName || 'طرف مقابل';
  }, [eligibility]);

  const canSubmit = rating >= 1 && rating <= 5 && text.trim().length >= 3 && !loading;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;

    try {
      setLoading(true);
      setError('');
      await userReviewService.createReview({
        dealId: deal?._id || deal?.id,
        rating,
        text: text.trim(),
      });
      setSuccess(true);
      onSuccess?.();
      setTimeout(() => {
        onClose?.();
      }, 650);
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="ثبت نظر معامله" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5" dir="rtl">
        <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50">
          <div className="flex items-start gap-3 p-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-200">
              <Sparkles size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-emerald-950">نظر شما بعد از تکمیل قرارداد ثبت می‌شود</p>
              <p className="mt-1 text-xs leading-6 text-emerald-800">
                برای <span className="font-bold">{revieweeName}</span> به عنوان {ROLE_LABELS[eligibility?.revieweeRole] || 'طرف معامله'} نظر ثبت می‌کنید.
              </p>
              {deal?.title && <p className="mt-2 line-clamp-1 text-xs text-gray-500">قرارداد: {deal.title}</p>}
            </div>
          </div>
        </div>

        {success ? (
          <div className="flex items-center gap-3 rounded-2xl border border-green-100 bg-green-50 p-4 text-green-800">
            <CheckCircle size={22} />
            <div>
              <p className="text-sm font-bold">نظر با موفقیت ثبت شد.</p>
              <p className="text-xs text-green-700">امتیاز کاربر به‌روزرسانی شد.</p>
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-red-700">
            <XCircle size={20} />
            <p className="text-sm">{error}</p>
          </div>
        ) : null}

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-bold text-gray-800">
            <ShieldCheck size={16} className="text-emerald-600" />
            امتیاز همکاری
          </label>
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <RatingStarsInput value={rating} onChange={setRating} />
            <p className="mt-2 text-xs text-gray-500">از ۱ تا ۵ ستاره انتخاب کنید.</p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-bold text-gray-800">
            <MessageSquareText size={16} className="text-emerald-600" />
            متن نظر
          </label>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={5}
            maxLength={1000}
            placeholder="تجربه همکاری، کیفیت پاسخگویی، تعهد به قرارداد و تحویل را بنویسید..."
            className="w-full resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm leading-7 text-gray-800 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
          />
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>حداقل ۳ کاراکتر</span>
            <span>{text.length}/1000</span>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>انصراف</Button>
          <Button type="submit" loading={loading} disabled={!canSubmit}>
            <CheckCircle size={16} /> ثبت نظر
          </Button>
        </div>
      </form>
    </Modal>
  );
}

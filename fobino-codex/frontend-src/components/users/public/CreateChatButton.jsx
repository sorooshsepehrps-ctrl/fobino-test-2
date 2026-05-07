import { useMemo, useState } from 'react';
import { ArrowLeft, Lock, MessageCircle, Send, ShieldCheck, UserRound, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import chatService from '../../../services/chatService';
import useAuthStore from '../../../store/authStore';

const normalizeApiData = (res) => res?.data || res;

export default function CreateChatButton({ userId, userName, businessName, className = '' }) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isOwnProfile = useMemo(() => {
    const currentId = user?._id || user?.id;
    return Boolean(currentId && userId && currentId.toString() === userId.toString());
  }, [user, userId]);

  const title = businessName || userName || 'این کاربر';

  const goToLogin = () => {
    const returnTo = window.location.pathname + window.location.search;
    navigate(`/login?redirect=${encodeURIComponent(returnTo)}`);
  };

  const startChat = async () => {
    if (!isAuthenticated || !user) {
      goToLogin();
      return;
    }

    if (isOwnProfile) {
      setError('این صفحه متعلق به شماست و امکان شروع گفتگو با خودتان وجود ندارد.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payloadMessage = message.trim();
      const res = await chatService.createOrGetDirectConversation(userId, payloadMessage);
      const data = normalizeApiData(res);
      const chatId = data?.conversationId || data?.chatId || data?.chat?._id || data?._id;
      const redirectUrl = data?.redirectUrl || (chatId ? `/dashboard/chats/${chatId}` : '/dashboard/messages');
      navigate(redirectUrl);
    } catch (err) {
      setError(err?.response?.data?.message || 'شروع گفتگو انجام نشد. لطفاً دوباره تلاش کنید.');
    } finally {
      setLoading(false);
    }
  };

  if (isOwnProfile) {
    return (
      <Button
        type="button"
        variant="secondary"
        disabled
        icon={UserRound}
        className={`shrink-0 bg-white/15 text-white ring-1 ring-white/25 ${className}`}
      >
        پروفایل شما
      </Button>
    );
  }

  return (
    <>
      <Button
        type="button"
        onClick={() => (!isAuthenticated || !user ? goToLogin() : setOpen(true))}
        icon={!isAuthenticated || !user ? Lock : MessageCircle}
        className={`shrink-0 bg-white px-5 font-bold text-emerald-700 shadow-lg shadow-emerald-950/10 hover:bg-emerald-50 ${className}`}
      >
        ایجاد چت
      </Button>

      <Modal isOpen={open} onClose={() => !loading && setOpen(false)} title={null} size="lg" showClose={false}>
        <div className="relative overflow-hidden rounded-3xl bg-white" dir="rtl">
          <button
            type="button"
            onClick={() => setOpen(false)}
            disabled={loading}
            className="absolute left-3 top-3 z-10 rounded-full bg-white/90 p-2 text-gray-500 shadow-sm transition hover:bg-gray-100 disabled:opacity-50"
            aria-label="بستن"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-slate-900 px-6 pb-9 pt-8 text-white">
            <div className="mb-4 inline-flex rounded-2xl bg-white/15 p-3 ring-1 ring-white/20">
              <MessageCircle className="h-7 w-7" />
            </div>
            <h3 className="text-2xl font-black">شروع گفتگوی مستقیم</h3>
            <p className="mt-2 max-w-md text-sm leading-7 text-emerald-50">
              پیام شما در یک چت امن و مستقیم با {title} ارسال می‌شود. اطلاعات خصوصی شما در صفحه عمومی نمایش داده نمی‌شود.
            </p>
          </div>

          <div className="-mt-5 space-y-5 px-6 pb-6">
            <div className="rounded-3xl border border-emerald-100 bg-white p-4 shadow-xl shadow-emerald-900/5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <div className="font-black text-gray-900">چت با {title}</div>
                  <div className="text-sm text-gray-500">در صورت وجود چت قبلی، همان گفتگو باز می‌شود.</div>
                </div>
              </div>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-gray-700">پیام اولیه اختیاری</span>
              <textarea
                value={message}
                onChange={(event) => {
                  setMessage(event.target.value.slice(0, 1000));
                  if (error) setError('');
                }}
                rows={5}
                placeholder="سلام، از طریق پروفایل عمومی فوبینو با شما آشنا شدم..."
                className="w-full resize-none rounded-3xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm leading-7 text-gray-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
              <span className="mt-2 block text-left text-xs text-gray-400">{message.length}/1000</span>
            </label>

            {error && (
              <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="rounded-2xl px-4 py-3 text-sm font-bold text-gray-600 transition hover:bg-gray-100 disabled:opacity-50"
              >
                انصراف
              </button>
              <Button
                type="button"
                onClick={startChat}
                loading={loading}
                icon={message.trim() ? Send : ArrowLeft}
                className="min-w-[180px] rounded-2xl py-3 font-black shadow-lg shadow-emerald-900/10"
              >
                {message.trim() ? 'ارسال و ورود به چت' : 'ورود به چت'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';
import userPublicService from '../../services/userPublicService';
import PublicUserHeader from '../../components/users/public/PublicUserHeader';
import PublicUserStats from '../../components/users/public/PublicUserStats';
import PublicUserSubscriptionCard from '../../components/users/public/PublicUserSubscriptionCard';
import PublicUserReviewSection from '../../components/users/public/PublicUserReviewSection';
import UserQrCard from '../../components/users/public/UserQrCard';
import BusinessCardModal from '../../components/users/public/BusinessCardModal';
import Button from '../../components/ui/Button';

const unwrap = (response) => response?.data?.data || response?.data || response;

function ProfileSkeleton() {
  return (
    <main className="min-h-screen bg-slate-50 py-6" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6 px-4 lg:px-6">
        <div className="relative overflow-hidden rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <div className="absolute inset-x-0 top-0 h-32 animate-pulse bg-gradient-to-l from-emerald-100 via-teal-50 to-white" />
          <div className="relative flex flex-col gap-5 md:flex-row md:items-end">
            <div className="h-28 w-28 animate-pulse rounded-3xl bg-slate-100" />
            <div className="flex-1 space-y-3">
              <div className="h-8 w-72 animate-pulse rounded-xl bg-slate-100" />
              <div className="h-4 w-96 max-w-full animate-pulse rounded-xl bg-slate-100" />
              <div className="flex gap-2">
                <div className="h-9 w-28 animate-pulse rounded-full bg-slate-100" />
                <div className="h-9 w-28 animate-pulse rounded-full bg-slate-100" />
              </div>
            </div>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 animate-pulse rounded-3xl bg-white shadow-sm ring-1 ring-slate-100" />)}
        </div>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <div className="h-56 animate-pulse rounded-3xl bg-white shadow-sm ring-1 ring-slate-100" />
            <div className="h-96 animate-pulse rounded-3xl bg-white shadow-sm ring-1 ring-slate-100" />
          </div>
          <div className="h-96 animate-pulse rounded-3xl bg-white shadow-sm ring-1 ring-slate-100" />
        </div>
      </div>
    </main>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12" dir="rtl">
      <div className="mx-auto max-w-xl overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-100">
        <div className="bg-gradient-to-l from-red-50 to-white p-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-red-100 text-red-600">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h1 className="mt-4 text-2xl font-black text-slate-900">پروفایل عمومی در دسترس نیست</h1>
          <p className="mt-3 leading-7 text-slate-600">{message}</p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button onClick={onRetry} icon={RefreshCw} className="rounded-2xl">تلاش دوباره</Button>
            <Link to="/"><Button variant="outline" icon={ArrowLeft} className="rounded-2xl">بازگشت به خانه</Button></Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function PublicUserProfile() {
  const { identifier } = useParams();
  const [profile, setProfile] = useState(null);
  const [businessCard, setBusinessCard] = useState(null);
  const [businessCardOpen, setBusinessCardOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const [profileRes, cardRes] = await Promise.all([
        userPublicService.getPublicProfile(identifier),
        userPublicService.getBusinessCard(identifier),
      ]);
      setProfile(unwrap(profileRes));
      setBusinessCard(unwrap(cardRes));
    } catch (err) {
      setError(err?.response?.data?.message || 'اطلاعات پروفایل عمومی دریافت نشد. لطفاً اتصال اینترنت یا آدرس پروفایل را بررسی کنید.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProfile(); }, [identifier]);

  const analysisPath = useMemo(() => `/users/${identifier}/analysis`, [identifier]);

  if (loading) return <ProfileSkeleton />;
  if (error) return <ErrorState message={error} onRetry={loadProfile} />;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,#ecfdf5_0,#f8fafc_34%,#f8fafc_100%)] py-6">
      <div className="mx-auto max-w-7xl space-y-6 px-4 lg:px-6">
        <PublicUserHeader profile={profile} onOpenBusinessCard={() => setBusinessCardOpen(true)} />
        <PublicUserStats profile={profile} />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="space-y-6">
            <div className="overflow-hidden rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-100" dir="rtl">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900">تحلیل اعتماد کاربر</h2>
                    <p className="mt-1 max-w-2xl leading-7 text-slate-600">
                      گرید و امتیاز این کاربر بر اساس تکمیل پروفایل، احراز هویت، اشتراک، پاسخگویی و سابقه معاملات موفق محاسبه می‌شود.
                    </p>
                  </div>
                </div>
                <Link to={analysisPath}>
                  <Button icon={Sparkles} className="w-full rounded-2xl px-5 font-black md:w-auto">مشاهده تحلیل کامل</Button>
                </Link>
              </div>
            </div>

            <PublicUserSubscriptionCard subscription={profile?.subscription} badges={profile?.user?.badges} />
            <PublicUserReviewSection
              profile={profile}
              onReviewsChange={(reviews) => setProfile((prev) => ({ ...prev, recentReviews: reviews }))}
            />
          </section>

          <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            <UserQrCard profile={profile} businessCard={businessCard} onOpenBusinessCard={() => setBusinessCardOpen(true)} />
          </aside>
        </div>
      </div>

      <BusinessCardModal isOpen={businessCardOpen} onClose={() => setBusinessCardOpen(false)} card={businessCard} />
    </main>
  );
}

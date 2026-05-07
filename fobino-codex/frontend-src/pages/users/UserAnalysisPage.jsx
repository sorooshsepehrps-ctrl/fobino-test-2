import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { RefreshCcw } from 'lucide-react';
import userAnalysisService from '../../services/userAnalysisService';
import UserAnalysisHero from '../../components/users/analysis/UserAnalysisHero';
import UserAnalysisBreakdown from '../../components/users/analysis/UserAnalysisBreakdown';
import UserAnalysisSuggestions from '../../components/users/analysis/UserAnalysisSuggestions';
import UserTrustTimeline from '../../components/users/analysis/UserTrustTimeline';
import Button from '../../components/ui/Button';

function AnalysisPageSkeleton() {
  return (
    <main className="min-h-screen bg-slate-50 py-6" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-5 px-4">
        <div className="h-10 w-64 animate-pulse rounded-2xl bg-white" />
        <div className="h-[420px] animate-pulse rounded-[36px] bg-white" />
        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-52 animate-pulse rounded-[28px] bg-white" />
            ))}
          </div>
          <div className="h-96 animate-pulse rounded-[32px] bg-white" />
        </div>
      </div>
    </main>
  );
}

function unwrapApiPayload(response) {
  if (response?.data?.data) return response.data.data;
  if (response?.data && !response.data.success) return response.data;
  if (response?.success && response?.data) return response.data;
  return response?.data || response;
}

export default function UserAnalysisPage() {
  const { identifier } = useParams();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  async function loadAnalysis({ silent = false } = {}) {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const response = await userAnalysisService.getUserAnalysis(identifier);
      setAnalysis(unwrapApiPayload(response));
    } catch (err) {
      setError(err?.response?.data?.message || 'تحلیل کاربر دریافت نشد. دوباره تلاش کنید.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    let mounted = true;
    async function run() {
      setLoading(true);
      setError('');
      try {
        const response = await userAnalysisService.getUserAnalysis(identifier);
        if (mounted) setAnalysis(unwrapApiPayload(response));
      } catch (err) {
        if (mounted) setError(err?.response?.data?.message || 'تحلیل کاربر دریافت نشد. دوباره تلاش کنید.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    run();
    return () => { mounted = false; };
  }, [identifier]);

  const userTitle = useMemo(() => {
    const user = analysis?.user || {};
    return user.businessName || user.fullName || 'کاربر فوبینو';
  }, [analysis]);

  if (loading) return <AnalysisPageSkeleton />;

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-12" dir="rtl">
        <div className="mx-auto max-w-xl rounded-[32px] bg-white p-7 text-center shadow-sm ring-1 ring-slate-100">
          <h1 className="text-2xl font-black text-slate-950">تحلیل در دسترس نیست</h1>
          <p className="mt-3 leading-8 text-slate-600">{error}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button onClick={() => loadAnalysis()} icon={RefreshCcw}>تلاش دوباره</Button>
            <Link to={`/users/${identifier}`}><Button variant="outline">بازگشت به پروفایل</Button></Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dcfce7,transparent_35%),#f8fafc] py-6" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6 px-4">
        <div className="flex flex-col gap-3 rounded-[28px] bg-white/85 p-4 shadow-sm ring-1 ring-white md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold text-emerald-600">صفحه تحلیل کاربر</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">{userTitle}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => loadAnalysis({ silent: true })} loading={refreshing} icon={RefreshCcw}>به‌روزرسانی تحلیل</Button>
            <Link to={`/users/${identifier}`}><Button variant="outline">بازگشت به پروفایل</Button></Link>
          </div>
        </div>

        <UserAnalysisHero analysis={analysis} identifier={identifier} />

        <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
          <UserAnalysisBreakdown breakdown={analysis?.breakdown || []} />
          <UserTrustTimeline analysis={analysis} />
        </div>

        <UserAnalysisSuggestions suggestions={analysis?.suggestions || []} />
      </div>
    </main>
  );
}

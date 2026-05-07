import { CalendarDays, MapPin, QrCode, ShieldCheck, Sparkles, Store, UserRound } from 'lucide-react';
import UserGradeBadge from '../analysis/UserGradeBadge';
import RatingStars from '../../reviews/RatingStars';
import CreateChatButton from './CreateChatButton';

const avatarUrl = (avatar) => typeof avatar === 'string' ? avatar : avatar?.url || avatar?.secure_url || '';
const firstLetter = (value) => (value || 'فوبینو').trim().slice(0, 1).toUpperCase();
const formatDate = (value) => value ? new Date(value).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long' }) : null;

function TrustPill({ icon: Icon, children, tone = 'white' }) {
  const classes = tone === 'green'
    ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
    : 'bg-white/15 text-white ring-white/20';
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${classes}`}><Icon className="h-4 w-4" />{children}</span>;
}

export default function PublicUserHeader({ profile, onOpenBusinessCard }) {
  const user = profile?.user || {};
  const analysis = profile?.analysisSummary || {};
  const summary = profile?.reviewSummary || {};
  const avatar = avatarUrl(user.avatar);
  const title = user.businessName || user.fullName || 'کاربر فوبینو';
  const joinedAt = formatDate(user.createdAt);

  return (
    <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-2xl shadow-emerald-950/10" dir="rtl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(16,185,129,.45),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(45,212,191,.25),transparent_30%)]" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950 to-transparent" />
      <div className="relative grid gap-8 p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-[1.75rem] bg-white/10 ring-4 ring-white/15">
            {avatar ? <img src={avatar} alt={title} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-4xl font-black">{firstLetter(title)}</div>}
            <div className="absolute bottom-2 left-2 rounded-full bg-emerald-400 p-1.5 text-slate-950 shadow-lg"><ShieldCheck className="h-4 w-4" /></div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-black leading-tight md:text-5xl">{title}</h1>
              <UserGradeBadge grade={analysis.grade} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-emerald-50">
              {user.fullName && user.fullName !== title && <TrustPill icon={UserRound}>{user.fullName}</TrustPill>}
              {user.businessName && <TrustPill icon={Store}>کسب‌وکار تأییدپذیر</TrustPill>}
              {user.isIdentityVerified && <TrustPill icon={ShieldCheck}>احراز هویت شده</TrustPill>}
              {(user.city || user.province) && <TrustPill icon={MapPin}>{[user.city, user.province].filter(Boolean).join('، ')}</TrustPill>}
              {joinedAt && <TrustPill icon={CalendarDays}>عضویت از {joinedAt}</TrustPill>}
            </div>
            {user.bio ? (
              <p className="mt-5 max-w-3xl text-sm leading-8 text-slate-100 md:text-base">{user.bio}</p>
            ) : (
              <p className="mt-5 max-w-3xl text-sm leading-8 text-slate-300">این کاربر هنوز توضیح عمومی برای پروفایل خود ثبت نکرده است.</p>
            )}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2 ring-1 ring-white/15">
                <RatingStars value={summary.averageRating || 0} size={18} />
                <span className="text-sm font-bold">{Number(summary.averageRating || 0).toFixed(1)} از {summary.reviewsCount || 0} نظر</span>
              </div>
              <TrustPill icon={Sparkles}>امتیاز اعتماد {analysis.totalScore || 0}/{analysis.maxScore || 65}</TrustPill>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-stretch lg:justify-center">
          <CreateChatButton userId={user.id || user._id} userName={user.fullName} businessName={user.businessName} />
          <button
            type="button"
            onClick={onOpenBusinessCard}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-5 py-3 text-sm font-black text-white ring-1 ring-white/20 transition hover:bg-white/15"
          >
            <QrCode className="h-5 w-5" /> کارت ویزیت
          </button>
        </div>
      </div>
    </section>
  );
}

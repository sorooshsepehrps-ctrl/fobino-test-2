import { CalendarDays, Eye, Layers3, MapPin, Package, Tag, Timer } from 'lucide-react';

function MetaCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_18px_50px_-38px_rgba(15,23,42,0.22)]">
      <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-xs font-bold text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-black leading-7 text-slate-900">{value || '—'}</p>
    </div>
  );
}

export default function PostMetaGrid({ post }) {
  const createdAt = post?.createdAt
    ? new Date(post.createdAt).toLocaleDateString('fa-IR')
    : '—';

  const categoryPath = [
    post?.categoryLevel1?.name,
    post?.categoryLevel2?.name,
    post?.categoryLevel3?.name,
  ]
    .filter(Boolean)
    .join(' / ');

  const location = [
    post?.location?.city || post?.city,
    post?.location?.province || post?.province,
  ]
    .filter(Boolean)
    .join(' - ');

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetaCard icon={Tag} label="قیمت" value={post?.displayPrice || 'توافقی'} />
      <MetaCard icon={Layers3} label="دسته‌بندی" value={categoryPath || 'ثبت نشده'} />
      <MetaCard icon={MapPin} label="موقعیت" value={location || 'ثبت نشده'} />
      <MetaCard
        icon={Eye}
        label="بازدید"
        value={Number(post?.views || 0).toLocaleString('fa-IR')}
      />
      <MetaCard icon={CalendarDays} label="تاریخ ثبت" value={createdAt} />
      <MetaCard
        icon={Timer}
        label="روزهای باقی‌مانده"
        value={
          post?.remainingDays !== undefined && post?.remainingDays !== null
            ? `${Number(post.remainingDays).toLocaleString('fa-IR')} روز`
            : 'نامشخص'
        }
      />
      <MetaCard
        icon={Package}
        label="وضعیت آگهی"
        value={
          post?.status === 'active'
            ? 'فعال'
            : post?.status === 'inactive'
            ? 'غیرفعال'
            : post?.status || '—'
        }
      />
      <MetaCard
        icon={Tag}
        label="نوع"
        value={post?.type === 'sell' ? 'آگهی فروش' : 'آگهی خرید'}
      />
    </div>
  );
}
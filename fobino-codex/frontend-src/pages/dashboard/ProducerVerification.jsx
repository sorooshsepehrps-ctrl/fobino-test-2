import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AlertTriangle, Building2, CheckCircle2, FileText, Loader2, MapPin, Send, Star, UploadCloud } from 'lucide-react';
import { Button, Card, Input } from '../../components/ui';
import producerVerificationService from '../../services/producerVerificationService';
import UserTrustBadges from '../../components/common/UserTrustBadges';

const STATUS_LABELS = {
  not_started: 'شروع نشده',
  draft: 'پیش‌نویس',
  pending: 'در انتظار بررسی',
  approved: 'تایید شده',
  rejected: 'رد شده',
  requires_resubmit: 'نیازمند اصلاح',
  revision_pending: 'اصلاحات در بررسی',
  locked: 'قفل شده',
  scheduled: 'زمان‌بندی شده',
  visited: 'بازدید انجام شد',
};

function statusClass(status) {
  if (status === 'approved') return 'bg-blue-50 text-blue-800 border-blue-100';
  if (['pending', 'revision_pending', 'scheduled', 'visited'].includes(status)) return 'bg-amber-50 text-amber-700 border-amber-100';
  if (['rejected', 'requires_resubmit'].includes(status)) return 'bg-red-50 text-red-700 border-red-100';
  if (status === 'locked') return 'bg-slate-100 text-slate-500 border-slate-200';
  return 'bg-slate-50 text-slate-700 border-slate-100';
}

function StatusBadge({ status }) {
  return <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusClass(status)}`}>{STATUS_LABELS[status] || status}</span>;
}

function LevelCard({ level, title, description, status, children, locked }) {
  return (
    <Card variant="wallet" padding="lg" className={`rounded-3xl ${locked ? 'opacity-70' : ''}`}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-blue-800">سطح {level}</p>
          <h2 className="mt-1 text-xl font-black text-slate-900">{title}</h2>
          <p className="mt-2 text-sm leading-7 text-slate-500">{description}</p>
        </div>
        <StatusBadge status={status} />
      </div>
      {children}
    </Card>
  );
}

function buildProducerBadges(verification) {
  const level = verification?.publicLevel || 0;
  return {
    producer: {
      active: true,
      verificationLevel: level,
      status: level > 0 ? 'approved' : verification?.overallStatus === 'pending_review' ? 'pending' : 'not_started',
    },
  };
}

export default function ProducerVerification() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verification, setVerification] = useState(null);
  const [level1Files, setLevel1Files] = useState([]);
  const [level2Files, setLevel2Files] = useState([]);
  const [production, setProduction] = useState({ name: '', province: '', city: '', street: '', postalCode: '', phone: '', description: '' });
  const [visit, setVisit] = useState({ coordinatorName: '', coordinatorPhone: '', preferredDates: '', workingHours: '', notes: '' });

  const producerBadges = useMemo(() => buildProducerBadges(verification), [verification]);
  const hasProducerSubscription = Boolean(verification?.activeSubscription);
  const levels = verification?.levels || {};

  const load = async () => {
    setLoading(true);
    try {
      const res = await producerVerificationService.getMine();
      const next = res?.data?.verification || res?.verification;
      setVerification(next);
      setProduction({
        name: next?.production?.name || '',
        province: next?.production?.address?.province || '',
        city: next?.production?.address?.city || '',
        street: next?.production?.address?.street || '',
        postalCode: next?.production?.address?.postalCode || '',
        phone: next?.production?.phone || '',
        description: next?.production?.description || '',
      });
      setVisit((prev) => ({
        ...prev,
        coordinatorPhone: next?.production?.phone || prev.coordinatorPhone,
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطا در دریافت وضعیت احراز تولیدکننده');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const withSaving = async (fn, message) => {
    setSaving(true);
    try {
      await fn();
      toast.success(message);
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'خطا در عملیات');
    } finally {
      setSaving(false);
    }
  };

  const saveLevel1Draft = () => withSaving(async () => {
    await producerVerificationService.saveLevel1Draft({
      production: {
        name: production.name,
        phone: production.phone,
        description: production.description,
        address: {
          province: production.province,
          city: production.city,
          street: production.street,
          postalCode: production.postalCode,
        },
      },
    });
  }, 'پیش‌نویس سطح ۱ ذخیره شد');

  const uploadLevel1 = () => withSaving(async () => {
    if (!level1Files.length) throw new Error('ابتدا عکس‌های تولیدی را انتخاب کنید');
    await producerVerificationService.uploadLevel1Photos(level1Files);
    setLevel1Files([]);
  }, 'عکس‌های تولیدی بارگذاری شد');

  const submitLevel1 = () => withSaving(() => producerVerificationService.submitLevel1(), 'سطح ۱ برای بررسی ارسال شد');
  const uploadLevel2 = () => withSaving(async () => {
    if (!level2Files.length) throw new Error('ابتدا مدارک تولیدی را انتخاب کنید');
    await producerVerificationService.uploadLevel2Documents(level2Files);
    setLevel2Files([]);
  }, 'مدارک تولیدی بارگذاری شد');
  const submitLevel2 = () => withSaving(() => producerVerificationService.submitLevel2(), 'سطح ۲ برای بررسی ارسال شد');
  const requestVisit = () => withSaving(() => producerVerificationService.requestLevel3Visit({
    productionName: production.name,
    address: { province: production.province, city: production.city, street: production.street, postalCode: production.postalCode },
    coordinatorName: visit.coordinatorName,
    coordinatorPhone: visit.coordinatorPhone,
    preferredDates: visit.preferredDates.split(',').map((item) => item.trim()).filter(Boolean),
    workingHours: visit.workingHours,
    notes: visit.notes,
  }), 'درخواست بازدید حضوری ثبت شد');

  if (loading) {
    return <Card variant="wallet" className="flex items-center justify-center gap-3 py-12 text-blue-900"><Loader2 className="h-5 w-5 animate-spin" />در حال دریافت وضعیت احراز...</Card>;
  }

  return (
    <div className="space-y-6">
      <Card variant="walletHero" padding="lg" className="overflow-hidden rounded-3xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10"><Building2 className="h-6 w-6" /></div>
              <div>
                <p className="text-sm text-blue-100">احراز تولیدکننده فوبینو</p>
                <h1 className="text-2xl font-black">تکمیل احراز سه‌سطحی تولیدی</h1>
              </div>
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-8 text-blue-100">
              عکس‌های تولیدی، مدارک رسمی و درخواست بازدید حضوری را مرحله‌به‌مرحله ثبت کنید تا نشان تولیدکننده ستاره‌دار در آگهی‌ها و پروفایل عمومی نمایش داده شود.
            </p>
          </div>
          <div className="rounded-3xl bg-white/10 p-4 ring-1 ring-white/15">
            <p className="text-sm text-blue-100">پیش‌نمایش نشان عمومی</p>
            <UserTrustBadges badges={producerBadges} className="mt-3" />
            <p className="mt-3 text-sm font-black">سطح فعلی: {(verification?.publicLevel || 0).toLocaleString('fa-IR')} / ۳</p>
          </div>
        </div>
      </Card>

      {!hasProducerSubscription ? (
        <div className="rounded-3xl border border-red-100 bg-red-50 p-4 text-sm leading-7 text-red-700">
          <AlertTriangle className="ml-2 inline h-5 w-5" />
          می‌توانید پیش‌نویس را آماده کنید، اما ارسال برای بررسی نیازمند اشتراک تولیدکننده فعال است.
          <Link to="/dashboard/subscription?modal=purchase&plan=producer&method=wallet" className="mr-2 font-black text-red-800 underline">خرید اشتراک تولیدکننده</Link>
        </div>
      ) : null}

      <LevelCard level="۱" title="عکس‌ها و اطلاعات تولیدی" status={levels.level1?.status} description="نام تولیدی، آدرس، شماره تماس و حداقل سه عکس واقعی از فضای تولید را ثبت کنید.">
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="نام تولیدی" value={production.name} onChange={(e) => setProduction({ ...production, name: e.target.value })} />
          <Input label="شماره تماس هماهنگی" value={production.phone} onChange={(e) => setProduction({ ...production, phone: e.target.value })} />
          <Input label="استان" value={production.province} onChange={(e) => setProduction({ ...production, province: e.target.value })} />
          <Input label="شهر" value={production.city} onChange={(e) => setProduction({ ...production, city: e.target.value })} />
          <Input label="آدرس کامل" className="md:col-span-2" value={production.street} onChange={(e) => setProduction({ ...production, street: e.target.value })} />
          <Input label="کد پستی" value={production.postalCode} onChange={(e) => setProduction({ ...production, postalCode: e.target.value })} />
        </div>
        <textarea className="mt-4 w-full rounded-2xl border border-slate-200 p-3 text-sm focus:border-blue-500 focus:outline-none" rows="3" placeholder="توضیح کوتاه درباره تولیدی" value={production.description} onChange={(e) => setProduction({ ...production, description: e.target.value })} />
        <div className="mt-4 rounded-2xl border border-dashed border-blue-200 p-4">
          <input type="file" multiple accept="image/*" onChange={(e) => setLevel1Files(Array.from(e.target.files || []))} />
          <p className="mt-2 text-xs text-slate-500">عکس‌های ثبت‌شده: {(levels.level1?.photos?.length || 0).toLocaleString('fa-IR')} · انتخاب جدید: {level1Files.length.toLocaleString('fa-IR')}</p>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button variant="brand" icon={CheckCircle2} loading={saving} onClick={saveLevel1Draft}>ذخیره پیش‌نویس</Button>
          <Button variant="brandOutline" icon={UploadCloud} loading={saving} onClick={uploadLevel1}>آپلود عکس‌ها</Button>
          <Button variant="danger" icon={Send} loading={saving} onClick={submitLevel1}>ارسال سطح ۱ برای بررسی</Button>
        </div>
      </LevelCard>

      <LevelCard level="۲" title="مدارک تولیدی" status={levels.level2?.status} locked={levels.level1?.status !== 'approved'} description="مجوزها، پروانه بهره‌برداری، جواز کسب یا مدارک رسمی تولیدی را بارگذاری کنید.">
        <div className="rounded-2xl border border-dashed border-blue-200 p-4">
          <FileText className="mb-2 h-6 w-6 text-blue-800" />
          <input type="file" multiple accept="image/*,.pdf,.doc,.docx" disabled={levels.level1?.status !== 'approved'} onChange={(e) => setLevel2Files(Array.from(e.target.files || []))} />
          <p className="mt-2 text-xs text-slate-500">مدارک ثبت‌شده: {(levels.level2?.documents?.length || 0).toLocaleString('fa-IR')} · انتخاب جدید: {level2Files.length.toLocaleString('fa-IR')}</p>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button variant="brandOutline" icon={UploadCloud} loading={saving} disabled={levels.level1?.status !== 'approved'} onClick={uploadLevel2}>آپلود مدارک</Button>
          <Button variant="danger" icon={Send} loading={saving} disabled={levels.level1?.status !== 'approved'} onClick={submitLevel2}>ارسال سطح ۲ برای بررسی</Button>
        </div>
      </LevelCard>

      <LevelCard level="۳" title="درخواست بازدید حضوری" status={levels.level3?.status} locked={levels.level1?.status !== 'approved' || levels.level2?.status !== 'approved'} description="پس از تایید سطح ۱ و ۲، اطلاعات هماهنگی بازدید حضوری کارشناسان فوبینو را ثبت کنید.">
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="نام مسئول هماهنگی" value={visit.coordinatorName} onChange={(e) => setVisit({ ...visit, coordinatorName: e.target.value })} />
          <Input label="شماره تماس مسئول" value={visit.coordinatorPhone} onChange={(e) => setVisit({ ...visit, coordinatorPhone: e.target.value })} />
          <Input label="تاریخ‌های پیشنهادی (با کاما جدا کنید)" value={visit.preferredDates} onChange={(e) => setVisit({ ...visit, preferredDates: e.target.value })} />
          <Input label="ساعت کاری" value={visit.workingHours} onChange={(e) => setVisit({ ...visit, workingHours: e.target.value })} />
        </div>
        <textarea className="mt-4 w-full rounded-2xl border border-slate-200 p-3 text-sm focus:border-blue-500 focus:outline-none" rows="3" placeholder="توضیحات لازم برای ورود، هماهنگی یا دسترسی" value={visit.notes} onChange={(e) => setVisit({ ...visit, notes: e.target.value })} />
        <div className="mt-5">
          <Button variant="danger" icon={MapPin} loading={saving} disabled={levels.level1?.status !== 'approved' || levels.level2?.status !== 'approved'} onClick={requestVisit}>ثبت درخواست بازدید حضوری</Button>
        </div>
      </LevelCard>
    </div>
  );
}

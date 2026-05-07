import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  Banknote,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  IdCard,
  ImagePlus,
  Loader2,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Upload,
  UserRoundCheck,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Card, Input } from '../../components/ui';
import useAuthStore from '../../store/authStore';
import { toPersianNumber, isValidShaba } from '../../utils/helpers';
import { userService } from '../../services';

const levelConfigs = {
  1: {
    title: 'تکمیل پروفایل پایه',
    subtitle: 'اطلاعات اولیه حساب کاربری',
    icon: UserRoundCheck,
    color: 'emerald',
    documents: [],
    fields: [
      { name: 'firstName', label: 'نام', type: 'readonly', source: 'profile' },
      { name: 'lastName', label: 'نام خانوادگی', type: 'readonly', source: 'profile' },
      { name: 'province', label: 'استان', type: 'readonly', source: 'location' },
      { name: 'city', label: 'شهر', type: 'readonly', source: 'location' },
    ],
  },
  2: {
    title: 'احراز هویت کاربری',
    subtitle: 'برای ثبت آگهی و افزایش اعتماد عمومی',
    icon: IdCard,
    color: 'blue',
    documents: [
      { key: 'nationalCard', label: 'تصویر کارت ملی', hint: 'تصویر واضح کارت ملی؛ JPG/PNG/PDF تا ۵ مگابایت' },
      { key: 'selfieWithCard', label: 'سلفی همراه کارت ملی', hint: 'چهره و کارت ملی باید خوانا باشند' },
    ],
    fields: [
      { name: 'nationalCode', label: 'کد ملی', placeholder: 'مثلاً 0012345678', dir: 'ltr' },
      { name: 'birthDate', label: 'تاریخ تولد', placeholder: 'مثلاً 1370/01/01', dir: 'ltr' },
      { name: 'fatherName', label: 'نام پدر', placeholder: 'نام پدر' },
    ],
  },
  3: {
    title: 'احراز تولیدکنندگی / کسب‌وکار',
    subtitle: 'برای نمایش اعتبار تولیدکننده در صفحه عمومی',
    icon: Building2,
    color: 'violet',
    documents: [
      { key: 'businessLicense', label: 'مجوز کسب‌وکار', hint: 'جواز، روزنامه رسمی، پروانه فعالیت یا مدرک معادل' },
      { key: 'catalog', label: 'کاتالوگ یا معرفی محصول', hint: 'اختیاری اما برای بررسی سریع‌تر پیشنهاد می‌شود', optional: true },
    ],
    fields: [
      { name: 'businessName', label: 'نام کسب‌وکار', placeholder: 'نام برند یا مجموعه' },
      { name: 'businessType', label: 'نوع فعالیت', placeholder: 'تولیدکننده، عمده‌فروش، واردکننده و ...' },
      { name: 'businessAddress', label: 'آدرس کسب‌وکار', placeholder: 'آدرس کامل محل فعالیت' },
      { name: 'employeeCount', label: 'تعداد کارکنان', placeholder: 'مثلاً ۱۲', type: 'number' },
      { name: 'yearEstablished', label: 'سال شروع فعالیت', placeholder: 'مثلاً ۱۳۹۸', type: 'number' },
    ],
  },
  4: {
    title: 'تأیید اطلاعات بانکی',
    subtitle: 'برای تسویه امن و جلوگیری از خطای پرداخت',
    icon: Banknote,
    color: 'amber',
    documents: [
      { key: 'bankCardImage', label: 'تصویر کارت بانکی', hint: 'شماره کارت باید با اطلاعات حساب هم‌خوانی داشته باشد' },
    ],
    fields: [
      { name: 'shaba', label: 'شماره شبا', placeholder: 'IR...', dir: 'ltr' },
      { name: 'bankName', label: 'نام بانک', placeholder: 'مثلاً ملت' },
      { name: 'cardNumber', label: 'شماره کارت', placeholder: '0000 0000 0000 0000', dir: 'ltr' },
      { name: 'accountHolder', label: 'نام صاحب حساب', placeholder: 'نام و نام خانوادگی صاحب حساب' },
    ],
  },
};

const statusMap = {
  none: { label: 'شروع نشده', className: 'bg-gray-100 text-gray-600', icon: Clock },
  requires_resubmit: { label: 'در حال تکمیل', className: 'bg-blue-50 text-blue-700', icon: FileText },
  pending: { label: 'در انتظار بررسی', className: 'bg-amber-50 text-amber-700', icon: Clock },
  in_review: { label: 'در حال بررسی', className: 'bg-purple-50 text-purple-700', icon: Loader2 },
  approved: { label: 'تأیید شده', className: 'bg-emerald-50 text-emerald-700', icon: CheckCircle2 },
  rejected: { label: 'رد شده', className: 'bg-red-50 text-red-700', icon: XCircle },
};

const docPreviewValue = (documents, key) => {
  const value = documents?.[key];
  if (Array.isArray(value)) return value.length ? `${toPersianNumber(value.length)} فایل آپلود شده` : '';
  return value?.url ? 'آپلود شده' : '';
};

function StatusBadge({ status }) {
  const item = statusMap[status] || statusMap.none;
  const Icon = item.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${item.className}`}>
      <Icon className={`h-3.5 w-3.5 ${status === 'in_review' ? 'animate-spin' : ''}`} />
      {item.label}
    </span>
  );
}

function VerificationSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-pulse">
      <div className="h-44 rounded-3xl bg-gray-100" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((item) => <div key={item} className="h-32 rounded-2xl bg-gray-100" />)}
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
        <div className="h-96 rounded-3xl bg-gray-100" />
        <div className="h-96 rounded-3xl bg-gray-100" />
      </div>
    </div>
  );
}

function LevelCard({ level, currentLevel, activeLevel, status, onSelect }) {
  const config = levelConfigs[level];
  const Icon = config.icon;
  const isApproved = currentLevel >= level;
  const isActive = activeLevel === level;

  return (
    <button
      type="button"
      onClick={() => onSelect(level)}
      className={`group rounded-2xl border bg-white p-4 text-right shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
        isActive ? 'border-emerald-400 ring-4 ring-emerald-50' : 'border-gray-100'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${isApproved ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
          {isApproved ? <Check className="h-6 w-6" /> : <Icon className="h-6 w-6" />}
        </div>
        <StatusBadge status={isApproved ? 'approved' : status} />
      </div>
      <div className="mt-4">
        <p className="text-xs font-semibold text-gray-400">سطح {toPersianNumber(level)}</p>
        <h3 className="mt-1 font-bold text-gray-900">{config.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-gray-500">{config.subtitle}</p>
      </div>
    </button>
  );
}

function DocumentUploadCard({ document, currentRequest, selectedFile, uploadingKey, onFileChange, onUpload, disabled }) {
  const uploadedLabel = docPreviewValue(currentRequest?.documents, document.key);
  const hasUploaded = Boolean(uploadedLabel);
  const isUploading = uploadingKey === document.key;

  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${hasUploaded ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-gray-500'}`}>
            {hasUploaded ? <CheckCircle2 className="h-5 w-5" /> : <ImagePlus className="h-5 w-5" />}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-bold text-gray-900">{document.label}</h4>
              {document.optional && <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[11px] text-gray-600">اختیاری</span>}
            </div>
            <p className="mt-1 text-sm text-gray-500">{document.hint}</p>
            {hasUploaded && <p className="mt-2 text-sm font-semibold text-emerald-700">{uploadedLabel}</p>}
            {selectedFile && <p className="mt-2 text-xs text-blue-700">فایل انتخاب‌شده: {selectedFile.name}</p>}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <label className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 ${disabled ? 'pointer-events-none opacity-50' : ''}`}>
            <Upload className="h-4 w-4" />
            انتخاب فایل
            <input
              type="file"
              accept="image/*,.pdf,.doc,.docx"
              onChange={(event) => onFileChange(document.key, event)}
              className="hidden"
              disabled={disabled}
            />
          </label>
          <Button
            size="sm"
            onClick={() => onUpload(document.key)}
            loading={isUploading}
            disabled={disabled || !selectedFile || isUploading}
          >
            آپلود
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Verification() {
  const { user, fetchUser } = useAuthStore();
  const [overview, setOverview] = useState(null);
  const [activeLevel, setActiveLevel] = useState(2);
  const [form, setForm] = useState({});
  const [files, setFiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingKey, setUploadingKey] = useState(null);
  const [error, setError] = useState(null);

  const effectiveUser = overview?.user || user || {};
  const currentRequest = overview?.currentRequest?.targetLevel === activeLevel ? overview.currentRequest : null;
  const activeConfig = levelConfigs[activeLevel];
  const currentLevel = Number(effectiveUser?.level || 0);
  const ActiveLevelIcon = activeConfig.icon;
  const isApproved = currentLevel >= activeLevel;
  const isLocked = activeLevel > currentLevel + 1;
  const isReviewing = ['pending', 'in_review'].includes(currentRequest?.status);

  const completion = useMemo(() => {
    if (!activeConfig) return { done: 0, total: 0, percent: 0 };
    const requiredDocs = activeConfig.documents.filter((doc) => !doc.optional);
    const doneDocs = requiredDocs.filter((doc) => docPreviewValue(currentRequest?.documents, doc.key)).length;
    const doneFields = activeConfig.fields.filter((field) => {
      if (field.type === 'readonly') {
        if (field.source === 'location') return Boolean(effectiveUser?.location?.[field.name]);
        return Boolean(effectiveUser?.[field.name]);
      }
      return Boolean(form[field.name] || currentRequest?.additionalInfo?.[field.name]);
    }).length;
    const total = requiredDocs.length + activeConfig.fields.length;
    const done = doneDocs + doneFields;
    return { done, total, percent: total ? Math.round((done / total) * 100) : 100 };
  }, [activeConfig, currentRequest, effectiveUser, form]);

  const loadStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await userService.getVerificationStatus();
      const data = response.data || response;
      setOverview(data);
      const next = data?.nextLevel || 2;
      setActiveLevel(Math.max(2, Math.min(next, 4)));
      setForm(data?.currentRequest?.additionalInfo || {});
    } catch (err) {
      setError(err.response?.data?.message || 'خطا در دریافت وضعیت احراز هویت');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  useEffect(() => {
    const request = overview?.requests?.find((item) => item.targetLevel === activeLevel && ['pending', 'in_review', 'requires_resubmit', 'rejected'].includes(item.status));
    setForm(request?.additionalInfo || {});
    setFiles({});
  }, [activeLevel, overview]);

  const ensureRequest = async () => {
    const request = overview?.requests?.find((item) => item.targetLevel === activeLevel && ['pending', 'in_review', 'requires_resubmit', 'rejected'].includes(item.status));
    if (request) return request;
    const response = await userService.createVerificationRequest(activeLevel);
    const data = response.data || response;
    setOverview(data);
    return data.currentRequest;
  };

  const handleFileChange = (key, event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم فایل نباید بیشتر از ۵ مگابایت باشد');
      return;
    }
    setFiles((prev) => ({ ...prev, [key]: file }));
  };

  const handleUpload = async (documentKey) => {
    const file = files[documentKey];
    if (!file) {
      toast.error('لطفاً فایل را انتخاب کنید');
      return;
    }

    setUploadingKey(documentKey);
    try {
      await ensureRequest();
      await userService.submitVerificationDocument(activeLevel, documentKey, file);
      toast.success('فایل با موفقیت آپلود شد');
      setFiles((prev) => ({ ...prev, [documentKey]: null }));
      await loadStatus();
      await fetchUser?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'خطا در آپلود فایل');
    } finally {
      setUploadingKey(null);
    }
  };

  const handleSaveInfo = async () => {
    if (activeLevel === 4 && form.shaba) {
      const formattedShaba = form.shaba.toUpperCase().startsWith('IR') ? form.shaba.toUpperCase() : `IR${form.shaba}`;
      if (!isValidShaba(formattedShaba)) {
        toast.error('شماره شبا نامعتبر است');
        return;
      }
      form.shaba = formattedShaba;
    }

    setSaving(true);
    try {
      await ensureRequest();
      await userService.submitVerificationInfo(activeLevel, form);
      toast.success('اطلاعات با موفقیت ذخیره شد');
      await loadStatus();
      await fetchUser?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'خطا در ذخیره اطلاعات');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForReview = async () => {
    setSubmitting(true);
    try {
      await userService.submitVerificationRequest(activeLevel);
      toast.success('درخواست برای بررسی ارسال شد');
      await loadStatus();
      await fetchUser?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'مدارک یا اطلاعات هنوز کامل نیست');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <VerificationSkeleton />;

  if (error) {
    return (
      <div className="mx-auto max-w-3xl">
        <Card className="border-red-100 bg-red-50 p-8 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-red-600" />
          <h2 className="mt-4 text-xl font-bold text-red-900">وضعیت احراز هویت دریافت نشد</h2>
          <p className="mt-2 text-sm text-red-700">{error}</p>
          <Button className="mt-6" onClick={loadStatus} icon={RefreshCcw}>تلاش مجدد</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10" dir="rtl">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-500 p-6 text-white shadow-xl md:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold backdrop-blur">
              <ShieldCheck className="h-4 w-4" />
              مرکز احراز هویت فوبینو
            </div>
            <h1 className="mt-5 text-2xl font-black md:text-4xl">احراز هویت واقعی، اعتماد بیشتر در معامله</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-emerald-50 md:text-base">
              این صفحه دیگر mock نیست؛ وضعیت فعلی، درخواست‌های قبلی، مدارک آپلود‌شده و اطلاعات ارسالی مستقیماً از API دریافت و مدیریت می‌شود.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              <span className="rounded-2xl bg-white/15 px-4 py-2">سطح فعلی: {toPersianNumber(currentLevel)}</span>
              <span className="rounded-2xl bg-white/15 px-4 py-2">تکمیل پروفایل: {toPersianNumber(effectiveUser?.profileCompletionPercent || 0)}٪</span>
              <span className="rounded-2xl bg-white/15 px-4 py-2">وضعیت هویت: {effectiveUser?.identityVerificationStatus === 'verified' ? 'تأیید شده' : 'در انتظار تکمیل'}</span>
            </div>
          </div>

          <div className="rounded-3xl border border-white/20 bg-white/15 p-5 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-50">مرحله فعال</p>
                <h2 className="mt-1 text-xl font-black">{activeConfig.title}</h2>
              </div>
              <BadgeCheck className="h-12 w-12 text-white" />
            </div>
            <div className="mt-6">
              <div className="flex items-center justify-between text-sm font-semibold">
                <span>پیشرفت تکمیل</span>
                <span>{toPersianNumber(completion.percent)}٪</span>
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/20">
                <div className="h-full rounded-full bg-white transition-all" style={{ width: `${completion.percent}%` }} />
              </div>
              <p className="mt-3 text-sm text-emerald-50">
                {toPersianNumber(completion.done)} از {toPersianNumber(completion.total)} مورد ضروری تکمیل شده است.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((level) => {
          const request = overview?.requests?.find((item) => item.targetLevel === level);
          return (
            <LevelCard
              key={level}
              level={level}
              currentLevel={currentLevel}
              activeLevel={activeLevel}
              status={request?.status || 'none'}
              onSelect={setActiveLevel}
            />
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
        <Card className="p-0 overflow-hidden">
          <div className="border-b border-gray-100 bg-white p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <ActiveLevelIcon className="h-6 w-6 text-emerald-600" />
                  <h2 className="text-xl font-black text-gray-900">{activeConfig.title}</h2>
                </div>
                <p className="mt-2 text-sm leading-6 text-gray-500">{activeConfig.subtitle}</p>
              </div>
              <StatusBadge status={isApproved ? 'approved' : currentRequest?.status || 'none'} />
            </div>
          </div>

          {isLocked ? (
            <div className="p-8 text-center">
              <LockNotice currentLevel={currentLevel} activeLevel={activeLevel} />
            </div>
          ) : isApproved ? (
            <div className="p-8 text-center">
              <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" />
              <h3 className="mt-4 text-xl font-black text-gray-900">این سطح تأیید شده است</h3>
              <p className="mt-2 text-gray-500">برای ارتقای اعتماد، می‌توانید مرحله بعدی را از کارت‌های بالا انتخاب کنید.</p>
            </div>
          ) : (
            <div className="space-y-6 p-5">
              {currentRequest?.status === 'rejected' && (
                <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
                  <div className="flex items-start gap-3">
                    <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                    <div>
                      <h3 className="font-bold text-red-900">درخواست قبلی رد شده است</h3>
                      <p className="mt-1 text-sm text-red-700">{currentRequest.rejectionReason || 'لطفاً مدارک و اطلاعات را اصلاح و دوباره ارسال کنید.'}</p>
                      {currentRequest.rejectionDetails && <p className="mt-1 text-xs text-red-600">{currentRequest.rejectionDetails}</p>}
                    </div>
                  </div>
                </div>
              )}

              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-black text-gray-900">اطلاعات موردنیاز</h3>
                  <span className="text-xs font-semibold text-gray-400">ذخیره قبل از ارسال نهایی</span>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {activeConfig.fields.map((field) => {
                    const readOnlyValue = field.source === 'location' ? effectiveUser?.location?.[field.name] : effectiveUser?.[field.name];
                    return (
                      <Input
                        key={field.name}
                        label={field.label}
                        type={field.type === 'number' ? 'number' : 'text'}
                        dir={field.dir || 'rtl'}
                        className={field.dir === 'ltr' ? 'text-left' : ''}
                        value={field.type === 'readonly' ? (readOnlyValue || '') : (form[field.name] || '')}
                        placeholder={field.placeholder}
                        readOnly={field.type === 'readonly' || isReviewing}
                        disabled={field.type === 'readonly' || isReviewing}
                        onChange={(event) => setForm((prev) => ({ ...prev, [field.name]: event.target.value }))}
                      />
                    );
                  })}
                </div>
                {activeConfig.fields.some((field) => field.type !== 'readonly') && (
                  <div className="mt-4 flex justify-end">
                    <Button onClick={handleSaveInfo} loading={saving} disabled={isReviewing}>ذخیره اطلاعات</Button>
                  </div>
                )}
              </section>

              {activeConfig.documents.length > 0 && (
                <section>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-black text-gray-900">مدارک</h3>
                    <span className="text-xs font-semibold text-gray-400">فرمت مجاز: تصویر، PDF، DOC</span>
                  </div>
                  <div className="space-y-3">
                    {activeConfig.documents.map((document) => (
                      <DocumentUploadCard
                        key={document.key}
                        document={document}
                        currentRequest={currentRequest}
                        selectedFile={files[document.key]}
                        uploadingKey={uploadingKey}
                        onFileChange={handleFileChange}
                        onUpload={handleUpload}
                        disabled={isReviewing}
                      />
                    ))}
                  </div>
                </section>
              )}

              <div className="flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="font-black text-emerald-900">ارسال برای بررسی کارشناسان</h3>
                  <p className="mt-1 text-sm text-emerald-700">بعد از تکمیل اطلاعات و مدارک ضروری، درخواست را نهایی کنید.</p>
                </div>
                <Button
                  onClick={handleSubmitForReview}
                  loading={submitting}
                  disabled={isReviewing || completion.percent < 100}
                  icon={ArrowLeft}
                >
                  ارسال نهایی
                </Button>
              </div>
            </div>
          )}
        </Card>

        <aside className="space-y-5">
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-black text-gray-900">اثر روی تحلیل کاربر</h3>
                <p className="text-sm text-gray-500">احراز هویت مستقیم در Grade عمومی اثر دارد.</p>
              </div>
            </div>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-2xl bg-gray-50 p-3">
                <span className="text-gray-600">احراز هویت کاربری</span>
                <span className="font-bold text-emerald-700">۵ امتیاز</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-gray-50 p-3">
                <span className="text-gray-600">تولیدکننده تأییدشده</span>
                <span className="font-bold text-emerald-700">۲۰ امتیاز</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-gray-50 p-3">
                <span className="text-gray-600">تکمیل پروفایل</span>
                <span className="font-bold text-emerald-700">۵ امتیاز</span>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-black text-gray-900">تاریخچه درخواست‌ها</h3>
            <div className="mt-4 space-y-3">
              {overview?.requests?.length ? overview.requests.slice(0, 5).map((request) => (
                <div key={request.id} className="rounded-2xl border border-gray-100 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-gray-900">سطح {toPersianNumber(request.targetLevel)}</p>
                      <p className="mt-1 text-xs text-gray-400">{new Date(request.createdAt).toLocaleDateString('fa-IR')}</p>
                    </div>
                    <StatusBadge status={request.status} />
                  </div>
                </div>
              )) : (
                <div className="rounded-2xl bg-gray-50 p-5 text-center text-sm text-gray-500">هنوز درخواستی ثبت نشده است.</div>
              )}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function LockNotice({ currentLevel, activeLevel }) {
  return (
    <div>
      <AlertCircle className="mx-auto h-14 w-14 text-amber-500" />
      <h3 className="mt-4 text-xl font-black text-gray-900">این مرحله هنوز فعال نیست</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
        شما در سطح {toPersianNumber(currentLevel)} هستید. برای ورود به سطح {toPersianNumber(activeLevel)} باید مرحله قبلی را تکمیل و تأیید کنید.
      </p>
    </div>
  );
}

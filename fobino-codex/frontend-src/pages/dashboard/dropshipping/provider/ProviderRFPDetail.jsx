

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import { dropshippingService } from '../../../../services';
import RFPDetailHeader from '../../../../components/dropshipping/RFPDetailHeader';
import TrackingCodeForm from '../../../../components/dropshipping/TrackingCodeForm';
import AnonymousCounterpartyBadge from '../../../../components/dropshipping/AnonymousCounterpartyBadge';
import ShipmentDeadlineBadge from '../../../../components/dropshipping/ShipmentDeadlineBadge';
import ErrorState from '../../../../components/dropshipping/ErrorState';
import LoadingState from '../../../../components/dropshipping/LoadingState';
import TimelineList from '../../../../components/dropshipping/TimelineList';
import StatusBadge from '../../../../components/dropshipping/StatusBadge';

export default function ProviderRFPDetail() {
  const { id } = useParams();
  const [rfp, setRfp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRfp = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const payload = await dropshippingService.getRFPById(id);
      setRfp(payload?.data || null);
    } catch (err) {
      setError(err.message || 'دریافت جزئیات RFP با خطا روبه‌رو شد');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRfp();
  }, [fetchRfp]);

  const canApprove = useMemo(
    () => ['pending_provider_approval', 'provider_editing'].includes(rfp?.status),
    [rfp?.status]
  );
  const canReject = useMemo(
    () => !['completed', 'refunded_due_to_no_tracking', 'provider_suspended_due_to_no_tracking'].includes(rfp?.status),
    [rfp?.status]
  );
  const canSubmitTracking = useMemo(
    () => ['payment_completed', 'shipment_deadline_passed', 'late_ticket_created'].includes(rfp?.status),
    [rfp?.status]
  );
  const canConfirmDelivery = useMemo(
    () => ['shipped', 'delivered_pending_confirmation'].includes(rfp?.status),
    [rfp?.status]
  );

  const withAction = async (fn, successMessage) => {
    try {
      setSubmitting(true);
      await fn();
      toast.success(successMessage);
      fetchRfp();
    } catch (err) {
      toast.error(err.message || 'عملیات انجام نشد');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <LoadingState
        title="در حال دریافت جزئیات RFP"
        description="اطلاعات قرارداد، وضعیت‌ها و تایم‌لاین در حال بارگذاری است."
      />
    );
  }

  if (error) {
    return (
      <ErrorState
        title="دریافت جزئیات RFP با خطا روبه‌رو شد"
        description={error}
        onRetry={fetchRfp}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-10 pt-6 md:px-6 xl:px-8">
      <div className="space-y-6 md:space-y-8">
        <RFPDetailHeader rfp={rfp} mode="provider" />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-black text-slate-900">خلاصه قرارداد</h2>
              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">کد RFP</p>
                  <p className="mt-2 text-sm font-black text-slate-900">{rfp?.rfpCode || '—'}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">وضعیت فعلی</p>
                  <div className="mt-2"><StatusBadge status={rfp?.status} /></div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">تعداد</p>
                  <p className="mt-2 text-sm font-black text-slate-900">{rfp?.quantity || 0}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">مبلغ کل</p>
                  <p className="mt-2 text-sm font-black text-slate-900">
                    {Number(rfp?.totalAmount || 0).toLocaleString('fa-IR')} تومان
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-black text-slate-900">ارسال و تحویل</h2>
              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">تاریخ ارسال توافقی</p>
                  <div className="mt-3">
                    <ShipmentDeadlineBadge
                      date={rfp?.agreedShipmentDate}
                      jalali={rfp?.agreedShipmentDateJalali}
                      status={rfp?.status}
                    />
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">کد رهگیری</p>
                  <p className="mt-2 text-sm font-black text-slate-900">{rfp?.delivery?.trackingCode || 'هنوز ثبت نشده'}</p>
                </div>
              </div>
            </div>

            {canSubmitTracking ? (
              <TrackingCodeForm
                loading={submitting}
                initialValue={rfp?.delivery?.trackingCode || ''}
                onSubmit={(trackingCode) =>
                  withAction(
                    () => dropshippingService.markShipped(rfp._id, trackingCode),
                    'کد رهگیری با موفقیت ثبت شد'
                  )
                }
              />
            ) : null}

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-black text-slate-900">عملیات تامین‌کننده</h2>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={!canApprove || submitting}
                  onClick={() => withAction(() => dropshippingService.approveRFP(rfp._id), 'RFP تایید شد')}
                  className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                >
                  تایید RFP
                </button>

                <button
                  type="button"
                  disabled={!canReject || submitting}
                  onClick={() => {
                    const reason = window.prompt('دلیل رد RFP را وارد کنید:');
                    if (!reason) return;
                    withAction(() => dropshippingService.rejectRFP(rfp._id, { reason }), 'RFP رد شد');
                  }}
                  className="rounded-2xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                >
                  رد RFP
                </button>

                <button
                  type="button"
                  disabled={!canConfirmDelivery || submitting}
                  onClick={() =>
                    withAction(() => dropshippingService.confirmDelivery(rfp._id), 'تحویل از سمت شما تایید شد')
                  }
                  className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:text-slate-400"
                >
                  تایید تحویل
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-black text-slate-900">طرف مقابل</h2>
              <div className="mt-4">
                <AnonymousCounterpartyBadge counterparty={rfp?.counterparty} />
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-500">
                هویت طرف مقابل در کل فرایند دراپ‌شیپینگ مخفی است و فقط اطلاعات عملیاتی قرارداد نمایش داده می‌شود.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-black text-slate-900">اطلاعات مقصد ارسال</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <p>استان: {rfp?.shippingLocation?.province || '—'}</p>
                <p>شهر: {rfp?.shippingLocation?.city || '—'}</p>
                <p>نشانی: {rfp?.shippingLocation?.address || '—'}</p>
                <p>کد پستی: {rfp?.shippingLocation?.postalCode || '—'}</p>
              </div>
            </div>
          </div>
        </div>

        <TimelineList items={rfp?.timeline || []} />
      </div>
    </div>
  );
}
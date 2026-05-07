
import React from 'react';
import StatusBadge from './StatusBadge';
import AnonymousCounterpartyBadge from './AnonymousCounterpartyBadge';
import ShipmentDeadlineBadge from './ShipmentDeadlineBadge';

const money = (value) => `${Number(value || 0).toLocaleString('fa-IR')} تومان`;

const RFPDetailHeader = ({ rfp, showCounterpartyRating = false }) => {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-slate-900 md:text-2xl">
                {rfp?.rfpCode || 'جزئیات RFP'}
              </h1>
              <StatusBadge status={rfp?.status} />
            </div>

            <p className="mt-3 text-sm leading-7 text-slate-500">
              جزئیات مالی، وضعیت فعلی، مهلت ارسال و تایم‌لاین این RFP در این صفحه نمایش داده می‌شود.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {rfp?.counterparty ? (
              <AnonymousCounterpartyBadge
                counterparty={rfp.counterparty}
                showRating={showCounterpartyRating}
              />
            ) : null}
            <ShipmentDeadlineBadge
              agreedShipmentDate={rfp?.agreedShipmentDate}
              agreedShipmentDateJalali={rfp?.agreedShipmentDateJalali}
              status={rfp?.status}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs text-slate-500">مبلغ کل</p>
            <p className="mt-2 text-sm font-black text-slate-900 md:text-base">{money(rfp?.totalAmount)}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs text-slate-500">کارمزد</p>
            <p className="mt-2 text-sm font-black text-slate-900 md:text-base">{money(rfp?.fobinoFee || rfp?.feeAmount)}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs text-slate-500">سهم تامین‌کننده</p>
            <p className="mt-2 text-sm font-black text-slate-900 md:text-base">{money(rfp?.providerAmount || rfp?.providerNetAmount)}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs text-slate-500">کد رهگیری</p>
            <p className="mt-2 text-sm font-black text-slate-900 md:text-base">{rfp?.delivery?.trackingCode || 'ثبت نشده'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RFPDetailHeader;
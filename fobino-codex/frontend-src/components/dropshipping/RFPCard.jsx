
import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import ShipmentDeadlineBadge from './ShipmentDeadlineBadge';
import AnonymousCounterpartyBadge from './AnonymousCounterpartyBadge';

const money = (value) => `${Number(value || 0).toLocaleString('fa-IR')} تومان`;

const RFPCard = ({
  rfp,
  to,
  showCounterparty = true,
  showShipmentBadge = true,
  showTracking = true,
}) => {
  return (
    <Link
      to={to}
      className="block rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-black text-slate-900 md:text-base">{rfp?.rfpCode || 'RFP'}</h3>
              <StatusBadge status={rfp?.status} />
            </div>
            <p className="mt-2 text-xs text-slate-500 md:text-sm">
              مبلغ کل: <span className="font-bold text-slate-700">{money(rfp?.totalAmount)}</span>
            </p>
          </div>

          {showShipmentBadge ? (
            <ShipmentDeadlineBadge
              agreedShipmentDate={rfp?.agreedShipmentDate}
              agreedShipmentDateJalali={rfp?.agreedShipmentDateJalali}
              status={rfp?.status}
            />
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">تعداد</p>
            <p className="mt-1 text-sm font-black text-slate-900">{rfp?.quantity || 0}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">وضعیت پرداخت</p>
            <p className="mt-1 text-sm font-black text-slate-900">{rfp?.paymentStatus || '---'}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">وضعیت تسویه</p>
            <p className="mt-1 text-sm font-black text-slate-900">{rfp?.settlementStatus || '---'}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {showCounterparty && rfp?.counterparty ? (
            <AnonymousCounterpartyBadge counterparty={rfp.counterparty} compact />
          ) : <div />}

          {showTracking && rfp?.trackingCode ? (
            <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">
              کد رهگیری: {rfp.trackingCode}
            </div>
          ) : null}
        </div>
      </div>
    </Link>
  );
};

export default RFPCard;

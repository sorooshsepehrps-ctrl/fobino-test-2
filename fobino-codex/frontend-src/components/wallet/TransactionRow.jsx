import Card from '../ui/Card';
import { getTransactionMeta } from './transactionMeta';
import {
  formatMoney,
  formatTransactionDate,
  getSettlementHint,
  getStatusToneClass,
  getTransactionAmountDisplay,
} from '../../utils/wallet';

export default function TransactionRow({ item, onSelect }) {
  const meta = getTransactionMeta(item);
  const Icon = meta.icon;

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className="w-full text-right"
    >
      <Card
        variant="wallet"
        className="rounded-2xl transition-all hover:-translate-y-0.5 hover:shadow-md"
        padding="lg"
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-start gap-3">
            <div className={`mt-1 flex h-11 w-11 items-center justify-center rounded-2xl ${meta.iconClass}`}>
              <Icon className="h-5 w-5" />
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold text-gray-900">{item.title}</h3>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusToneClass(item.statusTone)}`}>
                  {item.statusLabel}
                </span>
              </div>

              <p className="text-sm text-gray-500">{item.subtitle}</p>
              <p className="text-sm leading-6 text-gray-600">{item.explainer}</p>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                <span>شماره: {item.transactionNumber || '-'}</span>
                <span>دامنه: {item.domainLabel}</span>
                <span>تاریخ: {formatTransactionDate(item.createdAt)}</span>
                {item.counterpartyLabel ? <span>طرف مقابل: {item.counterpartyLabel}</span> : null}
              </div>

              {item.flow === 'incoming_pending' ? (
                <div className="rounded-xl bg-blue-50 px-3 py-2 text-xs text-blue-800">
                  {getSettlementHint(item)}
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex min-w-[210px] flex-col gap-2 xl:items-end">
            <div className="text-lg font-bold text-gray-900">
              {getTransactionAmountDisplay(item)}
            </div>

            {item.netAmount && item.grossAmount && item.netAmount !== item.grossAmount ? (
              <div className="text-sm text-gray-500">
                مبلغ خالص: {formatMoney(item.netAmount, item.currency || 'IRR')}
              </div>
            ) : null}

            {item.feeAmount ? (
              <div className="text-sm text-red-600">
                کارمزد: {formatMoney(item.feeAmount, item.currency || 'IRR')}
              </div>
            ) : null}
          </div>
        </div>
      </Card>
    </button>
  );
}
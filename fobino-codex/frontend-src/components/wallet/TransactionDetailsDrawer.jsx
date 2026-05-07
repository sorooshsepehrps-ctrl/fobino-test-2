import { Modal, Card } from '../ui';
import {
  formatMoney,
  formatTransactionDate,
  getSettlementHint,
  getStatusToneClass,
} from '../../utils/wallet';

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-3 last:border-b-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value || '-'}</span>
    </div>
  );
}

export default function TransactionDetailsDrawer({
  isOpen,
  onClose,
  item,
  loading = false,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="جزئیات تراکنش"
      size="full"
    >
      {loading ? (
        <div className="py-10 text-center text-gray-500">در حال دریافت جزئیات...</div>
      ) : !item ? (
        <div className="py-10 text-center text-gray-500">تراکنشی انتخاب نشده است.</div>
      ) : (
        <div className="space-y-4">
          <Card variant="walletHero" padding="lg">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm text-blue-100">{item.subtitle}</p>
                <h3 className="mt-2 text-2xl font-bold">{item.title}</h3>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
                  {item.explainer}
                </p>
              </div>

              <div className="space-y-2">
                <div className="text-2xl font-bold">
                  {formatMoney(
                    Math.abs(item.netAmount ?? item.grossAmount ?? item.amount ?? 0),
                    item.currency || 'IRR'
                  )}
                </div>
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusToneClass(item.statusTone)}`}>
                  {item.statusLabel}
                </span>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card variant="wallet" padding="lg">
              <h4 className="mb-3 text-base font-semibold text-gray-900">اطلاعات اصلی</h4>
              <DetailRow label="شماره تراکنش" value={item.transactionNumber} />
              <DetailRow label="دامنه" value={item.domainLabel} />
              <DetailRow label="فلو" value={item.flowLabel} />
              <DetailRow label="وضعیت" value={item.statusLabel} />
              <DetailRow label="وضعیت تسویه" value={item.settlementStatus} />
              <DetailRow label="تاریخ ثبت" value={formatTransactionDate(item.createdAt)} />
              <DetailRow label="طرف مقابل" value={item.counterpartyLabel} />
            </Card>

            <Card variant="wallet" padding="lg">
              <h4 className="mb-3 text-base font-semibold text-gray-900">اطلاعات مالی</h4>
              <DetailRow label="مبلغ ناخالص" value={formatMoney(item.grossAmount || 0, item.currency || 'IRR')} />
              <DetailRow label="مبلغ خالص" value={formatMoney(item.netAmount || 0, item.currency || 'IRR')} />
              <DetailRow label="کارمزد" value={formatMoney(item.feeAmount || 0, item.currency || 'IRR')} />
              <DetailRow label="کمیسیون" value={formatMoney(item.commissionAmount || 0, item.currency || 'IRR')} />
              <DetailRow label="مرجع" value={item.referenceId} />
              <DetailRow label="نوع مرجع" value={item.referenceType} />
            </Card>
          </div>

          <Card variant="wallet" padding="lg">
            <h4 className="mb-3 text-base font-semibold text-gray-900">توضیح تکمیلی</h4>
            <p className="text-sm leading-7 text-gray-700">{getSettlementHint(item)}</p>
          </Card>
        </div>
      )}
    </Modal>
  );
}
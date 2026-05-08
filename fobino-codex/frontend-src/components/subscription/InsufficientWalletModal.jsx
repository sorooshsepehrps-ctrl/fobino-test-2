import { AlertTriangle, Wallet } from 'lucide-react';
import { Button, Modal } from '../ui';
import { formatToman } from './subscriptionUtils';

export default function InsufficientWalletModal({ isOpen, onClose, plan, walletBalance, onCharge }) {
  const shortage = Math.max(0, Number(plan?.price || 0) - Number(walletBalance || 0));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="موجودی کیف پول کافی نیست" size="md">
      <div className="space-y-5">
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm leading-7 text-red-700">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-1 h-5 w-5 flex-shrink-0" />
            <div>
              برای خرید {plan?.name || 'اشتراک'} از کیف پول، موجودی شما کافی نیست. می‌توانید کیف پول را شارژ کنید و سپس به همین خرید برگردید.
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">قیمت پلن</p>
            <p className="mt-1 font-black text-slate-900">{formatToman(plan?.price)}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">موجودی</p>
            <p className="mt-1 font-black text-slate-900">{formatToman(walletBalance)}</p>
          </div>
          <div className="rounded-2xl bg-red-50 p-3">
            <p className="text-xs text-red-600">کمبود</p>
            <p className="mt-1 font-black text-red-700">{formatToman(shortage)}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose}>فعلاً نه</Button>
          <Button variant="danger" className="flex-1 bg-red-600 hover:bg-red-700" icon={Wallet} onClick={() => onCharge(shortage)}>
            شارژ کیف پول
          </Button>
        </div>
      </div>
    </Modal>
  );
}

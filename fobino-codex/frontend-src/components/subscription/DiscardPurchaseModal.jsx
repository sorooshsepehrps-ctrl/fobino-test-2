import { AlertTriangle } from 'lucide-react';
import { Button, Modal } from '../ui';

export default function DiscardPurchaseModal({ isOpen, onCancel, onConfirm }) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title="خروج از پرداخت؟" size="sm">
      <div className="space-y-5">
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm leading-7 text-red-700">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-1 h-5 w-5 flex-shrink-0" />
            <span>پلن و روش پرداخت انتخاب شده است. اگر خارج شوید، اطلاعات انتخاب فعلی از آدرس صفحه حذف می‌شود.</span>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onCancel}>ادامه پرداخت</Button>
          <Button variant="danger" className="flex-1 bg-red-600 hover:bg-red-700" onClick={onConfirm}>خروج از پرداخت</Button>
        </div>
      </div>
    </Modal>
  );
}

export default function WalletChargeModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full">
        <h3 className="font-black text-lg mb-3">موجودی کافی نیست</h3>

        <p className="text-sm text-slate-600 mb-5">
          موجودی کیف پول شما برای دریافت اطلاعات تماس کافی نیست.
        </p>

        <button className="w-full bg-blue-700 text-white py-3 rounded-xl">
          شارژ کیف پول
        </button>
      </div>
    </div>
  );
}
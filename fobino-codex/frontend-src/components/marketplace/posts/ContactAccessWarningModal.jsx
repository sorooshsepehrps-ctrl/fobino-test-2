export default function ContactAccessWarningModal({
  open,
  onClose,
  onConfirm,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full">
        <h3 className="font-black text-lg mb-3">عدم دسترسی</h3>

        <p className="text-sm text-slate-600 mb-5">
          سهمیه مشاهده اطلاعات تماس شما به پایان رسیده است.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 bg-blue-700 text-white py-3 rounded-xl"
          >
            دریافت این آگهی
          </button>

          <button
            onClick={onClose}
            className="flex-1 border rounded-xl py-3"
          >
            انصراف
          </button>
        </div>
      </div>
    </div>
  );
}
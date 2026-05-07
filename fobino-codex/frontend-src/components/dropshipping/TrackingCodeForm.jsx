
import { useState } from 'react';
import { Truck, Hash } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';

export default function TrackingCodeForm({ onSubmit, loading = false }) {
  const [trackingCode, setTrackingCode] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!trackingCode.trim()) return;
    onSubmit?.(trackingCode.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-4 flex items-center gap-2">
        <Truck className="h-5 w-5 text-blue-900" />
        <h3 className="font-bold text-slate-900">ثبت کد رهگیری</h3>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <Input
          value={trackingCode}
          onChange={(e) => setTrackingCode(e.target.value)}
          placeholder="کد رهگیری مرسوله را وارد کنید"
          icon={Hash}
        />
        <Button type="submit" variant="brand" loading={loading} className="w-full md:w-auto">
          ثبت کد رهگیری
        </Button>
      </div>
    </form>
  );
}

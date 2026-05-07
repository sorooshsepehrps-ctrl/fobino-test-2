import { FileSpreadsheet } from 'lucide-react';
import { Card } from '../../../components/ui';

export default function ProductExcel() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">ایجاد محصول با اکسل</h1>
      
      <Card className="text-center py-12">
        <FileSpreadsheet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">به زودی...</h3>
        <p className="text-gray-500">
          امکان آپلود فایل اکسل برای ثبت دسته‌ای محصولات در نسخه بعدی اضافه خواهد شد.
        </p>
      </Card>
    </div>
  );
}

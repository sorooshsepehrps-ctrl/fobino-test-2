import { ShoppingCart } from 'lucide-react';
import { Card } from '../../../components/ui';

export default function NewBuyRequest() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">درخواست خرید محصول</h1>
      
      <Card className="text-center py-12">
        <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">به زودی...</h3>
        <p className="text-gray-500">
          فرم ثبت درخواست خرید در نسخه بعدی اضافه خواهد شد.
        </p>
      </Card>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { ShoppingCart, Plus } from 'lucide-react';
import { Button, Card } from '../../../components/ui';

export default function BuyRequests() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">درخواست‌های خرید من</h1>
        <Link to="/dashboard/requests/new">
          <Button icon={Plus}>درخواست خرید جدید</Button>
        </Link>
      </div>
      
      <Card className="text-center py-12">
        <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">درخواستی ثبت نشده است</h3>
        <p className="text-gray-500 mb-4">
          با ثبت درخواست خرید، فروشندگان می‌توانند با شما ارتباط برقرار کنند.
        </p>
        <Link to="/dashboard/requests/new">
          <Button>ثبت درخواست خرید</Button>
        </Link>
      </Card>
    </div>
  );
}

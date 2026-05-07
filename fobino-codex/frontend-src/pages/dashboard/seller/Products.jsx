import { Link } from 'react-router-dom';
import { Package, Plus } from 'lucide-react';
import { Button, Card } from '../../../components/ui';

export default function Products() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">محصولات من</h1>
        <Link to="/dashboard/products/new">
          <Button icon={Plus}>ایجاد محصول جدید</Button>
        </Link>
      </div>
      
      <Card className="text-center py-12">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">محصولی ثبت نشده است</h3>
        <p className="text-gray-500 mb-4">
          با ثبت محصول، خریداران می‌توانند محصولات شما را ببینند و با شما ارتباط برقرار کنند.
        </p>
        <Link to="/dashboard/products/new">
          <Button>ایجاد محصول جدید</Button>
        </Link>
      </Card>
    </div>
  );
}

import { useState } from 'react';
import { Package, MapPin, Clock, TrendingUp, Eye, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MarketingRequestCard({
  request,
  isSeller = false,
  onDelete,
  onEdit,
  showAcceptedBadge = true
}) {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
  };

  const handleView = () => {
    navigate(`/dashboard/marketing/requests/${request._id}`);
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      deleted: 'bg-red-100 text-red-800',
    };
    const labels = {
      active: 'فعال',
      inactive: 'غیرفعال',
      deleted: 'حذف شده',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image */}
      <div className="relative h-48 bg-gray-200">
        {request.primaryImage && !imageError ? (
          <img
            src={request.primaryImage}
            alt={request.productName}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-16 h-16 text-gray-400" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          {getStatusBadge(request.status)}
        </div>
        {showAcceptedBadge && request.acceptedBy?.length > 0 && (
          <div className="absolute bottom-2 right-2 bg-blue-500 text-white px-3 py-1 rounded-full text-xs">
            پذیرفته شده توسط بازاریاب
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-900 mb-2">{request.productName}</h3>
        <p className="text-sm text-gray-600 mb-1">برند: {request.brand}</p>
        
        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          <MapPin className="w-4 h-4" />
          <span>{request.cityOfProduction?.province} - {request.cityOfProduction?.city}</span>
        </div>

        {/* Shipping Time */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
          <Clock className="w-4 h-4" />
          <span>
            زمان ارسال: {request.shippingTimeAvailable?.value}{' '}
            {request.shippingTimeAvailable?.unit === 'days' ? 'روز' : 
             request.shippingTimeAvailable?.unit === 'weeks' ? 'هفته' : 'ماه'}
          </span>
        </div>

        {/* Price Volumes */}
        <div className="mb-3">
          <p className="text-sm font-medium text-gray-700 mb-1">قیمت‌های عمده‌فروشی:</p>
          <div className="space-y-1">
            {request.priceVolumes?.slice(0, 2).map((pv, index) => (
              <div key={index} className="text-xs text-gray-600 flex justify-between">
                <span>{pv.volume} {pv.unit}</span>
                <span className="font-medium">{formatPrice(pv.pricePerUnit)}</span>
              </div>
            ))}
            {request.priceVolumes?.length > 2 && (
              <div className="text-xs text-blue-600">+ {request.priceVolumes.length - 2} قیمت دیگر</div>
            )}
          </div>
        </div>

        {/* Commission */}
        <div className="flex items-center gap-2 bg-green-50 p-2 rounded-lg mb-3">
          <TrendingUp className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-green-700">
            کمیسیون: {request.commissionPercent}%
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            <span>{request.stats?.views || 0} بازدید</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleView}
            className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
          >
            مشاهده جزئیات
          </button>
          
          {isSeller && (
            <>
              <button
                onClick={() => onEdit(request)}
                className="bg-yellow-500 text-white p-2 rounded-lg hover:bg-yellow-600 transition-colors"
                title="ویرایش"
              >
                <Edit className="w-5 h-5" />
              </button>
              <button
                onClick={() => onDelete(request._id)}
                className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors"
                title="حذف"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

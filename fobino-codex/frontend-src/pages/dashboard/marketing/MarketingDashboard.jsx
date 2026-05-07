import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, FileText, FileSignature, TrendingUp, Users, Award } from 'lucide-react';
import { marketingService } from '../../../services';
import MarketingRequestCard from '../../../components/marketing/MarketingRequestCard';
import RFPCard from '../../../components/marketing/RFPCard';
import TradeContractCard from '../../../components/marketing/TradeContractCard';

export default function MarketingDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [stats, setStats] = useState({
    myRequests: 0,
    myRFPs: 0,
    myContracts: 0,
    totalCommission: 0,
  });
  const [recentItems, setRecentItems] = useState({
    requests: [],
    rfps: [],
    contracts: [],
  });
  const [marketerStatus, setMarketerStatus] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Check if user is marketer
      try {
        const marketerStatusResponse = await marketingService.getMyMarketerStatus();
        setMarketerStatus(marketerStatusResponse.data);
        if (marketerStatusResponse.data.isMarketer) {
          setUserRole('marketer');
        }
      } catch (error) {
        console.log('Not a marketer');
      }

      // Load seller's marketing requests
      try {
        const requestsResponse = await marketingService.getMyMarketingRequests({ limit: 3 });
        setRecentItems(prev => ({ ...prev, requests: requestsResponse.data || [] }));
        setStats(prev => ({ ...prev, myRequests: requestsResponse.pagination?.total || 0 }));
      } catch (error) {
        console.log('No marketing requests');
      }

      // Load RFPs
      try {
        const rfpsResponse = await marketingService.getMyRFPs({ limit: 3 });
        setRecentItems(prev => ({ ...prev, rfps: rfpsResponse.data || [] }));
        setStats(prev => ({ ...prev, myRFPs: rfpsResponse.pagination?.total || 0 }));
      } catch (error) {
        console.log('No RFPs');
      }

      // Load Contracts
      try {
        const contractsResponse = await marketingService.getMyContracts({ limit: 3 });
        setRecentItems(prev => ({ ...prev, contracts: contractsResponse.data || [] }));
        setStats(prev => ({ ...prev, myContracts: contractsResponse.pagination?.total || 0 }));
        
        // Calculate total commission
        const totalCommission = contractsResponse.data?.reduce((sum, contract) => {
          if (contract.commission?.status === 'released' || contract.commission?.status === 'released_with_fee') {
            return sum + (contract.commission.amount - (contract.commission.fobinoFee || 0));
          }
          return sum;
        }, 0) || 0;
        setStats(prev => ({ ...prev, totalCommission }));
      } catch (error) {
        console.log('No contracts');
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">داشبورد بازاریابی</h1>
        <p className="text-gray-600 mt-1">مدیریت فعالیت‌های بازاریابی خود</p>
      </div>

      {/* Marketer Verification Card */}
      {marketerStatus && !marketerStatus.isMarketer && (
        <div className="bg-linear-to-r from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-6 h-6" />
                <h2 className="text-xl font-bold">بازاریاب شوید</h2>
              </div>
              <p className="text-purple-100 mb-4">
                {marketerStatus.verification?.status === 'pending'
                  ? 'درخواست شما در حال بررسی است'
                  : marketerStatus.canRequest
                  ? 'با تایید بازاریاب، درآمد کسب کنید'
                  : 'ابتدا به سطح 5 برسید تا بتوانید درخواست دهید'}
              </p>
              <button
                onClick={() => navigate('/dashboard/marketing/marketer-verification')}
                className="bg-white text-purple-600 px-6 py-2 rounded-lg font-medium hover:bg-purple-50 transition-colors"
              >
                {marketerStatus.verification?.status === 'pending'
                  ? 'مشاهده وضعیت'
                  : 'درخواست تایید'}
              </button>
            </div>
            <Award className="w-20 h-20 opacity-20" />
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => navigate('/dashboard/marketing/requests/new')}
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow text-right"
        >
          <div className="flex items-center justify-between mb-3">
            <Package className="w-10 h-10 text-blue-500" />
          </div>
          <h3 className="font-bold text-lg mb-1">درخواست بازاریابی جدید</h3>
          <p className="text-sm text-gray-600">محصول خود را برای بازاریابی معرفی کنید</p>
        </button>

        {marketerStatus?.isMarketer && (
          <button
            onClick={() => navigate('/dashboard/marketing/browse-requests')}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow text-right"
          >
            <div className="flex items-center justify-between mb-3">
              <Users className="w-10 h-10 text-green-500" />
            </div>
            <h3 className="font-bold text-lg mb-1">مرور درخواست‌ها</h3>
            <p className="text-sm text-gray-600">درخواست‌های بازاریابی را مشاهده کنید</p>
          </button>
        )}

        <button
          onClick={() => navigate('/dashboard/marketing/connect-contract')}
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow text-right"
        >
          <div className="flex items-center justify-between mb-3">
            <FileSignature className="w-10 h-10 text-purple-500" />
          </div>
          <h3 className="font-bold text-lg mb-1">اتصال به قرارداد</h3>
          <p className="text-sm text-gray-600">با استفاده از کد قرارداد متصل شوید</p>
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">درخواست‌های من</p>
              <p className="text-2xl font-bold text-gray-900">{stats.myRequests}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-yellow-100 p-2 rounded-lg">
              <FileText className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">RFP ها</p>
              <p className="text-2xl font-bold text-gray-900">{stats.myRFPs}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-purple-100 p-2 rounded-lg">
              <FileSignature className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">قراردادها</p>
              <p className="text-2xl font-bold text-gray-900">{stats.myContracts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-green-100 p-2 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">کل کمیسیون</p>
              <p className="text-lg font-bold text-green-600">
                {formatPrice(stats.totalCommission)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Marketing Requests */}
      {recentItems.requests.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">درخواست‌های بازاریابی اخیر</h2>
            <button
              onClick={() => navigate('/dashboard/marketing/my-requests')}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              مشاهده همه
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentItems.requests.map((request) => (
              <MarketingRequestCard
                key={request._id}
                request={request}
                isSeller={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recent RFPs */}
      {recentItems.rfps.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">RFP های اخیر</h2>
            <button
              onClick={() => navigate('/dashboard/marketing/rfps')}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              مشاهده همه
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentItems.rfps.map((rfp) => (
              <RFPCard key={rfp._id} rfp={rfp} userRole={userRole} />
            ))}
          </div>
        </div>
      )}

      {/* Recent Contracts */}
      {recentItems.contracts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">قراردادهای اخیر</h2>
            <button
              onClick={() => navigate('/dashboard/marketing/contracts')}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              مشاهده همه
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentItems.contracts.map((contract) => (
              <TradeContractCard
                key={contract._id}
                contract={contract}
                userRole={userRole}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {recentItems.requests.length === 0 && 
       recentItems.rfps.length === 0 && 
       recentItems.contracts.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">شروع کنید</h3>
          <p className="text-gray-600 mb-6">
            هنوز هیچ فعالیت بازاریابی ندارید. یک درخواست بازاریابی ایجاد کنید یا به عنوان بازاریاب فعالیت کنید.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate('/dashboard/marketing/requests/new')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              ایجاد درخواست
            </button>
            {marketerStatus?.canRequest && (
              <button
                onClick={() => navigate('/dashboard/marketing/marketer-verification')}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
              >
                بازاریاب شوید
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

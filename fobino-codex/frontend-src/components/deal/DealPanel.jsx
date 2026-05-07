import { useState, useEffect } from 'react';
import {
  Package,
  Truck,
  Search as SearchIcon,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  DollarSign,
  MapPin,
  Plus,
  Shield,
  CreditCard,
  RefreshCw,
  ArrowRight,
  Star,
  MessageSquareText,
  Users,
} from 'lucide-react';
import { Button, Modal } from '../ui';
import dealService from '../../services/dealService';
import userReviewService from '../../services/userReviewService';
import ReviewCreateModal from '../reviews/ReviewCreateModal';
import useAuthStore from '../../store/authStore';
import { formatPrice, toPersianNumber } from '../../utils/helpers';

const PAYMENT_METHODS = [
  { value: 'fobino_secure', label: 'پرداخت امن فوبینو', icon: Shield, desc: 'مبلغ در کیف پول مسدود و پس از تایید آزاد می‌شود' },
  { value: 'credit', label: 'اعتباری', icon: CreditCard, desc: 'پرداخت اعتباری' },
  { value: 'tahator', label: 'تهاتر', icon: RefreshCw, desc: 'مبادله کالا به کالا' },
  { value: 'cash', label: 'نقدی', icon: DollarSign, desc: 'پرداخت نقدی' },
];

const UNITS = [
  { value: 'ton', label: 'تن' },
  { value: 'kg', label: 'کیلوگرم' },
  { value: 'gram', label: 'گرم' },
  { value: 'meter', label: 'متر' },
  { value: 'sqm', label: 'متر مربع' },
  { value: 'piece', label: 'عدد' },
  { value: 'pack', label: 'بسته' },
  { value: 'roll', label: 'رول' },
  { value: 'liter', label: 'لیتر' },
  { value: 'box', label: 'جعبه' },
];

const STATUS_MAP = {
  pending: { label: 'در انتظار تایید', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  open: { label: 'باز', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  shipped: { label: 'ارسال شده', color: 'bg-purple-100 text-purple-800', icon: Truck },
  delivered: { label: 'تحویل داده شده', color: 'bg-indigo-100 text-indigo-800', icon: Package },
  confirmed: { label: 'تایید نهایی', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  disputed: { label: 'اختلاف', color: 'bg-red-100 text-red-800', icon: AlertTriangle },
  cancelled: { label: 'لغو شده', color: 'bg-gray-100 text-gray-800', icon: XCircle },
  refunded: { label: 'بازگشت وجه', color: 'bg-orange-100 text-orange-800', icon: RefreshCw },
};

const SHIPPING_STATUS_MAP = {
  pending: 'در انتظار تخمین قیمت',
  estimated: 'تخمین زده شده',
  agreed: 'موافقت شده',
  disagreed: 'رد شده',
  shipped: 'ارسال شده',
  waiting_for_factor: 'در انتظار فاکتور',
  factored: 'فاکتور صادر شده',
};

const INSPECTION_STATUS_MAP = {
  pending: 'در انتظار تخمین قیمت',
  estimated: 'تخمین زده شده',
  paid: 'پرداخت شده',
  inspected: 'بازرسی انجام شده',
  waiting_for_factor: 'در انتظار فاکتور',
  factored: 'فاکتور صادر شده',
};

export default function DealPanel({ chatId, chatParticipants, chat }) {
  const { user } = useAuthStore();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [expandedDeal, setExpandedDeal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Determine user role in chat
  const buyerParticipant = chatParticipants?.find(p => p.role === 'buyer');
  const sellerParticipant = chatParticipants?.find(p => p.role === 'seller');
  const isBuyer = buyerParticipant?.user?._id === user?._id || buyerParticipant?.user === user?._id;
  const isSeller = sellerParticipant?.user?._id === user?._id || sellerParticipant?.user === user?._id;
  
  // Check if roles are defined
  const hasDefinedRoles = (buyerParticipant && sellerParticipant);
  const canCreateDeal = !hasDefinedRoles || isBuyer;
  
  const tradeContract = chat?.tradeContract;
  const isMarketingChat = Boolean(tradeContract);
  const canCreateMarketingDeal = !isMarketingChat || ['commission_deposited', 'contacts_shared'].includes(tradeContract?.status);

  // Modal states
  const [shippingModal, setShippingModal] = useState({ open: false, dealId: null });
  const [shippingForm, setShippingForm] = useState({ shippingCity: '', deliveryCity: '' });
  const [inspectionModal, setInspectionModal] = useState({ open: false, dealId: null });
  const [inspectionForm, setInspectionForm] = useState({ location: '' });
  const [cancelModal, setCancelModal] = useState({ open: false, dealId: null });
  const [cancelReason, setCancelReason] = useState('');
  const [reviewModal, setReviewModal] = useState({ open: false, deal: null, eligibility: null });
  const [reviewEligibilityMap, setReviewEligibilityMap] = useState({});
  const [reviewLoadingMap, setReviewLoadingMap] = useState({});

  // Create deal form state
  const [form, setForm] = useState({
    title: '',
    unit: 'kg',
    pricePerUnit: '',
    count: '',
    paymentMethod: 'fobino_secure',
    preContractPercentage: 10,
    terms: '',
    contractCode: '',
    selectedBuyerId: null,
    selectedSellerId: null,
  });

  // Helper function to get user's role in a specific deal
// frontend/my-app/src/components/deal/DealPanel.jsx

// Update getUserRoleInDeal function to be more robust
const getUserRoleInDeal = (deal) => {
  const userId = user?._id;
  if (!userId) return null;
  
  // First check dealRoles if they exist (for deals created without chat roles)
  if (deal.dealRoles?.explicitlySet) {
    const dealRolesBuyerId = typeof deal.dealRoles.buyer === 'object' 
      ? deal.dealRoles.buyer?._id 
      : deal.dealRoles.buyer;
    const dealRolesSellerId = typeof deal.dealRoles.seller === 'object' 
      ? deal.dealRoles.seller?._id 
      : deal.dealRoles.seller;
    
    if (dealRolesBuyerId?.toString() === userId.toString()) return 'buyer';
    if (dealRolesSellerId?.toString() === userId.toString()) return 'seller';
  }
  
  // If deal has dealRoles but not explicitlySet, still check them
  if (deal.dealRoles && deal.dealRoles.buyer && deal.dealRoles.seller) {
    const dealRolesBuyerId = typeof deal.dealRoles.buyer === 'object' 
      ? deal.dealRoles.buyer?._id 
      : deal.dealRoles.buyer;
    const dealRolesSellerId = typeof deal.dealRoles.seller === 'object' 
      ? deal.dealRoles.seller?._id 
      : deal.dealRoles.seller;
    
    if (dealRolesBuyerId?.toString() === userId.toString()) return 'buyer';
    if (dealRolesSellerId?.toString() === userId.toString()) return 'seller';
  }
  
  // Fallback to buyer/seller fields
  const buyerId = typeof deal.buyer === 'object' ? deal.buyer?._id : deal.buyer;
  const sellerId = typeof deal.seller === 'object' ? deal.seller?._id : deal.seller;
  
  if (buyerId?.toString() === userId.toString()) return 'buyer';
  if (sellerId?.toString() === userId.toString()) return 'seller';
  
  console.log('User not found in deal roles:', {
    userId: userId.toString(),
    dealId: deal._id,
    dealRolesBuyer: deal.dealRoles?.buyer?.toString?.(),
    dealRolesSeller: deal.dealRoles?.seller?.toString?.(),
    buyer: buyerId?.toString(),
    seller: sellerId?.toString()
  });
  
  return null;
};

  // Get all unique participants from chat
  const getAllParticipants = () => {
    if (!chatParticipants || !Array.isArray(chatParticipants)) return [];
    
    return chatParticipants.map(participant => {
      const userData = participant.user;
      const userId = typeof userData === 'object' ? userData?._id : userData;
      const userName = typeof userData === 'object' 
        ? (userData?.fullName || userData?.name || userData?.username || userData?.phone || 'کاربر')
        : 'کاربر';
      
      return {
        id: userId,
        name: userName,
        role: participant.role,
        rawParticipant: participant
      };
    }).filter(p => p.id); // Filter out any null/undefined ids
  };

  const allParticipants = getAllParticipants();
  const currentUserId = user?._id;
  
  // Get other participants (excluding current user)
  const otherParticipants = allParticipants.filter(p => p.id !== currentUserId);
  
  // Get participants without roles (all participants when roles not defined)
  const participantsForSelection = !hasDefinedRoles ? allParticipants : [];

  // Auto-select current user as buyer and first other as seller when opening form
  useEffect(() => {
    if (showCreateForm && !hasDefinedRoles && participantsForSelection.length > 0) {
      const currentUserParticipant = participantsForSelection.find(p => p.id === currentUserId);
      const otherParticipant = participantsForSelection.find(p => p.id !== currentUserId);
      
      if (currentUserParticipant && !form.selectedBuyerId && !form.selectedSellerId) {
        // By default, set current user as buyer and other participant as seller
        setForm(prev => ({
          ...prev,
          selectedBuyerId: currentUserId,
          selectedSellerId: otherParticipant?.id || null
        }));
      }
    }
  }, [showCreateForm, hasDefinedRoles, participantsForSelection, currentUserId]);

  useEffect(() => {
    fetchDeals();
  }, [chatId]);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      
      // Fetch all deals for this chat
      const response = await dealService.getDeals({ chat: chatId });
      
      if (response.success) {
        const allChatDeals = response.data || [];
        
        // Filter deals where current user is either buyer or seller (based on deal-specific roles)
        const userDeals = allChatDeals.filter(deal => {
          const role = getUserRoleInDeal(deal);
          return role !== null;
        });
        
        setDeals(userDeals);
        
        // Automatically check review eligibility for all completed/confirmed deals
        for (const deal of userDeals) {
          const isCompleted = deal.status === 'confirmed' || 
                            deal.status === 'completed' || 
                            deal.completedAt;
          
          if (isCompleted) {
            console.log('Auto-checking eligibility for deal:', deal._id, 'Status:', deal.status);
            await fetchDealReviewEligibility(deal._id, { silent: true });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching deals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDeal = async (e) => {
    e.preventDefault();
    if (actionLoading) return;

    // If roles are not defined, we need to set buyer and seller
    if (!hasDefinedRoles) {
      if (!form.selectedBuyerId || !form.selectedSellerId) {
        alert('لطفاً خریدار و فروشنده را انتخاب کنید');
        return;
      }
      
      // Check if current user is selected as buyer or seller
      if (form.selectedBuyerId !== currentUserId && form.selectedSellerId !== currentUserId) {
        alert('شما باید یکی از طرفین معامله باشید (خریدار یا فروشنده)');
        return;
      }
      
      // Check if buyer and seller are different
      if (form.selectedBuyerId === form.selectedSellerId) {
        alert('خریدار و فروشنده نمی‌توانند یک نفر باشند');
        return;
      }
    }

    if (isMarketingChat && !form.contractCode.trim()) {
      alert('کد قرارداد بازاریابی الزامی است');
      return;
    }

    try {
      setActionLoading(true);
      const data = {
        chatId,
        title: form.title,
        unit: form.unit,
        pricePerUnit: Number(form.pricePerUnit),
        count: Number(form.count),
        paymentMethod: form.paymentMethod,
        terms: form.terms,
      };
      
      // Add buyer and seller info if roles not defined
      if (!hasDefinedRoles) {
        data.buyerId = form.selectedBuyerId;
        data.sellerId = form.selectedSellerId;
      }
      
      if (isMarketingChat) {
        data.contractCode = form.contractCode.trim();
        data.tradeContractId = tradeContract?._id || tradeContract;
      }
      if (form.paymentMethod === 'fobino_secure') {
        data.preContractPercentage = Number(form.preContractPercentage);
      }
      
      const response = await dealService.createDeal(data);
      if (response.success) {
        setShowCreateForm(false);
        setForm({ 
          title: '', 
          unit: 'kg', 
          pricePerUnit: '', 
          count: '', 
          paymentMethod: 'fobino_secure', 
          preContractPercentage: 10, 
          terms: '', 
          contractCode: '',
          selectedBuyerId: null,
          selectedSellerId: null,
        });
        fetchDeals();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'خطا در ایجاد قرارداد');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDealAction = async (dealId, action) => {
    if (actionLoading) return;
    try {
      setActionLoading(true);
      let response;
      switch (action) {
        case 'verify': response = await dealService.verifyDeal(dealId); break;
        case 'ship': response = await dealService.shipDeal(dealId); break;
        case 'deliver': response = await dealService.deliverDeal(dealId); break;
        case 'confirm': response = await dealService.confirmDeal(dealId); break;
        case 'cancel':
          setCancelReason('');
          setCancelModal({ open: true, dealId });
          return;
        default: return;
      }
      if (response?.success) fetchDeals();
    } catch (error) {
      alert(error.response?.data?.message || 'خطا در انجام عملیات');
    } finally {
      setActionLoading(false);
    }
  };

  // Shipping handlers
  const handleRequestShipping = async (dealId) => {
    setShippingForm({ shippingCity: '', deliveryCity: '' });
    setShippingModal({ open: true, dealId });
  };

  const submitShippingRequest = async () => {
    if (!shippingForm.shippingCity || !shippingForm.deliveryCity) return;
    try {
      setActionLoading(true);
      await dealService.requestShipping(shippingModal.dealId, shippingForm);
      setShippingModal({ open: false, dealId: null });
      fetchDeals();
    } catch (error) {
      alert(error.response?.data?.message || 'خطا');
    } finally { setActionLoading(false); }
  };

  const handleShippingRespond = async (dealId, agree) => {
    try {
      setActionLoading(true);
      await dealService.respondToShippingPrice(dealId, agree);
      fetchDeals();
    } catch (error) {
      alert(error.response?.data?.message || 'خطا');
    } finally { setActionLoading(false); }
  };

  const handleRequestShippingFactor = async (dealId) => {
    try {
      setActionLoading(true);
      await dealService.requestShippingFactor(dealId);
      fetchDeals();
    } catch (error) {
      alert(error.response?.data?.message || 'خطا');
    } finally { setActionLoading(false); }
  };

  // Inspection handlers
  const handleRequestInspection = async (dealId) => {
    setInspectionForm({ location: '' });
    setInspectionModal({ open: true, dealId });
  };

  const submitInspectionRequest = async () => {
    if (!inspectionForm.location) return;
    try {
      setActionLoading(true);
      await dealService.requestInspection(inspectionModal.dealId, inspectionForm);
      setInspectionModal({ open: false, dealId: null });
      fetchDeals();
    } catch (error) {
      alert(error.response?.data?.message || 'خطا');
    } finally { setActionLoading(false); }
  };

  const submitCancel = async () => {
    if (!cancelReason) return;
    try {
      setActionLoading(true);
      await dealService.cancelDeal(cancelModal.dealId, cancelReason);
      setCancelModal({ open: false, dealId: null });
      fetchDeals();
    } catch (error) {
      alert(error.response?.data?.message || 'خطا');
    } finally { setActionLoading(false); }
  };

  const handlePayInspection = async (dealId) => {
    try {
      setActionLoading(true);
      await dealService.payInspection(dealId);
      fetchDeals();
    } catch (error) {
      alert(error.response?.data?.message || 'خطا');
    } finally { setActionLoading(false); }
  };

  const handleRequestInspectionFactor = async (dealId) => {
    try {
      setActionLoading(true);
      await dealService.requestInspectionFactor(dealId);
      fetchDeals();
    } catch (error) {
      alert(error.response?.data?.message || 'خطا');
    } finally { setActionLoading(false); }
  };

  const totalPrice = Number(form.pricePerUnit || 0) * Number(form.count || 0);
  const preContractAmount = form.paymentMethod === 'fobino_secure'
    ? Math.floor(totalPrice * (Number(form.preContractPercentage || 0) / 100))
    : 0;
  const commissionAmount = form.paymentMethod === 'fobino_secure'
    ? Math.floor(totalPrice * 0.01)
    : 0;
  const marketingCommission = tradeContract?.commission?.amount || 0;
  const marketingFee = Math.floor(marketingCommission * 0.1);
  const marketingNet = marketingCommission - marketingFee;
  const contractStatusLabel = {
    waiting_buyer: 'در انتظار اتصال خریدار',
    buyer_connected: 'خریدار متصل شد',
    buyer_approved: 'تایید شده توسط خریدار',
    commission_deposited: 'کمیسیون واریز شد',
    contacts_shared: 'ارتباط برقرار شد',
    deal_created: 'معامله ایجاد شد',
    completed: 'تکمیل شد',
    cancelled: 'لغو شد',
  }[tradeContract?.status] || tradeContract?.status;

  const normalizeEligibility = (payload) => payload?.data || payload || {};

  const fetchDealReviewEligibility = async (dealId, { silent = false } = {}) => {
    if (!dealId) return null;
    try {
      setReviewLoadingMap((prev) => ({ ...prev, [dealId]: true }));
      const payload = await userReviewService.getDealReviewEligibility(dealId);
      const eligibility = normalizeEligibility(payload);
      console.log('Review eligibility for deal', dealId, ':', eligibility);
      setReviewEligibilityMap((prev) => ({ ...prev, [dealId]: eligibility }));
      return eligibility;
    } catch (error) {
      console.error('Error fetching review eligibility:', error);
      if (!silent) {
        alert(error.response?.data?.message || 'خطا در بررسی امکان ثبت نظر');
      }
      return null;
    } finally {
      setReviewLoadingMap((prev) => ({ ...prev, [dealId]: false }));
    }
  };

  const openReviewModal = async (deal) => {
    const dealId = deal?._id || deal?.id;
    const eligibility = reviewEligibilityMap[dealId] || await fetchDealReviewEligibility(dealId);
    if (!eligibility?.canReview) {
      alert('امکان ثبت نظر برای این معامله وجود ندارد');
      return;
    }
    setReviewModal({ open: true, deal, eligibility });
  };

  const handleReviewSuccess = async () => {
    const dealId = reviewModal.deal?._id || reviewModal.deal?.id;
    if (dealId) await fetchDealReviewEligibility(dealId, { silent: true });
    fetchDeals();
  };

  const renderReviewPanel = (deal) => {
    const dealId = deal?._id || deal?.id;
    const eligibility = reviewEligibilityMap[dealId];
    const isLoading = Boolean(reviewLoadingMap[dealId]);
    const isCompleted = deal.status === 'confirmed' || 
                       deal.status === 'completed' || 
                       deal.completedAt;

    console.log('Rendering review panel for deal:', dealId, {
      status: deal.status,
      completedAt: deal.completedAt,
      isCompleted,
      eligibility,
      isLoading
    });

    if (!isCompleted) {
      if (deal.status === 'delivered') {
        return (
          <div className="mt-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-3">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-blue-500" />
              <p className="text-sm text-blue-800">پس از تایید نهایی معامله توسط خریدار، امکان ثبت نظر وجود خواهد داشت</p>
            </div>
          </div>
        );
      }
      return null;
    }

    // If we haven't fetched eligibility yet, show a button to check
    if (!eligibility && !isLoading) {
      return (
        <div className="mt-3 rounded-2xl border border-amber-100 bg-amber-50/70 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <Star size={18} className="mt-0.5 text-amber-500" />
              <div>
                <p className="text-sm font-bold text-amber-900">معامله تکمیل شده است</p>
                <p className="mt-1 text-xs leading-6 text-amber-800">
                  برای ثبت نظر برای طرف مقابل، روی دکمه "بررسی نظر" کلیک کنید.
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => fetchDealReviewEligibility(dealId)} disabled={isLoading}>
              {isLoading ? 'در حال بررسی...' : 'بررسی نظر'}
            </Button>
          </div>
        </div>
      );
    }

    if (eligibility?.alreadyReviewed) {
      const userRole = getUserRoleInDeal(deal);
      const reviewedUser = userRole === 'buyer' ? deal.seller : deal.buyer;
      const reviewedUserName = typeof reviewedUser === 'object' 
        ? (reviewedUser?.fullName || reviewedUser?.name || 'کاربر')
        : 'کاربر';
      
      return (
        <div className="mt-3 rounded-2xl border border-green-100 bg-green-50 p-3">
          <div className="flex items-center gap-2 font-bold text-green-800">
            <CheckCircle size={16} /> 
            نظر شما برای {reviewedUserName} ثبت شده است.
          </div>
        </div>
      );
    }

    if (eligibility?.canReview) {
      const userRole = getUserRoleInDeal(deal);
      const reviewTarget = userRole === 'buyer' ? deal.seller : deal.buyer;
      const targetName = typeof reviewTarget === 'object' 
        ? (reviewTarget?.fullName || reviewTarget?.name || 'کاربر')
        : 'کاربر';
      
      return (
        <div className="mt-3 overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2">
              <MessageSquareText size={18} className="mt-0.5 text-emerald-600" />
              <div>
                <p className="text-sm font-bold text-emerald-950">این معامله آماده ثبت نظر است</p>
                <p className="mt-1 text-xs leading-6 text-emerald-700">
                  برای {targetName} امتیاز و نظر ثبت کنید تا پروفایل عمومی او به‌روزرسانی شود.
                </p>
              </div>
            </div>
            <Button size="sm" onClick={() => openReviewModal(deal)} disabled={isLoading}>
              <Star size={14} /> ثبت نظر برای {targetName}
            </Button>
          </div>
        </div>
      );
    }

    if (eligibility && !eligibility.canReview && !eligibility.alreadyReviewed) {
      return (
        <div className="mt-3 rounded-2xl border border-gray-200 bg-gray-50 p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle size={18} className="mt-0.5 text-gray-500" />
            <div>
              <p className="text-sm font-medium text-gray-700">امکان ثبت نظر وجود ندارد</p>
              <p className="mt-1 text-xs text-gray-600">
                {eligibility.message || 'در حال حاضر امکان ثبت نظر برای این معامله وجود ندارد.'}
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="mt-3">
          <div className="h-16 animate-pulse rounded-2xl bg-gray-100" />
        </div>
      );
    }

    return null;
  };

  const renderDealActions = (deal) => {
    const userRole = getUserRoleInDeal(deal);
    const actions = [];

    if (deal.status === 'pending' && userRole === 'seller') {
      actions.push(
        <Button key="verify" size="sm" onClick={() => handleDealAction(deal._id, 'verify')} disabled={actionLoading}>
          <CheckCircle size={14} /> تایید قرارداد
        </Button>
      );
    }
    if (deal.status === 'open' && userRole === 'seller') {
      actions.push(
        <Button key="ship" size="sm" variant="outline" onClick={() => handleDealAction(deal._id, 'ship')} disabled={actionLoading}>
          <Truck size={14} /> ارسال شد
        </Button>
      );
    }
    if (deal.status === 'shipped' && userRole === 'buyer') {
      actions.push(
        <Button key="deliver" size="sm" variant="outline" onClick={() => handleDealAction(deal._id, 'deliver')} disabled={actionLoading}>
          <Package size={14} /> تحویل گرفتم
        </Button>
      );
    }
    if (deal.status === 'delivered' && userRole === 'buyer') {
      actions.push(
        <Button key="confirm" size="sm" onClick={() => handleDealAction(deal._id, 'confirm')} disabled={actionLoading}>
          <CheckCircle size={14} /> تایید نهایی و آزادسازی وجه
        </Button>
      );
    }
    if (['pending', 'open'].includes(deal.status)) {
      actions.push(
        <Button key="cancel" size="sm" variant="danger" onClick={() => handleDealAction(deal._id, 'cancel')} disabled={actionLoading}>
          <XCircle size={14} /> لغو
        </Button>
      );
    }

    return actions;
  };

  const renderShippingSection = (deal) => {
    const userRole = getUserRoleInDeal(deal);
    const isDealBuyer = userRole === 'buyer';
    
    if (!deal.shipping && isDealBuyer && ['pending', 'open'].includes(deal.status)) {
      return (
        <Button size="sm" variant="ghost" onClick={() => handleRequestShipping(deal._id)} disabled={actionLoading}>
          <Truck size={14} /> درخواست ارسال فوبینو
        </Button>
      );
    }
    if (!deal.shipping) return null;

    const s = deal.shipping;
    return (
      <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
        <h5 className="text-sm font-bold text-purple-800 mb-2 flex items-center gap-1">
          <Truck size={14} /> ارسال فوبینو
        </h5>
        <p className="text-xs text-gray-600">وضعیت: <span className="font-medium">{SHIPPING_STATUS_MAP[s.status] || s.status}</span></p>
        {s.shippingCity && <p className="text-xs text-gray-600">مبدا: {s.shippingCity} → مقصد: {s.deliveryCity}</p>}
        {s.price > 0 && <p className="text-xs text-gray-600">قیمت: {formatPrice(s.price * 10)}</p>}
        {s.trackingCode && <p className="text-xs text-gray-600">کد رهگیری: <span className="font-mono font-bold">{s.trackingCode}</span></p>}
        {s.factor?.imageUrl && (
          <a href={s.factor.imageUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline">مشاهده فاکتور</a>
        )}

        {/* Buyer actions on shipping */}
        {isDealBuyer && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {s.status === 'estimated' && (
              <>
                <Button size="sm" onClick={() => handleShippingRespond(deal._id, true)} disabled={actionLoading}>موافقم</Button>
                <Button size="sm" variant="danger" onClick={() => handleShippingRespond(deal._id, false)} disabled={actionLoading}>مخالفم</Button>
              </>
            )}
            {s.status === 'shipped' && (
              <Button size="sm" variant="ghost" onClick={() => handleRequestShippingFactor(deal._id)} disabled={actionLoading}>
                <FileText size={14} /> درخواست فاکتور
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderInspectionSection = (deal) => {
    const userRole = getUserRoleInDeal(deal);
    const isDealBuyer = userRole === 'buyer';
    
    if (!deal.inspection && isDealBuyer && ['pending', 'open'].includes(deal.status)) {
      return (
        <Button size="sm" variant="ghost" onClick={() => handleRequestInspection(deal._id)} disabled={actionLoading}>
          <SearchIcon size={14} /> درخواست بازرسی فوبینو
        </Button>
      );
    }
    if (!deal.inspection) return null;

    const ins = deal.inspection;
    return (
      <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
        <h5 className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-1">
          <SearchIcon size={14} /> بازرسی فوبینو
        </h5>
        <p className="text-xs text-gray-600">وضعیت: <span className="font-medium">{INSPECTION_STATUS_MAP[ins.status] || ins.status}</span></p>
        {ins.location && <p className="text-xs text-gray-600"><MapPin size={12} className="inline" /> محل: {ins.location}</p>}
        {ins.price > 0 && <p className="text-xs text-gray-600">هزینه: {formatPrice(ins.price * 10)}</p>}
        {ins.result && <p className="text-xs text-gray-700 mt-1 bg-white p-2 rounded">نتیجه: {ins.result}</p>}
        {ins.factor?.imageUrl && (
          <a href={ins.factor.imageUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline">مشاهده فاکتور</a>
        )}

        {/* Buyer actions on inspection */}
        {isDealBuyer && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {ins.status === 'estimated' && (
              <Button size="sm" onClick={() => handlePayInspection(deal._id)} disabled={actionLoading}>
                <DollarSign size={14} /> پرداخت هزینه بازرسی
              </Button>
            )}
            {ins.status === 'inspected' && (
              <Button size="sm" variant="ghost" onClick={() => handleRequestInspectionFactor(deal._id)} disabled={actionLoading}>
                <FileText size={14} /> درخواست فاکتور
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  // Helper to get user name from participant
  const getParticipantDisplayName = (participant) => {
    if (!participant) return 'نامشخص';
    const userData = participant.user;
    if (typeof userData === 'object') {
      return userData.fullName || userData.name || userData.username || userData.phone || 'کاربر';
    }
    return 'کاربر';
  };

  return (
    <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-200px)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900">قراردادها</h3>
        {canCreateDeal && (
          <Button
            size="sm"
            variant={showCreateForm ? 'ghost' : 'primary'}
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? <XCircle size={14} /> : <Plus size={14} />}
            {showCreateForm ? 'انصراف' : 'قرارداد جدید'}
          </Button>
        )}
      </div>

      {/* Create Deal Form */}
      {showCreateForm && canCreateDeal && (
        <form onSubmit={handleCreateDeal} className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
          <h4 className="font-bold text-gray-800">ایجاد قرارداد جدید</h4>

          {/* Role Selection Section (when roles not defined) */}
          {!hasDefinedRoles && (
            <div className="space-y-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 text-blue-800">
                <Users size={18} />
                <span className="font-bold text-sm">انتخاب نقش‌ها در معامله</span>
              </div>
              
              {/* Warning if less than 2 participants */}
              {allParticipants.length < 2 && (
                <div className="p-2 bg-yellow-50 rounded border border-yellow-200 text-yellow-800 text-xs">
                  برای ایجاد قرارداد حداقل به دو نفر در گفتگو نیاز است.
                </div>
              )}
              
              {/* Buyer Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="text-green-600">خریدار</span> (شخصی که کالا را خریداری می‌کند)
                </label>
                <div className="space-y-2">
                  {allParticipants.map((participant) => (
                    <label 
                      key={participant.id} 
                      className={`flex items-center gap-3 p-2 rounded-lg border-2 transition-all cursor-pointer ${
                        form.selectedBuyerId === participant.id
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="buyer"
                        value={participant.id}
                        checked={form.selectedBuyerId === participant.id}
                        onChange={() => {
                          setForm({ ...form, selectedBuyerId: participant.id });
                          // If same person is selected as seller, clear seller
                          if (form.selectedSellerId === participant.id) {
                            setForm(prev => ({ ...prev, selectedSellerId: null }));
                          }
                        }}
                        className="w-4 h-4 text-green-600"
                        disabled={participant.id === form.selectedSellerId}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{participant.name}</p>
                        {participant.id === currentUserId && (
                          <p className="text-xs text-gray-500">(شما)</p>
                        )}
                      </div>
                      {participant.role === 'buyer' && (
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">خریدار</span>
                      )}
                      {participant.role === 'seller' && (
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">فروشنده</span>
                      )}
                      {form.selectedBuyerId === participant.id && (
                        <span className="text-xs px-2 py-1 bg-green-600 text-white rounded-full">انتخاب شده</span>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {/* Seller Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="text-blue-600">فروشنده</span> (شخصی که کالا را می‌فروشد)
                </label>
                <div className="space-y-2">
                  {allParticipants.map((participant) => (
                    <label 
                      key={participant.id} 
                      className={`flex items-center gap-3 p-2 rounded-lg border-2 transition-all cursor-pointer ${
                        form.selectedSellerId === participant.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="seller"
                        value={participant.id}
                        checked={form.selectedSellerId === participant.id}
                        onChange={() => {
                          setForm({ ...form, selectedSellerId: participant.id });
                          // If same person is selected as buyer, clear buyer
                          if (form.selectedBuyerId === participant.id) {
                            setForm(prev => ({ ...prev, selectedBuyerId: null }));
                          }
                        }}
                        className="w-4 h-4 text-blue-600"
                        disabled={participant.id === form.selectedBuyerId}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{participant.name}</p>
                        {participant.id === currentUserId && (
                          <p className="text-xs text-gray-500">(شما)</p>
                        )}
                      </div>
                      {participant.role === 'buyer' && (
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">خریدار</span>
                      )}
                      {participant.role === 'seller' && (
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">فروشنده</span>
                      )}
                      {form.selectedSellerId === participant.id && (
                        <span className="text-xs px-2 py-1 bg-blue-600 text-white rounded-full">انتخاب شده</span>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {/* Display selected roles summary */}
              {form.selectedBuyerId && form.selectedSellerId && (
                <div className="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <p className="text-sm font-bold text-emerald-800 mb-2">خلاصه معامله:</p>
                  <div className="space-y-1 text-sm">
                    <p className="text-emerald-700">
                      <span className="font-bold">خریدار:</span> {
                        allParticipants.find(p => p.id === form.selectedBuyerId)?.name
                      } {form.selectedBuyerId === currentUserId && '(شما)'}
                    </p>
                    <p className="text-emerald-700">
                      <span className="font-bold">فروشنده:</span> {
                        allParticipants.find(p => p.id === form.selectedSellerId)?.name
                      } {form.selectedSellerId === currentUserId && '(شما)'}
                    </p>
                    {form.selectedBuyerId === currentUserId && (
                      <p className="text-xs text-emerald-600 mt-2">✓ شما به عنوان خریدار هستید</p>
                    )}
                    {form.selectedSellerId === currentUserId && (
                      <p className="text-xs text-emerald-600 mt-2">✓ شما به عنوان فروشنده هستید</p>
                    )}
                  </div>
                </div>
              )}

              {(!form.selectedBuyerId || !form.selectedSellerId) && (
                <p className="text-xs text-amber-600 mt-2">
                  ⚠️ لطفاً خریدار و فروشنده را انتخاب کنید (نمی‌توانند یک نفر باشند)
                </p>
              )}
            </div>
          )}

          {/* Show existing roles if defined */}
          {hasDefinedRoles && (
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="flex items-center gap-2 text-emerald-800">
                <Shield size={18} />
                <span className="font-bold text-sm">نقش‌های تعیین شده در چت</span>
              </div>
              <p className="text-xs text-emerald-700 mt-2">
                <span className="font-bold">خریدار:</span> {getParticipantDisplayName(buyerParticipant)}
              </p>
              <p className="text-xs text-emerald-700 mt-1">
                <span className="font-bold">فروشنده:</span> {getParticipantDisplayName(sellerParticipant)}
              </p>
              {isBuyer && <p className="text-xs text-emerald-600 mt-2">✓ شما به عنوان خریدار هستید و می‌توانید قرارداد ایجاد کنید</p>}
              {isSeller && <p className="text-xs text-emerald-600 mt-2">✓ شما به عنوان فروشنده هستید و باید منتظر ایجاد قرارداد توسط خریدار باشید</p>}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">عنوان قرارداد</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="مثلاً: خرید 5 کیلو پسته اکبری"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">واحد</label>
              <select
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white"
              >
                {UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">قیمت واحد (تومان)</label>
              <input
                type="number"
                value={form.pricePerUnit}
                onChange={(e) => setForm({ ...form, pricePerUnit: e.target.value })}
                placeholder="مبلغ"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                required min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">تعداد</label>
              <input
                type="number"
                value={form.count}
                onChange={(e) => setForm({ ...form, count: e.target.value })}
                placeholder="تعداد"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                required min="1"
              />
            </div>
          </div>

          {/* Total Price Display */}
          {totalPrice > 0 && (
            <div className="p-3 bg-emerald-50 rounded-lg text-center">
              <p className="text-sm text-gray-600">مبلغ کل</p>
              <p className="text-xl font-bold text-emerald-700">{formatPrice(totalPrice * 10)}</p>
            </div>
          )}

          {isMarketingChat && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">کد قرارداد بازاریابی</label>
              <input
                type="text"
                value={form.contractCode}
                onChange={(e) => setForm({ ...form, contractCode: e.target.value })}
                placeholder="کد قرارداد را وارد کنید"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-sm"
                required
              />
            </div>
          )}

          {isMarketingChat && (
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-sm space-y-2">
              <p className="text-amber-800 font-medium">قرارداد بازاریابی متصل است</p>
              <p className="text-amber-700">وضعیت قرارداد: <span className="font-semibold">{contractStatusLabel}</span></p>
              <p className="text-amber-700">کمیسیون بازاریاب: <span className="font-semibold">{formatPrice(marketingCommission * 10)}</span></p>
              {tradeContract?.commission?.status === 'deposited' && (
                <p className="text-amber-700">این مبلغ نزد خریدار مسدود است و پس از اتمام معامله آزاد می‌شود.</p>
              )}
              {form.paymentMethod === 'fobino_secure' ? (
                <p className="text-emerald-700">پرداخت امن فوبینو انتخاب شده است؛ کارمزد اضافی کسر نمی‌شود.</p>
              ) : (
                <p className="text-amber-700">کارمزد فوبینو (۱۰٪): {formatPrice(marketingFee * 10)} · دریافتی بازاریاب: {formatPrice(marketingNet * 10)}</p>
              )}
              {!canCreateMarketingDeal && (
                <p className="text-red-600">برای ایجاد معامله، وضعیت قرارداد باید «کمیسیون واریز شد» یا «ارتباط برقرار شد» باشد.</p>
              )}
            </div>
          )}

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">روش پرداخت</label>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  key={pm.value}
                  type="button"
                  onClick={() => setForm({ ...form, paymentMethod: pm.value })}
                  className={`p-3 rounded-lg border-2 text-right transition-all ${
                    form.paymentMethod === pm.value
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <pm.icon size={16} className={form.paymentMethod === pm.value ? 'text-emerald-600' : 'text-gray-400'} />
                    <span className="text-sm font-medium">{pm.label}</span>
                  </div>
                  <p className="text-xs text-gray-500">{pm.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Pre-contract percentage (fobino_secure only) */}
          {form.paymentMethod === 'fobino_secure' && (
            <div className="p-3 bg-blue-50 rounded-lg space-y-3">
              <div>
                <label className="block text-sm font-medium text-blue-800 mb-1">درصد پیش‌قرارداد</label>
                <input
                  type="number"
                  value={form.preContractPercentage}
                  onChange={(e) => setForm({ ...form, preContractPercentage: e.target.value })}
                  className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  min="1" max="100" required
                />
              </div>
              {preContractAmount > 0 && (
                <div className="text-sm space-y-1">
                  <p className="text-blue-800">مبلغ مسدودی: <span className="font-bold">{formatPrice(preContractAmount * 10)}</span></p>
                  <p className="text-blue-600 text-xs">کارمزد فوبینو (۱٪): {formatPrice(commissionAmount * 10)}</p>
                  <p className="text-blue-600 text-xs">مبلغ دریافتی فروشنده: {formatPrice((preContractAmount - commissionAmount) * 10)}</p>
                </div>
              )}
            </div>
          )}

          {/* Terms */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">شرایط (اختیاری)</label>
            <textarea
              value={form.terms}
              onChange={(e) => setForm({ ...form, terms: e.target.value })}
              placeholder="شرایط تحویل، بسته‌بندی، ..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
              rows={2}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            loading={actionLoading} 
            disabled={
              (!hasDefinedRoles && (!form.selectedBuyerId || !form.selectedSellerId || form.selectedBuyerId === form.selectedSellerId)) || 
              !canCreateMarketingDeal
            }
          >
            ایجاد قرارداد
          </Button>
        </form>
      )}

      {/* Deals List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto"></div>
        </div>
      ) : deals.length === 0 && !showCreateForm ? (
        <div className="text-center py-8 text-gray-500">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm">هنوز قراردادی ایجاد نشده</p>
          {canCreateDeal && <p className="text-xs mt-1">با کلیک روی "قرارداد جدید" یک قرارداد ایجاد کنید</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {deals.map((deal) => {
            const statusInfo = STATUS_MAP[deal.status] || { label: deal.status, color: 'bg-gray-100 text-gray-800', icon: Clock };
            const StatusIcon = statusInfo.icon;
            const isExpanded = expandedDeal === deal._id;

            return (
              <div key={deal._id} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                {/* Deal Header */}
                <button
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedDeal(isExpanded ? null : deal._id)}
                >
                  <div className="flex items-center gap-3 text-right">
                    <StatusIcon size={18} className={statusInfo.color.includes('green') ? 'text-green-600' : statusInfo.color.includes('yellow') ? 'text-yellow-600' : 'text-gray-600'} />
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{deal.title}</p>
                      <p className="text-xs text-gray-500">{deal.dealNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
                    {/* Deal Info Grid */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-xs text-gray-500">قیمت واحد</p>
                        <p className="font-bold">{formatPrice((deal.pricePerUnit || 0) * 10)}</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-xs text-gray-500">تعداد</p>
                        <p className="font-bold">{toPersianNumber(deal.count)} {UNITS.find(u => u.value === deal.unit)?.label}</p>
                      </div>
                      <div className="bg-emerald-50 p-2 rounded col-span-2">
                        <p className="text-xs text-gray-500">مبلغ کل</p>
                        <p className="font-bold text-emerald-700">{formatPrice((deal.totalPrice || 0) * 10)}</p>
                      </div>
                    </div>

                    {/* Buyer and Seller Info */}
                    {(deal.buyer || deal.seller) && (
                      <div className="p-2 bg-gray-50 rounded-lg text-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-500">خریدار</p>
                            <p className="font-medium text-green-700">
                              {(() => {
                                const buyerId = typeof deal.buyer === 'object' ? deal.buyer?._id : deal.buyer;
                                const buyerName = typeof deal.buyer === 'object' 
                                  ? (deal.buyer?.fullName || deal.buyer?.name || 'نامشخص')
                                  : 'نامشخص';
                                return `${buyerName}${buyerId === currentUserId ? ' (شما)' : ''}`;
                              })()}
                            </p>
                          </div>
                          <ArrowRight size={14} className="text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-500">فروشنده</p>
                            <p className="font-medium text-blue-700">
                              {(() => {
                                const sellerId = typeof deal.seller === 'object' ? deal.seller?._id : deal.seller;
                                const sellerName = typeof deal.seller === 'object' 
                                  ? (deal.seller?.fullName || deal.seller?.name || 'نامشخص')
                                  : 'نامشخص';
                                return `${sellerName}${sellerId === currentUserId ? ' (شما)' : ''}`;
                              })()}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Payment Method */}
                    <div className="text-sm">
                      <span className="text-gray-500">روش پرداخت: </span>
                      <span className="font-medium">
                        {PAYMENT_METHODS.find(p => p.value === deal.paymentMethod)?.label || deal.paymentMethod}
                      </span>
                    </div>

                    {/* Pre-contract info */}
                    {deal.paymentMethod === 'fobino_secure' && deal.preContract?.amount > 0 && (
                      <div className="p-2 bg-blue-50 rounded-lg text-sm">
                        <p className="text-blue-800">مبلغ مسدودی: <span className="font-bold">{formatPrice(deal.preContract.amount * 10)}</span> ({toPersianNumber(deal.preContract.percentage)}٪)</p>
                        <p className="text-blue-600 text-xs">کارمزد فوبینو: {formatPrice((deal.commission?.amount || 0) * 10)}</p>
                      </div>
                    )}

                    {/* Terms */}
                    {deal.terms && (
                      <div className="text-sm">
                        <span className="text-gray-500">شرایط: </span>
                        <span>{deal.terms}</span>
                      </div>
                    )}

                    {/* Status Actions */}
                    <div className="flex gap-2 flex-wrap pt-2 border-t border-gray-100">
                      {renderDealActions(deal)}
                    </div>

                    {/* Review Section */}
                    {renderReviewPanel(deal)}

                    {/* Shipping Section */}
                    {renderShippingSection(deal)}

                    {/* Inspection Section */}
                    {renderInspectionSection(deal)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Shipping Request Modal */}
      <Modal
        isOpen={shippingModal.open}
        onClose={() => setShippingModal({ open: false, dealId: null })}
        title="درخواست ارسال فوبینو"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">شهر مبدا ارسال</label>
            <input
              type="text"
              value={shippingForm.shippingCity}
              onChange={(e) => setShippingForm({ ...shippingForm, shippingCity: e.target.value })}
              placeholder="مثلاً: تهران"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">شهر مقصد تحویل</label>
            <input
              type="text"
              value={shippingForm.deliveryCity}
              onChange={(e) => setShippingForm({ ...shippingForm, deliveryCity: e.target.value })}
              placeholder="مثلاً: اصفهان"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setShippingModal({ open: false, dealId: null })}>انصراف</Button>
            <Button size="sm" onClick={submitShippingRequest} loading={actionLoading}
              disabled={!shippingForm.shippingCity || !shippingForm.deliveryCity}>
              <Truck size={14} /> ثبت درخواست
            </Button>
          </div>
        </div>
      </Modal>

      {/* Inspection Request Modal */}
      <Modal
        isOpen={inspectionModal.open}
        onClose={() => setInspectionModal({ open: false, dealId: null })}
        title="درخواست بازرسی فوبینو"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">آدرس دقیق محل بازرسی</label>
            <textarea
              value={inspectionForm.location}
              onChange={(e) => setInspectionForm({ location: e.target.value })}
              placeholder="آدرس کامل محل بازرسی کالا..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-sm"
              rows={3}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setInspectionModal({ open: false, dealId: null })}>انصراف</Button>
            <Button size="sm" onClick={submitInspectionRequest} loading={actionLoading}
              disabled={!inspectionForm.location}>
              <SearchIcon size={14} /> ثبت درخواست
            </Button>
          </div>
        </div>
      </Modal>

      {/* Cancel Deal Modal */}
      <Modal
        isOpen={cancelModal.open}
        onClose={() => setCancelModal({ open: false, dealId: null })}
        title="لغو قرارداد"
      >
        <div className="space-y-4">
          <p className="text-sm text-red-600">آیا مطمئن هستید که می‌خواهید این قرارداد را لغو کنید؟</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">دلیل لغو</label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="دلیل لغو قرارداد را بنویسید..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
              rows={3}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setCancelModal({ open: false, dealId: null })}>انصراف</Button>
            <Button size="sm" variant="danger" onClick={submitCancel} loading={actionLoading}
              disabled={!cancelReason}>
              <XCircle size={14} /> لغو قرارداد
            </Button>
          </div>
        </div>
      </Modal>

      <ReviewCreateModal
        isOpen={reviewModal.open}
        onClose={() => setReviewModal({ open: false, deal: null, eligibility: null })}
        deal={reviewModal.deal}
        eligibility={reviewModal.eligibility}
        onSuccess={handleReviewSuccess}
      />
    </div>
  );
}
/* frontend/my-app/src/components/deal/DealPanel.jsx */

// import { useState, useEffect } from 'react';
// import {
//   Package,
//   Truck,
//   Search as SearchIcon,
//   FileText,
//   CheckCircle,
//   XCircle,
//   Clock,
//   ChevronDown,
//   ChevronUp,
//   AlertTriangle,
//   DollarSign,
//   MapPin,
//   Plus,
//   Shield,
//   CreditCard,
//   RefreshCw,
//   Star,
//   MessageSquareText,
// } from 'lucide-react';

// import { Button, Modal } from '../ui';
// import dealService from '../../services/dealService';
// import userReviewService from '../../services/userReviewService';
// import ReviewCreateModal from '../reviews/ReviewCreateModal';
// import useAuthStore from '../../store/authStore';
// import { formatPrice, toPersianNumber } from '../../utils/helpers';

// const PAYMENT_METHODS = [
//   {
//     value: 'fobino_secure',
//     label: 'پرداخت امن فوبینو',
//     icon: Shield,
//     desc: 'مبلغ در کیف پول مسدود و پس از تایید آزاد می‌شود',
//   },
//   {
//     value: 'credit',
//     label: 'اعتباری',
//     icon: CreditCard,
//     desc: 'پرداخت اعتباری',
//   },
//   {
//     value: 'tahator',
//     label: 'تهاتر',
//     icon: RefreshCw,
//     desc: 'مبادله کالا به کالا',
//   },
//   {
//     value: 'cash',
//     label: 'نقدی',
//     icon: DollarSign,
//     desc: 'پرداخت نقدی',
//   },
// ];

// const UNITS = [
//   { value: 'ton', label: 'تن' },
//   { value: 'kg', label: 'کیلوگرم' },
//   { value: 'gram', label: 'گرم' },
//   { value: 'meter', label: 'متر' },
//   { value: 'sqm', label: 'متر مربع' },
//   { value: 'piece', label: 'عدد' },
//   { value: 'pack', label: 'بسته' },
//   { value: 'roll', label: 'رول' },
//   { value: 'liter', label: 'لیتر' },
//   { value: 'box', label: 'جعبه' },
// ];

// const STATUS_MAP = {
//   pending: {
//     label: 'در انتظار تایید',
//     color: 'bg-yellow-100 text-yellow-800',
//     icon: Clock,
//   },
//   open: {
//     label: 'باز',
//     color: 'bg-blue-100 text-blue-800',
//     icon: CheckCircle,
//   },
//   shipped: {
//     label: 'ارسال شده',
//     color: 'bg-purple-100 text-purple-800',
//     icon: Truck,
//   },
//   delivered: {
//     label: 'تحویل داده شده',
//     color: 'bg-indigo-100 text-indigo-800',
//     icon: Package,
//   },
//   confirmed: {
//     label: 'تایید نهایی',
//     color: 'bg-green-100 text-green-800',
//     icon: CheckCircle,
//   },
//   cancelled: {
//     label: 'لغو شده',
//     color: 'bg-gray-100 text-gray-800',
//     icon: XCircle,
//   },
// };

// export default function DealPanel({
//   chatId,
//   chatParticipants,
//   chat,
// }) {
//   const { user } = useAuthStore();

//   const [deals, setDeals] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [showCreateForm, setShowCreateForm] = useState(false);
//   const [expandedDeal, setExpandedDeal] = useState(null);
//   const [actionLoading, setActionLoading] = useState(false);

//   const [reviewModal, setReviewModal] = useState({
//     open: false,
//     deal: null,
//     eligibility: null,
//   });

//   const [form, setForm] = useState({
//     title: '',
//     unit: 'kg',
//     pricePerUnit: '',
//     count: '',
//     paymentMethod: 'fobino_secure',
//     preContractPercentage: 10,
//     terms: '',
//     contractCode: '',
//   });

//   /*
//    ======================================================
//    FIXED ROLE LOGIC
//    ======================================================
//   */

//   const buyerParticipant = chatParticipants?.find(
//     (p) => p.role === 'buyer'
//   );

//   const sellerParticipant = chatParticipants?.find(
//     (p) => p.role === 'seller'
//   );

//   const isBuyer =
//     buyerParticipant?.user?._id === user?._id ||
//     buyerParticipant?.user === user?._id;

//   const isSeller =
//     sellerParticipant?.user?._id === user?._id ||
//     sellerParticipant?.user === user?._id;

//   const hasExplicitRoles =
//     Boolean(buyerParticipant) || Boolean(sellerParticipant);

//   /*
//    If roles exist:
//    - sell post → buyer creates
//    - buy post → seller creates

//    If roles DON'T exist:
//    - both participants can create
//   */
//   const canCreateDeal = hasExplicitRoles
//     ? chat?.post?.type === 'sell'
//       ? isBuyer
//       : chat?.post?.type === 'buy'
//       ? isSeller
//       : (isBuyer || isSeller)
//     : true;

//   /*
//    ======================================================
//    MARKETING CONTRACT LOGIC
//    ======================================================
//   */

//   const tradeContract = chat?.tradeContract;
//   const isMarketingChat = Boolean(tradeContract);

//   const canCreateMarketingDeal =
//     !isMarketingChat ||
//     ['commission_deposited', 'contacts_shared'].includes(
//       tradeContract?.status
//     );

//   useEffect(() => {
//     fetchDeals();
//   }, [chatId]);

//   const fetchDeals = async () => {
//     try {
//       setLoading(true);

//       const response = await dealService.getDeals({});

//       if (response.success) {
//         const chatDeals = (response.data || []).filter((deal) => {
//           const dealChatId =
//             typeof deal.chat === 'object'
//               ? deal.chat?._id
//               : deal.chat;

//           return dealChatId === chatId;
//         });

//         setDeals(chatDeals);
//       }
//     } catch (error) {
//       console.error(error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCreateDeal = async (e) => {
//     e.preventDefault();

//     if (actionLoading) return;

//     try {
//       setActionLoading(true);

//       const payload = {
//         chatId,
//         title: form.title,
//         unit: form.unit,
//         pricePerUnit: Number(form.pricePerUnit),
//         count: Number(form.count),
//         paymentMethod: form.paymentMethod,
//         terms: form.terms,
//       };

//       if (form.paymentMethod === 'fobino_secure') {
//         payload.preContractPercentage = Number(
//           form.preContractPercentage
//         );
//       }

//       if (isMarketingChat) {
//         payload.contractCode = form.contractCode;
//         payload.tradeContractId =
//           tradeContract?._id || tradeContract;
//       }

//       const response = await dealService.createDeal(payload);

//       if (response.success) {
//         setShowCreateForm(false);

//         setForm({
//           title: '',
//           unit: 'kg',
//           pricePerUnit: '',
//           count: '',
//           paymentMethod: 'fobino_secure',
//           preContractPercentage: 10,
//           terms: '',
//           contractCode: '',
//         });

//         fetchDeals();
//       }
//     } catch (error) {
//       alert(
//         error?.response?.data?.message ||
//           'خطا در ایجاد قرارداد'
//       );
//     } finally {
//       setActionLoading(false);
//     }
//   };

//   const totalPrice =
//     Number(form.pricePerUnit || 0) *
//     Number(form.count || 0);

//   return (
//     <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-200px)]">

//       {/* HEADER */}
//       <div className="flex items-center justify-between">
//         <h3 className="font-bold text-gray-900">
//           قراردادها
//         </h3>

//         {canCreateDeal && (
//           <Button
//             size="sm"
//             variant={
//               showCreateForm ? 'ghost' : 'primary'
//             }
//             onClick={() =>
//               setShowCreateForm(!showCreateForm)
//             }
//           >
//             {showCreateForm ? (
//               <XCircle size={14} />
//             ) : (
//               <Plus size={14} />
//             )}

//             {showCreateForm
//               ? 'انصراف'
//               : 'قرارداد جدید'}
//           </Button>
//         )}
//       </div>

//       {/* CREATE FORM */}
//       {showCreateForm && canCreateDeal && (
//         <form
//           onSubmit={handleCreateDeal}
//           className="p-4 bg-white border rounded-xl space-y-4"
//         >
//           <h4 className="font-bold">
//             ایجاد قرارداد جدید
//           </h4>

//           <input
//             type="text"
//             placeholder="عنوان قرارداد"
//             value={form.title}
//             onChange={(e) =>
//               setForm({
//                 ...form,
//                 title: e.target.value,
//               })
//             }
//             className="w-full border rounded-lg px-3 py-2"
//             required
//           />

//           <div className="grid grid-cols-3 gap-3">
//             <input
//               type="number"
//               placeholder="قیمت واحد"
//               value={form.pricePerUnit}
//               onChange={(e) =>
//                 setForm({
//                   ...form,
//                   pricePerUnit:
//                     e.target.value,
//                 })
//               }
//               className="border rounded-lg px-3 py-2"
//               required
//             />

//             <input
//               type="number"
//               placeholder="تعداد"
//               value={form.count}
//               onChange={(e) =>
//                 setForm({
//                   ...form,
//                   count: e.target.value,
//                 })
//               }
//               className="border rounded-lg px-3 py-2"
//               required
//             />

//             <select
//               value={form.unit}
//               onChange={(e) =>
//                 setForm({
//                   ...form,
//                   unit: e.target.value,
//                 })
//               }
//               className="border rounded-lg px-3 py-2"
//             >
//               {UNITS.map((unit) => (
//                 <option
//                   key={unit.value}
//                   value={unit.value}
//                 >
//                   {unit.label}
//                 </option>
//               ))}
//             </select>
//           </div>

//           {totalPrice > 0 && (
//             <div className="bg-blue-50 p-3 rounded-lg text-center">
//               <p className="text-sm text-gray-600">
//                 مبلغ کل
//               </p>
//               <p className="font-bold text-blue-700">
//                 {formatPrice(totalPrice * 10)}
//               </p>
//             </div>
//           )}

//           <textarea
//             placeholder="شرایط قرارداد"
//             value={form.terms}
//             onChange={(e) =>
//               setForm({
//                 ...form,
//                 terms: e.target.value,
//               })
//             }
//             className="w-full border rounded-lg px-3 py-2"
//             rows={3}
//           />

//           <Button
//             type="submit"
//             className="w-full"
//             loading={actionLoading}
//             disabled={!canCreateMarketingDeal}
//           >
//             ایجاد قرارداد
//           </Button>
//         </form>
//       )}

//       {/* DEAL LIST */}
//       {loading ? (
//         <div className="text-center py-10">
//           <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
//         </div>
//       ) : deals.length === 0 ? (
//         <div className="text-center py-10 text-gray-500">
//           <Package className="w-10 h-10 mx-auto mb-3 text-gray-300" />

//           <p>هنوز قراردادی ثبت نشده</p>

//           {canCreateDeal && (
//             <p className="text-sm mt-2">
//               برای شروع روی "قرارداد جدید" کلیک کنید
//             </p>
//           )}
//         </div>
//       ) : (
//         <div className="space-y-3">
//           {deals.map((deal) => {
//             const status =
//               STATUS_MAP[deal.status] ||
//               STATUS_MAP.pending;

//             const StatusIcon = status.icon;

//             return (
//               <div
//                 key={deal._id}
//                 className="bg-white border rounded-xl overflow-hidden"
//               >
//                 <button
//                   className="w-full p-4 flex justify-between items-center"
//                   onClick={() =>
//                     setExpandedDeal(
//                       expandedDeal === deal._id
//                         ? null
//                         : deal._id
//                     )
//                   }
//                 >
//                   <div className="text-right">
//                     <p className="font-bold">
//                       {deal.title}
//                     </p>
//                     <p className="text-sm text-gray-500">
//                       {deal.dealNumber}
//                     </p>
//                   </div>

//                   <div className="flex items-center gap-2">
//                     <span
//                       className={`px-2 py-1 rounded-full text-xs ${status.color}`}
//                     >
//                       {status.label}
//                     </span>

//                     <StatusIcon size={16} />
//                   </div>
//                 </button>

//                 {expandedDeal === deal._id && (
//                   <div className="p-4 border-t bg-gray-50">
//                     <p>
//                       مبلغ کل:
//                       {' '}
//                       {formatPrice(
//                         (deal.totalPrice || 0) * 10
//                       )}
//                     </p>

//                     <p>
//                       تعداد:
//                       {' '}
//                       {toPersianNumber(
//                         deal.count
//                       )}
//                     </p>

//                     {deal.terms && (
//                       <p className="mt-2 text-sm text-gray-600">
//                         {deal.terms}
//                       </p>
//                     )}
//                   </div>
//                 )}
//               </div>
//             );
//           })}
//         </div>
//       )}

//       <ReviewCreateModal
//         isOpen={reviewModal.open}
//         onClose={() =>
//           setReviewModal({
//             open: false,
//             deal: null,
//             eligibility: null,
//           })
//         }
//         deal={reviewModal.deal}
//         eligibility={reviewModal.eligibility}
//       />
//     </div>
//   );
// }
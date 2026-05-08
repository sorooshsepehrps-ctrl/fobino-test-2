import { useState, useEffect } from 'react';
import {
  Truck,
  Search as SearchIcon,
  Package,
  FileText,
  Clock,
  CheckCircle,
  DollarSign,
  MapPin,
  Users,
  BarChart3,
  RefreshCw,
  Eye,
  ChevronDown,
  ChevronUp,
  Upload,
  Hash,
  AlertTriangle,
  Factory,
} from 'lucide-react';
import { Button, Modal, Card } from '../../components/ui';
import adminService from '../../services/adminService';
import producerVerificationService from '../../services/producerVerificationService';
import useAuthStore from '../../store/authStore';
import { formatPrice, toPersianNumber } from '../../utils/helpers';

const SHIPPING_STATUS_MAP = {
  pending: { label: 'در انتظار تخمین', color: 'bg-yellow-100 text-yellow-800' },
  estimated: { label: 'تخمین زده شده', color: 'bg-blue-100 text-blue-800' },
  agreed: { label: 'موافقت شده', color: 'bg-green-100 text-green-800' },
  disagreed: { label: 'رد شده', color: 'bg-red-100 text-red-800' },
  shipped: { label: 'ارسال شده', color: 'bg-purple-100 text-purple-800' },
  waiting_for_factor: { label: 'در انتظار فاکتور', color: 'bg-orange-100 text-orange-800' },
  factored: { label: 'فاکتور صادر شده', color: 'bg-gray-100 text-gray-800' },
};

const INSPECTION_STATUS_MAP = {
  pending: { label: 'در انتظار تخمین', color: 'bg-yellow-100 text-yellow-800' },
  estimated: { label: 'تخمین زده شده', color: 'bg-blue-100 text-blue-800' },
  paid: { label: 'پرداخت شده', color: 'bg-green-100 text-green-800' },
  inspected: { label: 'بازرسی شده', color: 'bg-purple-100 text-purple-800' },
  waiting_for_factor: { label: 'در انتظار فاکتور', color: 'bg-orange-100 text-orange-800' },
  factored: { label: 'فاکتور صادر شده', color: 'bg-gray-100 text-gray-800' },
};

export default function AdminPanel() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('shipping');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);

  // Shipping state
  const [shippingRequests, setShippingRequests] = useState([]);
  const [shippingFilter, setShippingFilter] = useState('');
  const [expandedShipping, setExpandedShipping] = useState(null);

  // Inspection state
  const [inspectionRequests, setInspectionRequests] = useState([]);
  const [inspectionFilter, setInspectionFilter] = useState('');
  const [expandedInspection, setExpandedInspection] = useState(null);

  // Deals state
  const [deals, setDeals] = useState([]);
  const [dealFilter, setDealFilter] = useState('');

  // Producer verification state
  const [producerVerifications, setProducerVerifications] = useState([]);

  // Action modals
  const [actionLoading, setActionLoading] = useState(false);
  const [estimateModal, setEstimateModal] = useState({ open: false, id: null, type: null });
  const [estimatePrice, setEstimatePrice] = useState('');
  const [shipModal, setShipModal] = useState({ open: false, id: null });
  const [trackingCode, setTrackingCode] = useState('');
  const [resultModal, setResultModal] = useState({ open: false, id: null });
  const [inspectionResult, setInspectionResult] = useState('');
  const [factorModal, setFactorModal] = useState({ open: false, id: null, type: null });
  const [factorUrl, setFactorUrl] = useState('');

  const isAdmin = user?.roles?.includes('admin');

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
      fetchData();
    }
  }, [activeTab, isAdmin]);

  const fetchStats = async () => {
    try {
      const res = await adminService.getDashboardStats();
      if (res.success) setStats(res.data);
    } catch (e) { console.error(e); }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'shipping') {
        const params = shippingFilter ? { status: shippingFilter } : {};
        const res = await adminService.getShippingRequests(params);
        if (res.success) setShippingRequests(res.data || []);
      } else if (activeTab === 'inspection') {
        const params = inspectionFilter ? { status: inspectionFilter } : {};
        const res = await adminService.getInspectionRequests(params);
        if (res.success) setInspectionRequests(res.data || []);
      } else if (activeTab === 'deals') {
        const params = dealFilter ? { status: dealFilter } : {};
        const res = await adminService.getDeals(params);
        if (res.success) setDeals(res.data || []);
      } else if (activeTab === 'producer-verifications') {
        const res = await producerVerificationService.adminList();
        if (res.success) setProducerVerifications(res.data?.items || []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (isAdmin) fetchData();
  }, [shippingFilter, inspectionFilter, dealFilter]);

  // Actions
  const handleEstimate = async () => {
    if (!estimatePrice || Number(estimatePrice) <= 0) return;
    try {
      setActionLoading(true);
      if (estimateModal.type === 'shipping') {
        await adminService.estimateShippingPrice(estimateModal.id, Number(estimatePrice));
      } else {
        await adminService.estimateInspectionPrice(estimateModal.id, Number(estimatePrice));
      }
      setEstimateModal({ open: false, id: null, type: null });
      setEstimatePrice('');
      fetchData();
    } catch (e) {
      alert(e.response?.data?.message || 'خطا');
    } finally { setActionLoading(false); }
  };

  const handleShip = async () => {
    if (!trackingCode) return;
    try {
      setActionLoading(true);
      await adminService.shipOrder(shipModal.id, trackingCode);
      setShipModal({ open: false, id: null });
      setTrackingCode('');
      fetchData();
    } catch (e) {
      alert(e.response?.data?.message || 'خطا');
    } finally { setActionLoading(false); }
  };

  const handleResult = async () => {
    if (!inspectionResult) return;
    try {
      setActionLoading(true);
      await adminService.provideInspectionResult(resultModal.id, inspectionResult);
      setResultModal({ open: false, id: null });
      setInspectionResult('');
      fetchData();
    } catch (e) {
      alert(e.response?.data?.message || 'خطا');
    } finally { setActionLoading(false); }
  };

  const getProducerReviewLevel = (item) => {
    if (item?.levels?.level3?.status === 'pending' || item?.levels?.level3?.status === 'visited') return 3;
    if (item?.levels?.level2?.status === 'pending' || item?.levels?.level2?.status === 'revision_pending') return 2;
    return 1;
  };

  const handleProducerReview = async (item, action) => {
    const level = getProducerReviewLevel(item);
    try {
      setActionLoading(true);
      if (action === 'approve') {
        await producerVerificationService.adminApprove(item._id, level);
      } else {
        const reason = window.prompt('دلیل رد یا اصلاح را وارد کنید') || 'نیازمند اصلاح اطلاعات';
        await producerVerificationService.adminRequestResubmit(item._id, level, reason);
      }
      fetchData();
    } catch (e) {
      alert(e.response?.data?.message || 'خطا');
    } finally { setActionLoading(false); }
  };

  const handleFactor = async () => {
    if (!factorUrl) return;
    try {
      setActionLoading(true);
      const data = { imageUrl: factorUrl, cloudinaryId: '' };
      if (factorModal.type === 'shipping') {
        await adminService.uploadShippingFactor(factorModal.id, data);
      } else {
        await adminService.uploadInspectionFactor(factorModal.id, data);
      }
      setFactorModal({ open: false, id: null, type: null });
      setFactorUrl('');
      fetchData();
    } catch (e) {
      alert(e.response?.data?.message || 'خطا');
    } finally { setActionLoading(false); }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">دسترسی غیرمجاز</h2>
          <p className="text-gray-500">فقط مدیران سیستم به این بخش دسترسی دارند</p>
        </div>
      </div>
    );
  }

  const formatDate = (d) => {
    if (!d) return '-';
    return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(d));
  };

  return (
    <div className="p-4 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">پنل مدیریت</h1>
        <Button variant="ghost" size="sm" onClick={() => { fetchStats(); fetchData(); }}>
          <RefreshCw size={16} /> بروزرسانی
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">کاربران</p>
                <p className="text-xl font-bold text-gray-900">{toPersianNumber(stats.usersCount || 0)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Package size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">آگهی‌ها</p>
                <p className="text-xl font-bold text-gray-900">{toPersianNumber(stats.postsCount || 0)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">قراردادها</p>
                <p className="text-xl font-bold text-gray-900">{toPersianNumber(stats.dealsCount || 0)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock size={20} className="text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">احراز هویت در انتظار</p>
                <p className="text-xl font-bold text-gray-900">{toPersianNumber(stats.pendingVerifications || 0)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          { key: 'shipping', label: 'ارسال فوبینو', icon: Truck },
          { key: 'inspection', label: 'بازرسی فوبینو', icon: SearchIcon },
          { key: 'deals', label: 'قراردادها', icon: FileText },
          { key: 'producer-verifications', label: 'احراز تولیدکننده', icon: Factory },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <>
          {/* ===== SHIPPING TAB ===== */}
          {activeTab === 'shipping' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-500">فیلتر:</span>
                {['', 'pending', 'estimated', 'agreed', 'shipped', 'waiting_for_factor'].map(s => (
                  <button key={s} onClick={() => setShippingFilter(s)}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                      shippingFilter === s ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                    }`}>
                    {s === '' ? 'همه' : SHIPPING_STATUS_MAP[s]?.label || s}
                  </button>
                ))}
              </div>

              {shippingRequests.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Truck className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>درخواست ارسالی یافت نشد</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {shippingRequests.map(s => {
                    const statusInfo = SHIPPING_STATUS_MAP[s.status] || { label: s.status, color: 'bg-gray-100 text-gray-800' };
                    const isExpanded = expandedShipping === s._id;
                    return (
                      <div key={s._id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50" onClick={() => setExpandedShipping(isExpanded ? null : s._id)}>
                          <div className="flex items-center gap-3 text-right">
                            <Truck size={18} className="text-purple-600" />
                            <div>
                              <p className="font-bold text-gray-900 text-sm">{s.deal?.dealNumber || 'بدون شماره'} - {s.deal?.title || ''}</p>
                              <p className="text-xs text-gray-500">{s.shippingCity} → {s.deliveryCity}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </div>
                        </button>
                        {isExpanded && (
                          <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div><span className="text-gray-500">خریدار: </span><span className="font-medium">{s.buyer?.firstName} {s.buyer?.lastName}</span></div>
                              <div><span className="text-gray-500">تلفن: </span><span className="font-mono">{s.buyer?.phone}</span></div>
                              <div><span className="text-gray-500">مبدا: </span><span className="font-medium">{s.shippingCity}</span></div>
                              <div><span className="text-gray-500">مقصد: </span><span className="font-medium">{s.deliveryCity}</span></div>
                              {s.price > 0 && <div><span className="text-gray-500">قیمت: </span><span className="font-bold text-emerald-700">{formatPrice(s.price * 10)}</span></div>}
                              {s.trackingCode && <div><span className="text-gray-500">کد رهگیری: </span><span className="font-mono font-bold">{s.trackingCode}</span></div>}
                              <div><span className="text-gray-500">تاریخ: </span><span>{formatDate(s.createdAt)}</span></div>
                              <div><span className="text-gray-500">قرارداد: </span><span className="font-medium">{formatPrice((s.deal?.totalPrice || 0) * 10)}</span></div>
                            </div>
                            {s.factor?.imageUrl && (
                              <a href={s.factor.imageUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline flex items-center gap-1">
                                <Eye size={14} /> مشاهده فاکتور
                              </a>
                            )}
                            <div className="flex gap-2 flex-wrap pt-2 border-t border-gray-100">
                              {s.status === 'pending' && (
                                <Button size="sm" onClick={() => { setEstimatePrice(''); setEstimateModal({ open: true, id: s._id, type: 'shipping' }); }}>
                                  <DollarSign size={14} /> تخمین قیمت
                                </Button>
                              )}
                              {s.status === 'agreed' && (
                                <Button size="sm" onClick={() => { setTrackingCode(''); setShipModal({ open: true, id: s._id }); }}>
                                  <Truck size={14} /> ثبت ارسال
                                </Button>
                              )}
                              {s.status === 'waiting_for_factor' && (
                                <Button size="sm" onClick={() => { setFactorUrl(''); setFactorModal({ open: true, id: s._id, type: 'shipping' }); }}>
                                  <Upload size={14} /> آپلود فاکتور
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ===== INSPECTION TAB ===== */}
          {activeTab === 'inspection' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-500">فیلتر:</span>
                {['', 'pending', 'estimated', 'paid', 'inspected', 'waiting_for_factor'].map(s => (
                  <button key={s} onClick={() => setInspectionFilter(s)}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                      inspectionFilter === s ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                    }`}>
                    {s === '' ? 'همه' : INSPECTION_STATUS_MAP[s]?.label || s}
                  </button>
                ))}
              </div>

              {inspectionRequests.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <SearchIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>درخواست بازرسی یافت نشد</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {inspectionRequests.map(ins => {
                    const statusInfo = INSPECTION_STATUS_MAP[ins.status] || { label: ins.status, color: 'bg-gray-100 text-gray-800' };
                    const isExpanded = expandedInspection === ins._id;
                    return (
                      <div key={ins._id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50" onClick={() => setExpandedInspection(isExpanded ? null : ins._id)}>
                          <div className="flex items-center gap-3 text-right">
                            <SearchIcon size={18} className="text-amber-600" />
                            <div>
                              <p className="font-bold text-gray-900 text-sm">{ins.deal?.dealNumber || 'بدون شماره'} - {ins.deal?.title || ''}</p>
                              <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin size={12} /> {ins.location}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </div>
                        </button>
                        {isExpanded && (
                          <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div><span className="text-gray-500">خریدار: </span><span className="font-medium">{ins.buyer?.firstName} {ins.buyer?.lastName}</span></div>
                              <div><span className="text-gray-500">تلفن: </span><span className="font-mono">{ins.buyer?.phone}</span></div>
                              <div className="col-span-2"><span className="text-gray-500">محل بازرسی: </span><span className="font-medium">{ins.location}</span></div>
                              {ins.price > 0 && <div><span className="text-gray-500">هزینه: </span><span className="font-bold text-emerald-700">{formatPrice(ins.price * 10)}</span></div>}
                              <div><span className="text-gray-500">تاریخ: </span><span>{formatDate(ins.createdAt)}</span></div>
                              <div><span className="text-gray-500">قرارداد: </span><span className="font-medium">{formatPrice((ins.deal?.totalPrice || 0) * 10)}</span></div>
                            </div>
                            {ins.result && (
                              <div className="p-3 bg-amber-50 rounded-lg text-sm">
                                <p className="text-gray-500 text-xs mb-1">نتیجه بازرسی:</p>
                                <p className="text-gray-800">{ins.result}</p>
                              </div>
                            )}
                            {ins.factor?.imageUrl && (
                              <a href={ins.factor.imageUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline flex items-center gap-1">
                                <Eye size={14} /> مشاهده فاکتور
                              </a>
                            )}
                            <div className="flex gap-2 flex-wrap pt-2 border-t border-gray-100">
                              {ins.status === 'pending' && (
                                <Button size="sm" onClick={() => { setEstimatePrice(''); setEstimateModal({ open: true, id: ins._id, type: 'inspection' }); }}>
                                  <DollarSign size={14} /> تخمین هزینه
                                </Button>
                              )}
                              {ins.status === 'paid' && (
                                <Button size="sm" onClick={() => { setInspectionResult(''); setResultModal({ open: true, id: ins._id }); }}>
                                  <CheckCircle size={14} /> ثبت نتیجه بازرسی
                                </Button>
                              )}
                              {ins.status === 'waiting_for_factor' && (
                                <Button size="sm" onClick={() => { setFactorUrl(''); setFactorModal({ open: true, id: ins._id, type: 'inspection' }); }}>
                                  <Upload size={14} /> آپلود فاکتور
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}



          {/* ===== PRODUCER VERIFICATIONS TAB ===== */}
          {activeTab === 'producer-verifications' && (
            <div className="space-y-4">
              {producerVerifications.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Factory className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>درخواست احراز تولیدکننده‌ای یافت نشد</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {producerVerifications.map((item) => {
                    const reviewLevel = getProducerReviewLevel(item);
                    return (
                      <div key={item._id} className="rounded-xl border border-gray-200 bg-white p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="font-bold text-gray-900">{item.production?.name || 'تولیدی بدون نام'}</p>
                            <p className="mt-1 text-xs text-gray-500">
                              {item.user?.firstName} {item.user?.lastName} · {item.user?.phone || 'بدون شماره'} · سطح عمومی {toPersianNumber(item.publicLevel || 0)}
                            </p>
                            <p className="mt-2 text-xs text-gray-500">
                              سطح ۱: {item.levels?.level1?.status} · سطح ۲: {item.levels?.level2?.status} · سطح ۳: {item.levels?.level3?.status}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" disabled={actionLoading} onClick={() => handleProducerReview(item, 'approve')}>
                              تایید سطح {toPersianNumber(reviewLevel)}
                            </Button>
                            <Button size="sm" variant="danger" disabled={actionLoading} onClick={() => handleProducerReview(item, 'resubmit')}>
                              درخواست اصلاح
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ===== DEALS TAB ===== */}
          {activeTab === 'deals' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-500">فیلتر:</span>
                {['', 'pending', 'open', 'shipped', 'delivered', 'confirmed', 'cancelled', 'disputed'].map(s => (
                  <button key={s} onClick={() => setDealFilter(s)}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                      dealFilter === s ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                    }`}>
                    {s === '' ? 'همه' : s === 'pending' ? 'در انتظار' : s === 'open' ? 'باز' : s === 'shipped' ? 'ارسال شده' : s === 'delivered' ? 'تحویل شده' : s === 'confirmed' ? 'تایید شده' : s === 'cancelled' ? 'لغو شده' : s === 'disputed' ? 'اختلاف' : s}
                  </button>
                ))}
              </div>

              {deals.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>قراردادی یافت نشد</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-gray-600">
                        <th className="text-right p-3 font-medium">شماره</th>
                        <th className="text-right p-3 font-medium">عنوان</th>
                        <th className="text-right p-3 font-medium">خریدار</th>
                        <th className="text-right p-3 font-medium">فروشنده</th>
                        <th className="text-right p-3 font-medium">مبلغ کل</th>
                        <th className="text-right p-3 font-medium">روش پرداخت</th>
                        <th className="text-right p-3 font-medium">وضعیت</th>
                        <th className="text-right p-3 font-medium">تاریخ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {deals.map(deal => (
                        <tr key={deal._id} className="hover:bg-gray-50">
                          <td className="p-3 font-mono text-xs">{deal.dealNumber}</td>
                          <td className="p-3 font-medium">{deal.title}</td>
                          <td className="p-3">{deal.buyer?.firstName} {deal.buyer?.lastName}</td>
                          <td className="p-3">{deal.seller?.firstName} {deal.seller?.lastName}</td>
                          <td className="p-3 font-bold text-emerald-700">{formatPrice((deal.totalPrice || 0) * 10)}</td>
                          <td className="p-3">
                            {deal.paymentMethod === 'fobino_secure' ? 'امن فوبینو' : deal.paymentMethod === 'credit' ? 'اعتباری' : deal.paymentMethod === 'tahator' ? 'تهاتر' : 'نقدی'}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                              deal.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                              deal.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              deal.status === 'disputed' ? 'bg-red-100 text-red-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {deal.status === 'pending' ? 'در انتظار' : deal.status === 'open' ? 'باز' : deal.status === 'shipped' ? 'ارسال شده' : deal.status === 'delivered' ? 'تحویل شده' : deal.status === 'confirmed' ? 'تایید شده' : deal.status === 'cancelled' ? 'لغو شده' : deal.status === 'disputed' ? 'اختلاف' : deal.status}
                            </span>
                          </td>
                          <td className="p-3 text-xs text-gray-500">{formatDate(deal.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ===== MODALS ===== */}

      {/* Estimate Price Modal */}
      <Modal isOpen={estimateModal.open} onClose={() => setEstimateModal({ open: false, id: null, type: null })}
        title={estimateModal.type === 'shipping' ? 'تخمین قیمت ارسال' : 'تخمین هزینه بازرسی'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">قیمت (تومان)</label>
            <input type="number" value={estimatePrice}
              onChange={(e) => setEstimatePrice(e.target.value)}
              placeholder="مبلغ به تومان"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
              min="1" />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setEstimateModal({ open: false, id: null, type: null })}>انصراف</Button>
            <Button size="sm" onClick={handleEstimate} loading={actionLoading} disabled={!estimatePrice || Number(estimatePrice) <= 0}>
              <DollarSign size={14} /> ثبت تخمین
            </Button>
          </div>
        </div>
      </Modal>

      {/* Ship Order Modal */}
      <Modal isOpen={shipModal.open} onClose={() => setShipModal({ open: false, id: null })} title="ثبت ارسال سفارش">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">کد رهگیری</label>
            <input type="text" value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value)}
              placeholder="کد رهگیری مرسوله"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm" />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setShipModal({ open: false, id: null })}>انصراف</Button>
            <Button size="sm" onClick={handleShip} loading={actionLoading} disabled={!trackingCode}>
              <Truck size={14} /> ثبت ارسال
            </Button>
          </div>
        </div>
      </Modal>

      {/* Inspection Result Modal */}
      <Modal isOpen={resultModal.open} onClose={() => setResultModal({ open: false, id: null })} title="ثبت نتیجه بازرسی">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">نتیجه بازرسی</label>
            <textarea value={inspectionResult}
              onChange={(e) => setInspectionResult(e.target.value)}
              placeholder="نتیجه بازرسی کالا را شرح دهید..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-sm"
              rows={4} />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setResultModal({ open: false, id: null })}>انصراف</Button>
            <Button size="sm" onClick={handleResult} loading={actionLoading} disabled={!inspectionResult}>
              <CheckCircle size={14} /> ثبت نتیجه
            </Button>
          </div>
        </div>
      </Modal>

      {/* Upload Factor Modal */}
      <Modal isOpen={factorModal.open} onClose={() => setFactorModal({ open: false, id: null, type: null })} title="آپلود فاکتور">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">لینک تصویر فاکتور</label>
            <input type="text" value={factorUrl}
              onChange={(e) => setFactorUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setFactorModal({ open: false, id: null, type: null })}>انصراف</Button>
            <Button size="sm" onClick={handleFactor} loading={actionLoading} disabled={!factorUrl}>
              <Upload size={14} /> آپلود فاکتور
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

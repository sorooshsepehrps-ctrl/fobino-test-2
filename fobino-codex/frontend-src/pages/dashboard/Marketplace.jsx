import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  MapPin,
  Eye,
  Phone,
  MessageSquare,
  User,
  Package,
  ShoppingCart,
  ChevronDown,
  X,
  Star,
  Clock,
  Tag,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Mail,
} from 'lucide-react';
import { Card, Button, Modal } from '../../components/ui';
import { postService, chatService } from '../../services';
import useAuthStore from '../../store/authStore';
import { formatPrice, toPersianNumber, toPersianDate } from '../../utils/helpers';

export default function Marketplace() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  // Posts state
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  
  // Contact Detail Modal
  const [contactModal, setContactModal] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [contactDetails, setContactDetails] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  
  // Start Chat
  const [chatLoading, setChatLoading] = useState(false);
  const [initialMessage, setInitialMessage] = useState('سلام، در مورد آگهی شما سوالی دارم.');
  
  const fetchPosts = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 20,
        sort: sortBy,
        status: 'active',
      };
      if (typeFilter) params.type = typeFilter;
      if (searchTerm.length >= 2) params.search = searchTerm;
      
      const response = await postService.getPosts(params);
      if (response.success) {
        setPosts(response.data || []);
        setPagination(response.pagination || { page: 1, pages: 1, total: 0 });
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sortBy, typeFilter, searchTerm]);

  useEffect(() => {
    fetchPosts(1);
  }, [fetchPosts]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPosts(1);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPosts(pagination.page);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      fetchPosts(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Contact detail handler
  const handleGetContactDetail = async (post) => {
    setSelectedPost(post);
    setContactModal(true);
    setContactLoading(true);
    setContactDetails(null);
    setInitialMessage('سلام، در مورد آگهی شما سوالی دارم.'); // Reset message
    
    try {
      const response = await postService.getPost(post._id);
      if (response.success) {
        const postData = response.data.post;
        
        // For buy posts, always call contact-details to record access
        if (postData.type === 'buy') {
          console.log('Buy post detected, calling contact-details endpoint');
          const contactResponse = await api_getContactDetails(post._id);
          if (contactResponse) {
            setContactDetails({
              ...contactResponse,
              profileImage: postData.user?.profileImage,
              userId: postData.user?._id,
            });
          }
        } else {
          // For sell posts, if user info has phone, show it directly
          if (postData.user?.phone) {
            setContactDetails({
              phone: postData.user.phone,
              fullName: `${postData.user.firstName || ''} ${postData.user.lastName || ''}`.trim(),
              email: postData.user.email,
              userLevel: postData.user.level,
              verifications: postData.user.verifications,
              profileImage: postData.user.profileImage,
              userId: postData.user._id,
            });
          } else {
            const contactResponse = await api_getContactDetails(post._id);
            if (contactResponse) {
              setContactDetails({
                ...contactResponse,
                profileImage: postData.user?.profileImage,
                userId: postData.user?._id,
              });
            }
          }
        }
      }
    } catch (err) {
      console.error('Error getting contact details:', err);setContactDetails({ error: err.response?.data?.message || 'خطا در دریافت اطلاعات تماس' });
    } finally {
      setContactLoading(false);
    }
  };

  // Helper to call contact-details API
  const api_getContactDetails = async (postId) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/posts/${postId}/contact-details`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const result = await response.json();
      console.log('Contact details response:', result);
      
      if (result.success) {
        return {
          ...result.data.contactDetails,
          userId: result.data.contactDetails.userId || result.data.post?.user?._id,
          profileImage: result.data.contactDetails.profileImage,
        };
      }
      throw new Error(result.message || 'Failed to get contact details');
    } catch (error) {
      console.error('Error getting contact details:', error);
      throw error;
    }
  };

  // Start chat with poster
  const handleStartChat = async () => {
    if (!selectedPost || !contactDetails?.userId || chatLoading) return;
    
    // Validate message
    if (!initialMessage.trim()) {
      alert('لطفا پیام خود را وارد کنید');
      return;
    }
    
    // For buy posts, ensure contact details have been accessed
    if (selectedPost.type === 'buy' && (!contactDetails || contactDetails.error)) {
      alert('لطفا ابتدا اطلاعات تماس را مشاهده کنید');
      return;
    }
    
    try {
      setChatLoading(true);
      
      const response = await chatService.createUserChat(
        contactDetails.userId,
        initialMessage.trim(),
        selectedPost._id
      );
      
      if (response.success) {
        const chatId = response.data.chat?._id;
        if (chatId) {
          setContactModal(false);
          navigate(`/dashboard/chats/${chatId}`);
        } else {
          throw new Error('چت ایجاد نشد');
        }
      } else {
        throw new Error(response.message || 'خطا در ایجاد گفتگو');
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        if (errorData.data?.chat?._id) {
          setContactModal(false);
          navigate(`/dashboard/chats/${errorData.data.chat._id}`);
          return;
        }
      }
      
      alert(error.response?.data?.message || error.message || 'خطا در ایجاد گفتگو');
    } finally {
      setChatLoading(false);
    }
  };

  const getPostTypeLabel = (type) => {
    return type === 'sell' ? 'فروش' : 'خرید';
  };

  const getPostTypeColor = (type) => {
    return type === 'sell'
      ? 'bg-emerald-100 text-emerald-800'
      : 'bg-blue-100 text-blue-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">بازار فوبینو</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          بروزرسانی
        </Button>
      </div>

      {/* Search & Filters */}
      <Card>
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="جستجوی محصول، آگهی، برند..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>
          
          {/* Type filter */}
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
            >
              <option value="">همه آگهی‌ها</option>
              <option value="sell">فروش</option>
              <option value="buy">خرید</option>
            </select>
          </div>
          
          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
          >
            <option value="newest">جدیدترین</option>
            <option value="priority">پیشنهادی</option>
            <option value="popular">پربازدیدترین</option>
            <option value="cheapest">ارزانترین</option><option value="expensive">گرانترین</option>
          </select>
          <Button type="submit" size="md">
            جستجو
          </Button>
        </form>
      </Card>

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        {toPersianNumber(pagination.total)} آگهی یافت شد
      </div>

      {/* Posts Grid */}
      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">در حال بارگذاری...</p>
        </div>
      ) : posts.length === 0 ? (
        <Card className="text-center py-16">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">آگهی‌ای یافت نشد</h3>
          <p className="text-gray-500">فیلترهای خود را تغییر دهید یا بعداً مراجعه کنید.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((post) => (
            <Card key={post._id} className="hover:shadow-lg transition-shadow duration-200 flex flex-col" padding="none">
              {/* Image */}
              <div className="relative h-48 bg-gray-100 rounded-t-xl overflow-hidden">
                {post.images?.[0] ? (
                  <img
                    src={post.images[0]}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-12 h-12 text-gray-300" />
                  </div>
                )}
                
                {/* Type Badge */}
                <span className={`absolute top-3 right-3 px-2.5 py-1 text-xs font-medium rounded-full ${getPostTypeColor(post.type)}`}>
                  {post.type === 'sell' ? (
                    <span className="flex items-center gap-1"><Tag size={12} /> فروش</span>
                  ) : (
                    <span className="flex items-center gap-1"><ShoppingCart size={12} /> خرید</span>
                  )}
                </span>
                
                {/* Views */}
                <span className="absolute top-3 left-3 px-2 py-1 bg-black/50 text-white text-xs rounded-full flex items-center gap-1">
                  <Eye size={12} /> {toPersianNumber(post.stats?.views || 0)}
                </span></div>

              {/* Content */}
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{post.title}</h3>
                
                {/* Category */}
                {post.categoryLevel1 && (
                  <p className="text-xs text-gray-500 mb-2">
                    {post.categoryLevel1?.name}
                    {post.categoryLevel2 && ` > ${post.categoryLevel2.name}`}
                    {post.categoryLevel3 && ` > ${post.categoryLevel3.name}`}
                  </p>
                )}
                
                {/* Price */}
                <div className="text-emerald-700 font-bold text-sm mb-2">
                  {post.type === 'sell' ? (
                    post.minPricePerUnit ? (
                      post.minPricePerUnit === post.maxPricePerUnit
                        ? formatPrice(post.minPricePerUnit)
                        : `${formatPrice(post.minPricePerUnit)} - ${formatPrice(post.maxPricePerUnit)}`
                    ) : 'توافقی'
                  ) : (
                    post.maxBudget ? `بودجه: تا ${formatPrice(post.maxBudget)}` : 'توافقی'
                  )}
                </div>
                
                {/* Location */}
                {(post.province || post.deliveryProvince) && (
                  <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                    <MapPin size={12} />
                    {post.type === 'sell' ? `${post.province}، ${post.city || ''}` : `${post.deliveryProvince}، ${post.deliveryCity || ''}`}
                  </p>
                )}
                
                {/* Seller Info */}
                <div className="flex items-center gap-2 mb-3 mt-auto pt-2 border-t border-gray-100">
                  <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {post.user?.profileImage ? (
                      <img src={post.user.profileImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User size={14} className="text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 truncate">
                      {post.user?.firstName} {post.user?.lastName}
                    </p>
                  </div>
                  {post.user?.verifications?.verified && (
                    <ShieldCheck size={14} className="text-emerald-500 flex-shrink-0" />
                  )}
                  {post.user?.scores?.rating > 0 && (
                    <span className="text-xs text-gray-500 flex items-center gap-0.5">
                      <Star size={12} className="text-yellow-500 fill-yellow-500" />
                      {toPersianNumber(post.user.scores.rating?.toFixed(1))}
                    </span>
                  )}
                </div>
                
                {/* Date */}
                <p className="text-xs text-gray-400 flex items-center gap-1 mb-3">
                  <Clock size={12} />
                  {toPersianDate(post.createdAt)}
                </p>
                
                {/* Get Contact Button */}
                {post.user?._id !== user?._id ? (
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    onClick={() => handleGetContactDetail(post)}
                  >
                    <Phone size={16} />
                    دریافت اطلاعات تماس
                  </Button>
                ) : (
                  <span className="text-xs text-center text-gray-400 py-2">آگهی خودتان</span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button
            variant="ghost"
            size="sm"
            disabled={pagination.page <= 1}
            onClick={() => handlePageChange(pagination.page - 1)}
          >
            <ChevronRight size={18} />
          </Button>
          <span className="text-sm text-gray-600">
            صفحه {toPersianNumber(pagination.page)} از {toPersianNumber(pagination.pages)}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={pagination.page >= pagination.pages}
            onClick={() => handlePageChange(pagination.page + 1)}
          >
            <ChevronLeft size={18} />
          </Button>
        </div>
      )}

      {/* Contact Details Modal */}<Modal
        isOpen={contactModal}
        onClose={() => { 
          setContactModal(false); 
          setContactDetails(null); 
          setSelectedPost(null); setInitialMessage('سلام، در مورد آگهی شما سوالی دارم.');
        }}
        title="اطلاعات تماس"
        size="md"
      >
        {contactLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-3 text-gray-600">در حال دریافت اطلاعات...</p>
          </div>
        ) : contactDetails?.error ? (
          <div className="text-center py-8">
            <X className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <p className="text-red-600">{contactDetails.error}</p>
          </div>
        ) : contactDetails ? (
          <div className="space-y-5">
            {/* User card */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden">
                {contactDetails.profileImage ? (
                  <img src={contactDetails.profileImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User size={24} className="text-emerald-600" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{contactDetails.fullName || 'کاربر فوبینو'}</h3>
                {contactDetails.verifications?.verified && (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <ShieldCheck size={12} /> تایید هویت شده
                  </span>
                )}
              </div>
            </div>

            {/* Post info */}
            {selectedPost && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800 font-medium">{selectedPost.title}</p>
                <p className="text-xs text-blue-600 mt-1">
                  {selectedPost.type === 'sell' ? 'آگهی فروش' : 'درخواست خرید'}
                </p>
              </div>
            )}

            {/* Contact info */}
            <div className="space-y-3">
              {contactDetails.phone && (
                <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                  <Phone size={18} className="text-emerald-600" />
                  <div>
                    <p className="text-xs text-gray-500">شماره تماس</p>
                    <p className="font-bold text-gray-900 text-lg" dir="ltr">{contactDetails.phone}</p>
                  </div>
                </div>
              )}
              {contactDetails.email && (
                <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                  <Mail size={18} className="text-emerald-600" />
                  <div>
                    <p className="text-xs text-gray-500">ایمیل</p>
                    <p className="font-medium text-gray-900" dir="ltr">{contactDetails.email}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Message Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                پیام شما
              </label>
              <textarea
                value={initialMessage}
                onChange={(e) => setInitialMessage(e.target.value)}
                placeholder="پیام خود را وارد کنید..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
              />
            </div>

            {/* Start Chat Button */}
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              loading={chatLoading}
              onClick={handleStartChat}
              disabled={!initialMessage.trim()}
            >
              <MessageSquare size={20} />
              شروع گفتگو
            </Button>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}








// import { useState, useEffect, useCallback } from 'react';
// import { useNavigate } from 'react-router-dom';
// import {
//   Search,
//   Filter,
//   MapPin,
//   Eye,
//   Phone,
//   MessageSquare,
//   User,
//   Package,
//   ShoppingCart,
//   ChevronDown,
//   X,
//   Star,
//   Clock,
//   Tag,
//   RefreshCw,
//   ChevronLeft,
//   ChevronRight,
//   ShieldCheck,
//   Mail,
// } from 'lucide-react';
// import { Card, Button, Modal } from '../../components/ui';
// import { postService, chatService } from '../../services';
// import useAuthStore from '../../store/authStore';
// import { formatPrice, toPersianNumber, toPersianDate } from '../../utils/helpers';

// export default function Marketplace() {
//   const navigate = useNavigate();
//   const { user } = useAuthStore();

//   // Posts state
//   const [posts, setPosts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

//   // Filters
//   const [searchTerm, setSearchTerm] = useState('');
//   const [typeFilter, setTypeFilter] = useState('');
//   const [sortBy, setSortBy] = useState('newest');

//   // Contact Detail Modal
//   const [contactModal, setContactModal] = useState(false);
//   const [contactLoading, setContactLoading] = useState(false);
//   const [contactDetails, setContactDetails] = useState(null);
//   const [selectedPost, setSelectedPost] = useState(null);

//   // Start Chat
//   const [chatLoading, setChatLoading] = useState(false);

//   const fetchPosts = useCallback(async (page = 1) => {
//     try {
//       setLoading(true);
//       const params = {
//         page,
//         limit: 20,
//         sort: sortBy,
//         status: 'active',
//       };
//       if (typeFilter) params.type = typeFilter;
//       if (searchTerm.length >= 2) params.search = searchTerm;

//       const response = await postService.getPosts(params);
//       if (response.success) {
//         setPosts(response.data || []);
//         setPagination(response.pagination || { page: 1, pages: 1, total: 0 });
//       }
//     } catch (error) {
//       console.error('Error fetching posts:', error);
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   }, [sortBy, typeFilter, searchTerm]);

//   useEffect(() => {
//     fetchPosts(1);
//   }, [fetchPosts]);

//   const handleSearch = (e) => {
//     e.preventDefault();
//     fetchPosts(1);
//   };

//   const handleRefresh = () => {
//     setRefreshing(true);
//     fetchPosts(pagination.page);
//   };

//   const handlePageChange = (newPage) => {
//     if (newPage >= 1 && newPage <= pagination.pages) {
//       fetchPosts(newPage);
//       window.scrollTo({ top: 0, behavior: 'smooth' });
//     }
//   };

//   // Contact detail handler
//   const handleGetContactDetail = async (post) => {
//     setSelectedPost(post);
//     setContactModal(true);
//     setContactLoading(true);
//     setContactDetails(null);

//     try {
//       const response = await postService.getPost(post._id);
//       if (response.success) {
//         const postData = response.data.post;
        
//         // For buy posts, always call contact-details to record access
//         if (postData.type === 'buy') {
//           console.log('Buy post detected, calling contact-details endpoint');
//           const contactResponse = await api_getContactDetails(post._id);
//           if (contactResponse) {
//             setContactDetails({
//               ...contactResponse,
//               profileImage: postData.user?.profileImage,
//               userId: postData.user?._id,
//             });
//           }
//         } else {
//           // For sell posts, if user info has phone, show it directly
//           if (postData.user?.phone) {
//             setContactDetails({
//               phone: postData.user.phone,
//               fullName: `${postData.user.firstName || ''} ${postData.user.lastName || ''}`.trim(),
//               email: postData.user.email,
//               userLevel: postData.user.level,
//               verifications: postData.user.verifications,
//               profileImage: postData.user.profileImage,
//               userId: postData.user._id,
//             });
//           } else {
//             // Need to call contact-details endpoint
//             const contactResponse = await api_getContactDetails(post._id);
//             if (contactResponse) {
//               setContactDetails({
//                 ...contactResponse,
//                 profileImage: postData.user?.profileImage,
//                 userId: postData.user?._id,
//               });
//             }
//           }
//         }
//       }
//     } catch (err) {
//       console.error('Error getting contact details:', err);
//       setContactDetails({ error: err.response?.data?.message || 'خطا در دریافت اطلاعات تماس' });
//     } finally {
//       setContactLoading(false);
//     }
//   };

//   // Helper to call contact-details API
//   const api_getContactDetails = async (postId) => {
//     try {
//       // Always call the contact-details endpoint to ensure access is recorded
//       const response = await fetch(
//         `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/posts/${postId}/contact-details`,
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
//             'Content-Type': 'application/json',
//           },
//         }
//       );
//       const result = await response.json();
//       console.log('Contact details response:', result); // Debug log
//       if (result.success) {
//         return {
//           ...result.data.contactDetails,
//           userId: result.data.contactDetails.userId || result.data.post?.user?._id,
//           profileImage: result.data.contactDetails.profileImage,
//         };
//       }
//       throw new Error(result.message || 'Failed to get contact details');
//     } catch (error) {
//       console.error('Error getting contact details:', error);
//       throw error;
//     }
//   };

//   // Start chat with poster
//   const handleStartChat = async () => {
//     if (!selectedPost || chatLoading) return;

//     // For buy posts, ensure contact details have been accessed
//     if (selectedPost.type === 'buy' && (!contactDetails || contactDetails.error)) {
//       alert('لطفا ابتدا اطلاعات تماس را مشاهده کنید');
//       return;
//     }

//     try {
//       setChatLoading(true);
//       const response = await chatService.createChat(selectedPost._id, 'سلام، در مورد آگهی شما سوالی دارم.');
//       if (response.success) {
//         const chatId = response.data.chat?._id;
//         if (chatId) {
//           setContactModal(false);
//           navigate(`/dashboard/chats/${chatId}`);
//         }
//       }
//     } catch (error) {
//       console.error('Error starting chat:', error);
//       // If chat already exists, try to find it
//       if (error.response?.data?.data?.chat?._id) {
//         setContactModal(false);
//         navigate(`/dashboard/chats/${error.response.data.data.chat._id}`);
//       } else {
//         alert(error.response?.data?.message || 'خطا در ایجاد گفتگو');
//       }
//     } finally {
//       setChatLoading(false);
//     }
//   };

//   const getPostTypeLabel = (type) => {
//     return type === 'sell' ? 'فروش' : 'خرید';
//   };

//   const getPostTypeColor = (type) => {
//     return type === 'sell'
//       ? 'bg-emerald-100 text-emerald-800'
//       : 'bg-blue-100 text-blue-800';
//   };

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
//         <h1 className="text-2xl font-bold text-gray-900">بازار فوبینو</h1>
//         <Button
//           variant="ghost"
//           size="sm"
//           onClick={handleRefresh}
//           disabled={refreshing}
//           className="flex items-center gap-2"
//         >
//           <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
//           بروزرسانی
//         </Button>
//       </div>

//       {/* Search & Filters */}
//       <Card>
//         <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
//           {/* Search */}
//           <div className="flex-1 relative">
//             <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
//             <input
//               type="text"
//               placeholder="جستجوی محصول، آگهی، برند..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="w-full pr-10 pl-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
//             />
//           </div>

//           {/* Type filter */}
//           <div className="flex items-center gap-2">
//             <Filter size={20} className="text-gray-400" />
//             <select
//               value={typeFilter}
//               onChange={(e) => setTypeFilter(e.target.value)}
//               className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
//             >
//               <option value="">همه آگهی‌ها</option>
//               <option value="sell">فروش</option>
//               <option value="buy">خرید</option>
//             </select>
//           </div>

//           {/* Sort */}
//           <select
//             value={sortBy}
//             onChange={(e) => setSortBy(e.target.value)}
//             className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
//           >
//             <option value="newest">جدیدترین</option>
//             <option value="priority">پیشنهادی</option>
//             <option value="popular">پربازدیدترین</option>
//             <option value="cheapest">ارزانترین</option>
//             <option value="expensive">گرانترین</option>
//           </select>

//           <Button type="submit" size="md">
//             جستجو
//           </Button>
//         </form>
//       </Card>

//       {/* Results Count */}
//       <div className="text-sm text-gray-600">
//         {toPersianNumber(pagination.total)} آگهی یافت شد
//       </div>

//       {/* Posts Grid */}
//       {loading ? (
//         <div className="text-center py-16">
//           <div className="animate-spin w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto"></div>
//           <p className="mt-4 text-gray-600">در حال بارگذاری...</p>
//         </div>
//       ) : posts.length === 0 ? (
//         <Card className="text-center py-16">
//           <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
//           <h3 className="text-lg font-medium text-gray-900 mb-2">آگهی‌ای یافت نشد</h3>
//           <p className="text-gray-500">فیلترهای خود را تغییر دهید یا بعداً مراجعه کنید.</p>
//         </Card>
//       ) : (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//           {posts.map((post) => (
//             <Card key={post._id} className="hover:shadow-lg transition-shadow duration-200 flex flex-col" padding="none">
//               {/* Image */}
//               <div className="relative h-48 bg-gray-100 rounded-t-xl overflow-hidden">
//                 {post.images?.[0] ? (
//                   <img
//                     src={post.images[0]}
//                     alt={post.title}
//                     className="w-full h-full object-cover"
//                   />
//                 ) : (
//                   <div className="w-full h-full flex items-center justify-center">
//                     <Package className="w-12 h-12 text-gray-300" />
//                   </div>
//                 )}
//                 {/* Type Badge */}
//                 <span className={`absolute top-3 right-3 px-2.5 py-1 text-xs font-medium rounded-full ${getPostTypeColor(post.type)}`}>
//                   {post.type === 'sell' ? (
//                     <span className="flex items-center gap-1"><Tag size={12} /> فروش</span>
//                   ) : (
//                     <span className="flex items-center gap-1"><ShoppingCart size={12} /> خرید</span>
//                   )}
//                 </span>
//                 {/* Views */}
//                 <span className="absolute top-3 left-3 px-2 py-1 bg-black/50 text-white text-xs rounded-full flex items-center gap-1">
//                   <Eye size={12} /> {toPersianNumber(post.stats?.views || 0)}
//                 </span>
//               </div>

//               {/* Content */}
//               <div className="p-4 flex-1 flex flex-col">
//                 <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{post.title}</h3>

//                 {/* Category */}
//                 {post.categoryLevel1 && (
//                   <p className="text-xs text-gray-500 mb-2">
//                     {post.categoryLevel1?.name}
//                     {post.categoryLevel2 && ` > ${post.categoryLevel2.name}`}
//                     {post.categoryLevel3 && ` > ${post.categoryLevel3.name}`}
//                   </p>
//                 )}

//                 {/* Price */}
//                 <div className="text-emerald-700 font-bold text-sm mb-2">
//                   {post.type === 'sell' ? (
//                     post.minPricePerUnit ? (
//                       post.minPricePerUnit === post.maxPricePerUnit
//                         ? formatPrice(post.minPricePerUnit)
//                         : `${formatPrice(post.minPricePerUnit)} - ${formatPrice(post.maxPricePerUnit)}`
//                     ) : 'توافقی'
//                   ) : (
//                     post.maxBudget ? `بودجه: تا ${formatPrice(post.maxBudget)}` : 'توافقی'
//                   )}
//                 </div>

//                 {/* Location */}
//                 {(post.province || post.deliveryProvince) && (
//                   <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
//                     <MapPin size={12} />
//                     {post.type === 'sell' ? `${post.province}، ${post.city || ''}` : `${post.deliveryProvince}، ${post.deliveryCity || ''}`}
//                   </p>
//                 )}

//                 {/* Seller Info */}
//                 <div className="flex items-center gap-2 mb-3 mt-auto pt-2 border-t border-gray-100">
//                   <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
//                     {post.user?.profileImage ? (
//                       <img src={post.user.profileImage} alt="" className="w-full h-full object-cover" />
//                     ) : (
//                       <User size={14} className="text-gray-400" />
//                     )}
//                   </div>
//                   <div className="flex-1 min-w-0">
//                     <p className="text-xs font-medium text-gray-700 truncate">
//                       {post.user?.firstName} {post.user?.lastName}
//                     </p>
//                   </div>
//                   {post.user?.verifications?.verified && (
//                     <ShieldCheck size={14} className="text-emerald-500 flex-shrink-0" />
//                   )}
//                   {post.user?.scores?.rating > 0 && (
//                     <span className="text-xs text-gray-500 flex items-center gap-0.5">
//                       <Star size={12} className="text-yellow-500 fill-yellow-500" />
//                       {toPersianNumber(post.user.scores.rating?.toFixed(1))}
//                     </span>
//                   )}
//                 </div>

//                 {/* Date */}
//                 <p className="text-xs text-gray-400 flex items-center gap-1 mb-3">
//                   <Clock size={12} />
//                   {toPersianDate(post.createdAt)}
//                 </p>

//                 {/* Get Contact Button */}
//                 {post.user?._id !== user?._id ? (
//                   <Button
//                     variant="primary"
//                     size="sm"
//                     className="w-full"
//                     onClick={() => handleGetContactDetail(post)}
//                   >
//                     <Phone size={16} />
//                     دریافت اطلاعات تماس
//                   </Button>
//                 ) : (
//                   <span className="text-xs text-center text-gray-400 py-2">آگهی خودتان</span>
//                 )}
//               </div>
//             </Card>
//           ))}
//         </div>
//       )}

//       {/* Pagination */}
//       {pagination.pages > 1 && (
//         <div className="flex items-center justify-center gap-2 mt-8">
//           <Button
//             variant="ghost"
//             size="sm"
//             disabled={pagination.page <= 1}
//             onClick={() => handlePageChange(pagination.page - 1)}
//           >
//             <ChevronRight size={18} />
//           </Button>
//           <span className="text-sm text-gray-600">
//             صفحه {toPersianNumber(pagination.page)} از {toPersianNumber(pagination.pages)}
//           </span>
//           <Button
//             variant="ghost"
//             size="sm"
//             disabled={pagination.page >= pagination.pages}
//             onClick={() => handlePageChange(pagination.page + 1)}
//           >
//             <ChevronLeft size={18} />
//           </Button>
//         </div>
//       )}

//       {/* Contact Details Modal */}
//       <Modal
//         isOpen={contactModal}
//         onClose={() => { setContactModal(false); setContactDetails(null); setSelectedPost(null); }}
//         title="اطلاعات تماس"
//         size="md"
//       >
//         {contactLoading ? (
//           <div className="text-center py-8">
//             <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto"></div>
//             <p className="mt-3 text-gray-600">در حال دریافت اطلاعات...</p>
//           </div>
//         ) : contactDetails?.error ? (
//           <div className="text-center py-8">
//             <X className="w-12 h-12 text-red-400 mx-auto mb-3" />
//             <p className="text-red-600">{contactDetails.error}</p>
//           </div>
//         ) : contactDetails ? (
//           <div className="space-y-5">
//             {/* User card */}
//             <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
//               <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden">
//                 {contactDetails.profileImage ? (
//                   <img src={contactDetails.profileImage} alt="" className="w-full h-full object-cover" />
//                 ) : (
//                   <User size={24} className="text-emerald-600" />
//                 )}
//               </div>
//               <div>
//                 <h3 className="font-bold text-gray-900 text-lg">{contactDetails.fullName || 'کاربر فوبینو'}</h3>
//                 {contactDetails.verifications?.verified && (
//                   <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
//                     <ShieldCheck size={12} /> تایید هویت شده
//                   </span>
//                 )}
//               </div>
//             </div>

//             {/* Post info */}
//             {selectedPost && (
//               <div className="p-3 bg-blue-50 rounded-lg">
//                 <p className="text-sm text-blue-800 font-medium">{selectedPost.title}</p>
//                 <p className="text-xs text-blue-600 mt-1">
//                   {selectedPost.type === 'sell' ? 'آگهی فروش' : 'درخواست خرید'}
//                 </p>
//               </div>
//             )}

//             {/* Contact info */}
//             <div className="space-y-3">
//               {contactDetails.phone && (
//                 <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
//                   <Phone size={18} className="text-emerald-600" />
//                   <div>
//                     <p className="text-xs text-gray-500">شماره تماس</p>
//                     <p className="font-bold text-gray-900 text-lg" dir="ltr">{contactDetails.phone}</p>
//                   </div>
//                 </div>
//               )}
//               {contactDetails.email && (
//                 <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
//                   <Mail size={18} className="text-emerald-600" />
//                   <div>
//                     <p className="text-xs text-gray-500">ایمیل</p>
//                     <p className="font-medium text-gray-900" dir="ltr">{contactDetails.email}</p>
//                   </div>
//                 </div>
//               )}
//             </div>

//             {/* Start Chat Button */}
//             <Button
//               variant="primary"
//               size="lg"
//               className="w-full"
//               loading={chatLoading}
//               onClick={handleStartChat}
//             >
//               <MessageSquare size={20} />
//               شروع گفتگو
//             </Button>
//           </div>
//         ) : null}
//       </Modal>
//     </div>
//   );
// }

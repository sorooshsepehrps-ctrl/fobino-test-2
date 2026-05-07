/* frontend/my-app/src/pages/dashboard/MyPostsChats.jsx */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageSquare, 
  Eye, 
  ChevronLeft, 
  ChevronRight,
  Search,
  Filter,
  Plus,
  Clock,
  User,
  DollarSign,
  Package
} from 'lucide-react';
import { postService, chatService } from '../../services';
import useAuthStore from '../../store/authStore';
import { Card, Button } from '../../components/ui';

const MyPostsChats = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('sell'); // 'sell' or 'buy'
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);
  const [postChats, setPostChats] = useState({}); // { postId: [chats] }
  const [loadingChats, setLoadingChats] = useState({});

  useEffect(() => {
    fetchMyPosts();
  }, [activeTab]);

  /* frontend/my-app/src/pages/dashboard/MyPostsChats.jsx */
// Update the fetchMyPosts function to handle the error:

const fetchMyPosts = async () => {
  try {
    setLoading(true);
    console.log('Fetching posts with type:', activeTab);
    
    const response = await postService.getMyPosts(activeTab);
    console.log('Response:', response);
    
    if (response.success) {
      setPosts(response.data.posts || response.data || []);
      
      // Initialize empty chats for each post
      const initialChats = {};
      const postsArray = response.data.posts || response.data || [];
      postsArray.forEach(post => {
        initialChats[post._id] = [];
      });
      setPostChats(initialChats);
    } else {
      console.error('API returned error:', response.message);
      // Show user-friendly error
    }
  } catch (error) {
    console.error('Error fetching posts:', error);
    console.error('Error response:', error.response?.data);
    
    // Check specific error types
    if (error.response?.status === 400) {
      console.log('Bad request - checking endpoint...');
      // Try alternative approach
      await tryAlternativePostFetch();
    } else if (error.response?.status === 401) {
      console.log('Unauthorized - redirecting to login');
      // Handle unauthorized
    } else if (error.response?.status === 404) {
      console.log('Endpoint not found');
      // Handle 404
    }
    
    setPosts([]);
    setPostChats({});
  } finally {
    setLoading(false);
  }
};

// Alternative method if main endpoint fails
const tryAlternativePostFetch = async () => {
  try {
    console.log('Trying alternative fetch method...');
    
    // Method 1: Try without type parameter
    const response1 = await postService.getMyPosts();
    console.log('Response without type:', response1);
    
    if (response1.success) {
      // Filter by type on client side
      const filteredPosts = (response1.data.posts || response1.data || [])
        .filter(post => post.type === activeTab);
      setPosts(filteredPosts);
      return;
    }
    
    // Method 2: Try the user posts endpoint
    const response2 = await api.get(`/posts/user/${user?._id}?type=${activeTab}`);
    console.log('User posts response:', response2.data);
    
    if (response2.data.success) {
      setPosts(response2.data.data.posts || response2.data.data || []);
    }
    
  } catch (altError) {
    console.error('Alternative fetch also failed:', altError);
  }
};

  const fetchPostChats = async (postId) => {
    try {
      setLoadingChats(prev => ({ ...prev, [postId]: true }));
      const response = await chatService.getPostChats(postId);
      if (response.success) {
        setPostChats(prev => ({
          ...prev,
          [postId]: response.data.chats || []
        }));
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
      setPostChats(prev => ({
        ...prev,
        [postId]: []
      }));
    } finally {
      setLoadingChats(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handlePostClick = (post) => {
    setSelectedPost(selectedPost?._id === post._id ? null : post);
    if (!postChats[post._id]?.length) {
      fetchPostChats(post._id);
    }
  };

  const handleChatClick = (chatId) => {
    navigate(`/dashboard/chats/${chatId}`);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getPostTypeLabel = (type) => {
    return type === 'sell' ? 'فروش' : 'خرید';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active': return 'فعال';
      case 'pending': return 'در انتظار تایید';
      case 'rejected': return 'رد شده';
      case 'expired': return 'منقضی شده';
      default: return status;
    }
  };

  const filteredPosts = posts.filter(post =>
    post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              آگهی‌ها و گفتگوهای من
            </h1>
            <Button
              onClick={() => navigate('/dashboard/seller/new-product')}
              className="flex items-center gap-2"
            >
              <Plus size={20} />
              آگهی جدید
            </Button>
          </div>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="flex bg-white rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => setActiveTab('sell')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'sell'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                آگهی‌های فروش
              </button>
              <button
                onClick={() => setActiveTab('buy')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'buy'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                درخواست‌های خرید
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="جستجو در آگهی‌ها..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Posts Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredPosts.length === 0 ? (
          <Card className="text-center py-12">
            <Package size={64} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">هیچ آگهی‌ای یافت نشد</h3>
            <p className="text-gray-600 mb-4">
              {activeTab === 'sell' 
                ? 'هنوز آگهی فروش ثبت نکرده‌اید'
                : 'هنوز درخواست خرید ثبت نکرده‌اید'}
            </p>
            <Button
              onClick={() => navigate(`/dashboard/${activeTab === 'sell' ? 'seller' : 'buyer'}/new-${activeTab === 'sell' ? 'product' : 'request'}`)}
            >
              ایجاد اولین آگهی
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredPosts.map((post) => (
              <Card
                key={post._id}
                className={`overflow-hidden transition-all duration-200 hover:shadow-lg cursor-pointer ${
                  selectedPost?._id === post._id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => handlePostClick(post)}
              >
                <div className="p-5">
                  {/* Post Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(post.status)}`}>
                          {getStatusLabel(post.status)}
                        </span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {getPostTypeLabel(post.type)}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 line-clamp-1">
                        {post.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {post.description}
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1 text-gray-600 mb-2">
                        <Eye size={16} />
                        <span className="text-sm">{post.views || 0}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <MessageSquare size={16} />
                        <span className="text-sm">{post.stats?.chats || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Post Details */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign size={16} className="text-green-600" />
                      <span className="font-medium">{post.displayPrice || 'قیمت توافقی'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Package size={16} className="text-blue-600" />
                      <span>{post.unit || 'عدد'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock size={16} className="text-gray-500" />
                      <span>{formatDate(post.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <User size={16} className="text-purple-600" />
                      <span>{post.location || 'تهران'}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 mb-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/posts/${post.slug || post._id}`);
                      }}
                    >
                      مشاهده آگهی
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/dashboard/seller/new-product?edit=${post._id}`);
                      }}
                    >
                      ویرایش
                    </Button>
                  </div>

                  {/* Chats Section */}
                  {selectedPost?._id === post._id && (
                    <div className="border-t pt-4 mt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">گفتگوها ({postChats[post._id]?.length || 0})</h4>
                        {postChats[post._id]?.length > 0 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              fetchPostChats(post._id);
                            }}
                          >
                            <RefreshCw size={16} className={loadingChats[post._id] ? 'animate-spin' : ''} />
                          </Button>
                        )}
                      </div>

                      {loadingChats[post._id] ? (
                        <div className="flex justify-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        </div>
                      ) : postChats[post._id]?.length === 0 ? (
                        <div className="text-center py-6 border border-dashed border-gray-300 rounded-lg">
                          <MessageSquare size={32} className="mx-auto text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600">هنوز گفتگویی برای این آگهی ایجاد نشده</p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-60 overflow-y-auto">
                          {postChats[post._id]?.map((chat) => {
                            const otherParticipant = chat.otherParticipant;
                            const lastMessage = chat.stats?.lastMessage;
                            
                            return (
                              <div
                                key={chat._id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleChatClick(chat._id);
                                }}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="relative">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                      {otherParticipant?.profileImage ? (
                                        <img
                                          src={otherParticipant.profileImage}
                                          alt={otherParticipant.firstName}
                                          className="w-10 h-10 rounded-full object-cover"
                                        />
                                      ) : (
                                        <User size={20} className="text-blue-600" />
                                      )}
                                    </div>
                                    {chat.participants?.find(p => 
                                      p.user._id !== user?._id && p.unreadCount > 0
                                    ) && (
                                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
                                    )}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium text-sm">
                                        {otherParticipant?.firstName} {otherParticipant?.lastName}
                                      </p>
                                      {otherParticipant?.verifications?.verified && (
                                        <span className="px-1.5 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                                          ✓ تایید شده
                                        </span>
                                      )}
                                    </div>
                                    {lastMessage ? (
                                      <p className="text-sm text-gray-600 truncate max-w-[200px]">
                                        {lastMessage.content}
                                      </p>
                                    ) : (
                                      <p className="text-sm text-gray-500">بدون پیام</p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-col items-end">
                                  <span className="text-xs text-gray-500">
                                    {formatDate(chat.updatedAt)}
                                  </span>
                                  {chat.participants?.find(p => 
                                    p.user._id !== user?._id && p.unreadCount > 0
                                  ) && (
                                    <span className="mt-1 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                                      {chat.participants.find(p => p.user._id !== user?._id).unreadCount}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPostsChats;

// Add RefreshCw icon import at the top
import { RefreshCw } from 'lucide-react';
/* frontend/my-app/src/pages/dashboard/Messages.jsx */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  MessageSquare, 
  User, 
  Clock, 
  Package,
  RefreshCw,
  Search,
  Filter,
  ChevronDown,
  XCircle
} from 'lucide-react';
import { Card, Button } from '../../components/ui';
import { toPersianDate, truncate } from '../../utils/helpers';
import { chatService } from '../../services';
import { socketService } from '../../services';

export default function Messages() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  const fetchChats = async () => {
    try {
      const params = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      const response = await chatService.getChats(params);
      if (response.success) {
        setChats(response.data.chats || []);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshChats = async () => {
    setRefreshing(true);
    await fetchChats();
  };

  useEffect(() => {
    fetchChats();
    
    // Connect to socket if not already connected
    if (!socketService.isConnected()) {
      console.log('📡 Messages component: Connecting to socket...');
      socketService.connect();
    } else {
      console.log('📡 Messages component: Socket already connected');
    }
    
    // Listen for new messages to update chat list
    const handleNewMessage = (message) => {
      setChats(prev => {
        const chatIndex = prev.findIndex(chat => chat._id === message.chat);
        if (chatIndex > -1) {
          const updatedChats = [...prev];
          const chat = { ...updatedChats[chatIndex] };
          
          // Update last message and timestamp
          chat.stats = {
            ...chat.stats,
            lastMessage: {
              content: message.content,
              sender: message.sender,
              type: message.type
            },
            lastMessageAt: message.createdAt
          };
          
          // Update unread count for current user
          chat.participants = chat.participants.map(p => ({
            ...p,
            unreadCount: p.user._id !== message.sender._id ? 
              (p.unreadCount || 0) + 1 : 
              p.unreadCount
          }));
          
          updatedChats[chatIndex] = chat;
          
          // Move to top
          const [movedChat] = updatedChats.splice(chatIndex, 1);
          return [movedChat, ...updatedChats];
        }
        return prev;
      });
    };

    // Listen for user online status
    const handleUserJoined = (data) => {
      setOnlineUsers(prev => new Set([...prev, data.userId]));
    };

    const handleUserLeft = (data) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.userId);
        return newSet;
      });
    };

    socketService.on('new_message', handleNewMessage);
    socketService.on('user_joined', handleUserJoined);
    socketService.on('user_left', handleUserLeft);

    // Cleanup: remove listeners but DON'T disconnect (socket is shared)
    return () => {
      console.log('📡 Messages component: Cleaning up...');
      socketService.off('new_message', handleNewMessage);
      socketService.off('user_joined', handleUserJoined);
      socketService.off('user_left', handleUserLeft);
    };
  }, [statusFilter]);

  const filteredChats = chats.filter(chat => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    // Search in participant names
    const participantNames = chat.participants
      .filter(p => p.user && p.user._id !== chat.currentUserId)
      .map(p => `${p.user.firstName || ''} ${p.user.lastName || ''}`.toLowerCase())
      .some(name => name.includes(searchLower));
    
    // Search in post title
    const postTitle = chat.post?.title?.toLowerCase().includes(searchLower);
    
    // Search in last message
    const lastMessage = chat.stats?.lastMessage?.content?.toLowerCase().includes(searchLower);
    
    return participantNames || postTitle || lastMessage;
  });

  const getOtherParticipant = (chat) => {
    return chat.participants?.find(p => p.user?._id !== chat.currentUserId)?.user;
  };

  const getLastMessageTime = (chat) => {
    if (chat.stats?.lastMessageAt) {
      const now = new Date();
      const messageTime = new Date(chat.stats.lastMessageAt);
      const diffInHours = (now - messageTime) / (1000 * 60 * 60);
      
      if (diffInHours < 24) {
        return toPersianDate(chat.stats.lastMessageAt, 'HH:mm');
      } else if (diffInHours < 168) { // 7 days
        return toPersianDate(chat.stats.lastMessageAt, 'dddd');
      } else {
        return toPersianDate(chat.stats.lastMessageAt, 'jMM/jDD');
      }
    }
    return '';
  };

  const getUnreadCount = (chat) => {
    const participant = chat.participants?.find(p => p.user?._id === chat.currentUserId);
    return participant?.unreadCount || 0;
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setSearchTerm('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">پیغام‌ها</h1>
        
        <div className="flex items-center gap-3">
          <Link to="/dashboard/my-posts-chats">
            <Button variant="outline" className="flex items-center gap-2">
              <Package size={20} />
              <span className="hidden sm:inline">آگهی‌ها و گفتگوها</span>
              <span className="sm:hidden">آگهی‌ها</span>
            </Button>
          </Link>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshChats}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">بروزرسانی</span>
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="جستجو در گفتگوها..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <XCircle size={18} />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
            >
              <option value="all">همه گفتگوها</option>
              <option value="active">فعال</option>
              <option value="closed">بسته شده</option>
              <option value="archived">آرشیو شده</option>
            </select>
          </div>

          {/* Clear Filters */}
          {(searchTerm || statusFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              حذف فیلترها
            </Button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">در حال بارگذاری گفتگوها...</p>
        </div>
      ) : filteredChats.length === 0 ? (
        <Card className="text-center py-12">
          <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || statusFilter !== 'all' ? 'نتیجه‌ای یافت نشد' : 'پیغامی وجود ندارد'}
          </h3>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            {searchTerm || statusFilter !== 'all' 
              ? 'هیچ گفتگویی با این مشخصات یافت نشد. سعی کنید فیلترهای جستجو را تغییر دهید.'
              : 'هنوز هیچ گفتگویی ندارید. با شروع خرید یا فروش، می‌توانید با کاربران دیگر گفتگو کنید.'}
          </p>
          {(searchTerm || statusFilter !== 'all') && (
            <Button variant="outline" onClick={clearFilters}>
              حذف فیلترها و مشاهده همه
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Chat Count */}
          <div className="text-sm text-gray-600 px-2">
            {filteredChats.length} گفتگو یافت شد
          </div>

          {/* Chats List */}
          {filteredChats.map((chat) => {
            const otherParticipant = getOtherParticipant(chat);
            const lastMessage = chat.stats?.lastMessage;
            const unreadCount = getUnreadCount(chat);
            const isOnline = onlineUsers.has(otherParticipant?._id);
            const lastMessageTime = getLastMessageTime(chat);

            return (
              <Link key={chat._id} to={`/dashboard/chats/${chat._id}`}>
                <Card className="hover:shadow-md transition-all duration-200 cursor-pointer hover:border-blue-300">
                  <div className="flex items-center gap-4 p-4">
                    {/* Avatar with Online Status */}
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                        {otherParticipant?.profileImage ? (
                          <img
                            src={otherParticipant.profileImage}
                            alt={otherParticipant.firstName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      {/* Online Status Indicator */}
                      {isOnline && chat.status === 'active' && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900 truncate">
                            {otherParticipant?.firstName} {otherParticipant?.lastName}
                          </h3>
                          {otherParticipant?.verifications?.verified && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                              ✓ تایید شده
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {lastMessageTime && (
                            <span className="text-xs text-gray-400 flex items-center gap-1 whitespace-nowrap">
                              <Clock className="w-3 h-3" />
                              {lastMessageTime}
                            </span>
                          )}
                          {chat.status === 'closed' && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full whitespace-nowrap">
                              بسته شده
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Post Title */}
                      {chat.post && (
                        <p className="text-xs text-blue-600 mb-1 truncate">
                          {chat.post.title}
                        </p>
                      )}
                      
                      {/* Last Message */}
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500 truncate max-w-[70%]">
                          {lastMessage?.content ? 
                            (lastMessage.sender?._id === chat.currentUserId ? 
                              `شما: ${truncate(lastMessage.content, 40)}` : 
                              truncate(lastMessage.content, 50)
                            ) : 
                            'شروع گفتگو...'
                          }
                        </p>
                        
                        {/* Unread Badge */}
                        {unreadCount > 0 && (
                          <div className="flex-shrink-0">
                            <div className="w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                              {unreadCount > 9 ? '9+' : unreadCount}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Chat Type Badge */}
                      <div className="mt-2">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          chat.chatType === 'sell_post' ? 'bg-emerald-100 text-emerald-800' :
                          chat.chatType === 'buy_post' ? 'bg-blue-100 text-blue-800' :
                          chat.chatType === 'deal_negotiation' ? 'bg-purple-100 text-purple-800' :
                          chat.chatType === 'support' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {chat.chatType === 'sell_post' ? 'آگهی فروش' :
                           chat.chatType === 'buy_post' ? 'درخواست خرید' :
                           chat.chatType === 'deal_negotiation' ? 'مذاکره معامله' :
                           chat.chatType === 'support' ? 'پشتیبانی' :
                           chat.chatType}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Real-time Connection Status */}
      <div className="text-xs text-gray-500 flex items-center justify-center gap-2">
        <div className={`w-2 h-2 rounded-full ${socketService.isConnected() ? 'bg-green-500' : 'bg-red-500'}`}></div>
        {socketService.isConnected() ? 'اتصال برقرار' : 'در حال اتصال...'}
      </div>
    </div>
  );
}
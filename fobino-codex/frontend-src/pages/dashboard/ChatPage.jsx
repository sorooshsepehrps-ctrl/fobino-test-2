/* frontend/my-app/src/pages/dashboard/ChatPage.jsx */
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Send, 
  Image as ImageIcon, 
  Paperclip, 
  X, 
  MoreVertical,
  Phone,
  Video,
  Info,
  ChevronLeft,
  Check,
  CheckCheck,
  Clock,
  User,
  Smile,
  Mic,
  Handshake,
  MessageSquare,
} from 'lucide-react';
import DealPanel from '../../components/deal/DealPanel';
import { chatService, socketService } from '../../services';
import useAuthStore from '../../store/authStore';
import { Card, Button } from '../../components/ui';

const ChatPage = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [otherParticipant, setOtherParticipant] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'deal'

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  // DEBUG: Track how many times listeners are registered
  const setupSocketListenersRef = useRef(0);
  const handleNewMessageRef = useRef(0);
  const markAsReadRef = useRef(0);

  // Debounce ref for typing indicator
  const typingTimeoutRef = useRef(null);
  const lastTypingStatusRef = useRef(null);
  
  // Debounce ref for markAsRead
  const markAsReadTimeoutRef = useRef(null);
  const lastMarkAsReadTimeRef = useRef(0);
  const MAR_AS_READ_DEBOUNCE = 1000; // 1 second

  // Single useEffect for loading chat data + setting up socket
  useEffect(() => {
    if (!chatId) return;

    loadChatData();
    const cleanupSocket = setupSocketListeners();

    return () => {
      if (cleanupSocket) cleanupSocket();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  const setupSocketListeners = () => {
    if (!socketService.isConnected()) {
      socketService.connect();
    }

    const handleSocketConnected = () => {
      socketService.joinChat(chatId);
    };

    const handleChatError = (errorData) => {
      console.error('Chat join error:', errorData);
      if (errorData.chatId === chatId && errorData.error?.includes('Not authorized')) {
        navigate('/dashboard/messages');
      }
    };

    const handleChatJoined = (data) => {
      if (data.chatId === chatId) {
        console.log('Joined chat:', chatId);
      }
    };

    const handleMessageRead = (data) => {
      if (data.chatId === chatId) {
        setMessages(prev => prev.map(msg => {
          if (msg._id === data.messageId) {
            return {
              ...msg,
              readBy: [...(msg.readBy || []), { user: data.userId, readAt: data.timestamp }]
            };
          }
          return msg;
        }));
      }
    };

    socketService.on('connected', handleSocketConnected);
    socketService.on('chat_error', handleChatError);
    socketService.on('chat_joined', handleChatJoined);
    socketService.on('new_message', handleNewMessage);
    socketService.on('user_typing', handleUserTyping);
    socketService.on('message_read', handleMessageRead);

    if (socketService.isConnected()) {
      setTimeout(() => socketService.joinChat(chatId), 100);
    }

    return () => {
      socketService.off('connected', handleSocketConnected);
      socketService.off('chat_error', handleChatError);
      socketService.off('chat_joined', handleChatJoined);
      socketService.off('new_message', handleNewMessage);
      socketService.off('user_typing', handleUserTyping);
      socketService.off('message_read', handleMessageRead);
      socketService.leaveChat(chatId);
    };
  };

  const handleNewMessage = (message) => {
    handleNewMessageRef.current++;
    console.log(`[DEBUG] handleNewMessage called #${handleNewMessageRef.current} for chat ${chatId}, messageId: ${message._id}`);
    
    if (message.chat === chatId || message.chat?._id === chatId || message.chat?.chatId === chatId) {
      // Deduplicate: Check if message already exists
      setMessages(prev => {
        const exists = prev.some(m => m._id === message._id);
        if (exists) {
          console.log(`[DEBUG] Message ${message._id} already exists, skipping duplicate`);
          return prev;
        }
        console.log(`[DEBUG] Adding new message ${message._id} to state`);
        return [...prev, message];
      });
      markAsRead();
    }
  };

  const handleUserTyping = (data) => {
    if (data.chatId === chatId && data.userId !== user?._id) {
      if (data.isTyping) {
        setTypingUsers(prev => [...new Set([...prev, data.userId])]);
      } else {
        setTypingUsers(prev => prev.filter(id => id !== data.userId));
      }
      
      // Auto hide typing indicator after 3 seconds
      if (data.isTyping) {
        setTimeout(() => {
          setTypingUsers(prev => prev.filter(id => id !== data.userId));
        }, 3000);
      }
    }
  };

  const loadChatData = async () => {
    console.log(`[DEBUG] loadChatData called for chat ${chatId}`);
    
    try {
      setLoading(true);
      const [chatResponse, messagesResponse] = await Promise.all([
        chatService.getChat(chatId),
        chatService.getMessages(chatId, { page: 1, limit: 50 })
      ]);

      if (chatResponse.success) {
        setChat(chatResponse.data.chat);
        
        // Find other participant
        const other = chatResponse.data.chat.participants?.find(
          p => p.user._id !== user?._id
        )?.user;
        setOtherParticipant(other);
      }

      if (messagesResponse.success) {
        setMessages(messagesResponse.data.messages || []);
        setHasMore(messagesResponse.data.messages?.length >= 50);
      }

      // Mark as read
      await markAsRead();
    } catch (error) {
      console.error('Error loading chat:', error);
      navigate('/dashboard/messages');
    } finally {
      setLoading(false);
    }
  };

  const loadMoreMessages = async () => {
    if (loadingMore || !hasMore) return;
    
    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const response = await chatService.getMessages(chatId, { 
        page: nextPage, 
        limit: 50 
      });

      if (response.success) {
        setMessages(prev => [...(response.data.messages || []), ...prev]);
        setPage(nextPage);
        setHasMore(response.data.messages?.length >= 50);
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const markAsRead = async () => {
    markAsReadRef.current++;
    console.log(`[DEBUG] markAsRead called #${markAsReadRef.current} for chat ${chatId}`);
    
    // Debounce: Only allow one call per second
    const now = Date.now();
    if (now - lastMarkAsReadTimeRef.current < MAR_AS_READ_DEBOUNCE) {
      console.log(`[DEBUG] markAsRead debounced, last call was ${now - lastMarkAsReadTimeRef.current}ms ago`);
      return;
    }
    lastMarkAsReadTimeRef.current = now;
    
    try {
      await chatService.markAsRead(chatId);
      // Notify via socket
      socketService.sendMessageRead(chatId, messages[messages.length - 1]?._id);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      
      // Send typing stop
      socketService.sendTyping(chatId, false);
      
      const response = await chatService.sendMessage(chatId, newMessage.trim());
      
      if (response.success) {
        setNewMessage('');
        // Message will be added via socket
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('خطا در ارسال پیام');
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (e) => {
    const text = e.target.value;
    setNewMessage(text);
    
    // Debounce typing indicator to prevent multiple events
    const isTyping = text.trim() !== '';
    
    // Only send if status changed and not spamming
    if (lastTypingStatusRef.current !== isTyping) {
      lastTypingStatusRef.current = isTyping;
      socketService.sendTyping(chatId, isTyping);
    }
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Auto-stop typing after 2 seconds of inactivity
    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        if (lastTypingStatusRef.current === true) {
          lastTypingStatusRef.current = false;
          socketService.sendTyping(chatId, false);
        }
      }, 2000);
    }
  };

  const handleFileUpload = async (file) => {
    try {
      setSending(true);
      const response = await chatService.uploadAttachment(chatId, file);
      if (response.success) {
        // File will be added via socket
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('خطا در آپلود فایل');
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fa-IR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const renderMessage = (message) => {
    const isOwn = message.sender._id === user?._id;
    const isRead = message.readBy?.some(read => read.user === user?._id);
    
    return (
      <div
        key={message._id}
        className={`flex mb-4 ${isOwn ? 'justify-end' : 'justify-start'}`}
      >
        <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
          <div
            className={`rounded-2xl px-4 py-2 ${
              isOwn
                ? 'bg-blue-600 text-white rounded-br-none'
                : 'bg-gray-100 text-gray-900 rounded-bl-none'
            }`}
          >
            {message.type === 'image' ? (
              <img
                src={message.attachments?.[0]?.url || message.content}
                alt="تصویر پیام"
                className="max-w-full max-h-64 rounded-lg"
              />
            ) : message.type === 'file' ? (
              <div className="flex items-center gap-2">
                <Paperclip size={16} />
                <span className="truncate">{message.content}</span>
              </div>
            ) : (
              <p className="whitespace-pre-wrap">{message.content}</p>
            )}
            
            {/* Message status */}
            <div className={`flex items-center gap-1 mt-1 text-xs ${isOwn ? 'text-blue-200' : 'text-gray-500'}`}>
              <span>{formatTime(message.createdAt)}</span>
              {isOwn && (
                <>
                  {message.status === 'sent' && <Check size={12} />}
                  {message.status === 'delivered' && <CheckCheck size={12} />}
                  {isRead && <CheckCheck size={12} className="text-blue-300" />}
                </>
              )}
            </div>
          </div>
          
          {/* Sender name for others' messages */}
          {!isOwn && (
            <p className="text-xs text-gray-500 mt-1 mr-1">
              {message.sender.firstName}
            </p>
          )}
        </div>
        
        {/* Avatar */}
        {!isOwn && (
          <div className="order-1 mr-2 self-end">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
              {message.sender.profileImage ? (
                <img
                  src={message.sender.profileImage}
                  alt={message.sender.firstName}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <User size={16} className="text-gray-500" />
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold text-gray-900 mb-2">گفتگو یافت نشد</h2>
        <Button onClick={() => navigate('/dashboard/messages')}>
          بازگشت به گفتگوها
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Chat Header */}
      <header className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard/messages')}
              className="md:hidden"
            >
              <ChevronLeft size={24} />
            </Button>
            
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
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              
              <div>
                <h1 className="font-bold text-gray-900">
                  {otherParticipant?.firstName} {otherParticipant?.lastName}
                </h1>
                <div className="flex items-center gap-2">
                  {typingUsers.length > 0 ? (
                    <p className="text-sm text-green-600">در حال تایپ...</p>
                  ) : (
                    <p className="text-sm text-gray-600">آنلاین</p>
                  )}
                  {otherParticipant?.verifications?.verified && (
                    <span className="px-1.5 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                      ✓ تایید شده
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" title="تماس صوتی">
              <Phone size={20} />
            </Button>
            <Button variant="ghost" size="sm" title="تماس ویدیویی">
              <Video size={20} />
            </Button>
            <Button variant="ghost" size="sm" title="اطلاعات گفتگو">
              <Info size={20} />
            </Button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-t border-gray-100 mt-2">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors ${
              activeTab === 'chat'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <MessageSquare size={16} /> گفتگو
          </button>
          <button
            onClick={() => setActiveTab('deal')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors ${
              activeTab === 'deal'
                ? 'text-emerald-600 border-b-2 border-emerald-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Handshake size={16} /> قراردادها
          </button>
        </div>
      </header>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'chat' ? (
          <div className="max-w-6xl mx-auto h-full flex flex-col">
            {/* Post Info */}
            {chat.post && (
              <div className="bg-blue-50 border-b border-blue-100 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {chat.post.images?.[0] && (
                      <img
                        src={chat.post.images[0]}
                        alt={chat.post.title}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <h3 className="font-medium text-gray-900">{chat.post.title}</h3>
                      <p className="text-sm text-gray-600">
                        {chat.post.type === 'sell' ? 'آگهی فروش' : 'درخواست خرید'}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/posts/${chat.post.slug || chat.post._id}`)}
                  >
                    مشاهده آگهی
                  </Button>
                </div>
              </div>
            )}

            {/* Messages Container */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4"
              onScroll={(e) => {
                if (e.target.scrollTop === 0 && hasMore) {
                  loadMoreMessages();
                }
              }}
            >
              {loadingMore && (
                <div className="flex justify-center py-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              )}
              
              <div className="space-y-4">
                {messages.map((message, index) => {
                  const currentDate = formatDate(message.createdAt);
                  const prevDate = index > 0 ? formatDate(messages[index - 1].createdAt) : null;
                  
                  return (
                    <React.Fragment key={message._id}>
                      {currentDate !== prevDate && (
                        <div className="flex justify-center my-4">
                          <span className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-full">
                            {currentDate}
                          </span>
                        </div>
                      )}
                      {renderMessage(message)}
                    </React.Fragment>
                  );
                })}
              </div>
              
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={sendMessage} className="border-t border-gray-200 bg-white p-4">
              <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      title="ارسال فایل"
                    >
                      <Paperclip size={20} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      title="ارسال عکس"
                    >
                      <ImageIcon size={20} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      title="ارسال ویس"
                    >
                      <Mic size={20} />
                    </Button>
                  </div>
                  
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={handleTyping}
                      placeholder="پیام خود را بنویسید..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute left-2 top-1/2 transform -translate-y-1/2"
                      title="ایموجی"
                    >
                      <Smile size={20} />
                    </Button>
                  </div>
                  
                  <Button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3"
                  >
                    <Send size={20} />
                  </Button>
                </div>
              </div>
            </form>
          </div>
        ) : (
          /* Deal Tab */
          <div className="max-w-6xl mx-auto h-full">
            <DealPanel chatId={chatId} chatParticipants={chat?.participants} chat={chat} />
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleFileUpload(e.target.files[0]);
          }
        }}
      />
    </div>
  );
};

export default ChatPage;
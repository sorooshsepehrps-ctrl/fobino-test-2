import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import chatService from '../services/chatService';

export default function usePostChatStarter() {
  const navigate = useNavigate();
  const [isStartingChat, setIsStartingChat] = useState(false);

  const startChatFromPost = async (post) => {
    if (!post?._id) {
      toast.error('شناسه آگهی نامعتبر است');
      return;
    }

    const recipientId = post?.user?._id || post?.user?.id;
    if (!recipientId) {
      toast.error('شناسه آگهی‌دهنده پیدا نشد');
      return;
    }

    setIsStartingChat(true);

    try {
      const initialMessage = `ایجاد درخواست چت در آگهی ${post.title || 'بدون عنوان'}`;

      const response = await chatService.createUserChat(
        recipientId,
        initialMessage,
        post._id
      );

      const chat = response?.data?.chat || response?.chat;
      const chatId = chat?._id || chat?.id;

      if (!chatId) {
        throw new Error('شناسه چت از سرور دریافت نشد');
      }

      toast.success('چت با موفقیت آماده شد');
      navigate(`/dashboard/chats/${chatId}`);
    } catch (error) {
      console.error(error);
      const serverMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        'شروع چت با خطا مواجه شد';
      toast.error(serverMessage);
    } finally {
      setIsStartingChat(false);
    }
  };

  return {
    isStartingChat,
    startChatFromPost,
  };
}
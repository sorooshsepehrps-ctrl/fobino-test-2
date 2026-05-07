import { useState } from 'react';
import toast from 'react-hot-toast';
import postService from '../services/postService';

export default function useContactAccessFlow() {
  const [selectedPost, setSelectedPost] = useState(null);
  const [contactData, setContactData] = useState(null);

  const [loading, setLoading] = useState(false);

  const [showContactModal, setShowContactModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);

  // 🚀 MAIN ENTRY
  const handleOpenContact = async (post) => {
    setSelectedPost(post);

    if (post.type === 'sell') {
      return fetchContact(post._id);
    }

    // BUY POST → محدودیت دارد
    if (post.remainingContactAccess === 0) {
      setShowWarningModal(true);
      return;
    }

    fetchContact(post._id);
  };

  // 🔥 FETCH CONTACT
  const fetchContact = async (postId) => {
    setLoading(true);
    try {
      const res = await postService.getContactDetails(postId);

      setContactData(res?.data);
      setShowContactModal(true);

      toast.success('اطلاعات تماس دریافت شد');
    } catch (err) {
      console.error(err);

      if (err?.response?.status === 402) {
        setShowWalletModal(true);
      } else {
        toast.error('خطا در دریافت اطلاعات تماس');
      }
    } finally {
      setLoading(false);
    }
  };

  // 🔁 confirm access (برای خرید)
  const confirmAccess = () => {
    setShowWarningModal(false);
    fetchContact(selectedPost._id);
  };

  return {
    // state
    selectedPost,
    contactData,
    loading,

    showContactModal,
    showWarningModal,
    showWalletModal,

    // actions
    handleOpenContact,
    confirmAccess,

    setShowContactModal,
    setShowWarningModal,
    setShowWalletModal,
  };
}
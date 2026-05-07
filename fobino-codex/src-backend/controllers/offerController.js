const Offer = require('../models/Offer');
const Chat = require('../models/Chat');
const Post = require('../models/Post');
const Message = require('../models/Message');
const { asyncHandler } = require('../middleware/errorHandler');
const response = require('../utils/responseFormatter');
const notificationService = require('../services/notificationService');

exports.createOffer = asyncHandler(async (req, res) => {
  const { chatId, pricePerUnit, quantity, unit, deliveryDays, paymentMethod, terms, notes, deliveryAddress, isMultiStage, stages } = req.body;
  
  const chat = await Chat.findById(chatId).populate('post');
  if (!chat) return response.notFound(res, 'گفتگو یافت نشد');
  if (!chat.isParticipant(req.user._id)) return response.forbidden(res, 'شما در این گفتگو نیستید');
  
  const receiver = chat.participants.find(p => p.user.toString() !== req.user._id.toString());
  
  const offer = new Offer({
    post: chat.post._id,
    chat: chatId,
    sender: req.user._id,
    receiver: receiver.user,
    pricePerUnit,
    quantity,
    unit: unit || chat.post.unit,
    totalPrice: pricePerUnit * quantity,
    deliveryDays,
    paymentMethod,
    terms,
    notes,
    deliveryAddress,
    isMultiStage,
    stages
  });
  await offer.save();
  
  const message = new Message({
    chat: chatId,
    sender: req.user._id,
    type: 'offer',
    content: `پیشنهاد: ${quantity} ${unit} با قیمت ${pricePerUnit.toLocaleString()} ریال`,
    offer: offer._id
  });
  await message.save();
  
  offer.message = message._id;
  await offer.save();
  
  await Chat.findByIdAndUpdate(chatId, { chatType: 'post_offer', relatedOffer: offer._id });
  await Post.findByIdAndUpdate(chat.post._id, { $inc: { 'stats.offers': 1 } });
  // Notify receiver (temporarily disabled)
  // await notificationService.notifyNewOffer(receiver.user, chat.post.title, offer._id, chat.post._id);
  
  return response.created(res, { offer, message }, 'پیشنهاد ارسال شد');
});

exports.getOffer = asyncHandler(async (req, res) => {
  const offer = await Offer.findById(req.params.id)
    .populate('sender', 'firstName lastName profileImage')
    .populate('receiver', 'firstName lastName profileImage')
    .populate('post', 'title images');
  if (!offer) return response.notFound(res, 'پیشنهاد یافت نشد');
  if (offer.sender.toString() !== req.user._id.toString() && offer.receiver.toString() !== req.user._id.toString()) {
    return response.forbidden(res, 'دسترسی ندارید');
  }
  return response.success(res, { offer });
});

exports.acceptOffer = asyncHandler(async (req, res) => {
  const { message } = req.body;
  const offer = await Offer.findById(req.params.id);
  if (!offer) return response.notFound(res, 'پیشنهاد یافت نشد');
  if (offer.receiver.toString() !== req.user._id.toString()) return response.forbidden(res, 'فقط گیرنده می‌تواند بپذیرد');
  
  await offer.accept(message);
  // Notify sender (temporarily disabled)
  // await notificationService.notifyOfferAccepted(offer.sender, (await Post.findById(offer.post)).title, offer._id, null);
  
  return response.success(res, { offer }, 'پیشنهاد پذیرفته شد');
});

exports.rejectOffer = asyncHandler(async (req, res) => {
  const { message } = req.body;
  const offer = await Offer.findById(req.params.id);
  if (!offer) return response.notFound(res, 'پیشنهاد یافت نشد');
  if (offer.receiver.toString() !== req.user._id.toString()) return response.forbidden(res, 'فقط گیرنده می‌تواند رد کند');
  
  await offer.reject(message);
  // Notify sender (temporarily disabled)
  // await notificationService.notifyOfferRejected(offer.sender, (await Post.findById(offer.post)).title, offer._id);
  
  return response.success(res, { offer }, 'پیشنهاد رد شد');
});

exports.counterOffer = asyncHandler(async (req, res) => {
  const offer = await Offer.findById(req.params.id);
  if (!offer) return response.notFound(res, 'پیشنهاد یافت نشد');
  if (offer.receiver.toString() !== req.user._id.toString()) return response.forbidden(res, 'فقط گیرنده می‌تواند پیشنهاد متقابل دهد');
  
  const counterOffer = await offer.createCounterOffer(req.body);
  return response.created(res, { offer: counterOffer }, 'پیشنهاد متقابل ارسال شد');
});

exports.cancelOffer = asyncHandler(async (req, res) => {
  const offer = await Offer.findById(req.params.id);
  if (!offer) return response.notFound(res, 'پیشنهاد یافت نشد');
  if (offer.sender.toString() !== req.user._id.toString()) return response.forbidden(res, 'فقط فرستنده می‌تواند لغو کند');
  
  await offer.cancel();
  return response.success(res, { offer }, 'پیشنهاد لغو شد');
});

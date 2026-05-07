const Invitation = require('../models/Invitation');
const Post = require('../models/Post');
const Chat = require('../models/Chat');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const { kavenegar } = require('../config/sms');
const { asyncHandler } = require('../middleware/errorHandler');
const response = require('../utils/responseFormatter');
const { SYSTEM } = require('../config/constants');

exports.calculateCost = asyncHandler(async (req, res) => {
  const { recipients } = req.body;
  const count = recipients?.length || 0;
  const costPerMessage = SYSTEM.INVITATION_COST_PER_MESSAGE;
  return response.success(res, { count, costPerMessage, totalCost: count * costPerMessage });
});

exports.sendInvitations = asyncHandler(async (req, res) => {
  const { postId, message, recipients, campaignName } = req.body;
  
  const post = await Post.findById(postId);
  if (!post || post.user.toString() !== req.user._id.toString()) return response.error(res, 'آگهی یافت نشد یا متعلق به شما نیست', 400);
  
  const totalCost = recipients.length * SYSTEM.INVITATION_COST_PER_MESSAGE;
  const wallet = await Wallet.getOrCreateWallet(req.user._id);
  if (!wallet.hasSufficientBalance(totalCost, 'IRR')) return response.error(res, 'موجودی کافی نیست', 400);
  
  await wallet.withdraw(totalCost, 'IRR');
  await Transaction.create({ user: req.user._id, wallet: wallet._id, type: 'invitation', amount: -totalCost, currency: 'IRR', description: `ارسال ${recipients.length} دعوتنامه`, status: 'completed', completedAt: new Date() });
  
  const invitation = new Invitation({
    sender: req.user._id, post: postId, campaignName, message,
    recipients: recipients.map(r => ({ phone: r.phone, name: r.name })),
    pricing: { costPerMessage: SYSTEM.INVITATION_COST_PER_MESSAGE, totalCost, paidAt: new Date() },
    status: 'processing'
  });
  await invitation.save();
  
  // Send SMS in background
  setImmediate(async () => {
    for (const recipient of invitation.recipients) {
      try {
        const link = invitation.getInviteLink(recipient.inviteCode);
        const smsMessage = `${message}\n${link}`;
        await kavenegar.send(recipient.phone, smsMessage);
        await invitation.markSent(recipient.phone);
      } catch (err) {
        await invitation.markFailed(recipient.phone, err.message);
      }
    }
    invitation.status = 'completed';
    await invitation.save();
  });
  
  return response.created(res, { invitation }, 'دعوت‌ها در حال ارسال هستند');
});

exports.getInvitations = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const total = await Invitation.countDocuments({ sender: req.user._id });
  const invitations = await Invitation.find({ sender: req.user._id }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit)).populate('post', 'title');
  return response.paginated(res, invitations, { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) });
});

exports.getInvitationStats = asyncHandler(async (req, res) => {
  const stats = await Invitation.getSenderStats(req.user._id);
  return response.success(res, { stats });
});

exports.handleInviteLink = asyncHandler(async (req, res) => {
  const { inviteCode } = req.params;
  const invitation = await Invitation.findByInviteCode(inviteCode);
  if (!invitation) return response.notFound(res, 'دعوت‌نامه یافت نشد');
  
  await invitation.markClicked(inviteCode);
  const recipient = invitation.recipients.find(r => r.inviteCode === inviteCode);
  
  return response.success(res, {
    post: invitation.post,
    sender: invitation.sender,
    recipientName: recipient?.name,
    inviteCode
  });
});

exports.completeInvitation = asyncHandler(async (req, res) => {
  const { inviteCode } = req.body;
  const invitation = await Invitation.findByInviteCode(inviteCode);
  if (!invitation) return response.notFound(res, 'دعوت‌نامه یافت نشد');
  
  // Create chat between sender and new user
  const chat = await Chat.getOrCreateChat(invitation.post._id, req.user._id, invitation.sender._id);
  await invitation.markRegistered(inviteCode, req.user._id, chat._id);
  
  return response.success(res, { chat, post: invitation.post });
});

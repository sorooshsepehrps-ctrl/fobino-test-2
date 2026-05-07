const Chat = require('../models/Chat');
const Message = require('../models/Message');

function sameId(a, b) { return a && b && a.toString() === b.toString(); }

async function getAverageResponseTimeInMinutes(userId) {
  const chats = await Chat.find({ 'participants.user': userId }).select('_id').lean();
  const chatIds = chats.map(c => c._id);
  if (!chatIds.length) return null;

  const messages = await Message.find({ chat: { $in: chatIds }, sender: { $ne: null }, isDeleted: false })
    .select('chat sender createdAt')
    .sort({ chat: 1, createdAt: 1 })
    .lean();

  let pendingIncoming = new Map();
  let totalMinutes = 0;
  let count = 0;

  for (const msg of messages) {
    const chatKey = msg.chat.toString();
    if (sameId(msg.sender, userId)) {
      const incomingAt = pendingIncoming.get(chatKey);
      if (incomingAt) {
        totalMinutes += Math.max(0, (new Date(msg.createdAt) - new Date(incomingAt)) / 60000);
        count += 1;
        pendingIncoming.delete(chatKey);
      }
    } else if (!pendingIncoming.has(chatKey)) {
      pendingIncoming.set(chatKey, msg.createdAt);
    }
  }

  return count ? Math.round(totalMinutes / count) : null;
}

async function isAverageResponseTimeUnderTwoHours(userId) {
  const avg = await getAverageResponseTimeInMinutes(userId);
  return avg !== null && avg < 120;
}

module.exports = { getAverageResponseTimeInMinutes, isAverageResponseTimeUnderTwoHours };

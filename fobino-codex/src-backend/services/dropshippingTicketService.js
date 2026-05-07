

const Ticket = require('../models/Ticket');

async function createLateTrackingTicket({ userId, rfp, product }) {
  const messageLines = [
    'این تیکت به صورت خودکار توسط سیستم دراپ‌شیپینگ ایجاد شده است.',
    `کد RFP: ${rfp.rfpCode}`,
    `نام محصول: ${product?.productName || 'نامشخص'}`,
    `تاریخ ارسال توافقی: ${rfp.agreedShipmentDateJalali || 'ثبت نشده'}`,
    `مبلغ کل: ${rfp.totalAmount?.toLocaleString('fa-IR') || 0} تومان`,
    '',
    'تا این لحظه کد رهگیری برای این RFP ثبت نشده است.',
    'لطفاً حداکثر ظرف ۵ روز کد رهگیری را در RFP ثبت کنید؛ در غیر این صورت وجه کامل به دراپ‌شیپر بازگشت داده می‌شود و حساب تامین‌کننده تعلیق خواهد شد.'
  ];

  const ticket = await Ticket.create({
    user: userId,
    subject: `دراپ‌شیپینگ - پیگیری کد رهگیری ${rfp.rfpCode}`,
    category: 'other',
    priority: 'high',
    tags: ['dropshipping', 'late-shipment', rfp.rfpCode],
    message: messageLines.join('\n')
  });

  return ticket;
}

module.exports = {
  createLateTrackingTicket
};
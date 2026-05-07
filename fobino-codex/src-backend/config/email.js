const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

const isDev = process.env.NODE_ENV !== 'production';

// Only create transporter in production
let transporter = null;
if (!isDev) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_PORT === '465',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

const sendEmail = async ({ to, subject, html, text }) => {
  // Dev mode: just log to console
  if (isDev) {
    console.log('\n========================================');
    console.log('📧 EMAIL (DEV MODE)');
    console.log('----------------------------------------');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Text: ${text}`);
    console.log('========================================\n');
    return { success: true, messageId: `dev-email-${Date.now()}` };
  }

  try {
    const info = await transporter.sendMail({
      from: `"فوبینو" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html,
      text
    });
    
    logger.info(`Email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('Email send error:', error);
    return { success: false, error: error.message };
  }
};

const emailTemplates = {
  verification: (code) => ({
    subject: 'کد تایید فوبینو',
    html: `
      <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; padding: 20px;">
        <h2>کد تایید فوبینو</h2>
        <p>کد تایید شما: <strong style="font-size: 24px; color: #4CAF50;">${code}</strong></p>
        <p>این کد تا ۵ دقیقه معتبر است.</p>
      </div>
    `,
    text: `کد تایید شما: ${code}`
  }),

  welcome: (name) => ({
    subject: 'به فوبینو خوش آمدید',
    html: `
      <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; padding: 20px;">
        <h2>سلام ${name} عزیز</h2>
        <p>به پلتفرم فوبینو خوش آمدید!</p>
        <p>برای شروع، پروفایل خود را تکمیل کنید و از امکانات پلتفرم استفاده نمایید.</p>
      </div>
    `,
    text: `سلام ${name} عزیز، به فوبینو خوش آمدید!`
  }),

  dealCreated: (dealInfo) => ({
    subject: 'معامله جدید ایجاد شد',
    html: `
      <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; padding: 20px;">
        <h2>معامله جدید</h2>
        <p>یک معامله جدید با شماره <strong>${dealInfo.dealNumber}</strong> ایجاد شد.</p>
        <p>مبلغ کل: ${dealInfo.totalAmount.toLocaleString()} ریال</p>
      </div>
    `,
    text: `معامله جدید با شماره ${dealInfo.dealNumber} ایجاد شد.`
  }),

  paymentReceived: (amount) => ({
    subject: 'پرداخت دریافت شد',
    html: `
      <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; padding: 20px;">
        <h2>پرداخت موفق</h2>
        <p>مبلغ <strong>${amount.toLocaleString()}</strong> ریال به حساب امن واریز شد.</p>
      </div>
    `,
    text: `مبلغ ${amount.toLocaleString()} ریال دریافت شد.`
  }),

  verificationApproved: (level) => ({
    subject: 'احراز هویت تایید شد',
    html: `
      <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; padding: 20px;">
        <h2>تبریک!</h2>
        <p>احراز هویت شما در سطح ${level} تایید شد.</p>
      </div>
    `,
    text: `احراز هویت شما در سطح ${level} تایید شد.`
  }),

  subscriptionExpiring: (daysLeft) => ({
    subject: 'اشتراک شما در حال انقضاست',
    html: `
      <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; padding: 20px;">
        <h2>یادآوری اشتراک</h2>
        <p>اشتراک شما تا ${daysLeft} روز دیگر منقضی می‌شود.</p>
        <p>برای تمدید اشتراک اقدام کنید.</p>
      </div>
    `,
    text: `اشتراک شما تا ${daysLeft} روز دیگر منقضی می‌شود.`
  })
};

module.exports = {
  sendEmail,
  emailTemplates
};

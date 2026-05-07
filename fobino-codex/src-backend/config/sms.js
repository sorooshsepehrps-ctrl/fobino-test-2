const axios = require('axios');
const logger = require('../utils/logger');

const isDev = process.env.NODE_ENV !== 'production';

// Kavenegar SMS Provider (with dev mode console.log fallback)
const kavenegar = {
  apiKey: process.env.SMS_API_KEY,
  sender: process.env.SMS_SENDER,
  baseUrl: 'https://api.kavenegar.com/v1',

  async send(receptor, message) {
    // Dev mode: just log to console
    if (isDev) {
      console.log('\n========================================');
      console.log('📱 SMS MESSAGE (DEV MODE)');
      console.log('----------------------------------------');
      console.log(`To: ${receptor}`);
      console.log(`Message: ${message}`);
      console.log('========================================\n');
      return { success: true, messageId: `dev-${Date.now()}` };
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/${this.apiKey}/sms/send.json`,
        {
          params: {
            receptor,
            message,
            sender: this.sender
          }
        }
      );
      
      return {
        success: true,
        messageId: response.data.entries[0].messageid
      };
    } catch (error) {
      logger.error('Kavenegar send error:', error);
      return { success: false, error: error.message };
    }
  },

  async sendVerificationCode(receptor, code) {
    // Dev mode: just log to console
    if (isDev) {
      console.log('\n========================================');
      console.log('🔐 VERIFICATION CODE (DEV MODE)');
      console.log('----------------------------------------');
      console.log(`Phone: ${receptor}`);
      console.log(`Code: ${code}`);
      console.log('========================================\n');
      return { success: true, messageId: `dev-${Date.now()}` };
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/${this.apiKey}/verify/lookup.json`,
        {
          params: {
            receptor,
            token: code,
            template: 'verify'
          }
        }
      );
      
      return {
        success: true,
        messageId: response.data.entries[0].messageid
      };
    } catch (error) {
      logger.error('Kavenegar verification error:', error);
      return { success: false, error: error.message };
    }
  },

  async sendBulk(receptors, message) {
    // Dev mode: just log to console
    if (isDev) {
      console.log('\n========================================');
      console.log('📱 BULK SMS (DEV MODE)');
      console.log('----------------------------------------');
      console.log(`To: ${receptors.join(', ')}`);
      console.log(`Message: ${message}`);
      console.log('========================================\n');
      return { success: true, count: receptors.length };
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/${this.apiKey}/sms/sendarray.json`,
        {
          params: {
            receptor: receptors.join(','),
            message,
            sender: this.sender
          }
        }
      );
      
      return {
        success: true,
        count: response.data.entries.length
      };
    } catch (error) {
      logger.error('Kavenegar bulk send error:', error);
      return { success: false, error: error.message };
    }
  },

  async getStatus(messageId) {
    // Dev mode: return mock status
    if (isDev) {
      return { success: true, status: 10, statusText: 'delivered' };
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/${this.apiKey}/sms/status.json`,
        {
          params: { messageid: messageId }
        }
      );
      
      return {
        success: true,
        status: response.data.entries[0].status,
        statusText: response.data.entries[0].statustext
      };
    } catch (error) {
      logger.error('Kavenegar status error:', error);
      return { success: false, error: error.message };
    }
  }
};

// Generate verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports = {
  kavenegar,
  generateVerificationCode
};

const axios = require('axios');
const logger = require('../utils/logger');

// Zarinpal Configuration for Sandbox
const zarinpal = {
  merchantId: '00000000-0000-0000-0000-000000000000', // Sandbox merchant ID (all zeros)
  sandbox: true, // Always sandbox for testing
  
  get baseUrl() {
    return this.sandbox 
      ? 'https://sandbox.zarinpal.com/pg/v4/payment'
      : 'https://api.zarinpal.com/pg/v4/payment';
  },
  
  get gatewayUrl() {
    return this.sandbox
      ? 'https://sandbox.zarinpal.com/pg/StartPay'
      : 'https://www.zarinpal.com/pg/StartPay';
  },

  async request(amount, description, callbackUrl, mobile = null, email = null) {
    try {
      // For sandbox, use the test merchant ID
      const merchantId = this.sandbox 
        ? '00000000-0000-0000-0000-000000000000'
        : this.merchantId;

      logger.info('Zarinpal sandbox request:', {
        merchantId,
        amount,
        description,
        callbackUrl
      });

      const response = await axios.post(`${this.baseUrl}/request.json`, {
        merchant_id: merchantId,
        amount: amount / 10, // Convert Rials to Tomans (Zarinpal uses Tomans)
        description,
        callback_url: callbackUrl,
        mobile,
        email,
        metadata: {
          mobile,
          email
        }
      });
      
      logger.info('Zarinpal response:', response.data);
      
      if (response.data.data && response.data.data.code === 100) {
        return {
          success: true,
          authority: response.data.data.authority,
          url: `${this.gatewayUrl}/${response.data.data.authority}`
        };
      }
      
      return { 
        success: false, 
        error: response.data.errors || 'خطا در اتصال به درگاه پرداخت' 
      };
    } catch (error) {
      const errorDetails = {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      };
      logger.error('Zarinpal request error:', errorDetails);
      throw new Error('خطا در اتصال به درگاه پرداخت');
    }
  },

  async verify(authority, amount) {
    try {
      // For sandbox, use the test merchant ID
      const merchantId = this.sandbox 
        ? '00000000-0000-0000-0000-000000000000'
        : this.merchantId;

      logger.info('Zarinpal sandbox verify:', {
        merchantId,
        authority,
        amount: amount / 10 // Convert Rials to Tomans
      });

      const response = await axios.post(`${this.baseUrl}/verify.json`, {
        merchant_id: merchantId,
        authority,
        amount: amount / 10 // Convert Rials to Tomans
      });
      
      logger.info('Zarinpal verify response:', response.data);
      
      if (response.data.data && (response.data.data.code === 100 || response.data.data.code === 101)) {
        return {
          success: true,
          refId: response.data.data.ref_id,
          cardPan: response.data.data.card_pan || '5022-29**-****-2328' // Test card for sandbox
        };
      }
      
      return { 
        success: false, 
        error: response.data.errors || 'خطا در تایید پرداخت' 
      };
    } catch (error) {
      logger.error('Zarinpal verify error:', error);
      throw new Error('خطا در تایید پرداخت');
    }
  }
};

// IDPay Configuration (if needed)
const idpay = {
  apiKey: process.env.IDPAY_API_KEY,
  sandbox: process.env.IDPAY_SANDBOX === 'true',
  
  get baseUrl() {
    return 'https://api.idpay.ir/v1.1';
  },

  async request(orderId, amount, name, phone, description, callbackUrl) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/payment`,
        {
          order_id: orderId,
          amount: amount / 10, // Convert Rials to Tomans
          name,
          phone,
          desc: description,
          callback: callbackUrl
        },
        {
          headers: {
            'X-API-KEY': this.apiKey,
            'X-SANDBOX': this.sandbox ? '1' : '0'
          }
        }
      );
      
      return {
        success: true,
        id: response.data.id,
        url: response.data.link
      };
    } catch (error) {
      logger.error('IDPay request error:', error);
      throw error;
    }
  },

  async verify(id, orderId) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/payment/verify`,
        { id, order_id: orderId },
        {
          headers: {
            'X-API-KEY': this.apiKey,
            'X-SANDBOX': this.sandbox ? '1' : '0'
          }
        }
      );
      
      if (response.data.status === 100 || response.data.status === 101) {
        return {
          success: true,
          trackId: response.data.track_id,
          cardNo: response.data.payment.card_no,
          amount: response.data.amount
        };
      }
      
      return { success: false, status: response.data.status };
    } catch (error) {
      logger.error('IDPay verify error:', error);
      throw error;
    }
  }
};

module.exports = {
  zarinpal,
  idpay
};
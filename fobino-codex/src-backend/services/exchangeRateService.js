const logger = require('../utils/logger');

const isDev = process.env.NODE_ENV !== 'production';

// Mock exchange rates for development
const MOCK_RATES = {
  USD: 52000,
  EUR: 57000,
  GBP: 66000,
  AED: 14200,
  TRY: 1600,
  CNY: 7200,
  INR: 625,
  RUB: 520,
};

class ExchangeRateService {
  constructor() {
    this.rates = { ...MOCK_RATES };
    this.lastUpdate = new Date();
  }

  // Get all exchange rates
  async getRates() {
    // Dev mode: return mock rates
    if (isDev) {
      console.log('💱 Using mock exchange rates (DEV MODE)');
      return {
        success: true,
        rates: this.rates,
        lastUpdate: this.lastUpdate,
        source: 'mock'
      };
    }

    // Production: fetch from API
    try {
      const apiUrl = process.env.EXCHANGE_API_URL;
      const apiKey = process.env.EXCHANGE_API_KEY;

      if (!apiUrl || !apiKey) {
        logger.warn('Exchange rate API not configured, using mock rates');
        return {
          success: true,
          rates: this.rates,
          lastUpdate: this.lastUpdate,
          source: 'mock'
        };
      }

      const response = await fetch(`${apiUrl}?api_key=${apiKey}`);
      const data = await response.json();

      if (data && data.usd) {
        this.rates = {
          USD: Math.round(data.usd.value),
          EUR: Math.round(data.eur.value),
          GBP: Math.round(data.gbp.value),
          AED: Math.round(data.aed.value),
          TRY: Math.round(data.try.value),
          CNY: Math.round(data.cny.value),
          INR: Math.round(data.inr.value),
          RUB: Math.round(data.rub.value),
        };
        this.lastUpdate = new Date();
      }

      return {
        success: true,
        rates: this.rates,
        lastUpdate: this.lastUpdate,
        source: 'api'
      };
    } catch (error) {
      logger.error('Exchange rate fetch error:', error);
      return {
        success: true,
        rates: this.rates,
        lastUpdate: this.lastUpdate,
        source: 'cache'
      };
    }
  }

  // Get single rate
  async getRate(currency) {
    const result = await this.getRates();
    const rate = result.rates[currency.toUpperCase()];
    
    if (!rate) {
      throw new Error(`نرخ ارز ${currency} یافت نشد`);
    }

    return {
      currency: currency.toUpperCase(),
      rate,
      lastUpdate: result.lastUpdate
    };
  }

  // Convert amount
  async convert(amount, fromCurrency, toCurrency = 'IRR') {
    const result = await this.getRates();
    
    if (toCurrency === 'IRR') {
      // Convert to Rial
      const rate = result.rates[fromCurrency.toUpperCase()];
      if (!rate) {
        throw new Error(`نرخ ارز ${fromCurrency} یافت نشد`);
      }
      return {
        originalAmount: amount,
        fromCurrency: fromCurrency.toUpperCase(),
        toCurrency: 'IRR',
        rate,
        convertedAmount: Math.round(amount * rate)
      };
    }

    if (fromCurrency === 'IRR') {
      // Convert from Rial
      const rate = result.rates[toCurrency.toUpperCase()];
      if (!rate) {
        throw new Error(`نرخ ارز ${toCurrency} یافت نشد`);
      }
      return {
        originalAmount: amount,
        fromCurrency: 'IRR',
        toCurrency: toCurrency.toUpperCase(),
        rate,
        convertedAmount: Math.round(amount / rate)
      };
    }

    throw new Error('تبدیل مستقیم بین ارزها پشتیبانی نمی‌شود');
  }

  // Update rates (called by cron job)
  async updateRates() {
    return this.getRates();
  }
}

module.exports = new ExchangeRateService();

const mongoose = require('mongoose');

const exchangeRateSchema = new mongoose.Schema({
  baseCurrency: {
    type: String,
    enum: ['IRR', 'USD', 'EUR', 'AED', 'TRY', 'GBP', 'CNY'],
    required: true
  },
  targetCurrency: {
    type: String,
    enum: ['IRR', 'USD', 'EUR', 'AED', 'TRY', 'GBP', 'CNY'],
    required: true
  },
  rate: {
    type: Number,
    required: true,
    min: 0
  },
  buyRate: Number,
  sellRate: Number,
  source: {
    type: String,
    enum: ['manual', 'api', 'bank'],
    default: 'manual'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index for currency pair
exchangeRateSchema.index({ baseCurrency: 1, targetCurrency: 1 });
exchangeRateSchema.index({ isActive: 1 });

// Static method to get rate
exchangeRateSchema.statics.getRate = async function(from, to) {
  if (from === to) return 1;
  
  const rate = await this.findOne({
    baseCurrency: from,
    targetCurrency: to,
    isActive: true
  }).sort({ updatedAt: -1 });
  
  if (rate) return rate.rate;
  
  // Try reverse
  const reverseRate = await this.findOne({
    baseCurrency: to,
    targetCurrency: from,
    isActive: true
  }).sort({ updatedAt: -1 });
  
  if (reverseRate) return 1 / reverseRate.rate;
  
  return null;
};

// Static method to convert amount
exchangeRateSchema.statics.convert = async function(amount, from, to) {
  const rate = await this.getRate(from, to);
  if (!rate) throw new Error(`نرخ تبدیل ${from} به ${to} یافت نشد`);
  return amount * rate;
};

// Static method to update rates from API
exchangeRateSchema.statics.updateFromAPI = async function(rates) {
  const operations = rates.map(rate => ({
    updateOne: {
      filter: {
        baseCurrency: rate.baseCurrency,
        targetCurrency: rate.targetCurrency
      },
      update: {
        $set: {
          rate: rate.rate,
          buyRate: rate.buyRate,
          sellRate: rate.sellRate,
          source: 'api',
          isActive: true
        }
      },
      upsert: true
    }
  }));
  
  return this.bulkWrite(operations);
};

// Static method to get all active rates
exchangeRateSchema.statics.getAllRates = async function(baseCurrency = 'IRR') {
  const rates = await this.find({
    baseCurrency,
    isActive: true
  }).lean();
  
  return rates.reduce((acc, r) => {
    acc[r.targetCurrency] = {
      rate: r.rate,
      buyRate: r.buyRate,
      sellRate: r.sellRate,
      updatedAt: r.updatedAt
    };
    return acc;
  }, {});
};

module.exports = mongoose.model('ExchangeRate', exchangeRateSchema);

const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    balances: {
      IRR: {
        available: { type: Number, default: 0, min: 0 },
        blocked: { type: Number, default: 0, min: 0 },
        totalDeposit: { type: Number, default: 0 },
        totalWithdrawal: { type: Number, default: 0 },
      },
      USD: {
        available: { type: Number, default: 0, min: 0 },
        blocked: { type: Number, default: 0, min: 0 },
        totalDeposit: { type: Number, default: 0 },
        totalWithdrawal: { type: Number, default: 0 },
      },
      EUR: {
        available: { type: Number, default: 0, min: 0 },
        blocked: { type: Number, default: 0, min: 0 },
        totalDeposit: { type: Number, default: 0 },
        totalWithdrawal: { type: Number, default: 0 },
      },
      AED: {
        available: { type: Number, default: 0, min: 0 },
        blocked: { type: Number, default: 0, min: 0 },
        totalDeposit: { type: Number, default: 0 },
        totalWithdrawal: { type: Number, default: 0 },
      },
    },

    defaultCurrency: {
      type: String,
      enum: ['IRR', 'USD', 'EUR', 'AED'],
      default: 'IRR',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

walletSchema.index({ user: 1 });

walletSchema.virtual('totalBalanceIRR').get(function () {
  return this.balances.IRR.available;
});

walletSchema.methods.getBalance = function (currency = 'IRR') {
  const balance = this.balances[currency];
  if (!balance) {
    throw new Error('ارز نامعتبر');
  }

  return {
    available: balance.available,
    blocked: balance.blocked,
    total: balance.available + balance.blocked,
  };
};

walletSchema.methods.getBalanceSnapshot = function (currency = 'IRR') {
  const balance = this.getBalance(currency);
  return {
    currency,
    available: balance.available,
    blocked: balance.blocked,
    total: balance.total,
  };
};

walletSchema.methods.hasSufficientBalance = function (amount, currency = 'IRR') {
  const balance = this.balances[currency];
  return balance && balance.available >= amount;
};

walletSchema.methods.assertSufficientAvailableBalance = function (amount, currency = 'IRR') {
  if (amount <= 0) {
    throw new Error('مبلغ باید بزرگتر از صفر باشد');
  }

  if (!this.balances[currency]) {
    throw new Error('ارز نامعتبر');
  }

  if (this.balances[currency].available < amount) {
    throw new Error('موجودی کافی نیست');
  }

  return true;
};

walletSchema.methods.assertSufficientBlockedBalance = function (amount, currency = 'IRR') {
  if (amount <= 0) {
    throw new Error('مبلغ باید بزرگتر از صفر باشد');
  }

  if (!this.balances[currency]) {
    throw new Error('ارز نامعتبر');
  }

  if (this.balances[currency].blocked < amount) {
    throw new Error('مبلغ مسدود شده کافی نیست');
  }

  return true;
};

walletSchema.methods.deposit = async function (amount, currency = 'IRR') {
  if (amount <= 0) {
    throw new Error('مبلغ باید بزرگتر از صفر باشد');
  }

  if (!this.balances[currency]) {
    throw new Error('ارز نامعتبر');
  }

  this.balances[currency].available += amount;
  this.balances[currency].totalDeposit += amount;

  return this.save();
};

walletSchema.methods.withdraw = async function (amount, currency = 'IRR') {
  this.assertSufficientAvailableBalance(amount, currency);

  this.balances[currency].available -= amount;
  this.balances[currency].totalWithdrawal += amount;

  return this.save();
};

walletSchema.methods.blockAmount = async function (amount, currency = 'IRR') {
  this.assertSufficientAvailableBalance(amount, currency);

  this.balances[currency].available -= amount;
  this.balances[currency].blocked += amount;

  return this.save();
};

walletSchema.methods.unblockAmount = async function (amount, currency = 'IRR') {
  this.assertSufficientBlockedBalance(amount, currency);

  this.balances[currency].blocked -= amount;
  this.balances[currency].available += amount;

  return this.save();
};

walletSchema.methods.releaseBlockedAmount = async function (amount, currency = 'IRR') {
  this.assertSufficientBlockedBalance(amount, currency);

  this.balances[currency].blocked -= amount;

  return this.save();
};

walletSchema.methods.convertCurrency = async function (amount, fromCurrency, toCurrency, rate) {
  this.assertSufficientAvailableBalance(amount, fromCurrency);

  const convertedAmount = amount * rate;
  this.balances[fromCurrency].available -= amount;
  this.balances[toCurrency].available += convertedAmount;

  return this.save();
};

walletSchema.statics.getOrCreateWallet = async function (userId) {
  let wallet = await this.findOne({ user: userId });

  if (!wallet) {
    wallet = new this({ user: userId });
    await wallet.save();
  }

  return wallet;
};

module.exports = mongoose.model('Wallet', walletSchema);
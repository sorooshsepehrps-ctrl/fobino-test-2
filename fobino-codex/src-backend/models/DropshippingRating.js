
const mongoose = require('mongoose');

const dropshippingRatingSchema = new mongoose.Schema(
  {
    rfp: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DropshippingRFP',
      required: true,
      index: true
    },
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    toUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    fromRole: {
      type: String,
      enum: ['provider', 'dropshipper'],
      required: true
    },
    toRole: {
      type: String,
      enum: ['provider', 'dropshipper'],
      required: true
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DropshippingProduct'
    },
    stars: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    }
  },
  { timestamps: true }
);

dropshippingRatingSchema.index({ rfp: 1, fromUser: 1, toUser: 1 }, { unique: true });
dropshippingRatingSchema.index({ toUser: 1, toRole: 1, createdAt: -1 });

dropshippingRatingSchema.statics.calculateAverageForUser = async function (userId, role) {
  const result = await this.aggregate([
    {
      $match: {
        toUser: new mongoose.Types.ObjectId(userId),
        toRole: role
      }
    },
    {
      $group: {
        _id: '$toUser',
        averageStars: { $avg: '$stars' },
        totalRatings: { $sum: 1 }
      }
    }
  ]);

  if (!result.length) {
    return { averageStars: 0, totalRatings: 0 };
  }

  return {
    averageStars: Number(result[0].averageStars.toFixed(2)),
    totalRatings: result[0].totalRatings
  };
};

module.exports = mongoose.model('DropshippingRating', dropshippingRatingSchema);

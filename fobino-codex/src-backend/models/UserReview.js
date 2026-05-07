const mongoose = require('mongoose');

const userReviewSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reviewee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reviewerRole: {
      type: String,
      enum: ['buyer', 'seller'],
      required: true
    },
    revieweeRole: {
      type: String,
      enum: ['buyer', 'seller'],
      required: true
    },
    text: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 1000
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: 'Rating must be an integer between 1 and 5'
      }
    },
    deal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Deal',
      required: true
    },
    shipment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shipping',
      default: null
    },
    isVisible: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

userReviewSchema.index({ deal: 1, reviewer: 1 }, { unique: true });
userReviewSchema.index({ reviewee: 1, createdAt: -1 });
userReviewSchema.index({ reviewer: 1, createdAt: -1 });
userReviewSchema.index({ rating: 1 });

userReviewSchema.pre('validate', function (next) {
  if (this.reviewer && this.reviewee && this.reviewer.toString() === this.reviewee.toString()) {
    this.invalidate('reviewee', 'Reviewer and reviewee must be different users');
  }

  if (this.reviewerRole && this.revieweeRole && this.reviewerRole === this.revieweeRole) {
    this.invalidate('revieweeRole', 'Reviewer and reviewee roles must be opposite sides of the deal');
  }

  next();
});

module.exports = mongoose.model('UserReview', userReviewSchema);

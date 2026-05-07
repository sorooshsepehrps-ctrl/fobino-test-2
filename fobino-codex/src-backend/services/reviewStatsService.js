const mongoose = require('mongoose');
const UserReview = require('../models/UserReview');
const User = require('../models/User');

const emptyStats = {
  averageRating: 0,
  reviewsCount: 0,
  fiveStarsCount: 0,
  fourStarsCount: 0,
  threeStarsCount: 0,
  twoStarsCount: 0,
  oneStarCount: 0
};

async function getUserReviewStats(userId) {
  const [stats] = await UserReview.aggregate([
    {
      $match: {
        reviewee: new mongoose.Types.ObjectId(userId),
        isVisible: true
      }
    },
    {
      $group: {
        _id: '$reviewee',
        averageRating: { $avg: '$rating' },
        reviewsCount: { $sum: 1 },
        fiveStarsCount: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
        fourStarsCount: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
        threeStarsCount: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
        twoStarsCount: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
        oneStarCount: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } }
      }
    },
    {
      $project: {
        _id: 0,
        averageRating: { $round: ['$averageRating', 2] },
        reviewsCount: 1,
        fiveStarsCount: 1,
        fourStarsCount: 1,
        threeStarsCount: 1,
        twoStarsCount: 1,
        oneStarCount: 1
      }
    }
  ]);

  return stats || emptyStats;
}

async function recalculateUserReviewStats(userId) {
  const stats = await getUserReviewStats(userId);

  await User.findByIdAndUpdate(userId, {
    $set: {
      reviewStats: stats,
      'scores.rating': stats.averageRating,
      'scores.totalRatings': stats.reviewsCount
    }
  });

  return stats;
}

module.exports = {
  recalculateUserReviewStats,
  getUserReviewStats
};

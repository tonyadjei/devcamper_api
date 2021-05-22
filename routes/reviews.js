const express = require('express');
const {
  getReviews,
  getReview,
  addReview,
  updateReview,
  deleteReview,
} = require('../controllers/reviews');

const Review = require('../models/Review');

const router = express.Router({ mergeParams: true });

// Bring in the 'protect route', 'authorize' and 'advanced results' middleware
const { protect, authorize } = require('../middleware/auth');
const advancedResults = require('../middleware/advancedResults');

router
  .route('/')
  .get(
    advancedResults(Review, {
      path: 'bootcamp',
      select: 'name description',
    }),
    getReviews
  )
  .post(protect, authorize('user', 'admin'), addReview); // publishers are not allowed to create a review. Only users of a bootcamp(the students) are allowed to create a review

router
  .route('/:id')
  .get(getReview)
  .put(protect, authorize('user', 'admin'), updateReview)
  .delete(protect, authorize('user', 'admin'), deleteReview);

module.exports = router;

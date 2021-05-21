const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true, // this just removes whitespaces from the text the user entered
    required: [true, 'Please add a title for the review'],
    maxlength: [100, 'Review title cannot exceed 100 characters'],
  },
  text: {
    type: String,
    required: [true, 'Please add some text'],
  },
  rating: {
    type: Number,
    min: 1,
    max: 10,
    required: [true, 'Please add a rating between 1 and 10'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  bootcamp: {
    type: mongoose.Schema.ObjectId,
    ref: 'Bootcamp',
    required: true,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
});

// Prevent user from submitting more than one review per bootcamp
reviewSchema.index({ bootcamp: 1, user: 1 }, { unique: true });

// Static method to get avg rating
reviewSchema.statics.getAverageRating = async function (bootcampId) {
  try {
    const obj = await this.aggregate([
      {
        $match: { bootcamp: bootcampId },
      },
      {
        $group: {
          _id: '$bootcamp',
          averageRating: { $avg: '$rating' },
        },
      },
    ]);
  } catch (err) {
    console.error(err);
  }

  try {
    await this.model('Bootcamp').findByIdAndUpdate(bootcampId, {
      averageRating: obj[0].averageRating,
    });
  } catch (err) {
    console.error(err);
  }
};

// Call getAverageRating after save
reviewSchema.post('save', function (doc, next) {
  this.constructor.getAverageRating(this.bootcamp);
  next();
});

// Call getAverageRating before finishing remove operation
reviewSchema.pre('remove', function (next) {
  this.constructor.getAverageRating(this.bootcamp);
  next();
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;

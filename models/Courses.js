const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    required: [true, 'Please add a course title'],
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
  },
  weeks: {
    type: String,
    required: [true, 'Please add number of weeks'],
  },
  tuition: {
    type: Number,
    required: [true, 'Please add a tuition cost'],
  },
  minimumSkill: {
    type: String,
    required: [true, 'Please add a minimum skill'],
    enum: ['beginner', 'intermediate', 'advanced'], // the string can be only of these
  },
  scholarshipAvailable: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  bootcamp: {
    // creating a bootcamp field where every course will have the bootcamp Id that it belonds to, we later populate this field with the actual data of that bootcamp that the course belongs to (mongoose does this by using the ObjectId specified in the 'bootcamp' field to query for that bootcamp in the Bootcamp model inside the db, and place all of its data in the 'bootcamp' field of a course document.)
    type: mongoose.Schema.ObjectId, // we want a course to have a relationship with a bootcamp, so we are creating a bootcamp field for every course(the value of this field will be the ObjectId of a particular bootcamp which has a relationship with a particular course)
    ref: 'Bootcamp', // here, we indicate which model we are going to have the relationship with(so that mongoose knows to create that relationship)
    required: true,
  },
});

// Static method to get avg of course tuitions(for a bootcamp)
courseSchema.statics.getAverageCost = async function (bootcampId) {
  console.log('Calculating average cost...'.blue);
  const obj = await this.aggregate([
    // pipeline: series of steps, each step is an object
    {
      $match: { bootcamp: bootcampId }, // match and grab all courses that have the same bootcamp field value
    },
    {
      $group: {
        // these are the data that our 'aggregate' object will have
        _id: '$bootcamp',
        averageCost: { $avg: '$tuition' },
      },
    },
  ]);

  try {
    await this.model('Bootcamp').findByIdAndUpdate(bootcampId, {
      averageCost: Math.ceil(obj[0].averageCost / 10) * 10,
    });
  } catch (err) {
    console.log(err);
  }
};

// Call getAverageCost after saving a course
courseSchema.post('save', function (doc, next) {
  // here, I want to use only the next() function, but since it is received as the 2nd parameter, I need to still include the 'doc' parameter
  this.constructor.getAverageCost(this.bootcamp); // the 'this' keyword here, refers to the saved document in the database, it is equivalent to the 'doc' argument we get in our function. 'this.constructor' returns to us the model
  next();
});

// Call getAverageCost before removing a course
courseSchema.pre('remove', function (next) {
  this.constructor.getAverageCost(this.bootcamp); // here, the 'this' keyword also refers to the document that was in the database which is about to be removed by mongoose, again, 'this.constructor' will return to us the model
  next();
});

module.exports = mongoose.model('Course', courseSchema);

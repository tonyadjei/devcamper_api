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
    type: mongoose.Schema.ObjectId, // we want a course to have a relationship with a bootcamp, so we are creating a bootcamp field for every course(the value of this field will be the ObjectId of a particular bootcamp which has a relationship with a particular course)
    ref: 'Bootcamp', // here, we indicate which model we are going to have the relationship with(so that mongoose knows to create that relationship)
    required: true,
  },
});

module.exports = mongoose.model('Course', courseSchema);

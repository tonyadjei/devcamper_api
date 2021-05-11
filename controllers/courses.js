const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Course = require('../models/Courses');

// @desc Get courses
// @route GET /api/v1/courses
// @route GET /api/v1/bootcamps/:bootcampId/courses
// @access Public

module.exports.getCourses = asyncHandler(async (req, res, next) => {
  // this controller method is handling two different routes(/api/v1/courses & /api/v1/bootcamps/:bootcampId/courses)
  let query;

  if (req.params.bootcampId) {
    query = Course.find({ bootcamp: req.params.bootcampId });
  } else {
    // query = Course.find().populate('bootcamp'); // the populate() method takes the name of the field that has a relationship with the document, which in this case was the 'bootcamp' field, mongoose will then use the ObjectId to query for that bootcamp document and put its data inside the 'bootcamp' field of the respective course document
    // if we only want specific fields from the bootcamp document which will be used to do the population we can use the code below
    query = Course.find().populate({
      path: 'bootcamp',
      select: 'name description',
    });
  }

  // Execute the query
  const courses = await query;

  res.status(200).json({
    success: true,
    count: courses.length,
    data: courses,
  });
});

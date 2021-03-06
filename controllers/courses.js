const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Course = require('../models/Courses');
const Bootcamp = require('../models/Bootcamp');

// @desc Get courses
// @route GET /api/v1/courses
// @route GET /api/v1/bootcamps/:bootcampId/courses
// @access Public

module.exports.getCourses = asyncHandler(async (req, res, next) => {
  // this controller method is handling two different routes(/api/v1/courses & /api/v1/bootcamps/:bootcampId/courses)
  if (req.params.bootcampId) {
    const courses = await Course.find({ bootcamp: req.params.bootcampId });

    return res.status(200).json({
      // when we have more than one instance of sending a response to the client, we should use the 'return' javascript keyword before we make the response.
      success: true,
      count: courses.length,
      data: courses,
    });
  } else {
    // query = Course.find().populate('bootcamp'); // the populate() method takes the name of the field that has a relationship with the document, which in this case was the 'bootcamp' field, mongoose will then use the ObjectId to query for that bootcamp document and put its data inside the 'bootcamp' field of the respective course document
    // if we only want specific fields from the bootcamp document which will be used to do the population we can use the code below
    // query = Course.find().populate({
    //   path: "bootcamp",
    //   select: "name description",
    // });
    return res.status(200).json(res.advancedResults);
  }
});

// @desc Get single course
// @route GET /api/v1/courses/:id
// @access Public

module.exports.getCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id).populate({
    path: 'bootcamp',
    select: 'name description',
  });

  if (!course) {
    return next(
      new ErrorResponse(`No course with id of ${req.params.id}`, 404)
    );
  }
  res.status(200).json({
    success: true,
    data: course,
  });
});

// @desc Add course
// @route POST /api/v1/bootcamps/:bootcampId/courses
// @access Private

module.exports.addCourse = asyncHandler(async (req, res, next) => {
  // set the req.body.bootcamp to be the bootcampId in our req.params
  req.body.bootcamp = req.params.bootcampId;
  //set the owner of the course to be the currently logged in user
  req.body.user = req.user._id;

  //check if bootcamp with that id exists in the first place
  const bootcamp = await Bootcamp.findById(req.params.bootcampId);

  if (!bootcamp) {
    return next(
      new ErrorResponse(
        `No bootcamp with id of ${req.params.bootcampId}, course cannot be created`,
        404
      )
    );
  }

  // Make sure user is bootcamp owner
  if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user._id} is not authorized to add a course to bootcamp ${bootcamp._id}`
      ),
      401
    );
  }

  const course = await Course.create(req.body);

  res.status(200).json({
    success: true,
    data: course,
  });
});

// @desc Update course
// @route PUT /api/v1/courses/:id
// @access Private

module.exports.updateCourse = asyncHandler(async (req, res, next) => {
  let course = await Course.findById(req.params.id);

  if (!course) {
    return next(
      new ErrorResponse(`No course with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is course owner
  if (course.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user._id} is not authorized to update course ${course._id}`
      ),
      401
    );
  }

  course = await Course.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: course,
  });
});

// @desc Delete course
// @route DELETE /api/v1/courses/:id
// @access Private

module.exports.deleteCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    return next(
      new ErrorResponse(`No course with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is course owner
  if (course.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user._id} is not authorized to delete course ${course._id}`
      ),
      401
    );
  }

  await course.remove();

  res.status(200).json({
    success: true,
    data: 'Course deleted successfully',
  });
});

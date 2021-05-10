const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const geocoder = require('../utils/geocoder');
const Bootcamp = require('../models/Bootcamp');

// @desc    Get all bootcamps
// @route   GET /api/v1/bootcamps
// @access  Public
module.exports.getBootcamps = asyncHandler(async (req, res, next) => {
  const bootcamps = await Bootcamp.find();
  res.status(200).json({
    sucess: true,
    count: bootcamps.length,
    data: bootcamps,
  });
});

// @desc    Get a single bootcamp
// @route   GET /api/v1/bootcamps/:id
// @access  Public
module.exports.getBootcamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id);
  if (!bootcamp) {
    // when fetching a single document by its _id property, if the id is not valid at all, it will of course return an error, however, if the id is a valid object id but it does not exist in the database, we will get a success, but our data will be null. We need to handle this scenario as well by checking whether the document we got back is null or not.
    // if we have multiple 'res.status()' in our code, we must return the first one,(even though it is in an if block) e.g. return res.status(400).send("An error occurred")
    // Again, if we are calling next(err) with an 'err' argument multiple times in a block of code, then we have to return it in the first statement, otherwise express will complain next(err) is being called more than once
    return next(
      new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
    );
  }
  res.status(200).json({ success: true, data: bootcamp });
});

// @desc    Create new a bootcamp
// @route   POST /api/v1/bootcamps
// @access  Private
module.exports.createBootcamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.create(req.body);
  res.status(201).json({
    success: true,
    data: bootcamp,
  });
});

// @desc    Update a bootcamp
// @route   PUT /api/v1/bootcamps/:id
// @access  Private
module.exports.updateBootcamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
    new: true, // telling mongoose that the response we want back from the async method above is the updated document, not the old one
    runValidators: true, // telling mongoose to run the validations on update
  });

  if (!bootcamp) {
    // we are doing this because once again we are dealing with id's
    next(
      new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
    );
  }
  res.status(200).json({ success: true, data: bootcamp });
});

// @desc    Delete bootcamp
// @route   Delete /api/v1/bootcamps/:id
// @access  Private
module.exports.deleteBootcamp = asyncHandler(async (req, res, next) => {
  const response = await Bootcamp.findByIdAndDelete(req.params.id);
  if (!response) {
    next(
      new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
    );
  }
  res.status(200).json({ success: true, message: 'Data deleted successfully' });
});

// @desc    Get bootcamps within a radius
// @route   GET /api/v1/bootcamps/radius/:zipcode/:distance
// @access  Private
module.exports.getBootcampsInRadius = asyncHandler(async (req, res, next) => {
  const { zipcode, distance } = req.params;

  // Get lat/lng from geocoder
  const loc = await geocoder.geocode(zipcode);
  const lat = loc[0].latitude;
  const lng = loc[0].longitude;

  // Calc radius using radians
  // Divide dist by radius of Earth
  // Earth Radius = 3,963 mi / 6,378 km
  const radius = distance / 3963;

  const bootcamps = await Bootcamp.find({
    location: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    success: true,
    count: bootcamps.length,
    data: bootcamps,
  });
});

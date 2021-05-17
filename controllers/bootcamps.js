const path = require("path"); // a core node.js module for dealing with file paths
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const geocoder = require("../utils/geocoder");
const Bootcamp = require("../models/Bootcamp");

// @desc    Get all bootcamps
// @route   GET /api/v1/bootcamps
// @access  Public
module.exports.getBootcamps = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
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
  const bootcamp = await Bootcamp.findById(req.params.id);
  if (!bootcamp) {
    // we are doing this check because, it may be that the id is not found in the database, as such we throw an error, it can also be that the id is not found in the database but it is formatted correctly and looks like an actual id, in that scenario, mongoDB will not throw an error, but it won't be able to find any document, and will give us an undefined or null answer.
    next(
      new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
    );
  }
  await bootcamp.remove(); // so after getting our document, then we call remove() to remove it. We did not use the findByIdAndDelete approach because we have a mongoose pre hook who's event is the 'remove' event, as such we had to perform a 'remove' operation and not a 'delete operation
  res.status(200).json({ success: true, message: "Data deleted successfully" });
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

// @desc    Upload photo for bootcamp
// @route   PUT /api/v1/bootcamps/:id/photo
// @access  Private
module.exports.bootcampPhotoUpload = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id);
  if (!bootcamp) {
    // we are doing this check because, it may be that the id is not found in the database, as such we throw an error, it can also be that the id is not found in the database but it is formatted correctly and looks like an actual id, in that scenario, mongoDB will not throw an error, but it won't be able to find any document, and will give us an undefined or null answer.
    return next(
      new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
    );
  }

  if (!req.files) {
    return next(new ErrorResponse(`Please upload a file`, 400));
  }

  const file = req.files.file;
  // console.log(file) inside the file object, the 'size' property indicates the size of the file in bytes.

  // Make sure the file is a photo. Users can upload a file, like a text file, and we don't want that.
  if (!file.mimetype.startsWith("image")) {
    // the mimetype property for image files always starts with 'image'. e.g. 'image/png' or 'image/jpg'
    return next(new ErrorResponse(`Please upload an image file`, 400));
  }

  // Check filesize
  if (file.size > process.env.MAX_FILE_UPLOAD) {
    return next(
      new ErrorResponse(
        `Please upload an image less than ${
          process.env.MAX_FILE_UPLOAD / 1000000
        } Megabytes`,
        400
      )
    );
  }

  // Create custom filename: We are creating a custom file name for every image the user uploads because if users happen to upload a file with the same name, since we are storing them in the same folder, one will override the other. Hence, we must find a way to make user file names always unique
  file.name = `photo_${bootcamp._id}${path.parse(file.name).ext}`;

  file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async (err) => {
    if (err) {
      console.error(err);
      return next(new ErrorResponse(`Problem with file upload`, 500));
    }

    await Bootcamp.findByIdAndUpdate(req.params.id, { photo: file.name });
    res.status(201).json({
      success: true,
      data: file.name,
    });
  });
});

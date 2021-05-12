const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const geocoder = require('../utils/geocoder');
const Bootcamp = require('../models/Bootcamp');

// @desc    Get all bootcamps
// @route   GET /api/v1/bootcamps
// @access  Public
module.exports.getBootcamps = asyncHandler(async (req, res, next) => {
  let query;

  // Copy req.query
  const reqQuery = { ...req.query };

  // Fields in the url query params to exclude (because those fields do not exist in the database, we created them ourselves and will handle them ourselves)
  const removeFields = ['select', 'sort', 'page', 'limit'];

  // Loop over removeFields and delete them from reqQuery
  removeFields.forEach((param) => delete reqQuery[param]);

  // Create query string
  let queryStr = JSON.stringify(reqQuery); // convert the query parameter object to a JSON string

  // Create operators ($gt, $gte, etc)
  queryStr = queryStr.replace(
    // we convert the req.query object to a JSON string so that we can replace the 'lte' or 'gte', etc with '$gte', '$lte' etc..
    /\b(gt|gte|lt|lte|in)\b/g,
    (match) => `$étudiants${match}`
  );

  // Finding resource
  query = Bootcamp.find(JSON.parse(queryStr)).populate('courses'); // we need to parse the JSON string back into an object for mongoose to use. We are also populating the virutal field 'courses' that we created so that it will contain all the data of the courses

  // Selecting and returning only specific fields of the document(when we don't want all the fields in the document, just some of them)
  if (req.query.select) {
    // if there was a 'select' property in the req.query, then it means we want to select specific fields from the document we obtain
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  }

  // Sort
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy); // you can also sort by specifying a number of fields in a single string separated by white spaces
  } else {
    query = query.sort('-createdAt'); // this is another way of sorting in mongoose, a string name that denotes the field and a '-' for descending order or omiting the '-' for the default(ascending)
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit; // note, the value of startIndex(which was previously called skip) tells us the number of documents to skip, consequently implying where to begin from
  const endIndex = page * limit;
  const total = await Bootcamp.countDocuments(); // countDocuments() will give you the total number of documents in a particular collection

  query = query.skip(startIndex).limit(limit); // skip method skips a number of documents, limit allows you to indicate the number of documents you want to receive back

  // Executing query
  const bootcamps = await query;

  // Pagination result
  const pagination = {};

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit,
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit,
    };
  }

  res.status(200).json({
    sucess: true,
    count: bootcamps.length,
    pagination,
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
  const bootcamp = await Bootcamp.findById(req.params.id);
  if (!bootcamp) {
    // we are doing this check because, it may be that the id is not found in the database, as such we throw an error, it can also be that the id is not found in the database but it is formatted correctly and looks like an actual id, in that scenario, mongoDB will not throw an error, but it won't be able to find any document, and will give us an undefined or null answer.
    next(
      new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
    );
  }
  await bootcamp.remove(); // so after getting our document, then we call remove() to remove it. We did not use the findByIdAndDelete approach because we have a mongoose pre hook who's event is the 'remove' event, as such we had to perform a 'remove' operation and not a 'delete operation
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

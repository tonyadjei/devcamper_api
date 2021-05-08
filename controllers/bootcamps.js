const Bootcamp = require('../models/Bootcamp');

// @desc    Get all bootcamps
// @route   GET /api/v1/bootcamps
// @access  Public
module.exports.getBootcamps = async (req, res, next) => {
  try {
    const bootcamps = await Bootcamp.find();
    res.status(200).json({
      sucess: true,
      count: bootcamps.length,
      data: bootcamps,
    });
  } catch (err) {
    res.status(400).json({ success: false });
  }
};

// @desc    Get a single bootcamp
// @route   GET /api/v1/bootcamps/:id
// @access  Public
module.exports.getBootcamp = async (req, res, next) => {
  try {
    const bootcamp = await Bootcamp.findById(req.params.id);
    if (!bootcamp) {
      // when fetching a single document by its _id property, if the id is not valid at all, it will of course return an error, however, if the id is a valid object id but it does not exist in the database, we will get a success, but our data will be null. We need to handle this scenario as well by checking whether the document we got back is null or not.
      // if we have multiple 'res.status()' in our code, we must return the first one,(even though it is in an if block)
      return res.status(400).json({ success: false });
    }
    res.status(200).json({ success: true, data: bootcamp });
  } catch (err) {
    res.status(400).json({ success: false });
  }
};

// @desc    Create new a bootcamp
// @route   POST /api/v1/bootcamps
// @access  Private
module.exports.createBootcamp = async (req, res, next) => {
  try {
    const bootcamp = await Bootcamp.create(req.body);
    res.status(201).json({
      success: true,
      data: bootcamp,
    });
  } catch (err) {
    res.status(400).json({ success: false });
  }
};

// @desc    Update a bootcamp
// @route   PUT /api/v1/bootcamps/:id
// @access  Private
module.exports.updateBootcamp = async (req, res, next) => {
  try {
    const bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
      new: true, // telling mongoose that the response we want back from the async method above is the updated document, not the old one
      runValidators: true, // telling mongoose to run the validations on update
    });

    if (!bootcamp) {
      // we are doing this because once again we are dealing with id's
      return res.status(400).json({ success: false });
    }
    res.status(200).json({ success: true, data: bootcamp });
  } catch (err) {
    res.status(400).json({ success: false });
  }
};

// @desc    Delete bootcamp
// @route   Delete /api/v1/bootcamps/:id
// @access  Private
module.exports.deleteBootcamp = async (req, res, next) => {
  try {
    const response = await Bootcamp.findByIdAndDelete(req.params.id);
    if (!response) {
      return res.status(400).json({ success: false });
    }
    res
      .status(200)
      .json({ success: true, message: 'Data deleted successfully' });
  } catch (err) {
    res.status(400).json({ success: false });
  }
};

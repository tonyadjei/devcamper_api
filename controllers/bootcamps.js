// @desc    Get all bootcamps
// @route   GET /api/v1/bootcamps
// @access  Public
module.exports.getBootcamps = (req, res, next) => {
  res.status(200).send('get all');
};

// @desc    Get a single bootcamp
// @route   GET /api/v1/bootcamps/:id
// @access  Public
module.exports.getBootcamp = (req, res, next) => {
  res.status(200).send('get single');
};

// @desc    Create new a bootcamp
// @route   POST /api/v1/bootcamps
// @access  Private
module.exports.createBootcamp = (req, res, next) => {
  res.status(200).send('create bootcamp');
};

// @desc    Update a bootcamp
// @route   PUT /api/v1/bootcamps/:id
// @access  Private
module.exports.updateBootcamp = (req, res, next) => {
  res.status(200).send('update bootcamp');
};

// @desc    Delete bootcamp
// @route   Delete /api/v1/bootcamps/:id
// @access  Private
module.exports.deleteBootcamp = (req, res, next) => {
  res.status(200).send('delete a bootcamp');
};

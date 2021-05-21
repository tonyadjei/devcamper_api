const advancedResults = (model, populate) => async (req, res, next) => {
  // this syntax is a 'function within a function'. We have a wrapper function that takes in some arguments, and passes those arguments to the 'inside function'. The job of the wrapper function is to return the 'inside function'.
  let query;

  // Copy req.query
  const reqQuery = { ...req.query };

  // Fields in the url query params to exclude (because those fields do not exist in the database, we created them ourselves and will handle them ourselves)
  const removeFields = ['select', 'sort', 'page', 'limit'];

  // Loop over removeFields and delete them from reqQuery
  removeFields.forEach((param) => delete reqQuery[param]);

  // Create query string
  let queryStr = JSON.stringify(reqQuery); // convert the query parameter object to a JSON string

  // Create operators ($lt, $eq, $lte, $in, $gt, $gte, etc)
  queryStr = queryStr.replace(
    // we convert the req.query object to a JSON string so that we can replace the 'lte' or 'gte', etc with '$gte', '$lte' etc..
    /\b(gt|gte|lt|lte|in)\b/g,
    (match) => `$${match}`
  );

  // Finding resource
  query = model.find(JSON.parse(queryStr)); // we need to parse the JSON string back into a javascript object for mongoose to use.

  // Selecting and returning only specific fields of the document(when we don't want all the fields in the document, just some of them)
  if (req.query.select) {
    // if there was a 'select' property in the req.query, then it means we want to select specific fields from the document we obtain
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  }

  // Sort
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy); // you can also sort by specifying a number of fields in a single string separated by white spaces. That is what we are doing here
  } else {
    query = query.sort('-createdAt'); // this is another way of sorting in mongoose, a string name that denotes the field and a '-' for descending order or omiting the '-' for the default(ascending)
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit; // note, the value of startIndex(which was previously called skip) tells us the number of documents to skip, consequently implying where to begin from
  const endIndex = page * limit;
  const total = await model.countDocuments(); // countDocuments() will give you the total number of documents in a particular collection

  query = query.skip(startIndex).limit(limit); // skip method skips a number of documents, limit allows you to indicate the number of documents you want to receive back

  if (populate) {
    query = query.populate(populate);
  }

  // Executing query
  const results = await query;

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

  res.advancedResults = {
    // creating an object on the res object which will be available to us in the next handler function. This is a good way to pass data to the next handler function.
    success: true,
    count: results.length,
    pagination,
    data: results,
  };

  next();
};

module.exports = advancedResults;

const express = require('express');
const {
  getUser,
  getUsers,
  updateUser,
  deleteUser,
  createUser,
} = require('../controllers/users');

const User = require('../models/User');

// Bring in the 'protect route', 'authorize' and 'advanced results' middleware
const { protect, authorize } = require('../middleware/auth');
const advancedResults = require('../middleware/advancedResults');

const router = express.Router({ mergeParams: true }); // the option here is used when we are merging the URL params(remember in the bootcamps route file, we mounted a particular route(/:bootcampId/courses) on the courses router object. So whenver that route is hit, it should move onto the courses router)

// this syntax works like this: All the routes below will automatically make use of the protect and authorize middleware. 'router.use()' is like 'app.use()', it will run/fire for every route that is hit.
router.use(protect);
router.use(authorize('admin'));

router.route('/').get(advancedResults(User), getUsers).post(createUser);

router.route('/:id').get(getUser).put(updateUser).delete(deleteUser);

module.exports = router;

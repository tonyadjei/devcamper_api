const express = require('express');
const {
  getCourses,
  getCourse,
  addCourse,
  updateCourse,
  deleteCourse,
} = require('../controllers/courses');

const Course = require('../models/Courses');

// Bring in the 'protect route', 'authorize' and 'advanced results' middleware
const { protect, authorize } = require('../middleware/auth');
const advancedResults = require('../middleware/advancedResults');

const router = express.Router({ mergeParams: true }); // the option here is used when we are merging the URL params(remember in the bootcamps route file, we mounted a particular route(/:bootcampId/courses) on the courses router object. So whenever that route is hit, it should move onto the courses router.

router
  .route('/') // the :/bootcampId/courses route will fire here because it was a GET route that ends in '/courses'.
  .get(
    advancedResults(Course, {
      path: 'bootcamp',
      select: 'name description',
    }),
    getCourses
  )
  .post(protect, authorize('publisher', 'admin'), addCourse);
router
  .route('/:id')
  .get(getCourse)
  .put(protect, authorize('publisher', 'admin'), updateCourse)
  .delete(protect, authorize('publisher', 'admin'), deleteCourse);

module.exports = router;

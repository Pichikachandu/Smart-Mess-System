const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { registerUser, getUsers, updateUserStatus, getUserLogs } = require('../controllers/adminController');

router.route('/users').post(protect, admin, registerUser).get(protect, admin, getUsers);
router.route('/users/:id').put(protect, admin, updateUserStatus);
router.route('/logs').get(protect, admin, require('../controllers/adminController').getLogs);
router.route('/logs/:userId').get(protect, admin, require('../controllers/adminController').getUserLogs);

module.exports = router;

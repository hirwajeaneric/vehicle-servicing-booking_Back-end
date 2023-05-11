const express = require('express');
const router = express.Router();

const user = require('./user.routes');
const booking = require('./booking.routes');

router.use('/files', express.static('./uploads'));

router.use('/user', user);
router.use('/booking', booking);

module.exports = router;
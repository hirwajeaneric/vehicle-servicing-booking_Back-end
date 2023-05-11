const express = require('express');
const router = express.Router();

const user = require('./user.routes');
const booking = require('./booking.routes');
const schedule = require('./schedule.routes');

router.use('/files', express.static('./uploads'));

router.use('/user', user);
router.use('/booking', booking);
router.use('/schedule', schedule);

module.exports = router;
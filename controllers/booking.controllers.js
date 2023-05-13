const Booking = require('../models/booking.model');
const { StatusCodes } = require('http-status-codes');
const { BadRequestError, NotFoundError } = require('../errors/index');
const multer= require('multer');
const ScheduleModel = require('../models/schedule.model');

// Establishing a multer storage
const multerStorage = multer.diskStorage({
    destination: (req, file, callback) => { callback(null, './uploads') },
    filename: (req, file, callback) => { callback(null, `booking-${file.originalname}`) }
})

// Filter files with multer
const multerFilter = (req, file, callback) => {
    if (file.mimetype.startsWith("image")) {
        callback(null, true);
    } else {
        callback("Not an image! Please upload only images.", false);
    }
  };

const upload = multer({ 
    storage: multerStorage,
    fileFilter: multerFilter 
});

// Middleware for attaching files to the request body before saving.
const attachFile = async (req, res, next) => {
    var pics = [];
    const {query, body, files, file} = req;

    // Check if there is such a booking already
    if (query.id) {
        const existingBooking = await Booking.findById(query.id); 
        if (existingBooking && existingBooking.photos && !existingBooking.photos) {
            pics = existingBooking.photos;
            if (files) {
                files.forEach(file => {
                    pics.push(file.filename);
                })
            } else if (!files && file) {
                pics.push(file);
            }
        } else if (!existingBooking) {
            if (files) {
                files.forEach(file => {
                    pics.push(file.filename);
                })
            } else if (!files && file) {
                pics.push(file);
            }
        }
    } else {
        if (files) {
            files.forEach(file => {
                pics.push(file.filename);
            })
        } else if (!files && file) {
            pics.push(file);
        }
    }
    body.photos = pics;
    next();
}

const add = async (req, res) => {
    const data = req.body;
    const booking = await Booking.create(req.body);
    res.status(StatusCodes.CREATED).json({ message: 'Successfully Booked a slot. You will get a confirmation email shortly.', payload: booking })
};

const getAll = async(req, res) => {
    const bookings = await Booking.find({})
    res.status(StatusCodes.OK).json({ nbHits: bookings.length, bookings })
};

const findById = async(req, res) => {
    const bookingId = req.query.id;
    const booking = await Booking.findById(bookingId);
    if(!booking){
        throw new BadRequestError(`Booking not found!`)
    }
    res.status(StatusCodes.OK).json({ booking })
};

const findByStartHour = async(req, res) => {
    const startHour = req.query.startHour;
    const bookings = await Booking.find({ startHour: startHour });
    res.status(StatusCodes.OK).json({ nbHits: bookings.length, bookings });
};

const findByEndDate = async(req, res) => {
    const endDate = req.query.estimatedEndDate;
    const bookings = await Booking.find({ estimatedEndDate: endDate });
    res.status(StatusCodes.OK).json({ nbHits: bookings.length, bookings });
};

const findBySlotNumber = async(req, res) => {
    const slot = req.query.temporalSlotNumber;
    const bookings = await Booking.find({ temporalSlotNumber: slot });
    res.status(StatusCodes.OK).json({ nbHits: bookings.length, bookings });
};

const findByWorkStatus = async(req, res) => {
    const status = req.query.workStatus;
    const bookings = await Booking.find({workStatus: status});
    res.status(StatusCodes.OK).json({ nbHits: bookings.length, bookings });
};

const findByStatus = async(req, res) => {
    const status = req.query.status;
    const bookings = await Booking.find({status: status});
    res.status(StatusCodes.OK).json({ nbHits: bookings.length, bookings });
};

const findByCancelDate = async(req, res) => {
    const cancelDate = req.query.cancelDate;
    const bookings = await Booking.find({cancelDate: cancelDate});
    res.status(StatusCodes.OK).json({ nbHits: bookings.length, bookings });
};

const findByDuration = async(req, res) => {
    const duration = req.query.estimatedDuration;
    const bookings = await Booking.find({estimatedDuration: duration});
    res.status(StatusCodes.OK).json({ nbHits: bookings.length, bookings });
};

const findByClientConfirmation = async(req, res) => {
    const clientConfirmation = req.query.clientConfirmation;
    const bookings = await Booking.find({clientConfirmation: clientConfirmation});
    res.status(StatusCodes.OK).json({ nbHits: bookings.length, bookings });
};

const findByTypeOfService = async(req, res) => {
    const typeOfService = req.query.typeOfService;
    const bookings = await Booking.find({typeOfService: typeOfService});
    res.status(StatusCodes.OK).json({ nbHits: bookings.length, bookings });
};

const remove = async(req, res) => {
    const bookingId = req.query.id;
    const deletedBooking = await Booking.findByIdAndRemove({ _id: bookingId});

    if (!deletedBooking) {
        throw new NotFoundError(`Booking with id ${bookingId} not found!`);
    }

    res.status(StatusCodes.OK).json({ message: 'Booking deleted'})
};

const edit = async(req, res, next) => {
    var booking = req.body;
    const bookingId = req.query.id;
    
    const updated = await Booking.findByIdAndUpdate({ _id: bookingId}, req.body);
    // next();

    const updatedBooking = await Booking.findById(updated._id);

    if (!updatedBooking) {
        throw new NotFoundError(`Booking with id ${bookingId} not found!`);
    }
    res.status(StatusCodes.OK).json({ message: 'Booking updated', payload: updatedBooking})
};

const updateSchedule = async (req, res, next) => {
    // Adding a schedule if there is none.

    // Updating the schedule   
    if (req.body.status && req.body.status === 'Confirmed' || req.body.status === 'Rescheduled' || req.body.status === 'Cancelled') {
        const schedule = await ScheduleModel.findByIdAndUpdate();
    }
    next();
}

module.exports = { 
    add, 
    getAll, 
    upload, 
    attachFile, 
    findByCancelDate, 
    findByClientConfirmation,
    findByDuration, 
    findByEndDate, 
    findBySlotNumber, 
    findByStartHour, 
    findByTypeOfService, 
    findByWorkStatus, 
    edit, 
    updateSchedule,
    findByStatus, 
    findById, 
    remove 
} 
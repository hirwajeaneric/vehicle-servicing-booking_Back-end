const Booking = require('../models/booking.model');
const { StatusCodes } = require('http-status-codes');
const { BadRequestError, NotFoundError } = require('../errors/index');
const multer= require('multer');
const sendEmail = require('../utils/email/sendEmail');
const { email } = require('react-admin');

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
        if (existingBooking && existingBooking.photos) {
            pics = existingBooking.photos;
            if (files) {
                files.forEach(file => {
                    pics.push(file.filename);
                });
                body.photos = pics;
            } else if (!files && file) {
                pics.push(file);
                body.photos = pics;
            } else if (!files && !file) {
                delete body.photos;
            }
        } else if (existingBooking && !existingBooking.photos ) {
            if (files) {
                files.forEach(file => {
                    pics.push(file.filename);
                })
                body.photos = pics;
            } else if (!files && file) {
                pics.push(file);
                body.photos = pics;
            } else if (!files && !file) {
                delete body.photos;
            }
        } else if (!existingBooking) {
            if (files) {
                files.forEach(file => {
                    pics.push(file.filename);
                })
                body.photos = pics;
            } else if (!files && file) {
                pics.push(file);
                body.photos = pics;
            } else if (!files && !file) {
                delete body.photos;
            }
        }
    } else {
        if (files) {
            files.forEach(file => {
                pics.push(file.filename);
            })
            body.photos = pics;
        } else if (!files && file) {
            pics.push(file);
            body.photos = pics;
        }
    }
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
    var newBooking = await Booking.findById(updated._id);
    var updatedBooking = newBooking;

    const emailTemplate = { email: '', subject: '', text: '' };

    if (updatedBooking) {
        if (booking.status !== updatedBooking.status) {
            if (booking.status === 'Confirmed') {
                emailTemplate.email = updatedBooking.email;
                emailTemplate.subject = 'Reservation Confirmed';
                emailTemplate.text = `Dear ${updatedBooking.fullName},\n\nYour reservation for a slot in our garage for ${updatedBooking.typeOfService} for vehicle type (${updatedBooking.vehicleType}), ${updatedBooking.vehicleModel} model has been confirmed. The service you requested shall be performed on the day and time specified bellow:\n\nDate: ${updatedBooking.serviceDay}\nStart hour: ${updatedBooking.startHour}\nSlot number: ${updatedBooking.temporalSlotNumber}\n\nPlease, make sure to arrive at the garage early (At least 15min before) to get your car readied for inspections. \n\nBest regards,`;
            } else if (booking.status === 'Rescheduled') {
                emailTemplate.email = updatedBooking.email;
                emailTemplate.subject = 'Rescheduled.';
                emailTemplate.text = `Dear ${updatedBooking.fullName},\n\nYour reservation for a slot in our garage for ${updatedBooking.typeOfService} for vehicle type (${updatedBooking.vehicleType}), ${updatedBooking.vehicleModel} model has been rescheduled to the period writed bellow. This is to ensure that your vehicle gets a suffiscient amount of attention and care for better services are our main goal.\n\nDate: ${new Date(updatedBooking.serviceDay).toDateString()}\nStart hour: ${updatedBooking.startHour} h\n\nPlease, make sure to arrive at the garage early (At least 15min before) to get your car readied for inspections. \n\nBest regards,`;
            } else if (booking.status === 'Canceled') {
                emailTemplate.email = updatedBooking.email;
                emailTemplate.subject = 'Reservation Cancelled';
                emailTemplate.text = `Dear ${updatedBooking.fullName},\n\nYour reservation for a slot in our garage for ${updatedBooking.typeOfService} for vehicle type (${updatedBooking.vehicleType}), ${updatedBooking.vehicleModel} model is cancelled. If it was not cancelled because you are late, or if you are late because of an issue. Please contact the garage representatives or submit a new reservation.\n\nBest regards,`;
            }
        } else if (booking.workStatus !== updatedBooking.workStatus) {
            if (booking.workStatus === 'Ended') {
                emailTemplate.email = updatedBooking.email;
                emailTemplate.subject = 'Vehicle Services Completed';
                emailTemplate.text = `Dear ${updatedBooking.fullName},\n\nThis is to inform you that works on your vehicle that was stationed in our garage for ${updatedBooking.typeOfService} have been completed. You are thereby requested to come and pic your vehicle not later than a day (24 hours) from the time this message is delivered to you. \n\nPlease note that failure to take your car from the garage will result in extra parking fees since parking space is very much in demand.\n\nBest regards,`;;
            }
        } else if (!booking.status && (booking.serviceDay !== updatedBooking.serviceDay || booking.startHour !== updatedBooking.startHour)) {
            if (booking.status === 'Rescheduled') {
                emailTemplate.email = updatedBooking.email;
                emailTemplate.subject = 'Rescheduled.';
                emailTemplate.text = `Dear ${updatedBooking.fullName},\n\nYour reservation for a slot in our garage for ${updatedBooking.typeOfService} for vehicle type (${updatedBooking.vehicleType}), ${updatedBooking.vehicleModel} model has been rescheduled to the period writed bellow. This is to ensure that your vehicle gets a suffiscient amount of attention and care for better services are our main goal.\n\nDate: ${new Date(updatedBooking.serviceDay).toDateString()}\nStart hour: ${updatedBooking.startHour} h.\n\nPlease, make sure to arrive at the garage early (At least 15min before) to get your car readied for inspections. \n\nBest regards,`;
            } 
        }
    }

    await sendEmail(emailTemplate.email, emailTemplate.subject, emailTemplate.text);

    if (!updatedBooking) {
        throw new NotFoundError(`Booking with id ${bookingId} not found!`);
    }
    res.status(StatusCodes.OK).json({ message: 'Booking updated', payload: updatedBooking})
};

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
    findByStatus, 
    findById, 
    remove 
} 

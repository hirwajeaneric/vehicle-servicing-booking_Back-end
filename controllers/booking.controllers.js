const Booking = require('../models/booking.model');
const { StatusCodes } = require('http-status-codes');
const { BadRequestError, NotFoundError } = require('../errors/index');
const multer= require('multer');
const sendEmail = require('../utils/email/sendEmail');

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

    // Check if there is an booking or house already
    if (query.id) {
        const existingBooking = await Booking.findById(query.id);
        
        if (existingBooking && existingBooking.picturers.length !== 0) {
            pics = existingBooking.picturers;
            if (files.length === 0 && file == 0) {
                
            } else if (files.length !== 0) {
                pics = existingBooking.picturers;
                files.forEach(file => {
                    pics.push(file.filename); 
                });
            } else if (files.length === 0 && file) {
                pics = existingBooking.picturers;
                pics.push(file);
            }
        } else if (existingBooking && existingBooking.picturers.length === 0) {
            if (files.length === 0 && file == 0) {
                
            } else if (files.length !== 0) {
                pics = existingBooking.picturers;
                files.forEach(file => {
                    pics.push(file.filename); 
                });
            } else if (files.length === 0 && file) {
                pics = existingBooking.picturers;
                pics.push(file);
            }
        } else if (!existingBooking) {
            throw new BadRequestError(`Not found!`);
        }
    } else {
        if (files.length === 0 && file == 0) {
                    
        } else if (files.length !== 0) {
            files.forEach(file => {
                pics.push(file.filename); 
            });       
        } else if (files.length === 0 && file) {
            pics.push(file);
        }
    }

    req.body.picturers = pics;
    next();
}

const add = async (req, res) => {
    const data = req.body;
    const existing = await Booking.findOne({ number: data.number });
    if (existing) {
        throw new BadRequestError(`Booking with number: ${data.number} is already registered`)
    }
    const booking = await Booking.create(req.body);
    res.status(StatusCodes.CREATED).json({ message: 'Successfully added', payload: booking })
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

const findByOwnerId = async(req, res) => {
    const ownerId = req.query.ownerId;
    const bookings = await Booking.find({ ownerId: ownerId });
    res.status(StatusCodes.OK).json({ nbHits: bookings.length, bookings });
};


const findByTenantId = async(req, res) => {
    const tenantId = req.query.tenantId;
    const allBookings = await Booking.find({});
    let bookings = [];

    allBookings.forEach(booking => {
        booking.tenants.forEach(tenant => {
            if (tenant.tenantId === tenantId) {
                bookings.push(booking);
            }
        })
    })

    if (!bookings) {
        throw new BadRequestError(`No bookings found`);
    }
    res.status(StatusCodes.OK).json({ bookings });
};

const findByStatus = async(req, res) => {
    const status = req.query.status;
    const bookings = await Booking.find({status: status});
    if (!bookings) {
        throw new BadRequestError(`Booking not found`);
    }
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

const edit = async(req, res) => {
    const booking = req.body;
    const bookingId = req.query.id;
    var updatedBooking = {};

    if (req.body.tenants) {
        // Fetch the already existing booking.
        var existingBooking = await Booking.findById(req.query.id);
        // Let's check if there is no other tenant in the booking already
        if (!existingBooking.tenants || existingBooking.tenants.length === 0 ) {
            // Updating the booking if there are no heavy conditions
            const updated = await Booking.findByIdAndUpdate({ _id: bookingId}, req.body );
            updatedBooking = await Booking.findById(updated._id);
        } else {
            let listOfTenants = existingBooking.tenants;

            listOfTenants.forEach(tenant => {
                if (tenant.tenantId === req.body.tenants[0].tenantId || tenant.tenantName === req.body.tenants[0].tenantName) {
                    tenant.tenantId = req.body.tenants[0].tenantId;
                    tenant.tenantName = req.body.tenants[0].tenantName;
                    tenant.tenantEmail = req.body.tenants[0].tenantEmail;
                    tenant.signature = req.body.tenants[0].signature;
                    tenant.signedOn = req.body.tenants[0].signedOn;
                }
            })

            const updated = await Booking.findByIdAndUpdate({ _id: bookingId}, existingBooking);
            updatedBooking = await Booking.findById(updated._id);
        }
        
    } else {
        // Updating the booking if there are no heavy conditions
        const updated = await Booking.findByIdAndUpdate({ _id: bookingId}, req.body );
        updatedBooking = await Booking.findById(updated._id);
    }

    /**
     * 
     * SENDING EMAILS
    */
    const { PERMISSION_TO_REPOST_PROPERTY, SIGNING_ON_THE_CONTRACT} = emailTemplates;
    
    // PERMISSION TO REPOST
    if (updatedBooking.tenants[0].allowedToRepost !== booking.tenants[0].allowedToRepost && booking.tenants[0].allowedToRepost ===true) {
        // Email to the owner
        setEmailSamples("PERMISSION_TO_REPOST_PROPERTY", "accepted", "ownerEmail", updatedBooking.ownerEmail, updatedBooking.ownerName, updatedBooking.ownerId, updatedBooking._id, updatedBooking.bookingNumber);    
        await sendEmail(
            PERMISSION_TO_REPOST_PROPERTY.accepted.ownerEmail.recipient,
            PERMISSION_TO_REPOST_PROPERTY.accepted.ownerEmail.subject,
            {
                recipientName: PERMISSION_TO_REPOST_PROPERTY.accepted.ownerEmail.recipientName,
                recipientId: PERMISSION_TO_REPOST_PROPERTY.accepted.ownerEmail.recipientId, 
                bookingId: PERMISSION_TO_REPOST_PROPERTY.accepted.ownerEmail.bookingId,
                propertyNumber: PERMISSION_TO_REPOST_PROPERTY.accepted.ownerEmail.propertyNumber,
                body: PERMISSION_TO_REPOST_PROPERTY.accepted.ownerEmail.body
            },
            PERMISSION_TO_REPOST_PROPERTY.accepted.ownerEmail.tempate
        )

        // Email to the tenant
        setEmailSamples("PERMISSION_TO_REPOST_PROPERTY", "accepted", "tenantEmail", updatedBooking.tenants[0].tenantEmail, updatedBooking.tenants[0].tenantName, updatedBooking.tenants[0].tenantId, updatedBooking._id, updatedBooking.bookingNumber);    
        await sendEmail(
            PERMISSION_TO_REPOST_PROPERTY.accepted.tenantEmail.recipient,
            PERMISSION_TO_REPOST_PROPERTY.accepted.tenantEmail.subject,
            {
                recipientName: PERMISSION_TO_REPOST_PROPERTY.accepted.tenantEmail.recipientName,
                recipientId: PERMISSION_TO_REPOST_PROPERTY.accepted.tenantEmail.recipientId, 
                bookingId: PERMISSION_TO_REPOST_PROPERTY.accepted.tenantEmail.bookingId,
                propertyNumber: PERMISSION_TO_REPOST_PROPERTY.accepted.tenantEmail.propertyNumber,
                body: PERMISSION_TO_REPOST_PROPERTY.accepted.tenantEmail.body
            },
            PERMISSION_TO_REPOST_PROPERTY.accepted.tenantEmail.tempate
        )

    } else if (updatedBooking.tenants[0].allowedToRepost !== booking.tenants[0].allowedToRepost && booking.tenants[0].allowedToRepost ===false) {
        // Email to the owner
        setEmailSamples("PERMISSION_TO_REPOST_PROPERTY", "rejected", "ownerEmail", updatedBooking.ownerEmail, updatedBooking.ownerName, updatedBooking.ownerId, updatedBooking._id, updatedBooking.bookingNumber);    
        await sendEmail(
            PERMISSION_TO_REPOST_PROPERTY.rejected.ownerEmail.recipient,
            PERMISSION_TO_REPOST_PROPERTY.rejected.ownerEmail.subject,
            {
                recipientName: PERMISSION_TO_REPOST_PROPERTY.rejected.ownerEmail.recipientName,
                recipientId: PERMISSION_TO_REPOST_PROPERTY.rejected.ownerEmail.recipientId, 
                bookingId: PERMISSION_TO_REPOST_PROPERTY.rejected.ownerEmail.bookingId,
                propertyNumber: PERMISSION_TO_REPOST_PROPERTY.rejected.ownerEmail.propertyNumber,
                body: PERMISSION_TO_REPOST_PROPERTY.rejected.ownerEmail.body
            },
            PERMISSION_TO_REPOST_PROPERTY.rejected.ownerEmail.tempate
        )

        // Email to the tenant
        setEmailSamples("PERMISSION_TO_REPOST_PROPERTY", "rejected", "tenantEmail", updatedBooking.tenants[0].tenantEmail, updatedBooking.tenants[0].tenantName, updatedBooking.tenants[0].tenantId, updatedBooking._id, updatedBooking.bookingNumber);    
        await sendEmail(
            PERMISSION_TO_REPOST_PROPERTY.rejected.tenantEmail.recipient,
            PERMISSION_TO_REPOST_PROPERTY.rejected.tenantEmail.subject,
            {
                recipientName: PERMISSION_TO_REPOST_PROPERTY.rejected.tenantEmail.recipientName,
                recipientId: PERMISSION_TO_REPOST_PROPERTY.rejected.tenantEmail.recipientId, 
                bookingId: PERMISSION_TO_REPOST_PROPERTY.rejected.tenantEmail.bookingId,
                propertyNumber: PERMISSION_TO_REPOST_PROPERTY.rejected.tenantEmail.propertyNumber,
                body: PERMISSION_TO_REPOST_PROPERTY.rejected.tenantEmail.body
            },
            PERMISSION_TO_REPOST_PROPERTY.rejected.tenantEmail.tempate
        )
    }

    // SIGNING THE CONTRACT
    // Tenant signing
    if (updatedBooking.tenants[0].signature !== booking.tenants[0].signature && booking.tenants[0].signature ==='Signed') {

    } else if (updatedBooking.tenants[0].signature !== booking.tenants[0].signature && booking.tenants[0].signature ==='Rejected') {

    } else if (updatedBooking.tenants[0].signature !== booking.tenants[0].signature && booking.tenants[0].signature ==='Withdrew') {

    }

    // Owner signing
    if (updatedBooking.ownerSignature !== booking.ownerSignature && booking.ownerSignature ==='Signed') {

    } else if (updatedBooking.ownerSignature !== booking.ownerSignature && booking.ownerSignature ==='Rejected') {

    } else if (updatedBooking.ownerSignature !== booking.ownerSignature && booking.ownerSignature ==='Withdrew') {

    }

    if (!updatedBooking) {
        throw new NotFoundError(`Booking with id ${bookingId} not found!`);
    }
    res.status(StatusCodes.OK).json({ message: 'Booking updated', payload: updatedBooking})
};

module.exports = { add, getAll, edit, findByOwnerId, findByTenantId, findByStatus, findById, remove }
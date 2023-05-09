const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    fullName: { 
        type: String, 
        required: true 
    },
    phone: { 
        type: String, 
        required: true 
    },
    vehicleType: { 
        type: String, 
        required: true 
    },
    vehicleModel: { 
        type: String, 
        required: true 
    },
    typeOfService: { 
        type: String, 
        required: true 
    },
    clientConfirmation: { 
        type: String, 
        required: false,
        default: "Unconfirmed",
        enum: {
            values: ['Unconfirmed', 'Confirmed', 'Cancelled'],
            message: '{VALUE} is not supported as a confirmation.'
        } 
    },
    serviceDay: { 
        type: Date, 
        required: true,
        default: Date.now() 
    },
    startHour: {
        type: Number,
        required: true,
        default: new Date().getHours()
    },
    estimatedDuration: { 
        type: Number, 
        required: false 
    },
    estimatedEndDate: {
        type: Date, 
        required: false
    },
    temporalSlotNumber: {
        type: String, 
        required: true,
    },
    status: {
        type: String, 
        required: true,
        default: "Pending",
        enum: {
            values: ['Pending', 'Confirmed', 'Rescheduled', 'Cancelled'],
            message: '{VALUE} is not supported as a booking status.'
        }
    },
    workStatus: {
        type: String, 
        required: false,
        default: "Unconfirmed",
        enum: {
            values: ['Unconfirmed', 'Confirmed', 'Cancelled'],
            message: '{VALUE} is not supported as a confirmation.'
        }
    }
    ,
    cancelDate: {
        type: Date, 
        required: false
    },
    photos: [
        {
            type: String, 
            required: false,
        }
    ]
}) 

module.exports = mongoose.model('Booking', bookingSchema);
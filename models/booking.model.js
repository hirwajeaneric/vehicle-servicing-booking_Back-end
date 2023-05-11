const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    fullName: { 
        type: String, 
        required: [true, 'Your name is provided'],
    },
    phone: { 
        type: String, 
        required: [true, 'Phone number must be provided'], 
    },
    email: { 
        type: String, 
        trim: true, 
        required: [true, 'Email must be provided'],
        match: [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            'Please provide a valid email',
        ],
    },
    vehicleType: { 
        type: String, 
        required: [true, 'Please, specify the type of your vehicle'], 
        enum: {
            values: ['Car','Motorcycle','Bicycle','Truck','Bus','SUV','Van','Convertible','Sedan','Hatchback','Coupe','Minivan','Pickup Truck','RV (Recreational Vehicle)','Trailer','Electric Vehicle (EV)','Hybrid Vehicle','Sports Car','Limousine','Ambulance','Taxi','Motorhome','Tractor'],
            message: '{VALUE} is not supported as a confirmation.'
        } 
    },
    vehicleModel: { 
        type: String, 
        required: [true, 'Vehicle model must be provided'],
    },
    typeOfService: { 
        type: String, 
        required: [true, 'You must choose the type of sercise you need'], 
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
        default: Date.now() 
    },
    startHour: {
        type: Number,
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
        default: 1,
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
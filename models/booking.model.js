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
        required: [true, 'Email must be provided'],
        match: [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            'Please provide a valid email',
        ]
    },
    vehicleType: { 
        type: String, 
        required: [true, 'Please, specify the type of your vehicle'], 
        enum: {
            values: ['Car','Motorcycle','Bicycle','Truck','Bus','SUV','Van','Convertible','Sedan','Hatchback','Coupe','Minivan','Pickup Truck','RV (Recreational Vehicle)','Trailer','Electric Vehicle (EV)','Hybrid Vehicle','Sports Car','Limousine','Ambulance','Taxi','Motorhome','Tractor', 'Other'],
            message: '{VALUE} is not supported as a vehicle type.'
        } 
    },
    vehicleModel: { 
        type: String, 
        required: [true, 'Vehicle model must be provided'],
    },
    typeOfService: { 
        type: String, 
        required: [true, 'You must choose the type of sercise you need'], 
        enum: {
            values: ['Oil Change', 'Tire Rotation', 'Brake Inspection', 'Engine Tune-up', 'Wheel Alignment', 'Battery Replacement', 'Diagnostic Services', 'Transmission Service', 'Air Conditioning Repair', 'Exhaust System Repair', 'Electrical System Repair', 'Suspension Repair', 'Radiator Flush', 'Fuel System Cleaning', 'Headlight Restoration', 'Windshield Replacement', 'Paintless Dent Repair', 'Interior Detailing', 'Car Wash and Wax', 'Towing Service', 'Other'],
            message: '{VALUE} is not supported as a vehicle service.'
        } 
    },
    serviceDescription: { 
        type: String, 
        required: false, 
    },
    clientConfirmation: { 
        type: String, 
        required: false,
        default: "Unconfirmed",
        enum: {
            values: ['Unconfirmed', 'Confirmed', 'Canceled'],
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
            values: ['Pending', 'Confirmed', 'Rescheduled', 'Canceled'],
            message: '{VALUE} is not supported as a booking status.'
        }
    },
    workStatus: {
        type: String, 
        required: false,
        default: "Todo",
        enum: {
            values: ['Todo', 'In progress', 'Ended'],
            message: '{VALUE} is not supported as a confirmation.'
        }
    },
    cancelDate: {
        type: Date, 
        required: false
    },
    photos: [
        {
            type: String, 
            required: false,
        }
    ],
    submittedOn: {
        type: Date, 
        default: Date.now()        
    }
}) 

module.exports = mongoose.model('Booking', bookingSchema);
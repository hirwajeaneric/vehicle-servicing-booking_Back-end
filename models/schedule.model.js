const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
    hours:  [
        {
            hourTime: {
                type: Number, 
                required: true,
            },
            slots: [
                { 
                    status: {
                        type: String, 
                        default: 'Occupied',
                        required: true,
                        enum: {
                            values: ['Occupied', 'Unoccupied', 'Unusable'],
                            message: '{VALUE} is not supported as a slot status.'
                        }
                    },
                    vehicle: {
                        type: String, 
                        required: false,
                    },
                }
            ]
        }
    ],
    postDate: { 
        type: Date, 
        required: true,
        default: Date.now() 
    }
}) 

module.exports = mongoose.model('Schedule', scheduleSchema);
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
                    type: String, 
                    default: 'Occupied',
                    required: true,
                    enum: {
                        values: ['Occupied', 'Free', 'Unusable'],
                        message: '{VALUE} is not supported as a slot status.'
                    }
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
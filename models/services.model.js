const mongoose = require('mongoose');

const servicesSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'Service name must be provided'] 
    },
    duration: { 
        type: String, 
        required: [true, 'Estimated duration for this service must be provided'] 
    },
    cost: { 
        type: Number, 
        required: [true, 'You must provide the cost of the service'] 
    },
    description: { 
        type: String, 
        required: [true, 'Service description is required'] 
    },
    status: { 
        type: String, 
        default: 'Upcoming',
        enum: {
            values: ['Active', 'Upcoming'],
            message: '{VALUE} is not supported as a service status.'
        }
    },
    image: { 
        type: String, 
        required: false, 
    },
}) 

module.exports = mongoose.model('Services', servicesSchema);

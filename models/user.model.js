const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
    fullName: { 
        type: String, 
        trim: true, 
        required: [true, 'Full name must be provided'],
        maxlength: 50,
        minlength: 3,
    },
    nationality: { 
        type: String, 
        required: true, 
    },
    nationalId: { 
        type: String, 
        trim: true, 
        required: false,
        maxlength: 16,
        minlength: 16, 
    },
    passportNumber: { 
        type: String,
        trim: true, 
        required: false,
        maxlength: 8,
        minlength: 8, 
    },
    email: { 
        type: String, 
        trim: true, 
        required: [true, 'Email must be provided'],
        match: [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            'Please provide a valid email',
        ],
        unique: true, 
    },
    phone: { 
        type: String, 
        required: [true, 'Phone number must be provided'],
        maxlength: 12,
        minlength: 10,
    },
    password: { 
        type: String, 
        required: [true, 'Password must be provided'], 
        minlength: 8, 
    },
    profilePicture: { 
        type: String, 
        required: false, 
    }
}) 

UserSchema.pre('save', async function() {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);

    if (this.nationality === 'Rwanda') {
        this.passportNumber = '00000000';
    } else if (this.nationality !== 'Rwanda') {
        this.nationalId = '0000000000000000';
    }
});

UserSchema.methods.createJWT = function() {
    return jwt.sign(
        {
            userId: this._id,  
            email: this.email,
        }, 
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_LIFETIME,
        }
    );
};

UserSchema.methods.comparePassword = async function(candidatePassword) {
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    return isMatch;
}

module.exports = mongoose.model('User', UserSchema);
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const passwordComplexity = require('joi-password-complexity');
const sendEmail = require('../utils/email/sendEmail');
const { StatusCodes } = require('http-status-codes');
const { BadRequestError, UnauthenticatedError } = require('../errors');
const multer = require('multer');

const signIn = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new BadRequestError('Please provide email and password');
    }

    const user = await User.findOne({ email });
    if (!user) {
        throw new UnauthenticatedError('Invalid Credentials');
    }

    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
        throw new UnauthenticatedError('Invalid Credentials');
    }

    const token = user.createJWT();
    res.status(StatusCodes.OK).json({
        user: {
            id: user._id,
            email: user.email,
            fullName: user.fullName,
            phone: user.phone,
            nationality: user.nationality,
            nationalId: user.nationalId,
            passportNumber: user.passportNumber,
            profilePicturer: user.profilePicture,
            token: token,
        }
    })
};

const signUp = async (req, res) => {
    // Checking if the user is not already registered
    const userExists = await User.findOne({ email: req.body.email })
    if (userExists) {
        res.status(StatusCodes.BAD_REQUEST).send({ msg: `User with the provide email already exists.` });
    }

    // Validate password
    const schema = Joi.object({
        password: passwordComplexity().required().label('Password'),
    })
    const {error} = schema.validate({password: req.body.password});
    if (error) { return res.status(StatusCodes.BAD_REQUEST).send({ msg: error.details[0].message }) }
    
    // Registering the user
    const user = await User.create({...req.body});
    const token = user.createJWT();
    res.status(StatusCodes.CREATED).json({
        user: {
            id: user._id,
            email: user.email,
            fullName: user.fullName,
            phone: user.phone,
            nationality: user.nationality,
            nationalId: user.nationalId,
            passportNumber: user.passportNumber,
            profilePicturer: user.profilePicture,
            token: token,
        }
    })

};

const getUsers = async(req, res, next) => {
    const users = await User.find({})
    res.status(StatusCodes.OK).json({ nbHits: users.length, users })
};

const findById = async(req, res, next) => {
    const userId = req.query.id;
    const user = await User.findById(userId)

    if (!user || user === null ) {
        throw new NotFoundError(`No user with ID: ${userId} found!`);
    }

    res.status(200).json({ user });
};

const findByEmail = async(req, res, next) => {
    const userEmail = req.query.email;
    const users = await User.findOne({ email: userEmail })
    
    if (!users || users.length === 0 ) {
        throw new NotFoundError(`No user with email ${userEmail}`);
    }
    
    res.status(200).json({ users });
};

// Establishing a multer storage
const multerStorage = multer.diskStorage({
    destination: (req, file, callback) => { callback(null, './profiles') },
    filename: (req, file, callback) => { callback(null, `user-${file.originalname}`) }
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
const attachFile = (req, res, next) => {
    if (req.file) {
        req.body.profilePicture = req.file.filename;
        next();
    } else {
        next();
    }
}

const updateUser = async(req, res, next) => {
    const user = await User.findByIdAndUpdate({ _id: req.query.id }, req.body);
    const updatedUser = await User.findById(user._id);

    const token = user.createJWT();
    res.status(StatusCodes.OK).json({
        message: "Account successfully updated!",
        user: {
            id: updatedUser._id,
            email: updatedUser.email,
            fullName: updatedUser.fullName,
            phone: updatedUser.phone,
            nationality: updatedUser.nationality,
            nationalId: updatedUser.nationalId,
            passportNumber: updatedUser.passportNumber,
            profilePicturer: updatedUser.profilePicture,
            token: token,
        }
    })
};

const requestPasswordReset = async(req, res, next) => {
    const { email } = req.body;
    if (!email) {throw new BadRequestError('Your email is required')} 
    
    const registeredUser = await User.findOne({ email: email });
    if (!registeredUser) { throw new BadRequestError('Email address unrecognized');}
  
    let token = jwt.sign({ email: email }, process.env.JWT_SECRET, { expiresIn: 1800 }); 
    
    let clientDomain = '192.168.43.16';

    let link = `http://${clientDomain || localhost}:4444/auth/reset-password/${token}/${registeredUser._id}`;

    await sendEmail(
        registeredUser.email,
        "Reset password",
        {
          payload: link,
          name: registeredUser.fullName
        },
        "./template/requestResetPassword.handlebars"
    );

    res.status(StatusCodes.OK).json({ message: `Password reset link sent to your email: ${registeredUser.email}`})   
}

const resetPassword = async(req, res, next) => {
    const password = req.body.password;
    
    const user = await User.findById(req.query.id);
    if (!user) { throw new BadRequestError('Invalid or expired link')}
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer')) { throw new UnauthenticatedError('Invalid authentication') }
    
    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload) { throw new UnauthenticatedError('Invalid or expired link')}

    // Validating the password using Joi and Join Password Complexity
    const schema = Joi.object({
        password: passwordComplexity().required().label('Password'),
    })
    const {error} = schema.validate(req.body);
    if (error) { return res.status(StatusCodes.BAD_REQUEST).send({ msg: error.details[0].message }) }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const updatedUser = await User.findOneAndUpdate( req.query.id, { password: hashedPassword });    

    if (!updatedUser) {
        throw new UnauthenticatedError('Unable to change password');
    } else {
        res.status(StatusCodes.OK).json({ message: "Password changed" })
    }
}

const deleteAccount = async(req, res, next) => {
    const deletedUser = await User.findByIdAndDelete(req.query.id);
    
    if (!deletedUser) {
        throw new NotFoundError(`Failed to delete account.`);
    }
    
    res.status(StatusCodes.OK).json({ message: "Account deleted!" });
};

module.exports = { signIn, signUp, requestPasswordReset, findByEmail, resetPassword, getUsers, findById, updateUser, upload, deleteAccount, attachFile }

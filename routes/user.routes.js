const express = require('express');
const router = express.Router();

const { findById, getUsers, requestPasswordReset, resetPassword, signIn, signUp, updateUser, findByEmail, upload, attachFile, deleteAccount } = require('../controllers/user');

router.post('/signin', signIn);
router.post('/signup', upload.single('profilePicture'), attachFile, signUp);
router.post('/requestPasswordReset', requestPasswordReset);
router.put('/resetPassword', resetPassword);
router.put('/update', upload.single('profilePicture'), attachFile, updateUser);
router.get('/findById', findById);
router.get('/findByEmail', findByEmail);
router.get('/list', getUsers);
router.delete('/delete', deleteAccount);

module.exports = router;
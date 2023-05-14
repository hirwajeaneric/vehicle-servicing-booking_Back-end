const express = require('express');
const router = express.Router();

const { 
    findById, 
    add, 
    remove, 
    edit, 
    attachFile, 
    upload, 
    findByStatus, 
    findByCancelDate, 
    getAll, 
    findByClientConfirmation, 
    findByDuration, 
    findByEndDate, 
    findBySlotNumber, 
    findByStartHour, 
    findByTypeOfService, 
    findByWorkStatus 
} = require('../controllers/booking.controllers');


router.post('/add', upload.array('photos'), attachFile, add);
router.put('/update', upload.array('photos'), attachFile, edit);
router.delete('/delete', remove);
router.get('/list', getAll);
router.get('/findById', findById);
router.get('/findByCancelDate', findByCancelDate);
router.get('/findByStatus', findByStatus);
router.get('/findByDuration', findByDuration);
router.get('/findByEndDate', findByEndDate);
router.get('/findBySlotNumber', findBySlotNumber);
router.get('/findByStartHour', findByStartHour);
router.get('/findByTypeOfService', findByTypeOfService);
router.get('/findByWorkStatus', findByWorkStatus);
router.get('/findByClientConfirmation', findByClientConfirmation);

module.exports = router;
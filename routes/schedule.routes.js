const express = require('express');
const router = express.Router();

const { 
    findById, 
    add,  
    edit,
    findByPostDate,
    list 
} = require('../controllers/schedule.controllers');


router.post('/add', add);
router.put('/update', edit);
router.get('/list', list);
router.get('/findById', findById);
router.get('findByPostDate', findByPostDate);

module.exports = router;
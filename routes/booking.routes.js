const express = require('express');
const router = express.Router();

const { findById, add, remove, edit, findByOwnerId, findByStatus, findByTenantId, getAll } = require('../controllers/contract');

router.post('/add', add);
router.get('/list', getAll);
router.get('/findById', findById);
router.get('/findByOwnerId', findByOwnerId);
router.get('/findByStatus', findByStatus);
router.get('/findByTenantId', findByTenantId);
router.put('/update', edit);
router.delete('/delete', remove);

module.exports = router;
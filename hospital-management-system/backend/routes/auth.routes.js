const express = require('express');
const router = express.Router();
const { registerPatient, loginPatient, loginAdmin } = require('../controllers/auth.controller');

router.post('/register', registerPatient);
router.post('/login', loginPatient);
router.post('/admin/login', loginAdmin);

module.exports = router;

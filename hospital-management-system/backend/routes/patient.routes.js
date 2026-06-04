const express = require('express');
const router = express.Router();
const { getMyProfile, updateMyProfile, getMyAppointments } = require('../controllers/patient.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { requirePatient } = require('../middleware/role.middleware');

router.use(verifyToken, requirePatient);

router.get('/me', getMyProfile);
router.put('/me', updateMyProfile);
router.get('/my-appointments', getMyAppointments);

module.exports = router;

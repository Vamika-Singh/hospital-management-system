const express = require('express');
const router = express.Router();
const { getAllDoctors, getDoctorById, getDoctorSlots, getSpecializations } = require('../controllers/doctor.controller');

router.get('/', getAllDoctors);
router.get('/specializations', getSpecializations);
router.get('/:id', getDoctorById);
router.get('/:id/slots', getDoctorSlots);

module.exports = router;

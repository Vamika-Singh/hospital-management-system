const express = require('express');
const router = express.Router();
const {
  getDashboard, getAllDoctors, addDoctor, updateDoctor, deleteDoctor,
  getAllPatients, getAllAppointments, updateAppointmentStatus,
  getAnnouncement, setAnnouncement
} = require('../controllers/admin.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/role.middleware');

router.use(verifyToken, requireAdmin);

// Dashboard
router.get('/dashboard', getDashboard);

// Doctors
router.get('/doctors', getAllDoctors);
router.post('/doctors', addDoctor);
router.put('/doctors/:id', updateDoctor);
router.delete('/doctors/:id', deleteDoctor);

// Patients
router.get('/patients', getAllPatients);

// Appointments
router.get('/appointments', getAllAppointments);
router.put('/appointments/:id/status', updateAppointmentStatus);

// Announcements
router.get('/announcement', getAnnouncement);
router.post('/announcement', setAnnouncement);

// Nurses
const { getAllNurses, addNurse, updateNurse, deleteNurse } = require('../controllers/nurse.controller');
router.get('/nurses', getAllNurses);
router.post('/nurses', addNurse);
router.put('/nurses/:id', updateNurse);
router.delete('/nurses/:id', deleteNurse);

module.exports = router;

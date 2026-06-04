const express = require('express');
const router = express.Router();
const { bookAppointment, cancelAppointment, trackAppointment } = require('../controllers/appointment.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { requirePatient } = require('../middleware/role.middleware');

// Public route - tracking wait times/status
router.get('/track/:query', trackAppointment);

// Protected routes
router.use(verifyToken, requirePatient);

router.post('/', bookAppointment);
router.put('/:id/cancel', cancelAppointment);

module.exports = router;

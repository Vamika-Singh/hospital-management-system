const express = require('express');
const router = express.Router();
const { getBeds, allocateBed, dischargePatient } = require('../controllers/bed.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/role.middleware');

// Bed allocation routes - protected (Admin only)
router.use(verifyToken, requireAdmin);

router.get('/', getBeds);
router.post('/allocate', allocateBed);
router.post('/discharge', dischargePatient);

module.exports = router;

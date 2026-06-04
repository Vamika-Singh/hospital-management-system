const db = require('../config/db');
const { successResponse, errorResponse } = require('../utils/helpers');

// ─── GET MY PROFILE ───────────────────────────────────────────────────────────
const getMyProfile = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, email, phone, dob, gender, blood_group, address, medical_notes, created_at FROM patients WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) return errorResponse(res, 'Patient not found.', 404);
    
    const profile = rows[0];

    // Fetch active bed allocation if any
    const [bedRows] = await db.query(
      `SELECT ba.admission_date, b.bed_number, b.ward_type, b.fee_per_day 
       FROM bed_allocations ba
       JOIN beds b ON ba.bed_id = b.id
       WHERE ba.patient_id = ? AND ba.discharge_date IS NULL
       ORDER BY ba.admission_date DESC LIMIT 1`,
      [req.user.id]
    );

    profile.active_bed = bedRows.length > 0 ? bedRows[0] : null;

    return successResponse(res, profile);
  } catch (err) {
    console.error(err);
    return errorResponse(res, 'Failed to fetch profile.', 500);
  }
};

// ─── UPDATE MY PROFILE ────────────────────────────────────────────────────────
const updateMyProfile = async (req, res) => {
  try {
    const { name, phone, dob, gender, blood_group, address, medical_notes } = req.body;
    await db.query(
      'UPDATE patients SET name=?, phone=?, dob=?, gender=?, blood_group=?, address=?, medical_notes=? WHERE id=?',
      [name, phone || null, dob || null, gender || null, blood_group || null, address || null, medical_notes || null, req.user.id]
    );
    return successResponse(res, null, 'Profile updated successfully.');
  } catch (err) {
    console.error(err);
    return errorResponse(res, 'Failed to update profile.', 500);
  }
};

// ─── GET MY APPOINTMENTS ──────────────────────────────────────────────────────
const getMyAppointments = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT a.id, a.appointment_date, a.appointment_time, a.status, a.reason, a.notes, a.diagnosis, a.prescription, a.created_at,
              d.name AS doctor_name, d.specialization, d.fee
       FROM appointments a
       JOIN doctors d ON a.doctor_id = d.id
       WHERE a.patient_id = ?
       ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
      [req.user.id]
    );
    return successResponse(res, rows);
  } catch (err) {
    console.error(err);
    return errorResponse(res, 'Failed to fetch appointments.', 500);
  }
};

module.exports = { getMyProfile, updateMyProfile, getMyAppointments };

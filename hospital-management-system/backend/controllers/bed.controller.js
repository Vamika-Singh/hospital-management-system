const db = require('../config/db');
const { successResponse, errorResponse } = require('../utils/helpers');

// Get all beds with their status and occupancy
const getBeds = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT b.*, ba.patient_id, p.name AS patient_name, ba.admission_date 
       FROM beds b
       LEFT JOIN bed_allocations ba ON b.id = ba.bed_id AND ba.discharge_date IS NULL
       LEFT JOIN patients p ON ba.patient_id = p.id
       ORDER BY b.bed_number ASC`
    );
    return successResponse(res, rows);
  } catch (err) {
    console.error(err);
    return errorResponse(res, 'Failed to fetch beds.', 500);
  }
};

// Allocate a bed to a patient
const allocateBed = async (req, res) => {
  try {
    const { bed_id, patient_id, admission_date } = req.body;
    if (!bed_id || !patient_id || !admission_date) {
      return errorResponse(res, 'Bed, patient, and admission date are required.', 400);
    }

    // Check if bed is already occupied
    const [bed] = await db.query('SELECT is_occupied FROM beds WHERE id = ?', [bed_id]);
    if (bed.length === 0) return errorResponse(res, 'Bed not found.', 404);
    if (bed[0].is_occupied) return errorResponse(res, 'Bed is already occupied.', 400);

    // Check if patient is already admitted to another bed
    const [admitted] = await db.query(
      'SELECT id FROM bed_allocations WHERE patient_id = ? AND discharge_date IS NULL',
      [patient_id]
    );
    if (admitted.length > 0) return errorResponse(res, 'Patient is already admitted to another bed.', 400);

    // Start transaction
    await db.query('START TRANSACTION');

    // Insert allocation
    await db.query(
      'INSERT INTO bed_allocations (bed_id, patient_id, admission_date) VALUES (?, ?, ?)',
      [bed_id, patient_id, admission_date]
    );

    // Update bed status
    await db.query('UPDATE beds SET is_occupied = TRUE WHERE id = ?', [bed_id]);

    await db.query('COMMIT');

    return successResponse(res, null, 'Bed allocated successfully.', 201);
  } catch (err) {
    await db.query('ROLLBACK');
    console.error(err);
    return errorResponse(res, 'Failed to allocate bed.', 500);
  }
};

// Discharge a patient and free the bed
const dischargePatient = async (req, res) => {
  try {
    const { bed_id } = req.body;
    if (!bed_id) return errorResponse(res, 'Bed ID is required.', 400);

    // Get active allocation
    const [allocation] = await db.query(
      'SELECT id FROM bed_allocations WHERE bed_id = ? AND discharge_date IS NULL',
      [bed_id]
    );
    if (allocation.length === 0) return errorResponse(res, 'No active occupancy found for this bed.', 404);

    const today = new Date().toISOString().split('T')[0];

    // Start transaction
    await db.query('START TRANSACTION');

    // Update allocation with discharge date
    await db.query(
      'UPDATE bed_allocations SET discharge_date = ? WHERE id = ?',
      [today, allocation[0].id]
    );

    // Free the bed
    await db.query('UPDATE beds SET is_occupied = FALSE WHERE id = ?', [bed_id]);

    await db.query('COMMIT');

    return successResponse(res, null, 'Patient discharged and bed freed successfully.');
  } catch (err) {
    await db.query('ROLLBACK');
    console.error(err);
    return errorResponse(res, 'Failed to discharge patient.', 500);
  }
};

module.exports = { getBeds, allocateBed, dischargePatient };

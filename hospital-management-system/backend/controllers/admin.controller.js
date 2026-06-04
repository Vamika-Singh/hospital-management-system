const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { successResponse, errorResponse } = require('../utils/helpers');

// ─── DASHBOARD ANALYTICS ──────────────────────────────────────────────────────
const getDashboard = async (req, res) => {
  try {
    const [[{ totalDoctors }]] = await db.query('SELECT COUNT(*) AS totalDoctors FROM doctors WHERE is_active=TRUE');
    const [[{ totalPatients }]] = await db.query('SELECT COUNT(*) AS totalPatients FROM patients');
    const [[{ totalAppointments }]] = await db.query('SELECT COUNT(*) AS totalAppointments FROM appointments');
    const [[{ todayAppointments }]] = await db.query(
      `SELECT COUNT(*) AS todayAppointments FROM appointments WHERE appointment_date = CURDATE()`
    );
    const [[{ pendingAppointments }]] = await db.query(
      `SELECT COUNT(*) AS pendingAppointments FROM appointments WHERE status='pending'`
    );
    const [[{ confirmedAppointments }]] = await db.query(
      `SELECT COUNT(*) AS confirmedAppointments FROM appointments WHERE status='confirmed'`
    );
    const [[{ completedAppointments }]] = await db.query(
      `SELECT COUNT(*) AS completedAppointments FROM appointments WHERE status='completed'`
    );
    const [[{ cancelledAppointments }]] = await db.query(
      `SELECT COUNT(*) AS cancelledAppointments FROM appointments WHERE status='cancelled'`
    );

    // Appointments per day (last 7 days)
    const [perDay] = await db.query(
      `SELECT DATE(appointment_date) AS date, COUNT(*) AS count
       FROM appointments
       WHERE appointment_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
       GROUP BY DATE(appointment_date)
       ORDER BY date ASC`
    );

    // Appointments per specialization
    const [perSpec] = await db.query(
      `SELECT d.specialization, COUNT(a.id) AS count
       FROM appointments a
       JOIN doctors d ON a.doctor_id = d.id
       GROUP BY d.specialization
       ORDER BY count DESC`
    );

    // Recent 5 appointments
    const [recentAppointments] = await db.query(
      `SELECT a.id, a.appointment_date, a.appointment_time, a.status,
              p.name AS patient_name, d.name AS doctor_name, d.specialization
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN doctors d ON a.doctor_id = d.id
       ORDER BY a.created_at DESC LIMIT 5`
    );

    return successResponse(res, {
      totalDoctors, totalPatients, totalAppointments, todayAppointments,
      pendingAppointments, confirmedAppointments, completedAppointments, cancelledAppointments,
      perDay, perSpec, recentAppointments
    });
  } catch (err) {
    console.error(err);
    return errorResponse(res, 'Failed to fetch dashboard data.', 500);
  }
};

// ─── GET ALL DOCTORS (ADMIN) ──────────────────────────────────────────────────
const getAllDoctors = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM doctors ORDER BY created_at DESC');
    return successResponse(res, rows);
  } catch (err) {
    return errorResponse(res, 'Failed to fetch doctors.', 500);
  }
};

// ─── ADD DOCTOR ───────────────────────────────────────────────────────────────
const addDoctor = async (req, res) => {
  try {
    const { name, email, specialization, qualification, experience_years, phone, bio, available_days, slot_start, slot_end, slot_duration, fee } = req.body;
    if (!name || !email || !specialization) {
      return errorResponse(res, 'Name, email and specialization are required.', 400);
    }

    const [existing] = await db.query('SELECT id FROM doctors WHERE email = ?', [email]);
    if (existing.length > 0) return errorResponse(res, 'A doctor with this email already exists.', 409);

    await db.query(
      `INSERT INTO doctors (name, email, specialization, qualification, experience_years, phone, bio, available_days, slot_start, slot_end, slot_duration, fee)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, email, specialization, qualification || null, experience_years || 0, phone || null, bio || null,
       available_days || 'Mon,Tue,Wed,Thu,Fri', slot_start || '09:00:00', slot_end || '17:00:00',
       slot_duration || 30, fee || 500]
    );
    return successResponse(res, null, 'Doctor added successfully.', 201);
  } catch (err) {
    console.error(err);
    return errorResponse(res, 'Failed to add doctor.', 500);
  }
};

// ─── UPDATE DOCTOR ────────────────────────────────────────────────────────────
const updateDoctor = async (req, res) => {
  try {
    const { name, email, specialization, qualification, experience_years, phone, bio, available_days, slot_start, slot_end, slot_duration, fee, is_active } = req.body;
    const { id } = req.params;

    const [existing] = await db.query('SELECT id FROM doctors WHERE id = ?', [id]);
    if (existing.length === 0) return errorResponse(res, 'Doctor not found.', 404);

    await db.query(
      `UPDATE doctors SET name=?, email=?, specialization=?, qualification=?, experience_years=?, phone=?, bio=?,
       available_days=?, slot_start=?, slot_end=?, slot_duration=?, fee=?, is_active=? WHERE id=?`,
      [name, email, specialization, qualification, experience_years, phone, bio, available_days, slot_start, slot_end, slot_duration, fee, is_active !== undefined ? is_active : true, id]
    );
    return successResponse(res, null, 'Doctor updated successfully.');
  } catch (err) {
    console.error(err);
    return errorResponse(res, 'Failed to update doctor.', 500);
  }
};

// ─── DELETE DOCTOR ────────────────────────────────────────────────────────────
const deleteDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await db.query('SELECT id FROM doctors WHERE id = ?', [id]);
    if (existing.length === 0) return errorResponse(res, 'Doctor not found.', 404);

    await db.query('DELETE FROM doctors WHERE id = ?', [id]);
    return successResponse(res, null, 'Doctor removed successfully.');
  } catch (err) {
    console.error(err);
    return errorResponse(res, 'Failed to delete doctor.', 500);
  }
};

// ─── GET ALL PATIENTS (ADMIN) ─────────────────────────────────────────────────
const getAllPatients = async (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT id, name, email, phone, dob, gender, blood_group, address, created_at FROM patients';
    const params = [];
    if (search) {
      query += ' WHERE name LIKE ? OR email LIKE ? OR phone LIKE ?';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    query += ' ORDER BY created_at DESC';
    const [rows] = await db.query(query, params);
    return successResponse(res, rows);
  } catch (err) {
    return errorResponse(res, 'Failed to fetch patients.', 500);
  }
};

// ─── GET ALL APPOINTMENTS (ADMIN) ─────────────────────────────────────────────
const getAllAppointments = async (req, res) => {
  try {
    const { status, date, doctor_id } = req.query;
    let query = `SELECT a.id, a.appointment_date, a.appointment_time, a.status, a.reason, a.notes, a.created_at,
                        p.name AS patient_name, p.email AS patient_email, p.phone AS patient_phone,
                        d.name AS doctor_name, d.specialization
                 FROM appointments a
                 JOIN patients p ON a.patient_id = p.id
                 JOIN doctors d ON a.doctor_id = d.id
                 WHERE 1=1`;
    const params = [];

    if (status && status !== 'all') { query += ' AND a.status = ?'; params.push(status); }
    if (date) { query += ' AND a.appointment_date = ?'; params.push(date); }
    if (doctor_id) { query += ' AND a.doctor_id = ?'; params.push(doctor_id); }

    query += ' ORDER BY a.appointment_date DESC, a.appointment_time DESC';

    const [rows] = await db.query(query, params);
    return successResponse(res, rows);
  } catch (err) {
    console.error(err);
    return errorResponse(res, 'Failed to fetch appointments.', 500);
  }
};

// ─── UPDATE APPOINTMENT STATUS ────────────────────────────────────────────────
const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, diagnosis, prescription } = req.body;
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) return errorResponse(res, 'Invalid status value.', 400);

    const [existing] = await db.query('SELECT id, doctor_id, patient_id FROM appointments WHERE id = ?', [id]);
    if (existing.length === 0) return errorResponse(res, 'Appointment not found.', 404);

    await db.query(
      'UPDATE appointments SET status=?, notes=?, diagnosis=?, prescription=? WHERE id=?', 
      [status, notes || null, diagnosis || null, prescription || null, id]
    );

    // Generate Invoice when marked as completed
    if (status === 'completed') {
      const [invExisting] = await db.query('SELECT id FROM invoices WHERE appointment_id = ?', [id]);
      if (invExisting.length === 0) {
        const [doc] = await db.query('SELECT fee FROM doctors WHERE id = ?', [existing[0].doctor_id]);
        const consultation_fee = doc[0]?.fee || 0.00;

        // Check if patient is currently allocated a bed to compute room charges
        const [bedAlloc] = await db.query(
          `SELECT b.fee_per_day, ba.admission_date 
           FROM bed_allocations ba
           JOIN beds b ON ba.bed_id = b.id
           WHERE ba.patient_id = ? AND ba.discharge_date IS NULL
           ORDER BY ba.admission_date DESC LIMIT 1`,
          [existing[0].patient_id]
        );

        let room_charges = 0.00;
        if (bedAlloc.length > 0) {
          const feePerDay = parseFloat(bedAlloc[0].fee_per_day);
          const admissionDate = new Date(bedAlloc[0].admission_date);
          const today = new Date();
          const diffTime = Math.abs(today - admissionDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1; // minimum 1 day
          room_charges = feePerDay * diffDays;
        }

        const medicine_charges = prescription ? 250.00 : 0.00; // simulated flat rate
        const tax = (parseFloat(consultation_fee) + parseFloat(medicine_charges) + parseFloat(room_charges)) * 0.05; // 5% GST
        const total_amount = parseFloat(consultation_fee) + parseFloat(medicine_charges) + parseFloat(room_charges) + tax;

        await db.query(
          `INSERT INTO invoices (appointment_id, consultation_fee, medicine_charges, room_charges, tax, total_amount, payment_status)
           VALUES (?, ?, ?, ?, ?, ?, 'unpaid')`,
          [id, consultation_fee, medicine_charges, room_charges, tax, total_amount]
        );
      }
    }

    return successResponse(res, null, `Appointment status updated to "${status}".`);
  } catch (err) {
    console.error(err);
    return errorResponse(res, 'Failed to update appointment status.', 500);
  }
};
// ─── GET/SET ANNOUNCEMENT ─────────────────────────────────────────────────────
const getAnnouncement = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM announcements WHERE is_active=TRUE ORDER BY created_at DESC LIMIT 1');
    return successResponse(res, rows[0] || null);
  } catch (err) {
    return errorResponse(res, 'Failed to fetch announcement.', 500);
  }
};

const setAnnouncement = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return errorResponse(res, 'Message is required.', 400);
    await db.query('UPDATE announcements SET is_active=FALSE');
    await db.query('INSERT INTO announcements (message) VALUES (?)', [message]);
    return successResponse(res, null, 'Announcement updated successfully.');
  } catch (err) {
    return errorResponse(res, 'Failed to set announcement.', 500);
  }
};

module.exports = {
  getDashboard, getAllDoctors, addDoctor, updateDoctor, deleteDoctor,
  getAllPatients, getAllAppointments, updateAppointmentStatus,
  getAnnouncement, setAnnouncement
};

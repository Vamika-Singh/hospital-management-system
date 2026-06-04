const db = require('../config/db');
const { successResponse, errorResponse, generateSlots, getDayName } = require('../utils/helpers');

// ─── GET ALL DOCTORS ──────────────────────────────────────────────────────────
const getAllDoctors = async (req, res) => {
  try {
    const { specialization, search } = req.query;
    let query = `SELECT id, name, specialization, qualification, experience_years, bio, available_days, slot_start, slot_end, slot_duration, fee 
                 FROM doctors WHERE is_active = TRUE`;
    const params = [];

    if (specialization && specialization !== 'all') {
      query += ' AND specialization = ?';
      params.push(specialization);
    }
    if (search) {
      query += ' AND (name LIKE ? OR specialization LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    query += ' ORDER BY name ASC';

    const [rows] = await db.query(query, params);
    return successResponse(res, rows);
  } catch (err) {
    console.error(err);
    return errorResponse(res, 'Failed to fetch doctors.', 500);
  }
};

// ─── GET DOCTOR BY ID ─────────────────────────────────────────────────────────
const getDoctorById = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, name, email, specialization, qualification, experience_years, phone, bio, 
              available_days, slot_start, slot_end, slot_duration, fee 
       FROM doctors WHERE id = ? AND is_active = TRUE`,
      [req.params.id]
    );
    if (rows.length === 0) return errorResponse(res, 'Doctor not found.', 404);
    return successResponse(res, rows[0]);
  } catch (err) {
    console.error(err);
    return errorResponse(res, 'Failed to fetch doctor.', 500);
  }
};

// ─── GET AVAILABLE SLOTS ──────────────────────────────────────────────────────
const getDoctorSlots = async (req, res) => {
  try {
    const { date } = req.query;
    const doctorId = req.params.id;

    if (!date) return errorResponse(res, 'Date is required.', 400);

    const [doctorRows] = await db.query(
      'SELECT available_days, slot_start, slot_end, slot_duration FROM doctors WHERE id = ? AND is_active = TRUE',
      [doctorId]
    );
    if (doctorRows.length === 0) return errorResponse(res, 'Doctor not found.', 404);

    const doctor = doctorRows[0];
    const dayName = getDayName(date);

    // Check if doctor works on this day
    const availableDays = doctor.available_days ? doctor.available_days.split(',') : [];
    if (!availableDays.includes(dayName)) {
      return successResponse(res, { slots: [], message: `Doctor is not available on ${dayName}s.` });
    }

    // Fetch already booked slots
    const [booked] = await db.query(
      `SELECT appointment_time FROM appointments 
       WHERE doctor_id = ? AND appointment_date = ? AND status != 'cancelled'`,
      [doctorId, date]
    );
    const bookedTimes = booked.map(b => b.appointment_time);

    // Format booked times to HH:MM:SS
    const formattedBooked = bookedTimes.map(t => {
      if (typeof t === 'string') return t;
      // Handle duration objects from mysql2
      const totalSeconds = typeof t === 'object' ? t.hours * 3600 + t.minutes * 60 + (t.seconds || 0) : 0;
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = totalSeconds % 60;
      return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    });

    let slots = generateSlots(
      doctor.slot_start,
      doctor.slot_end,
      doctor.slot_duration,
      formattedBooked
    );

    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(now - tzOffset)).toISOString();
    const todayStr = localISOTime.split('T')[0];
    const currentTimeStr = localISOTime.split('T')[1].substring(0, 8);

    if (date === todayStr) {
      slots = slots.map(slot => {
        if (slot.time <= currentTimeStr) {
          slot.available = false;
        }
        return slot;
      });
    } else if (date < todayStr) {
      slots = slots.map(slot => {
        slot.available = false;
        return slot;
      });
    }

    return successResponse(res, { slots, date, dayName });
  } catch (err) {
    console.error(err);
    return errorResponse(res, 'Failed to fetch slots.', 500);
  }
};

// ─── GET ALL SPECIALIZATIONS ──────────────────────────────────────────────────
const getSpecializations = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT DISTINCT specialization FROM doctors WHERE is_active = TRUE ORDER BY specialization'
    );
    return successResponse(res, rows.map(r => r.specialization));
  } catch (err) {
    console.error(err);
    return errorResponse(res, 'Failed to fetch specializations.', 500);
  }
};

module.exports = { getAllDoctors, getDoctorById, getDoctorSlots, getSpecializations };

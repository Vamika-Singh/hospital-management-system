const db = require('../config/db');
const { successResponse, errorResponse, getDayName } = require('../utils/helpers');

// ─── BOOK APPOINTMENT ─────────────────────────────────────────────────────────
const bookAppointment = async (req, res) => {
  try {
    const { doctor_id, appointment_date, appointment_time, reason } = req.body;
    const patient_id = req.user.id;

    if (!doctor_id || !appointment_date || !appointment_time) {
      return errorResponse(res, 'Doctor, date, and time are required.', 400);
    }

    // Check if the selected date and time are in the past
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(now - tzOffset)).toISOString();
    const todayStr = localISOTime.split('T')[0];
    const currentTimeStr = localISOTime.split('T')[1].substring(0, 8);

    if (appointment_date < todayStr) {
      return errorResponse(res, 'Cannot book an appointment for a past date.', 400);
    }
    if (appointment_date === todayStr && appointment_time <= currentTimeStr) {
      return errorResponse(res, 'Cannot book an appointment for a past time today.', 400);
    }

    // Check doctor exists and is active
    const [doctorRows] = await db.query(
      'SELECT id, available_days, slot_start, slot_end FROM doctors WHERE id = ? AND is_active = TRUE',
      [doctor_id]
    );
    if (doctorRows.length === 0) return errorResponse(res, 'Doctor not found or inactive.', 404);

    const doctor = doctorRows[0];
    const dayName = getDayName(appointment_date);
    const availableDays = doctor.available_days ? doctor.available_days.split(',') : [];
    if (!availableDays.includes(dayName)) {
      return errorResponse(res, `Doctor is not available on ${dayName}s.`, 400);
    }

    // Check if slot is already booked
    const [existing] = await db.query(
      `SELECT id FROM appointments WHERE doctor_id=? AND appointment_date=? AND appointment_time=? AND status != 'cancelled'`,
      [doctor_id, appointment_date, appointment_time]
    );
    if (existing.length > 0) {
      return errorResponse(res, 'This time slot is already booked. Please choose another.', 409);
    }

    // Check patient doesn't have duplicate booking
    const [patientExisting] = await db.query(
      `SELECT id FROM appointments WHERE patient_id=? AND doctor_id=? AND appointment_date=? AND status != 'cancelled'`,
      [patient_id, doctor_id, appointment_date]
    );
    if (patientExisting.length > 0) {
      return errorResponse(res, 'You already have an appointment with this doctor on this date.', 409);
    }

    const [result] = await db.query(
      'INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, reason) VALUES (?, ?, ?, ?, ?)',
      [patient_id, doctor_id, appointment_date, appointment_time, reason || null]
    );

    return successResponse(res, { appointment_id: result.insertId }, 'Appointment booked successfully! 🎉', 201);
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') {
      return errorResponse(res, 'This time slot is already booked.', 409);
    }
    return errorResponse(res, 'Failed to book appointment.', 500);
  }
};

// ─── CANCEL APPOINTMENT ───────────────────────────────────────────────────────
const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      'SELECT id, patient_id, status FROM appointments WHERE id = ?',
      [id]
    );
    if (rows.length === 0) return errorResponse(res, 'Appointment not found.', 404);
    if (rows[0].patient_id !== req.user.id) return errorResponse(res, 'Unauthorized.', 403);
    if (rows[0].status === 'completed') return errorResponse(res, 'Cannot cancel a completed appointment.', 400);
    if (rows[0].status === 'cancelled') return errorResponse(res, 'Appointment is already cancelled.', 400);

    await db.query('UPDATE appointments SET status=? WHERE id=?', ['cancelled', id]);
    return successResponse(res, null, 'Appointment cancelled successfully.');
  } catch (err) {
    console.error(err);
    return errorResponse(res, 'Failed to cancel appointment.', 500);
  }
};

// ─── TRACK APPOINTMENT ────────────────────────────────────────────────────────
const trackAppointment = async (req, res) => {
  try {
    const { query } = req.params;
    let appointmentId = null;
    let expectedPrefix = null;

    const isNumeric = /^\d+$/.test(query);
    if (isNumeric) {
      appointmentId = parseInt(query);
    } else {
      const match = query.match(/^([A-Za-z]+)-(\d+)$/);
      if (match) {
        expectedPrefix = match[1].toUpperCase();
        appointmentId = parseInt(match[2]);
      }
    }

    if (!appointmentId) {
      return errorResponse(res, 'Invalid tracking format. Enter an Appointment ID or Token (e.g. C-101).', 400);
    }

    const [rows] = await db.query(
      `SELECT a.id, a.appointment_date, a.appointment_time, a.status, 
              d.id AS doctor_id, d.name AS doctor_name, d.specialization, d.slot_duration, d.available_days
       FROM appointments a
       JOIN doctors d ON a.doctor_id = d.id
       WHERE a.id = ?`,
      [appointmentId]
    );

    if (rows.length === 0) {
      return errorResponse(res, 'No active booking found with this ID/Token.', 404);
    }

    const appt = rows[0];

    // If expectedPrefix was provided, verify if the specialization starts with it
    if (expectedPrefix) {
      let specUpper = appt.specialization.toUpperCase();
      let matchFound = false;

      // Handle common clinical abbreviations
      if (expectedPrefix === 'C' && specUpper.includes('CARDIO')) matchFound = true;
      else if (expectedPrefix === 'N' && specUpper.includes('NEURO')) matchFound = true;
      else if (expectedPrefix === 'O' && (specUpper.includes('ORTHO') || specUpper.includes('BONE'))) matchFound = true;
      else if (expectedPrefix === 'P' && (specUpper.includes('PEDIAT') || specUpper.includes('CHILD'))) matchFound = true;
      else if (expectedPrefix === 'G' && (specUpper.includes('GEN') || specUpper.includes('INTERNAL'))) matchFound = true;
      else if (expectedPrefix === 'D' && (specUpper.includes('DERMA') || specUpper.includes('SKIN'))) matchFound = true;
      else if (expectedPrefix === 'GY' && (specUpper.includes('GYNE') || specUpper.includes('OBSTET'))) matchFound = true;
      else if (expectedPrefix === 'OP' && (specUpper.includes('OPHTH') || specUpper.includes('EYE'))) matchFound = true;
      else if (specUpper.startsWith(expectedPrefix)) matchFound = true;

      if (!matchFound) {
        return errorResponse(res, 'Token prefix does not match the department of this appointment.', 400);
      }
    }

    // If appointment is cancelled, we return it with that status
    if (appt.status === 'cancelled') {
      return successResponse(res, {
        appointment: {
          id: appt.id,
          appointment_date: appt.appointment_date,
          appointment_time: appt.appointment_time,
          status: appt.status,
          doctor_name: appt.doctor_name,
          specialization: appt.specialization,
          room: 'N/A'
        },
        patientsAhead: 0,
        estWaitTime: 0
      });
    }

    // Calculate patients ahead
    const [queueRows] = await db.query(
      `SELECT COUNT(*) as count FROM appointments 
       WHERE doctor_id = ? AND appointment_date = ? AND appointment_time < ? AND status IN ('pending', 'confirmed')`,
      [appt.doctor_id, appt.appointment_date, appt.appointment_time]
    );

    const patientsAhead = queueRows[0].count;
    const estWaitTime = patientsAhead * (appt.slot_duration || 15);

    // Map specialization to a room number
    let room = '101';
    let specUpper = appt.specialization.toUpperCase();
    if (specUpper.includes('NEURO')) room = '104';
    else if (specUpper.includes('ORTHO')) room = '108';
    else if (specUpper.includes('PEDIAT')) room = '112';
    else if (specUpper.includes('GEN')) room = '115';
    else if (specUpper.includes('DERMA')) room = '118';
    else if (specUpper.includes('GYNE')) room = '120';
    else if (specUpper.includes('OPHTH')) room = '122';

    return successResponse(res, {
      appointment: {
        id: appt.id,
        appointment_date: appt.appointment_date,
        appointment_time: appt.appointment_time,
        status: appt.status,
        doctor_name: appt.doctor_name,
        specialization: appt.specialization,
        room: room
      },
      patientsAhead,
      estWaitTime
    });
  } catch (err) {
    console.error(err);
    return errorResponse(res, 'Failed to track appointment.', 500);
  }
};

module.exports = { bookAppointment, cancelAppointment, trackAppointment };

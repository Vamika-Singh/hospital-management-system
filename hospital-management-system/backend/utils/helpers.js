/**
 * Generate time slots for a doctor on a given date
 * @param {string} startTime - "09:00:00"
 * @param {string} endTime   - "17:00:00"
 * @param {number} duration  - minutes (e.g. 30)
 * @param {Array}  bookedSlots - array of "HH:MM:SS" strings already booked
 * @returns {Array} array of slot objects { time, available }
 */
function generateSlots(startTime, endTime, duration, bookedSlots = []) {
  const slots = [];
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

  let current = startH * 60 + startM;
  const end = endH * 60 + endM;

  while (current + duration <= end) {
    const h = Math.floor(current / 60);
    const m = current % 60;
    const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
    const displayTime = `${String(h % 12 || 12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;

    slots.push({
      time: timeStr,
      displayTime,
      available: !bookedSlots.includes(timeStr)
    });
    current += duration;
  }
  return slots;
}

/**
 * Format a date to YYYY-MM-DD
 */
function formatDate(date) {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

/**
 * Get day name from a date string
 * Returns 'Mon', 'Tue', etc.
 */
function getDayName(dateStr) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[new Date(dateStr).getDay()];
}

/**
 * Send success response
 */
function successResponse(res, data, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({ success: true, message, data });
}

/**
 * Send error response
 */
function errorResponse(res, message = 'An error occurred', statusCode = 500) {
  return res.status(statusCode).json({ success: false, message });
}

module.exports = { generateSlots, formatDate, getDayName, successResponse, errorResponse };

const db = require('../config/db');
const { successResponse, errorResponse } = require('../utils/helpers');

// Fetch invoices for a patient
const getMyInvoices = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT i.*, a.appointment_date, d.name AS doctor_name, d.specialization 
       FROM invoices i
       JOIN appointments a ON i.appointment_id = a.id
       JOIN doctors d ON a.doctor_id = d.id
       WHERE a.patient_id = ?
       ORDER BY i.created_at DESC`,
      [req.user.id]
    );
    return successResponse(res, rows);
  } catch (err) {
    console.error(err);
    return errorResponse(res, 'Failed to fetch invoices.', 500);
  }
};

// Fetch all invoices (Admin)
const getAllInvoices = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT i.*, a.appointment_date, d.name AS doctor_name, p.name AS patient_name 
       FROM invoices i
       JOIN appointments a ON i.appointment_id = a.id
       JOIN doctors d ON a.doctor_id = d.id
       JOIN patients p ON a.patient_id = p.id
       ORDER BY i.created_at DESC`
    );
    return successResponse(res, rows);
  } catch (err) {
    console.error(err);
    return errorResponse(res, 'Failed to fetch all invoices.', 500);
  }
};

// Get single invoice details
const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      `SELECT i.*, a.appointment_date, a.appointment_time, a.diagnosis, a.prescription,
              d.name AS doctor_name, d.specialization,
              p.name AS patient_name, p.email AS patient_email, p.phone AS patient_phone, p.address AS patient_address
       FROM invoices i
       JOIN appointments a ON i.appointment_id = a.id
       JOIN doctors d ON a.doctor_id = d.id
       JOIN patients p ON a.patient_id = p.id
       WHERE i.id = ?`,
      [id]
    );

    if (rows.length === 0) return errorResponse(res, 'Invoice not found.', 404);
    
    // Ensure patient only accesses their own invoice
    if (req.user.role === 'patient' && rows[0].patient_email !== req.user.email) {
      return errorResponse(res, 'Unauthorized to view this invoice.', 403);
    }

    return successResponse(res, rows[0]);
  } catch (err) {
    console.error(err);
    return errorResponse(res, 'Failed to fetch invoice details.', 500);
  }
};

// Pay an invoice (Simulate payment)
const payInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const { method } = req.body;

    const [invoice] = await db.query('SELECT id, appointment_id FROM invoices WHERE id = ?', [id]);
    if (invoice.length === 0) return errorResponse(res, 'Invoice not found.', 404);

    await db.query(
      `UPDATE invoices SET payment_status = 'paid', payment_method = ? WHERE id = ?`,
      [method || 'Credit/Debit Card', id]
    );

    return successResponse(res, null, 'Invoice paid successfully!');
  } catch (err) {
    console.error(err);
    return errorResponse(res, 'Payment failed.', 500);
  }
};

module.exports = { getMyInvoices, getAllInvoices, getInvoiceById, payInvoice };

const db = require('../config/db');
const { successResponse, errorResponse } = require('../utils/helpers');

// ─── GET ALL NURSES (ADMIN) ──────────────────────────────────────────────────
const getAllNurses = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM nurses ORDER BY created_at DESC');
    return successResponse(res, rows);
  } catch (err) {
    console.error(err);
    return errorResponse(res, 'Failed to fetch nurses.', 500);
  }
};

// ─── ADD NURSE (ADMIN) ───────────────────────────────────────────────────────
const addNurse = async (req, res) => {
  try {
    const { name, email, phone, department, shift } = req.body;
    if (!name || !email || !department || !shift) {
      return errorResponse(res, 'Name, email, department, and shift are required.', 400);
    }

    const [existing] = await db.query('SELECT id FROM nurses WHERE email = ?', [email]);
    if (existing.length > 0) {
      return errorResponse(res, 'A nurse with this email already exists.', 409);
    }

    await db.query(
      `INSERT INTO nurses (name, email, phone, department, shift, is_active)
       VALUES (?, ?, ?, ?, ?, TRUE)`,
      [name, email, phone || null, department, shift]
    );

    return successResponse(res, null, 'Nurse added successfully.', 201);
  } catch (err) {
    console.error(err);
    return errorResponse(res, 'Failed to add nurse.', 500);
  }
};

// ─── UPDATE NURSE (ADMIN) ────────────────────────────────────────────────────
const updateNurse = async (req, res) => {
  try {
    const { name, email, phone, department, shift, is_active } = req.body;
    const { id } = req.params;

    const [existing] = await db.query('SELECT id FROM nurses WHERE id = ?', [id]);
    if (existing.length === 0) {
      return errorResponse(res, 'Nurse not found.', 404);
    }

    await db.query(
      `UPDATE nurses SET name=?, email=?, phone=?, department=?, shift=?, is_active=?
       WHERE id=?`,
      [name, email, phone || null, department, shift, is_active !== undefined ? is_active : true, id]
    );

    return successResponse(res, null, 'Nurse updated successfully.');
  } catch (err) {
    console.error(err);
    return errorResponse(res, 'Failed to update nurse.', 500);
  }
};

// ─── DELETE NURSE (ADMIN) ────────────────────────────────────────────────────
const deleteNurse = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await db.query('SELECT id FROM nurses WHERE id = ?', [id]);
    if (existing.length === 0) {
      return errorResponse(res, 'Nurse not found.', 404);
    }

    await db.query('DELETE FROM nurses WHERE id = ?', [id]);
    return successResponse(res, null, 'Nurse removed successfully.');
  } catch (err) {
    console.error(err);
    return errorResponse(res, 'Failed to delete nurse.', 500);
  }
};

module.exports = {
  getAllNurses,
  addNurse,
  updateNurse,
  deleteNurse
};

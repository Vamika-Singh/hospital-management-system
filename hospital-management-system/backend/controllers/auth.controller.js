const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { successResponse, errorResponse } = require('../utils/helpers');

// ─── PATIENT REGISTER ────────────────────────────────────────────────────────
const registerPatient = async (req, res) => {
  try {
    const { name, email, password, phone, dob, gender, blood_group, address } = req.body;

    // Validation
    if (!name || !email || !password) {
      return errorResponse(res, 'Name, email and password are required.', 400);
    }
    if (password.length < 6) {
      return errorResponse(res, 'Password must be at least 6 characters.', 400);
    }

    // Check if email exists
    const [existing] = await db.query('SELECT id FROM patients WHERE email = ?', [email]);
    if (existing.length > 0) {
      return errorResponse(res, 'An account with this email already exists.', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO patients (name, email, password, phone, dob, gender, blood_group, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, email, hashedPassword, phone || null, dob || null, gender || null, blood_group || null, address || null]
    );

    const token = jwt.sign(
      { id: result.insertId, role: 'patient', name, email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    return successResponse(res, { token, user: { id: result.insertId, name, email, role: 'patient' } }, 'Registration successful!', 201);
  } catch (err) {
    console.error('Register error:', err);
    return errorResponse(res, 'Registration failed. Please try again.', 500);
  }
};

// ─── PATIENT LOGIN ────────────────────────────────────────────────────────────
const loginPatient = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return errorResponse(res, 'Email and password are required.', 400);
    }

    const [rows] = await db.query('SELECT * FROM patients WHERE email = ?', [email]);
    if (rows.length === 0) {
      return errorResponse(res, 'Invalid email or password.', 401);
    }

    const patient = rows[0];
    const isMatch = await bcrypt.compare(password, patient.password);
    if (!isMatch) {
      return errorResponse(res, 'Invalid email or password.', 401);
    }

    const token = jwt.sign(
      { id: patient.id, role: 'patient', name: patient.name, email: patient.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    return successResponse(res, {
      token,
      user: { id: patient.id, name: patient.name, email: patient.email, role: 'patient' }
    }, 'Login successful!');
  } catch (err) {
    console.error('Login error:', err);
    return errorResponse(res, 'Login failed. Please try again.', 500);
  }
};

// ─── ADMIN LOGIN ──────────────────────────────────────────────────────────────
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return errorResponse(res, 'Email and password are required.', 400);
    }

    const [rows] = await db.query('SELECT * FROM admins WHERE email = ?', [email]);
    if (rows.length === 0) {
      return errorResponse(res, 'Invalid admin credentials.', 401);
    }

    const admin = rows[0];
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return errorResponse(res, 'Invalid admin credentials.', 401);
    }

    const token = jwt.sign(
      { id: admin.id, role: 'admin', name: admin.name, email: admin.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    return successResponse(res, {
      token,
      user: { id: admin.id, name: admin.name, email: admin.email, role: 'admin' }
    }, 'Admin login successful!');
  } catch (err) {
    console.error('Admin login error:', err);
    return errorResponse(res, 'Login failed. Please try again.', 500);
  }
};

module.exports = { registerPatient, loginPatient, loginAdmin };

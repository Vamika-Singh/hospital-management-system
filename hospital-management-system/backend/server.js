require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// ─── API ROUTES ───────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/patients', require('./routes/patient.routes'));
app.use('/api/doctors', require('./routes/doctor.routes'));
app.use('/api/appointments', require('./routes/appointment.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/beds', require('./routes/bed.routes'));
app.use('/api/invoices', require('./routes/invoice.routes'));

// Public announcement route (no auth needed)
const db = require('./config/db');
app.get('/api/announcement', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM announcements WHERE is_active=TRUE ORDER BY created_at DESC LIMIT 1');
    res.json({ success: true, data: rows[0] || null });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch announcement.' });
  }
});

// ─── CATCH-ALL MIDDLEWARE (SERVE FRONTEND) ────────────────────────────────────
app.use((req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../frontend/pages/index.html'));
  } else {
    res.status(404).json({ success: false, message: 'API Route not found' });
  }
});

// ─── 404 & ERROR HANDLER ─────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

// ─── START SERVER ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🏥 MediCare Hospital Server running at http://localhost:${PORT}`);
});

# 🏥 MediCare — Hospital Management System

A full-stack Hospital Management System with appointment scheduling built using HTML, CSS, JavaScript (Frontend) and Node.js + Express + MySQL (Backend).

---

## 🚀 Features

- **Patient Registration & Login** — JWT authentication with bcrypt password hashing
- **Doctor Listing** — Search and filter by specialization
- **Real-time Appointment Booking** — Live slot availability, date/time selection
- **Patient Dashboard** — Track appointments with status (pending, confirmed, completed, cancelled)
- **Admin Dashboard** — Analytics charts (Canvas API), stats overview
- **Admin CRUD** — Manage doctors, view patients, update appointment statuses
- **Announcement Banner** — Admin can post hospital-wide notices
- **Responsive Design** — Mobile-friendly CSS Grid + Flexbox

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js, Express.js |
| Database | MySQL |
| Authentication | JWT + bcrypt |
| Dev Tools | Nodemon |

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js (v16+)
- MySQL (v8+)
- A terminal / command prompt

### Step 1 — Database Setup

1. Open MySQL Workbench or terminal and log in to MySQL:
   ```bash
   mysql -u root -p
   ```

2. Run the schema file:
   ```sql
   source path/to/hospital-management-system/database/schema.sql;
   ```
   Or import it via MySQL Workbench → Server → Data Import.

### Step 2 — Backend Setup

1. Navigate to the backend folder:
   ```bash
   cd hospital-management-system/backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables — edit the `.env` file:
   ```
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_actual_mysql_password
   DB_NAME=hospital_db
   JWT_SECRET=medicare_hospital_jwt_secret_2024
   JWT_EXPIRES_IN=7d
   ```

4. Start the server:
   ```bash
   npm run dev
   ```
   You should see:
   ```
   ✅ MySQL Database connected successfully
   🏥 MediCare Hospital Server running at http://localhost:5000
   ```

### Step 3 — Open in Browser

Navigate to: **http://localhost:5000/pages/index.html**

---

## 🔐 Default Login Credentials

### Admin Login
- **URL:** http://localhost:5000/pages/admin-login.html
- **Email:** `admin@hospital.com`
- **Password:** `password`

### Patient Login
- Register a new patient account at http://localhost:5000/pages/register.html
- Or use any email/password you registered with

---

## 📁 Project Structure

```
hospital-management-system/
├── backend/
│   ├── config/db.js          # MySQL connection pool
│   ├── controllers/          # Business logic
│   ├── middleware/           # JWT auth + role guards
│   ├── routes/               # API route definitions
│   ├── utils/helpers.js      # Slot generator, response helpers
│   ├── .env                  # Environment variables
│   └── server.js             # Express entry point
├── frontend/
│   ├── css/                  # style.css, components.css, dashboard.css
│   ├── js/                   # api.js, utils.js
│   └── pages/
│       ├── index.html        # Landing page
│       ├── login.html        # Patient login
│       ├── admin-login.html  # Admin login
│       ├── register.html     # Patient registration
│       ├── doctors.html      # Doctor listing
│       ├── book-appointment.html  # Booking flow
│       ├── patient-dashboard.html # Patient area
│       └── admin/            # Admin panel pages
└── database/schema.sql       # Full DB schema + seed data
```

---

## 🌐 REST API Overview

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | — | Patient registration |
| POST | /api/auth/login | — | Patient login |
| POST | /api/auth/admin/login | — | Admin login |
| GET | /api/doctors | — | List all doctors |
| GET | /api/doctors/:id/slots?date= | — | Available slots |
| POST | /api/appointments | Patient | Book appointment |
| PUT | /api/appointments/:id/cancel | Patient | Cancel booking |
| GET | /api/patients/my-appointments | Patient | My appointments |
| GET | /api/admin/dashboard | Admin | Analytics data |
| POST | /api/admin/doctors | Admin | Add doctor |
| PUT | /api/admin/appointments/:id/status | Admin | Update status |

---

## 📝 Notes

- The system runs **fully locally** — no cloud/paid services required
- All API responses follow a consistent `{ success, message, data }` format
- Passwords are hashed using **bcrypt** (10 salt rounds)
- JWTs expire after **7 days**
- Double-booking is prevented via **database UNIQUE constraint**

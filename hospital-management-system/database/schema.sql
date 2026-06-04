-- ============================================================
-- Hospital Management System - Database Schema (Clean Version)
-- ============================================================

CREATE DATABASE IF NOT EXISTS hospital_db;
USE hospital_db;

-- ============================================================
-- TABLE: admins
-- ============================================================
CREATE TABLE IF NOT EXISTS admins (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE: patients
-- ============================================================
CREATE TABLE IF NOT EXISTS patients (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(15),
  dob DATE,
  gender ENUM('Male', 'Female', 'Other'),
  blood_group VARCHAR(5),
  address TEXT,
  medical_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE: doctors
-- ============================================================
CREATE TABLE IF NOT EXISTS doctors (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  specialization VARCHAR(100) NOT NULL,
  qualification VARCHAR(150),
  experience_years INT DEFAULT 0,
  phone VARCHAR(15),
  bio TEXT,
  available_days VARCHAR(100) DEFAULT 'Mon,Tue,Wed,Thu,Fri',
  slot_start TIME DEFAULT '09:00:00',
  slot_end TIME DEFAULT '17:00:00',
  slot_duration INT DEFAULT 30,
  fee DECIMAL(8,2) DEFAULT 500.00,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE: appointments
-- ============================================================
CREATE TABLE IF NOT EXISTS appointments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
  UNIQUE KEY unique_slot (doctor_id, appointment_date, appointment_time)
);

-- ============================================================
-- TABLE: announcements
-- ============================================================
CREATE TABLE IF NOT EXISTS announcements (
  id INT PRIMARY KEY AUTO_INCREMENT,
  message TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- SEED DATA: Admin Account
-- Password: password
-- ============================================================
INSERT INTO admins (name, email, password) VALUES
('Admin User', 'admin@hospital.com', '$2b$10$NhZ0//jjzvY.5mrmerlSLeP92X9zuDQP2pUnEFwc//mJBlm0NrcrC');

-- ============================================================
-- SEED DATA: Doctors
-- ============================================================
INSERT INTO doctors (name, email, specialization, qualification, experience_years, phone, bio, available_days, slot_start, slot_end, slot_duration, fee) VALUES
('Dr. Aryan Mehta', 'aryan.mehta@hospital.com', 'Cardiologist', 'MBBS, MD (Cardiology)', 12, '9876543210', 'Dr. Aryan Mehta is a leading cardiologist with over 12 years of experience.', 'Mon,Tue,Wed,Thu,Fri', '09:00:00', '17:00:00', 30, 800.00),
('Dr. Priya Sharma', 'priya.sharma@hospital.com', 'Neurologist', 'MBBS, DM (Neurology)', 8, '9876543211', 'Dr. Priya Sharma is a dedicated neurologist specializing in epilepsy.', 'Mon,Wed,Fri', '10:00:00', '16:00:00', 30, 700.00),
('Dr. Rajesh Kumar', 'rajesh.kumar@hospital.com', 'Orthopedic Surgeon', 'MBBS, MS (Orthopaedics)', 15, '9876543212', 'Dr. Rajesh Kumar is a renowned orthopedic surgeon.', 'Tue,Thu,Sat', '08:00:00', '14:00:00', 45, 900.00),
('Dr. Sunita Patel', 'sunita.patel@hospital.com', 'Pediatrician', 'MBBS, MD (Pediatrics)', 10, '9876543213', 'Dr. Sunita Patel is a warm and caring pediatrician.', 'Mon,Tue,Wed,Thu,Fri', '09:00:00', '15:00:00', 20, 500.00),
('Dr. Vikram Singh', 'vikram.singh@hospital.com', 'Dermatologist', 'MBBS, MD (Dermatology)', 7, '9876543214', 'Dr. Vikram Singh is a skilled dermatologist.', 'Mon,Wed,Fri,Sat', '11:00:00', '18:00:00', 30, 600.00),
('Dr. Neha Gupta', 'neha.guqa@hospital.com', 'Gynecologist', 'MBBS, MS (Obstetrics & Gynaecology)', 9, '9876543215', 'Dr. Neha Gupta is an experienced gynecologist.', 'Mon,Tue,Thu,Fri', '09:00:00', '16:00:00', 30, 700.00),
('Dr. Arun Nair', 'arun.nair@hospital.com', 'General Physician', 'MBBS, MD (Internal Medicine)', 5, '9876543216', 'Dr. Arun Nair is a general physician providing primary healthcare.', 'Mon,Tue,Wed,Thu,Fri,Sat', '08:00:00', '18:00:00', 15, 400.00),
('Dr. Kavya Reddy', 'kavya.reddy@hospital.com', 'Psychiatrist', 'MBBS, MD (Psychiatry)', 6, '9876543217', 'Dr. Kavya Reddy is a compassionate psychiatrist.', 'Tue,Wed,Thu', '10:00:00', '17:00:00', 45, 750.00);

-- ============================================================
-- SEED DATA: Sample Announcement
-- ============================================================
INSERT INTO announcements (message) VALUES
('Welcome to MediCare Hospital! We are now accepting appointments online. Book your slot today and skip the wait.');

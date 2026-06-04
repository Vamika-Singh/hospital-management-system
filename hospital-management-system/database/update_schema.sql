-- ============================================================
-- Hospital Management System - Phase 2 Advanced Schema Update
-- ============================================================

USE hospital_db;

-- 1. Add EHR columns to appointments table
ALTER TABLE appointments 
ADD COLUMN diagnosis VARCHAR(255) DEFAULT NULL,
ADD COLUMN prescription TEXT DEFAULT NULL;

-- 2. Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  appointment_id INT UNIQUE NOT NULL,
  consultation_fee DECIMAL(8,2) NOT NULL,
  medicine_charges DECIMAL(8,2) DEFAULT 0.00,
  room_charges DECIMAL(8,2) DEFAULT 0.00,
  tax DECIMAL(8,2) DEFAULT 0.00,
  total_amount DECIMAL(8,2) NOT NULL,
  payment_status ENUM('unpaid', 'paid') DEFAULT 'unpaid',
  payment_method VARCHAR(50) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
);

-- 3. Create beds table
CREATE TABLE IF NOT EXISTS beds (
  id INT PRIMARY KEY AUTO_INCREMENT,
  bed_number VARCHAR(20) UNIQUE NOT NULL,
  ward_type ENUM('General Ward', 'ICU', 'Semi-Private', 'Private') NOT NULL,
  fee_per_day DECIMAL(8,2) NOT NULL,
  is_occupied BOOLEAN DEFAULT FALSE
);

-- 4. Create bed allocations table
CREATE TABLE IF NOT EXISTS bed_allocations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  bed_id INT NOT NULL,
  patient_id INT NOT NULL,
  admission_date DATE NOT NULL,
  discharge_date DATE DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bed_id) REFERENCES beds(id) ON DELETE CASCADE,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- 5. Seed beds database
INSERT IGNORE INTO beds (bed_number, ward_type, fee_per_day, is_occupied) VALUES
('G-101', 'General Ward', 500.00, FALSE),
('G-102', 'General Ward', 500.00, FALSE),
('G-103', 'General Ward', 500.00, FALSE),
('S-201', 'Semi-Private', 1200.00, FALSE),
('S-202', 'Semi-Private', 1200.00, FALSE),
('I-301', 'ICU', 3500.00, FALSE),
('I-302', 'ICU', 3500.00, FALSE),
('P-401', 'Private', 2500.00, FALSE);

-- 6. Create nurses table
CREATE TABLE IF NOT EXISTS nurses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(15),
  department VARCHAR(100) NOT NULL,
  shift ENUM('Morning', 'Evening', 'Night') NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Seed nurses database
INSERT IGNORE INTO nurses (name, email, phone, department, shift, is_active) VALUES
('Nurse Sarah Connor', 'sarah.connor@hospital.com', '9876543220', 'ICU', 'Night', TRUE),
('Nurse Emma Watson', 'emma.watson@hospital.com', '9876543221', 'Cardiology', 'Morning', TRUE),
('Nurse Florence Nightingale', 'florence@hospital.com', '9876543222', 'General Medicine', 'Morning', TRUE),
('Nurse Clara Barton', 'clara.barton@hospital.com', '9876543223', 'Pediatrics', 'Evening', TRUE);

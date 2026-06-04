const db = require('../backend/config/db');

async function main() {
  try {
    console.log('🚀 Running Phase 2 migration for nurses...');
    
    // Create nurses table
    await db.query(`
      CREATE TABLE IF NOT EXISTS nurses (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(15),
        department VARCHAR(100) NOT NULL,
        shift ENUM('Morning', 'Evening', 'Night') NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created nurses table (if not exists).');

    // Seed nurses
    await db.query(`
      INSERT IGNORE INTO nurses (name, email, phone, department, shift, is_active) VALUES
      ('Nurse Sarah Connor', 'sarah.connor@hospital.com', '9876543220', 'ICU', 'Night', TRUE),
      ('Nurse Emma Watson', 'emma.watson@hospital.com', '9876543221', 'Cardiology', 'Morning', TRUE),
      ('Nurse Florence Nightingale', 'florence@hospital.com', '9876543222', 'General Medicine', 'Morning', TRUE),
      ('Nurse Clara Barton', 'clara.barton@hospital.com', '9876543223', 'Pediatrics', 'Evening', TRUE)
    `);
    console.log('✅ Seeded nurses database.');

    console.log('🎉 Phase 2 migrations complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Phase 2 migration failed:', err.message);
    process.exit(1);
  }
}

main();

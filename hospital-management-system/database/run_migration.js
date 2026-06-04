const fs = require('fs');
const path = require('path');
const db = require('../backend/config/db');

async function runMigration() {
  try {
    const sqlPath = path.join(__dirname, 'update_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split queries by semicolon simply and clean them up
    const queries = sql
      .split(';')
      .map(q => q.trim())
      .filter(q => q.length > 0);

    console.log(`🚀 Starting database migration... Found ${queries.length} queries to execute.`);

    for (let i = 0; i < queries.length; i++) {
      let query = queries[i];
      // Strip comments
      query = query.replace(/^\s*--.*$/gm, '').trim();
      if (!query) continue;

      console.log(`⏳ Executing Query ${i + 1}/${queries.length}: ${query.substring(0, 40)}...`);
      await db.query(query);
    }

    console.log('✅ Database migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

runMigration();

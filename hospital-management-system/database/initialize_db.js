const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root123',
    multipleStatements: true
  });

  console.log("🚀 Connected to MySQL database server.");

  try {
    // 1. Create database if not exists and select it
    await connection.query("CREATE DATABASE IF NOT EXISTS hospital_db;");
    await connection.query("USE hospital_db;");
    console.log("🏥 Database 'hospital_db' selected/created.");

    // 2. Disable foreign keys to cleanly drop and recreate
    await connection.query("SET FOREIGN_KEY_CHECKS = 0;");
    
    // 3. Drop existing tables to ensure a clean slate
    const tablesToDrop = [
      'bed_allocations',
      'invoices',
      'appointments',
      'beds',
      'nurses',
      'doctors',
      'patients',
      'admins',
      'announcements'
    ];
    for (const table of tablesToDrop) {
      await connection.query(`DROP TABLE IF EXISTS \`${table}\`;`);
      console.log(`🗑️ Dropped table: ${table}`);
    }

    // 4. Read and execute schema.sql
    const schemaSqlPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaSqlPath, 'utf8');
    console.log("📝 Executing schema.sql...");
    
    // Split schema queries by semicolon
    const schemaQueries = schemaSql
      .split(';')
      .map(q => q.trim())
      .filter(q => q.length > 0);

    for (let i = 0; i < schemaQueries.length; i++) {
      let query = schemaQueries[i];
      // Clean up comments
      query = query.replace(/^\s*--.*$/gm, '').trim();
      if (!query) continue;
      
      try {
        await connection.query(query);
      } catch (err) {
        console.error(`❌ Error in schema.sql query ${i+1}:`, err.message);
        console.error(`Query: ${query}`);
        throw err;
      }
    }
    console.log("✅ base schema.sql executed successfully!");

    // 5. Read and execute update_schema.sql
    const updateSqlPath = path.join(__dirname, 'update_schema.sql');
    const updateSql = fs.readFileSync(updateSqlPath, 'utf8');
    console.log("📝 Executing update_schema.sql...");
    
    // Split update queries by semicolon
    const updateQueries = updateSql
      .split(';')
      .map(q => q.trim())
      .filter(q => q.length > 0);

    for (let i = 0; i < updateQueries.length; i++) {
      let query = updateQueries[i];
      // Clean up comments
      query = query.replace(/^\s*--.*$/gm, '').trim();
      if (!query) continue;

      try {
        await connection.query(query);
      } catch (err) {
        console.error(`❌ Error in update_schema.sql query ${i+1}:`, err.message);
        console.error(`Query: ${query}`);
        throw err;
      }
    }
    console.log("✅ update_schema.sql executed successfully!");

    // Re-enable foreign key checks
    await connection.query("SET FOREIGN_KEY_CHECKS = 1;");
    console.log("🎉 Database initialized/recreated successfully with all seed data!");
    
  } catch (err) {
    console.error("❌ Database initialization failed:", err);
  } finally {
    await connection.end();
  }
}

main();

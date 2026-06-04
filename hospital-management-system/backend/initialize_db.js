const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const dbUrl = process.env.DATABASE_URL || '';
  const isPostgres = dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://');

  if (isPostgres) {
    console.log("🚀 Initializing PostgreSQL Database on Neon/Cloud...");
    const client = new Client({
      connectionString: dbUrl,
      ssl: {
        rejectUnauthorized: false
      }
    });

    await client.connect();
    console.log("🔌 Connected to PostgreSQL Database.");

    try {
      const schemaSqlPath = path.join(__dirname, '../database/schema_pg.sql');
      const schemaSql = fs.readFileSync(schemaSqlPath, 'utf8');
      console.log("📝 Executing schema_pg.sql...");

      // Execute schema_pg.sql directly on PostgreSQL client
      await client.query(schemaSql);

      console.log("🎉 PostgreSQL database initialized/recreated successfully with all seed data!");
    } catch (err) {
      console.error("❌ Database initialization failed:", err);
    } finally {
      await client.end();
    }
  } else {
    console.log("🚀 Initializing MySQL Database...");
    const isCloud = !!(dbUrl.startsWith('mysql://') || (process.env.DB_HOST && process.env.DB_HOST !== 'localhost' && process.env.DB_HOST !== '127.0.0.1'));
    
    let connection;
    if (dbUrl.startsWith('mysql://')) {
      const connUri = dbUrl + (dbUrl.includes('?') ? '&' : '?') + 'multipleStatements=true';
      connection = await mysql.createConnection(connUri);
    } else {
      connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'root123',
        database: isCloud ? process.env.DB_NAME : undefined,
        port: process.env.DB_PORT || 3306,
        multipleStatements: true
      });
    }

    console.log("🔌 Connected to MySQL database server.");

    try {
      if (!isCloud && !dbUrl.startsWith('mysql://')) {
        await connection.query("CREATE DATABASE IF NOT EXISTS hospital_db;");
        await connection.query("USE hospital_db;");
        console.log("🏥 Database 'hospital_db' selected/created.");
      } else {
        console.log(`🏥 Cloud Database selected directly: ${process.env.DB_NAME || 'URI config'}`);
      }

      await connection.query("SET FOREIGN_KEY_CHECKS = 0;");
      
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

      const schemaSqlPath = path.join(__dirname, '../database/schema.sql');
      const schemaSql = fs.readFileSync(schemaSqlPath, 'utf8');
      console.log("📝 Executing schema.sql...");
      
      const schemaQueries = schemaSql
        .split(';')
        .map(q => q.trim())
        .filter(q => q.length > 0);

      for (let i = 0; i < schemaQueries.length; i++) {
        let query = schemaQueries[i];
        query = query.replace(/^\s*--.*$/gm, '').trim();
        if (!query) continue;
        await connection.query(query);
      }
      console.log("✅ base schema.sql executed successfully!");

      const updateSqlPath = path.join(__dirname, '../database/update_schema.sql');
      const updateSql = fs.readFileSync(updateSqlPath, 'utf8');
      console.log("📝 Executing update_schema.sql...");
      
      const updateQueries = updateSql
        .split(';')
        .map(q => q.trim())
        .filter(q => q.length > 0);

      for (let i = 0; i < updateQueries.length; i++) {
        let query = updateQueries[i];
        query = query.replace(/^\s*--.*$/gm, '').trim();
        if (!query) continue;
        await connection.query(query);
      }
      console.log("✅ update_schema.sql executed successfully!");

      await connection.query("SET FOREIGN_KEY_CHECKS = 1;");
      console.log("🎉 MySQL Database initialized/recreated successfully with all seed data!");
      
    } catch (err) {
      console.error("❌ MySQL Database initialization failed:", err);
    } finally {
      await connection.end();
    }
  }
}

main();


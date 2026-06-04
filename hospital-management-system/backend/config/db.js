const mysql = require('mysql2/promise');
const { Pool } = require('pg');
require('dotenv').config();

let pool;
let dbType = 'mysql';

const dbUrl = process.env.DATABASE_URL || '';

if (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://')) {
  dbType = 'postgres';
  console.log("🔌 Connecting to PostgreSQL (Neon) using connection string...");
  pool = new Pool({
    connectionString: dbUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });
} else if (dbUrl.startsWith('mysql://')) {
  dbType = 'mysql';
  console.log("🔌 Connecting to MySQL using connection string...");
  pool = mysql.createPool(dbUrl);
} else {
  dbType = 'mysql';
  console.log("🔌 Connecting to MySQL using separate environment parameters...");
  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hospital_db',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
}

// Custom wrapper to behave like mysql2/promise
const dbWrapper = {
  dbType,
  pool,
  async query(sql, params = []) {
    if (this.dbType === 'postgres') {
      // Translate MySQL '?' placeholders to PostgreSQL '$1', '$2', ...
      let index = 1;
      let pgSql = sql.replace(/\?/g, () => `$${index++}`);

      // Handle MySQL-specific backticks
      pgSql = pgSql.replace(/`/g, '"');

      // Check if this is an INSERT query to append RETURNING clause
      const isInsert = pgSql.trim().toUpperCase().startsWith('INSERT');
      if (isInsert && !pgSql.toUpperCase().includes('RETURNING')) {
        pgSql += ' RETURNING id';
      }

      try {
        const res = await this.pool.query(pgSql, params);
        
        if (isInsert) {
          // mysql2 returns [ { insertId: ... } ]
          const insertId = res.rows[0] ? parseInt(res.rows[0].id) : null;
          const result = { insertId };
          return [result];
        }
        
        return [res.rows]; // Destructured as [rows] in mysql2
      } catch (err) {
        // Map PostgreSQL constraint violation codes to MySQL error codes
        if (err.code === '23505') {
          err.code = 'ER_DUP_ENTRY';
        }
        throw err;
      }
    } else {
      // standard mysql2 query
      return this.pool.query(sql, params);
    }
  },
  
  async getConnection() {
    if (this.dbType === 'postgres') {
      const client = await this.pool.connect();
      // Mock release/releaseConnection
      client.releaseConnection = () => client.release();
      return client;
    } else {
      return this.pool.getConnection();
    }
  }
};

// Test connection
if (dbType === 'postgres') {
  pool.connect()
    .then(client => {
      console.log('✅ PostgreSQL Database connected successfully via Pool wrapper');
      client.release();
    })
    .catch(err => {
      console.error('❌ PostgreSQL Connection failed:', err.message);
      process.exit(1);
    });
} else {
  pool.getConnection()
    .then(conn => {
      console.log('✅ MySQL Database connected successfully');
      conn.release();
    })
    .catch(err => {
      console.error('❌ MySQL Connection failed:', err.message);
      process.exit(1);
    });
}

module.exports = dbWrapper;
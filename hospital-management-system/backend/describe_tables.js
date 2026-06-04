const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root123',
    database: 'hospital_db'
  });
  
  console.log("Connected to MySQL successfully!");
  
  const [tables] = await connection.query("SHOW TABLES");
  const tableNames = tables.map(t => Object.values(t)[0]);
  console.log("Tables:", tableNames);
  
  for (const name of tableNames) {
    console.log(`\n=== Table: ${name} ===`);
    const [cols] = await connection.query(`DESCRIBE \`${name}\``);
    cols.forEach(c => {
      console.log(`  ${c.Field}: ${c.Type} (${c.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
  }
  
  await connection.end();
}

main().catch(err => {
  console.error("Error describing tables:", err);
});

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3307,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '1234',
  database: process.env.DB_NAME || 'hms',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ MySQL connection failed:', error.message);
    return false;
  }
}

export async function query(sql, params = []) {
  try {
    // Log for debugging
    console.log('📝 SQL:', sql);
    console.log('📦 Params:', params);
    console.log('🔢 Param count:', params.length);
    console.log('❓ Placeholder count:', (sql.match(/\?/g) || []).length);

    const [results] = await pool.query(sql, params);
    return results;
  } catch (error) {
    console.error('❌ Query error:', error.message);
    console.error('SQL:', sql);
    console.error('Params:', params);
    throw error;
  }
}

export async function procedure(procedureName, params = []) {
  try {
    const sql = `CALL ${procedureName}(${params.map(() => '?').join(',')})`;
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Procedure error:', error.message);
    throw error;
  }
}

export default pool;
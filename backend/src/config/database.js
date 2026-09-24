const mysql = require('mysql2/promise');
require('dotenv').config();

let pool = null;
let useMock = false;

const initPool = () => {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'student_support_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      timezone: '+00:00',
    });
  }
  return pool;
};

const testConnection = async () => {
  try {
    const p = initPool();
    const conn = await p.getConnection();
    console.log('✅ MySQL connected successfully to', process.env.DB_NAME || 'student_support_db');
    conn.release();
    return true;
  } catch (err) {
    console.warn('⚠️  MySQL connection failed:', err.message);
    console.warn('⚠️  Switching backend to In-Memory Fallback Mode (Full seed data loaded dynamically)');
    useMock = true;
    return false;
  }
};

module.exports = { 
  get pool() { return initPool(); }, 
  testConnection, 
  isMock: () => useMock 
};

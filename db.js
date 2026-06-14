const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || null,
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || null,
    ssl: process.env.DATABASE_URL ? {
        rejectUnauthorized: process.env.NODE_ENV !== 'production'
    } : false
});
});

// Create tables if they don't exist
async function initDb() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS rooms (
            id TEXT PRIMARY KEY,
            name TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    await pool.query(`
        CREATE TABLE IF NOT EXISTS questions (
            id SERIAL PRIMARY KEY,
            room_id TEXT REFERENCES rooms(id),
            text TEXT NOT NULL,
            upvotes INTEGER DEFAULT 0,
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    console.log('Database ready');
}

initDb().catch(console.error);

module.exports = pool;
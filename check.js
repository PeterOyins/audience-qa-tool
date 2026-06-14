const dbPromise = require('./db');

(async () => {
  try {
    const pool = await dbPromise;
    const result = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    );
    console.log(result.rows);
  } catch (err) {
    console.error('Error checking tables:', err);
    process.exitCode = 1;
  }
})();
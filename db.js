const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to the database
const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to the database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// Wrapper to run SQL queries (for async/await support)
const runQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('SQL Error:', err.message);
        reject(err);
      } else {
        console.log('Query executed successfully:', query);
        resolve(rows);
      }
    });
  });
};

module.exports = { db, runQuery };

const express = require('express');
const router = express.Router();
const { runQuery } = require('../db');

// Route to list all bookings
router.get('/list-bookings', async (req, res) => {
  try {
    const bookings = await runQuery('SELECT * FROM bookings');
    res.render('list-bookings', { bookings });
  } catch (err) {
    console.error('Error fetching bookings:', err);
    res.status(500).send('Error fetching bookings');
  }
});

module.exports = router;

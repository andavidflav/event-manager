const express = require('express');
const router = express.Router();
const { runQuery } = require('../db');
const QRCode = require('qrcode');

router.get('/', async (req, res) => {
  const userId = req.session.user?.id;

  if (!userId) {
    return res.redirect('/login'); // Redirect to login if the user is not logged in
  }

  try {
    // Fetch user details including the profile_image
    const user = await runQuery('SELECT * FROM users WHERE user_id = ?', [userId]);

    if (!user.length) {
      return res.status(404).send('User not found');
    }

    // Fetch site settings
    const siteSettings = await runQuery('SELECT name, description FROM site_settings LIMIT 1');
    const siteName = siteSettings[0]?.name || 'Default Site Name';
    const siteDescription = siteSettings[0]?.description || 'Default Site Description';

    // Fetch events
    const events = await runQuery('SELECT * FROM events WHERE status = "published" ORDER BY event_date ASC');

    // Fetch bookings for the logged-in user
    const bookings = await runQuery('SELECT * FROM bookings WHERE user_id = ?', [userId]);

    // Create a booking map to link events with booking IDs
    const bookingMap = {};
    bookings.forEach(booking => {
      bookingMap[booking.event_id] = booking;
    });

    // Render the attendee-home template and pass the user and event data
    res.render('attendee-home', { 
      events, 
      bookingMap,
      siteName, 
      siteDescription, 
      user: user[0] // Pass the complete user object to the template
    });
  } catch (err) {
    console.error('Error loading attendee home:', err);
    res.status(500).send('Error loading events.');
  }
});


// Attendee Event Page
router.get('/event/:id', async (req, res) => {
  const eventId = req.params.id;

  try {
    // Fetch the event details from the database
    const event = await runQuery('SELECT * FROM events WHERE event_id = ?', [eventId]);

    if (event.length === 0) {
      return res.status(404).send('Event not found');
    }

    res.render('attendee-event', { event: event[0] });
  } catch (err) {
    console.error('Error loading attendee event page:', err);
    res.status(500).send('Error loading attendee event page');
  }
});

router.get('/book-event/:id', async (req, res) => {
  const eventId = req.params.id;

  try {
    const event = await runQuery('SELECT * FROM events WHERE event_id = ?', [eventId]);

    if (!event.length) {
      return res.status(404).send('Event not found');
    }

    res.render('book-event', { event: event[0] });
  } catch (err) {
    console.error('Error fetching event details:', err);
    res.status(500).send('Error loading event details.');
  }
});




// Handle Booking Submission
router.post('/book-event/:id', async (req, res) => {
  const eventId = req.params.id;
  const { full_price, concession } = req.body;
  const userId = req.session.user?.id;

  if (!userId) {
    return res.redirect('/login');
  }

  try {
    // Fetch user details
    const user = await runQuery('SELECT user_name FROM users WHERE user_id = ?', [userId]);
    if (!user.length) {
      return res.status(404).send('User not found');
    }

    const userName = user[0].user_name;

    // Fetch event details
    const event = await runQuery('SELECT * FROM events WHERE event_id = ?', [eventId]);
    if (!event.length) {
      return res.status(404).send('Event not found');
    }

    // Check ticket availability
    if (full_price > event[0].full_price_tickets || concession > event[0].concession_tickets) {
      return res.status(400).send('Not enough tickets available');
    }

    // Insert booking into the database
    await runQuery(
      'INSERT INTO bookings (event_id, user_id, user_name, full_price_tickets, concession_tickets) VALUES (?, ?, ?, ?, ?)',
      [eventId, userId, userName, full_price || 0, concession || 0]
    );

    // Update event ticket counts
    await runQuery(
      'UPDATE events SET full_price_tickets = full_price_tickets - ?, concession_tickets = concession_tickets - ? WHERE event_id = ?',
      [full_price || 0, concession || 0, eventId]
    );

    res.redirect('/attendee');
  } catch (err) {
    console.error('Error booking ticket:', err);
    res.status(500).send('Error booking ticket.');
  }
});


router.get('/tickets', async (req, res) => {
  const userId = req.session.user?.id;

  if (!userId) {
    return res.redirect('/login'); // Redirect to login if the user is not logged in
  }

  try {
    // Fetch the user's bookings
    const bookings = await runQuery(
      `SELECT b.booking_id, b.full_price_tickets, b.concession_tickets, b.booking_date, 
              e.title AS event_title, e.event_date, e.location, e.image
       FROM bookings b
       JOIN events e ON b.event_id = e.event_id
       WHERE b.user_id = ?
       ORDER BY b.booking_date DESC`,
      [userId]
    );

    res.render('tickets', { bookings });
  } catch (err) {
    console.error('Error fetching tickets:', err);
    res.status(500).send('Error loading tickets.');
  }
});



module.exports = router;

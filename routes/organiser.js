const express = require('express');
const router = express.Router();
const db = require('../db');
const { runQuery } = require('../db');

const multer = require('multer');
const path = require('path');

// Set up Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/uploads/events')); // Upload directory
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}-${file.originalname}`); // Unique file name
  },
});

// Multer middleware
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png|gif/;
    const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = fileTypes.test(file.mimetype);

    if (extName && mimeType) {
      return cb(null, true);
    } else {
      cb('Error: Images only!');
    }
  },
});

// Organiser Page Route
router.get('/', async (req, res) => {
  const userId = req.session.user?.id;

  if (!userId) {
    return res.redirect('/login'); // Redirect to login if the user is not logged in
  }

  try {
    // Fetch user details
    const user = await runQuery('SELECT * FROM users WHERE user_id = ?', [userId]);
    if (!user.length) {
      return res.status(404).send('User not found');
    }

    // Fetch site settings
    const siteSettings = await runQuery('SELECT * FROM site_settings LIMIT 1');
    if (!siteSettings.length) {
      return res.status(404).send('Site settings not found');
    }

    // Fetch other data as needed
    const draftEvents = await runQuery('SELECT * FROM events WHERE status = "draft" ORDER BY created_at DESC');
    const publishedEvents = await runQuery('SELECT * FROM events WHERE status = "published" ORDER BY created_at DESC');

    // Render the organiser home page
    res.render('organiser-home', {
      user: user[0],
      siteName: siteSettings[0].name,
      siteDescription: siteSettings[0].description,
      draftEvents,
      publishedEvents
    });
  } catch (err) {
    console.error('Error loading organiser home page:', err);
    res.status(500).send('Error loading organiser home page.');
  }
});



// Route to render the Create Event page
router.get('/create-event', (req, res) => {
  res.render('create-event'); // Renders the updated Create Event page
});

// Route to handle Create Event form submission
router.post('/create-event', upload.single('image'), async (req, res) => {
  const {
    title,
    description,
    event_date,
    location,
    full_price_tickets,
    full_price_cost,
    concession_tickets,
    concession_cost,
    status,
  } = req.body;

  const imagePath = req.file ? `/public/uploads/${req.file.filename}` : null; // Get uploaded image path

  try {
    // Insert event into database
    await runQuery(
      `INSERT INTO events (
        title, 
        description, 
        event_date, 
        location, 
        image, 
        full_price_tickets, 
        full_price_cost, 
        concession_tickets, 
        concession_cost, 
        status, 
        created_at, 
        user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)`,
      [
        title,
        description,
        event_date,
        location,
        imagePath,
        full_price_tickets,
        full_price_cost,
        concession_tickets,
        concession_cost,
        status,
        req.session.user.id, // Assuming user ID is stored in session
      ]
    );

    res.redirect('/organiser'); // Redirect back to Organizer Home
  } catch (err) {
    console.error('Error creating event:', err);
    res.status(500).send('Error creating event');
  }
});


router.get('/view-event/:id', async (req, res) => {
  const eventId = req.params.id;

  try {
    // Fetch the event details
    const event = await runQuery('SELECT * FROM events WHERE event_id = ?', [eventId]);

    if (!event.length) {
      return res.status(404).send('Event not found');
    }

    res.render('view-event', { event: event[0] }); // Render the event details page
  } catch (err) {
    console.error('Error fetching event details:', err);
    res.status(500).send('Error loading event details.');
  }
});



router.get('/edit-event/:id', async (req, res) => {
  const eventId = req.params.id;

  try {
    // Fetch the event from the database
    const event = await runQuery('SELECT * FROM events WHERE event_id = ?', [eventId]);

    if (event.length === 0) {
      return res.status(404).send('Event not found');
    }

    // Render the edit-event template and pass the event data
    res.render('edit-event', { event: event[0] });
  } catch (err) {
    console.error('Error fetching event for editing:', err);
    res.status(500).send('Error loading event for editing');
  }
});


// Handle Edit Event Form Submission
router.post('/edit-event/:id', upload.single('image'), async (req, res) => {
  const eventId = req.params.id;
  const { title, description, full_price_tickets, full_price_cost, concession_tickets, concession_cost } = req.body;
  const image = req.file ? `/uploads/events/${req.file.filename}` : null;

  try {
    await runQuery(`
      UPDATE events 
      SET title = ?, description = ?, full_price_tickets = ?, full_price_cost = ?, 
          concession_tickets = ?, concession_cost = ?, image = COALESCE(?, image)
      WHERE event_id = ?
    `, [title, description, full_price_tickets, full_price_cost, concession_tickets, concession_cost, image, eventId]);

    res.redirect('/organiser');
  } catch (err) {
    console.error('Error updating event:', err);
    res.status(500).send('Error updating event.');
  }
});



// Publish Event Route
router.get('/publish-event/:id', async (req, res) => {
  const eventId = req.params.id;
  await runQuery('UPDATE events SET status = "published", published_at = CURRENT_TIMESTAMP WHERE event_id = ?', [eventId]);
  res.redirect('/organiser');
});

router.post('/publish-event/:id', async (req, res) => {
  const eventId = req.params.id;

  try {
    await runQuery('UPDATE events SET status = "published", published_at = CURRENT_TIMESTAMP WHERE event_id = ?', [eventId]);
    res.redirect('/organiser');
  } catch (err) {
    console.error('Error publishing event:', err);
    res.status(500).send('Error publishing event.');
  }
});


// Delete Event API
router.get('/delete-event/:id', async (req, res) => {
  const eventId = req.params.id;
  await runQuery('DELETE FROM events WHERE event_id = ?', [eventId]);
  res.redirect('/organiser');
});

router.post('/delete-event/:id', async (req, res) => {
  const eventId = req.params.id;

  try {
    await runQuery('DELETE FROM events WHERE event_id = ?', [eventId]);
    res.redirect('/organiser');
  } catch (err) {
    console.error('Error deleting event:', err);
    res.status(500).send('Error deleting event.');
  }
});


// View All Bookings
router.get('/bookings', async (req, res) => {
  try {
    const bookings = await runQuery(
      `SELECT b.booking_id, b.user_name, b.full_price_tickets, b.concession_tickets, b.booking_date, 
              e.title AS event_title 
       FROM bookings b 
       JOIN events e ON b.event_id = e.event_id`
    );

    res.render('organiser-bookings', { bookings });
  } catch (err) {
    console.error('Error loading bookings:', err);
    res.status(500).send('Error loading bookings');
  }
});


router.get('/all-bookings', async (req, res) => {
  try {
    // Fetch all bookings
    const bookings = await runQuery(`
      SELECT 
        b.booking_id, 
        b.event_id, 
        e.title AS event_title, 
        b.user_name, 
        b.full_price_tickets, 
        b.concession_tickets, 
        b.booking_date, 
        b.qr_code 
      FROM bookings b
      JOIN events e ON b.event_id = e.event_id
      ORDER BY b.booking_date DESC
    `);

    res.render('organiser-all-bookings', { bookings });
  } catch (err) {
    console.error('Error fetching bookings:', err);
    res.status(500).send('Error fetching bookings.');
  }
});


// Render Site Settings Page
router.get('/settings', async (req, res) => {
  try {
    // Fetch current site settings from the database
    const siteSettings = await runQuery('SELECT * FROM site_settings LIMIT 1');

    // Render the site settings page with current settings
    res.render('site-settings', {
      siteName: siteSettings.length > 0 ? siteSettings[0].name : '',
      siteDescription: siteSettings.length > 0 ? siteSettings[0].description : '',
    });
  } catch (err) {
    console.error('Error loading site settings page:', err);
    res.status(500).send('Error loading site settings page');
  }
});

// Handle Site Settings Form Submission
router.post('/settings', async (req, res) => {
  const { name, description } = req.body;

  try {
    // Update site settings in the database
    await runQuery('UPDATE site_settings SET name = ?, description = ? WHERE id = 1', [name, description]);

    // Redirect back to the organiser home page
    res.redirect('/organiser');
  } catch (err) {
    console.error('Error updating site settings:', err);
    res.status(500).send('Error updating site settings.');
  }
});


router.get('/profile/view', async (req, res) => {
  const userId = req.session.user?.id;

  try {
    const user = await runQuery('SELECT * FROM users WHERE user_id = ?', [userId]);
    if (!user.length) {
      return res.status(404).send('User not found');
    }

    res.render('profile-view', { user: user[0] });
  } catch (err) {
    console.error('Error loading profile:', err);
    res.status(500).send('Error loading profile.');
  }
});


router.get('/profile/edit', async (req, res) => {
  const userId = req.session.user?.id;

  try {
    const user = await runQuery('SELECT * FROM users WHERE user_id = ?', [userId]);
    if (!user.length) {
      return res.status(404).send('User not found');
    }

    res.render('profile-edit', { user: user[0] });
  } catch (err) {
    console.error('Error loading profile for edit:', err);
    res.status(500).send('Error loading profile.');
  }
});

router.post('/profile/edit', async (req, res) => {
  const userId = req.session.user?.id;
  const { user_name, username, phone } = req.body;

  try {
    await runQuery('UPDATE users SET user_name = ?, username = ?, phone = ? WHERE user_id = ?', [
      user_name,
      username,
      phone,
      userId,
    ]);

    res.redirect('/profile/view');
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).send('Error updating profile.');
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Error logging out:', err);
      return res.status(500).send('Error logging out.');
    }
    res.redirect('/login');
  });
});


module.exports = router;

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { runQuery } = require('../db');
const { v4: uuidv4 } = require('uuid'); // For generating unique IDs
const multer = require('multer');


// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: './public/uploads/profile-images',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  },
});
const upload = multer({ storage });


// Render Login Page
router.get('/login', async (req, res) => {
  try {
    const siteSettings = await runQuery('SELECT name, description FROM site_settings LIMIT 1');

    const siteName = siteSettings[0]?.name || 'Default Site Name';
    const siteDescription = siteSettings[0]?.description || 'Default Site Description';

    res.render('login', { siteName, siteDescription, error: null });
  } catch (err) {
    console.error('Error fetching site settings:', err);
    res.status(500).send('Error loading login page.');
  }
});
  
// Handle Login Submission
router.post('/login', async (req, res) => {
    console.log('Session Object:', req.session); // Debug log
    const { username, password } = req.body;
  
    try {
      // Fetch user by username
      const users = await runQuery('SELECT * FROM users WHERE username = ?', [username]);
      if (users.length === 0) {
        return res.render('login', { error: 'Invalid username or password' });
      }
  
      const user = users[0];
  
      // Compare the entered password with the hashed password
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.render('login', { error: 'Invalid username or password' });
      }
  
      // Store user session
      req.session.user = { id: user.user_id, role: user.role };
      console.log('User logged in:', req.session.user);
  
      // Redirect based on role
      if (user.role === 'organiser') {
        res.redirect('/organiser');
      } else if (user.role === 'attendee') {
        res.redirect('/attendee');
      }
    } catch (err) {
      console.error('Error during login:', err);
      res.status(500).send('Internal Server Error');
    }
  });

  // Render the registration page
router.get('/register', async (req, res) => {
  try {
    const siteSettings = await runQuery('SELECT name, description FROM site_settings LIMIT 1');

    const siteName = siteSettings[0]?.name || 'Default Site Name';
    const siteDescription = siteSettings[0]?.description || 'Default Site Description';

    res.render('register', { siteName, siteDescription, error: null });
  } catch (err) {
    console.error('Error fetching site settings:', err);
    res.status(500).send('Error loading login page.');
  }
});

 // Handle Registration
 router.post('/register', upload.single('profile_image'), async (req, res) => {
  const { user_name, username, phone, password, confirmPassword, role } = req.body;
  const profileImage = req.file ? `/public/uploads/profile-images/${req.file.filename}` : null;

  if (password !== confirmPassword) {
    return res.render('register', { error: 'Passwords do not match' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const uniqueId = uuidv4(); // Generate a unique attendee ID
    const query = `
      INSERT INTO users (unique_attendee_id, user_name, username, phone, password, role, profile_image)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    await runQuery(query, [uniqueId, user_name, username, phone, hashedPassword, role, profileImage]);

    res.redirect('/login'); // Redirect to login page after successful registration
  } catch (err) {
    console.error('Error during registration:', err);
    res.status(500).send('Error during registration. Please try again.');
  }
});
  
// Logout Route
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

module.exports = router;

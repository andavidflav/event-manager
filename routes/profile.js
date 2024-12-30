const express = require('express');
const router = express.Router();
const { runQuery } = require('../db');

router.get('/view', async (req, res) => {
  const userId = req.session.user?.id;

  if (!userId) {
    return res.redirect('/login'); // Redirect to login if the user is not logged in
  }

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

router.get('/edit', async (req, res) => {
    const userId = req.session.user?.id;
  
    if (!userId) {
      return res.redirect('/login'); // Redirect to login if the user is not logged in
    }
  
    try {
      const user = await runQuery('SELECT * FROM users WHERE user_id = ?', [userId]);
  
      if (!user.length) {
        return res.status(404).send('User not found');
      }
  
      res.render('profile-edit', { user: user[0] });
    } catch (err) {
      console.error('Error loading profile for edit:', err);
      res.status(500).send('Error loading profile for edit.');
    }
  });
  

router.post('/edit', async (req, res) => {
    const userId = req.session.user?.id;
    const { user_name, username, phone } = req.body;
  
    if (!userId) {
      return res.redirect('/login'); // Redirect to login if the user is not logged in
    }
  
    try {
      await runQuery('UPDATE users SET user_name = ?, username = ?, phone = ? WHERE user_id = ?', [
        user_name,
        username,
        phone,
        userId,
      ]);
  
      res.redirect('/profile/view'); // Redirect to the profile view page after saving changes
    } catch (err) {
      console.error('Error updating profile:', err);
      res.status(500).send('Error updating profile.');
    }
  });



  router.get('/viewattendee', async (req, res) => {
    const userId = req.session.user?.id;
  
    if (!userId) {
      return res.redirect('/login'); // Redirect to login if the user is not logged in
    }
  
    try {
      const user = await runQuery('SELECT * FROM users WHERE user_id = ?', [userId]);
      if (!user.length) {
        return res.status(404).send('User not found');
      }
  
      res.render('profile-view-attendee', { user: user[0] });
    } catch (err) {
      console.error('Error loading profile:', err);
      res.status(500).send('Error loading profile.');
    }
  });
  
  router.get('/editattendee', async (req, res) => {
      const userId = req.session.user?.id;
    
      if (!userId) {
        return res.redirect('/login'); // Redirect to login if the user is not logged in
      }
    
      try {
        const user = await runQuery('SELECT * FROM users WHERE user_id = ?', [userId]);
    
        if (!user.length) {
          return res.status(404).send('User not found');
        }
    
        res.render('profile-edit-attendee', { user: user[0] });
      } catch (err) {
        console.error('Error loading profile for edit:', err);
        res.status(500).send('Error loading profile for edit.');
      }
    });
  

  router.get('/editattendee', async (req, res) => {
    const userId = req.session.user?.id;
  
    if (!userId) {
      return res.redirect('/login'); // Redirect to login if the user is not logged in
    }
  
    try {
      const user = await runQuery('SELECT * FROM users WHERE user_id = ?', [userId]);
  
      if (!user.length) {
        return res.status(404).send('User not found');
      }
  
      res.render('profile-edit-attendee', { user: user[0] });
    } catch (err) {
      console.error('Error loading profile for edit:', err);
      res.status(500).send('Error loading profile for edit.');
    }
  });
  

router.post('/editattendee', async (req, res) => {
    const userId = req.session.user?.id;
    const { user_name, username, phone } = req.body;
  
    if (!userId) {
      return res.redirect('/login'); // Redirect to login if the user is not logged in
    }
  
    try {
      await runQuery('UPDATE users SET user_name = ?, username = ?, phone = ? WHERE user_id = ?', [
        user_name,
        username,
        phone,
        userId,
      ]);
  
      res.redirect('/profile/viewattendee'); // Redirect to the profile view page after saving changes
    } catch (err) {
      console.error('Error updating profile:', err);
      res.status(500).send('Error updating profile.');
    }
  });

module.exports = router;

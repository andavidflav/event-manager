// /**
// * index.js
// * This is your main app entry point
// */

// // Set up express, bodyparser and EJS
// const session = require('express-session');
// const express = require('express');
// const app = express();
// const port = 3000;
// const path = require('path');
// var bodyParser = require("body-parser");
// app.use(express.urlencoded({ extended: true }));
// app.use(express.json());
// app.use(bodyParser.urlencoded({ extended: true }));
// app.set('view engine', 'ejs'); // set the app to use ejs for rendering
// app.use(express.static(__dirname + '/public')); // set location of static files

// // Set up SQLite
// // Items in the global namespace are accessible throught out the node application
// const sqlite3 = require('sqlite3').verbose();
// global.db = new sqlite3.Database('./database.db',function(err){
//     if(err){
//         console.error(err);
//         process.exit(1); // bail out we can't connect to the DB
//     } else {
//         console.log("Database connected");
//         global.db.run("PRAGMA foreign_keys=ON"); // tell SQLite to pay attention to foreign key constraints
//     }
// });

// // Handle requests to the home page 
// app.get('/', (req, res) => {
//     res.render('home');
//   });
  

// // Add all the route handlers in usersRoutes to the app under the path /users
// const usersRoutes = require('./routes/users');
// app.use('/users', usersRoutes);

// const attendeeRoutes = require('./routes/attendee');
// app.use('/attendee', attendeeRoutes);

// const organiserRoutes = require('./routes/organiser');
// // Middleware for serving static files
// app.use('/public', express.static('public'));

// // Use Organiser Routes
// app.use('/organiser', organiserRoutes);

// // Middleware for parsing application/x-www-form-urlencoded
// app.use(express.urlencoded({ extended: true }));

// // Middleware for parsing JSON data (if needed)
// app.use(express.json());

// // Set views directory and engine
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'ejs');
// app.use('/public', express.static(path.join(__dirname, 'public')));

// const authRoutes = require('./routes/auth');
// app.use('/', authRoutes); // Registers routes from auth.js at the root level


// const bcrypt = require('bcrypt');

// // Middleware for parsing request bodies
// app.use(express.urlencoded({ extended: true }));
// app.use(express.json());

// // Middleware for sessions
// app.use(
//   session({
//     secret: 'your-secret-key',
//     resave: false,
//     saveUninitialized: true,
//     cookie: { secure: false }, // Set to true for HTTPS
//   })
// );

// const authMiddleware = require('./middleware/auth');
// app.use('/organiser', authMiddleware.ensureAuthenticated, organiserRoutes);
// app.use('/attendee', authMiddleware.ensureAuthenticated, attendeeRoutes);



// // Make the web application listen for HTTP requests
// app.listen(port, () => {
//     console.log(`Example app listening on port ${port}`)
// })

/**
 * index.js
 * This is your main app entry point
 */

const session = require('express-session');
const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const bodyParser = require("body-parser");

// Initialize Express App
const app = express();
const port = 3000;

// Configure Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Configure EJS as View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Configure SQLite
const sqlite3 = require('sqlite3').verbose();
global.db = new sqlite3.Database('./database.db', function (err) {
    if (err) {
        console.error(err);
        process.exit(1); // Bail out if DB connection fails
    } else {
        console.log("Database connected");
        global.db.run("PRAGMA foreign_keys=ON"); // Enable foreign key constraints
    }
});


const {runQuery} = require('./db'); // Adjust the path as needed

app.get('/', async (req, res) => {
  try {
    const siteSettings = await runQuery('SELECT name, description FROM site_settings LIMIT 1');

    if (siteSettings.length === 0) {
      return res.render('home', {
        siteName: 'Default Site Name', // Default fallback if the database is empty
        siteDescription: 'Default Site Description',
      });
    }

    res.render('home', {
      siteName: siteSettings[0].name,
      siteDescription: siteSettings[0].description,
    });
  } catch (err) {
    console.error('Error fetching site settings:', err);
    res.status(500).send('Error loading home page.');
  }
});

// Configure Session Middleware (must come before routes)
app.use(
    session({
        secret: 'your-secret-key',
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false }, // Set to true for HTTPS
    })
);

// Routes
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const attendeeRoutes = require('./routes/attendee');
const organiserRoutes = require('./routes/organiser');
const authMiddleware = require('./middleware/auth');
const bookingRoutes = require('./routes/bookings');
const profileRoutes = require('./routes/profile'); // Adjust the path as needed



// Register Routes
app.use('/', authRoutes); // Authentication routes
app.use('/users', usersRoutes); // User management routes
app.use('/attendee', authMiddleware.ensureAuthenticated, attendeeRoutes); // Attendee routes (protected)
app.use('/organiser', authMiddleware.ensureAuthenticated, organiserRoutes); // Organiser routes (protected)
app.use('/bookings', bookingRoutes);
app.use('/profile', profileRoutes);
// Serve static files from the 'public/uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
// Handle Home Page
app.get('/', (req, res) => {
    res.render('home');
});

// Start the Server
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});

-- Enable foreign key constraints
PRAGMA foreign_keys=ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    unique_attendee_id TEXT UNIQUE,
    user_name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    password TEXT NOT NULL,
    profile_image TEXT DEFAULT NULL,
    role TEXT NOT NULL CHECK (role IN ('organiser', 'attendee'))
);


CREATE TABLE IF NOT EXISTS email_accounts (
    email_account_id INTEGER PRIMARY KEY AUTOINCREMENT,
    email_address TEXT NOT NULL,
    user_id INT,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS events (
    event_id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    full_price_tickets INTEGER DEFAULT 0,
    full_price_cost REAL DEFAULT 0.0,
    concession_tickets INTEGER DEFAULT 0,
    concession_cost REAL DEFAULT 0.0,
    status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'canceled', 'archived')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    modified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    event_date DATETIME, -- Optional: To store the actual event date
    image TEXT,          -- Optional: To store event image URL or path
    location TEXT,       -- Optional: To store event location
    full_price_sold INTEGER DEFAULT 0, -- Optional: Full-price tickets sold
    concession_sold INTEGER DEFAULT 0, -- Optional: Concession tickets sold
    user_id INT,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);


CREATE TABLE IF NOT EXISTS bookings (
    booking_id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    user_name TEXT NOT NULL,
    user_id INTEGER NOT NULL, -- Added this column
    full_price_tickets INTEGER DEFAULT 0,
    concession_tickets INTEGER DEFAULT 0,
    qr_code TEXT, -- To store the QR code data
    booking_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(event_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);



CREATE TABLE IF NOT EXISTS site_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL
);




COMMIT;

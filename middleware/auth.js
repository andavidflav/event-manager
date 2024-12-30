module.exports = {
    /**
     * Middleware to ensure the user is authenticated.
     * If the user is not logged in, they will be redirected to the login page.
     */
    ensureAuthenticated: (req, res, next) => {
      if (req.session && req.session.user) {
        // User is logged in, proceed to the next middleware or route
        return next();
      }
      // User is not logged in, redirect to login page
      res.redirect('/login');
    },
  
    /**
     * Middleware to ensure the user is a guest.
     * If the user is already logged in, they will be redirected based on their role.
     */
    ensureGuest: (req, res, next) => {
      if (req.session && req.session.user) {
        // Redirect authenticated users based on their role
        if (req.session.user.role === 'organiser') {
          return res.redirect('/organiser');
        }
        if (req.session.user.role === 'attendee') {
          return res.redirect('/attendee');
        }
      }
      // User is not logged in, proceed to the next middleware or route
      next();
    },
  };
  
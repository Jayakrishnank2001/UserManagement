const express = require("express");
const session = require("express-session");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const nocache = require("nocache");
const router = express.Router();
const User = require("./db");

router.get('/signup', (req, res) => {
  res.render('signup');
});
router.get('/login', (req, res) => {
  if (req.session.user) {
    if (req.session.user.isAdmin) {
      return res.redirect('/route/admin');
    } else {
      return res.redirect('/route/dashboard');
    }
  }
  res.render('base');
});
// Middleware to check if the user is authenticated
const authenticateUser = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/route/login');
  }
}
// Middleware to check if the user is authenticated as an admin
const isAdminUser = (req, res, next) => {
  if (req.session.user && req.session.user.isAdmin) {
    next();
  } else {
    res.redirect('/route/login');
  }
}
// Route for admin panel
router.get('/admin', isAdminUser, async (req, res) => {
  try {
    const allUsers = await User.find();
    console.log("Admin Panel Access:", req.session.user);
    res.render('admin', { allUsers });
  } catch (error) {
    res.render('admin', { errorMessage: 'Error fetching users' }); }
});
// Route to update user role (Make a user admin or non-admin)
router.post('/admin/update-role/:id', isAdminUser, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    user.isAdmin = !user.isAdmin; // Toggle the admin role
    await user.save();
    res.redirect('/route/admin');
  } catch (error) {
    res.render('admin', { errorMessage: 'Error updating user role' });
  }
});
// Route to update user data (submit edited data)
router.post('/admin/edit/:id', isAdminUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, isAdmin } = req.body;
    // Check if the user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    // Update the user data
    user.username = username;
    user.email = email;
    user.isAdmin = isAdmin === 'on'; // Assuming 'isAdmin' comes as a checkbox value, convert it to a boolean
    await user.save();
    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Error updating user' });
  }
});
//Route for delete user
router.post('/admin/delete/:userId', isAdminUser, async (req, res) => {
  const userId = req.params.userId;
  try {
    // Using deleteOne method:
    const deletedUser = await User.deleteOne({ _id: userId });
    if (deletedUser.deletedCount === 1) {
      res.json({ message: 'User deleted successfully' });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Error deleting user' });
  }
});
// Home route (signup/login)
router.get('/', nocache(), (req, res) => {
  if (req.session.user) {
    // User is already logged in, redirect to the dashboard
    return res.redirect('/route/dashboard');
  }
  var string = req.query.valid;
  res.render('base', { title: "Login System", err: string });
});
// Signup user
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (password.length < 6) {
      const errorMessage = 'Password must be at least 6 characters long.';
      console.log(errorMessage); 
      return res.render('signup', { errorMessage });
    }
    const newUser = new User({ username, email, password });
    await newUser.save();
    if (req.session.user && req.session.user.isAdmin) {
      return res.redirect('/route/admin');
    }
    res.redirect('/route/login');
  } catch (error) {
    res.render('signup', { errorMessage: 'Error creating user' });
  }
});
// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
    if (user) {
      req.session.user = user;
      if (user.isAdmin) {
        // If the user is an admin, redirect to the admin panel
        return res.redirect('/route/admin');
      } else{
        // If the user is a regular user, redirect to the dashboard
        return res.redirect('/route/dashboard');
      }
    } else {
      res.render('base', { title: 'Login System', errorMessage: 'Invalid Username or Password' });
    }
  } catch (error) {
    res.render('base', { title: 'Login System', errorMessage: 'Error during login' });
  }
});
// Route for dashboard
router.get('/dashboard', authenticateUser, (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.render('dashboard', { user: req.session.user });
});
// Route for logout
router.get('/logout', (req, res) => {
  req.session.destroy(function (err) {
    if (err) {
      console.log(err);
      res.send("Error");
    } else {
      res.render('base', { title: "Express", logout: "Logout Successfully...!" });
    }
  });
});

module.exports = router;

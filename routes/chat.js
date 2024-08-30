const express = require('express');
const router = express.Router();

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
};

// Get chat page
router.get('/', isAuthenticated, (req, res) => {
    res.render('chat');
});

module.exports = router;
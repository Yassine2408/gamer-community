const express = require('express');
const passport = require('passport');
const User = require('../models/User');

const router = express.Router();

router.post('/register', (req, res) => {
    User.register(new User({ username: req.body.username, email: req.body.email }), req.body.password, (err, user) => {
        if (err) {
            return res.render('register', { error: err.message });
        }
        passport.authenticate('local')(req, res, () => {
            res.redirect('/profile');
        });
    });
});

router.post('/login', (req, res, next) => {
    console.log('Login attempt');
    passport.authenticate('local', (err, user, info) => {
        console.log('Passport authenticate callback');
        if (err) {
            console.error('Authentication error:', err);
            return next(err);
        }
        if (!user) {
            console.log('Authentication failed');
            return res.redirect('/login');
        }
        req.logIn(user, (err) => {
            if (err) {
                console.error('Login error:', err);
                return next(err);
            }
            console.log('User logged in successfully');
            return res.redirect('/profile');
        });
    })(req, res, next);
});

router.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.redirect('/');
    });
});

module.exports = router;
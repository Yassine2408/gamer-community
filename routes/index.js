const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Game = require('../models/Game');
const Comment = require('../models/Comment');
const Suggestion = require('../models/Suggestion');
const rawgApi = require('../utils/rawgApi');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    console.log('isAuthenticated middleware called');
    console.log('User authenticated:', req.isAuthenticated());
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
};

// Middleware to make user available to all views
router.use((req, res, next) => {
    res.locals.user = req.user;
    next();
});

// Home page route
router.get('/', async (req, res) => {
    try {
        const highRatedGames = await rawgApi.getGames(1, 10, '-rating');
        res.render('index', { highRatedGames: highRatedGames.results });
    } catch (err) {
        console.error('Error fetching high-rated games:', err);
        res.render('index', { highRatedGames: [] });
    }
});

// Login page route
router.get('/login', (req, res) => {
    res.render('login');
});

// Register page route
router.get('/register', (req, res) => {
    res.render('register');
});

// Profile page route
router.get('/profile', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('suggestions');
        const gamesRated = await Game.countDocuments({ 'ratings.user': user._id });
        const reviewsWritten = await Comment.countDocuments({ user: user._id });
        const suggestionsMade = user.suggestions.length;
        
        const recentActivity = await Promise.all([
            Comment.find({ user: user._id }).sort('-createdAt').limit(5).populate('game'),
            Suggestion.find({ user: user._id }).sort('-createdAt').limit(5),
            Game.find({ 'ratings.user': user._id }).sort('-ratings.createdAt').limit(5)
        ]);

        res.render('profile', { 
            user,
            gamesRated,
            reviewsWritten,
            suggestionsMade,
            recentActivity: recentActivity.flat().sort((a, b) => b.createdAt - a.createdAt).slice(0, 5)
        });
    } catch (err) {
        console.error('Error fetching profile data:', err);
        res.status(500).render('error', { error: 'An error occurred while fetching your profile data' });
    }
});

// Update profile route
router.post('/profile/update', isAuthenticated, async (req, res) => {
    try {
        const { bio, favoriteGame, favoriteGenres, preferredPlatform, averageGamingTime } = req.body;
        const user = await User.findById(req.user._id);
        
        user.bio = bio;
        user.favoriteGame = favoriteGame;
        user.favoriteGenres = favoriteGenres.split(',').map(genre => genre.trim());
        user.preferredPlatform = preferredPlatform;
        user.averageGamingTime = averageGamingTime;

        await user.save();
        res.redirect('/profile');
    } catch (err) {
        console.error('Error updating profile:', err);
        res.status(500).render('error', { error: 'An error occurred while updating your profile' });
    }
});

module.exports = router;
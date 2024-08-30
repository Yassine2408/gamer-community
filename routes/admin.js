const express = require('express');
const router = express.Router();
const Game = require('../models/Game');
const User = require('../models/User');
const Comment = require('../models/Comment');
const Suggestion = require('../models/Suggestion');

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
    if (req.isAuthenticated() && req.user.isAdmin) {
        return next();
    }
    res.status(403).json({ message: 'Access denied' });
};

// Admin dashboard
router.get('/', isAdmin, async (req, res) => {
    try {
        const users = await User.countDocuments();
        const games = await Game.countDocuments();
        const comments = await Comment.countDocuments();
        const suggestions = await Suggestion.countDocuments();
        res.render('admin/dashboard', { users, games, comments, suggestions });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Manage users
router.get('/users', isAdmin, async (req, res) => {
    try {
        const users = await User.find();
        res.render('admin/users', { users });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Manage games
router.get('/games', isAdmin, async (req, res) => {
    try {
        const games = await Game.find();
        res.render('admin/games', { games });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Manage comments
router.get('/comments', isAdmin, async (req, res) => {
    try {
        const comments = await Comment.find().populate('user game');
        res.render('admin/comments', { comments });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete a comment
router.delete('/comments/:id', isAdmin, async (req, res) => {
    try {
        await Comment.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Comment deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
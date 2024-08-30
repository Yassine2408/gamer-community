const express = require('express');
const router = express.Router();
const rawgApi = require('../utils/rawgApi');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
};

// Get all games
router.get('/', async (req, res) => {
    try {
        console.log('Fetching games from RAWG API');
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 20;
        const gamesData = await rawgApi.getGames(page, pageSize);
        console.log('Games data received:', JSON.stringify(gamesData, null, 2));
        res.render('games', { games: gamesData.results, user: req.user });
    } catch (err) {
        console.error('Error fetching games:', err);
        res.status(500).render('error', { 
            error: 'An error occurred while fetching games', 
            details: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});

// Search games
router.get('/search', async (req, res) => {
    try {
        const query = req.query.q;
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 20;
        const gamesData = await rawgApi.searchGames(query, page, pageSize);
        res.render('games', { games: gamesData.results, user: req.user, searchQuery: query });
    } catch (err) {
        console.error('Error searching games:', err);
        res.status(500).render('error', { error: 'An error occurred while searching games' });
    }
});

// Get game details
router.get('/:id', async (req, res) => {
    try {
        const gameId = req.params.id;
        const gameDetails = await rawgApi.getGameDetails(gameId);
        res.render('gameDetails', { game: gameDetails, user: req.user });
    } catch (err) {
        console.error('Error fetching game details:', err);
        res.status(500).render('error', { error: 'An error occurred while fetching game details' });
    }
});

// Add a new game (admin only)
router.post('/', isAuthenticated, async (req, res) => {
    if (!req.user.isAdmin) {
        return res.status(403).json({ message: 'Access denied' });
    }
    const game = new Game(req.body);
    try {
        const newGame = await game.save();
        res.status(201).json(newGame);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Add a comment to a game
router.post('/:id/comments', isAuthenticated, async (req, res) => {
    try {
        const game = await Game.findById(req.params.id);
        const comment = new Comment({
            user: req.user._id,
            game: game._id,
            content: req.body.content
        });
        await comment.save();
        game.comments.push(comment._id);
        await game.save();
        res.status(201).json(comment);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Rate a game
router.post('/:id/rate', isAuthenticated, async (req, res) => {
    try {
        const game = await Game.findById(req.params.id);
        const rating = {
            user: req.user._id,
            rating: req.body.rating
        };
        game.ratings.push(rating);
        game.averageRating = game.ratings.reduce((acc, curr) => acc + curr.rating, 0) / game.ratings.length;
        await game.save();
        res.status(200).json({ message: 'Rating added successfully' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
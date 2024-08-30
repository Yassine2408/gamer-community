const express = require('express');
const router = express.Router();
const Suggestion = require('../models/Suggestion');
const axios = require('axios'); // Make sure to install axios: npm install axios

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
};

// Simple test route
router.get('/test', (req, res) => {
    res.json({ message: 'Suggestions route is working' });
});

// Get all suggestions (render suggestions page)
router.get('/', async (req, res) => {
    try {
        console.log('Fetching suggestions');
        const suggestions = await Suggestion.find().sort('-createdAt').populate('suggestedBy', 'username');
        console.log('Suggestions fetched:', suggestions);
        res.render('suggestions', { suggestions, user: req.user });
    } catch (err) {
        console.error('Error fetching suggestions:', err);
        res.status(500).render('error', { 
            error: 'An error occurred while fetching suggestions',
            details: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : null
        });
    }
});

// Add a new suggestion
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const { gameId } = req.body;
        
        console.log('Received gameId:', gameId);
        
        // Check if gameId is provided
        if (!gameId) {
            throw new Error('Game ID is required');
        }

        // Fetch game details from RAWG API
        const apiKey = process.env.RAWG_API_KEY;
        if (!apiKey) {
            throw new Error('RAWG API key is not set');
        }

        console.log('Fetching game data from RAWG API...');
        const response = await axios.get(`https://api.rawg.io/api/games/${gameId}?key=${apiKey}`);
        const gameData = response.data;
        
        console.log('Game data fetched:', JSON.stringify(gameData, null, 2));

        const newSuggestion = new Suggestion({
            title: gameData.name,
            genre: gameData.genres.map(genre => genre.name).join(', '),
            releaseDate: gameData.released,
            rating: gameData.rating,
            background_image: gameData.background_image,
            suggestedBy: req.user._id
        });

        console.log('New suggestion created:', JSON.stringify(newSuggestion, null, 2));

        await newSuggestion.save();
        console.log('Suggestion saved successfully');
        
        res.status(201).json({ message: 'Suggestion added successfully' });
    } catch (err) {
        console.error('Error adding suggestion:', err);
        console.error('Error stack:', err.stack);
        res.status(500).json({ 
            error: 'An error occurred while adding the suggestion',
            details: err.message,
            stack: err.stack
        });
    }
});

// Delete a suggestion
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const suggestion = await Suggestion.findById(req.params.id);
        
        if (!suggestion) {
            return res.status(404).json({ message: 'Suggestion not found' });
        }
        
        if (suggestion.suggestedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You can only delete your own suggestions' });
        }
        
        await Suggestion.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Suggestion deleted successfully' });
    } catch (err) {
        console.error('Error deleting suggestion:', err);
        res.status(500).json({ 
            error: 'An error occurred while deleting the suggestion',
            details: err.message
        });
    }
});

// Add these routes after the existing routes

// Upvote a suggestion
router.post('/:id/upvote', isAuthenticated, async (req, res) => {
    try {
        const suggestion = await Suggestion.findById(req.params.id);
        if (!suggestion) {
            return res.status(404).json({ message: 'Suggestion not found' });
        }

        const upvoteIndex = suggestion.upvotes.indexOf(req.user._id);
        if (upvoteIndex === -1) {
            suggestion.upvotes.push(req.user._id);
        } else {
            suggestion.upvotes.splice(upvoteIndex, 1);
        }

        await suggestion.save();
        res.status(200).json({ upvotes: suggestion.upvotes.length });
    } catch (err) {
        console.error('Error upvoting suggestion:', err);
        res.status(500).json({ error: 'An error occurred while upvoting the suggestion' });
    }
});

// Add a comment to a suggestion
router.post('/:id/comment', isAuthenticated, async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ message: 'Comment text is required' });
        }

        const suggestion = await Suggestion.findById(req.params.id);
        if (!suggestion) {
            return res.status(404).json({ message: 'Suggestion not found' });
        }

        suggestion.comments.push({
            user: req.user._id,
            text: text
        });

        await suggestion.save();
        res.status(201).json({ message: 'Comment added successfully' });
    } catch (err) {
        console.error('Error adding comment:', err);
        res.status(500).json({ error: 'An error occurred while adding the comment' });
    }
});

module.exports = router;
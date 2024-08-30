const mongoose = require('mongoose');

const GameSchema = new mongoose.Schema({
    title: { type: String, required: true },
    genre: { type: String, required: true },
    description: String,
    releaseDate: Date,
    averageRating: { type: Number, default: 0 },
    ratings: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, rating: Number }],
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }]
});

module.exports = mongoose.model('Game', GameSchema);
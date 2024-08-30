const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    text: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const SuggestionSchema = new mongoose.Schema({
    title: { type: String, required: true },
    genre: { type: String, default: 'N/A' },
    releaseDate: { type: Date },
    rating: { type: Number },
    background_image: { type: String },
    suggestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    upvotes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    comments: [CommentSchema],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Suggestion', SuggestionSchema);
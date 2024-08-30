const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const UserSchema = new mongoose.Schema({
    username: String,
    email: String,
    bio: String,
    favoriteGame: String,
    favoriteGenres: [String],
    preferredPlatform: String,
    averageGamingTime: String,
    rank: { type: String, default: 'Newcomer' },
    createdAt: { type: Date, default: Date.now },
    suggestions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Suggestion' }]
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);
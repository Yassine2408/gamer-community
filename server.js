require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const User = require('./models/User');
const http = require('http');
const socketIo = require('socket.io');
const suggestionsRouter = require('./routes/suggestions');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
      console.error('Could not connect to MongoDB:', err.message);
      console.error('Full error:', err);
      fs.writeFileSync('mongo_error.log', JSON.stringify(err, null, 2));
      process.exit(1);
  });

// Session middleware
const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET || 'your_fallback_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production' }
});

// Middleware
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

// Passport configuration
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Middleware to make user available to all views
app.use((req, res, next) => {
    res.locals.user = req.user;
    next();
});

// Add this line before your routes
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static('public'));

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/games', require('./routes/games'));
app.use('/api/suggestions', suggestionsRouter);
app.use('/api/admin', require('./routes/admin'));

// Add a catch-all route for undefined routes
app.use((req, res) => {
    res.status(404).send('404 - Not Found');
});

// Chat route with authentication check
app.get('/chat', (req, res) => {
    if (req.isAuthenticated()) {
        res.render('chat');
    } else {
        res.redirect('/login');
    }
});

// Socket.IO middleware to access session data
io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
});

const onlineUsers = new Set();

io.on('connection', (socket) => {
    console.log('A user connected');

    const session = socket.request.session;
    const user = session.passport ? session.passport.user : null;

    socket.on('user connected', (username) => {
        onlineUsers.add(username);
        io.emit('update user list', Array.from(onlineUsers));
    });

    socket.on('chat message', (data) => {
        if (user) {
            io.emit('chat message', {
                message: data.message,
                username: data.username
            });
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
        const username = Array.from(onlineUsers).find(name => socket.id === name);
        if (username) {
            onlineUsers.delete(username);
            io.emit('update user list', Array.from(onlineUsers));
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', { 
        error: 'Something went wrong!', 
        details: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : null
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}).on('error', (err) => {
    console.error('Server failed to start:', err);
    fs.writeFileSync('server_error.log', JSON.stringify(err, null, 2));
    process.exit(1);
});

// Add this at the end of the file
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    fs.writeFileSync('unhandled_rejection.log', JSON.stringify({ reason, promise }, null, 2));
    process.exit(1);
});
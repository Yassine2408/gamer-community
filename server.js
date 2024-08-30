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
const functions = require('firebase-functions');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Connect to MongoDB
mongoose.connect(functions.config().mongodb.uri || process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
      console.error('Could not connect to MongoDB', err);
      process.exit(1);
  });

// Session middleware
const sessionMiddleware = session({
    secret: functions.config().session.secret,
    resave: false,
    saveUninitialized: false
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

// Routes
app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth'));
app.use('/games', require('./routes/games'));
app.use('/suggestions', suggestionsRouter);
app.use('/admin', require('./routes/admin'));

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

const PORT = process.env.PORT || 3001; // Change 3000 to 3001 or another available port
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
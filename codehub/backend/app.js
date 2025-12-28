const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Test Route
app.get('/', (req, res) => res.send('CodeHub API Running'));

// Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/repos', require('./src/routes/repos'));
app.use('/api/admin', require('./src/routes/admin'));
app.use('/api/users', require('./src/routes/users'));
app.use('/api/pull-requests', require('./src/routes/pullRequests'));
app.use('/api/search', require('./src/routes/search'));
app.use('/api/ai', require('./src/routes/ai'));
app.use('/api/reports', require('./src/routes/reports'));

module.exports = app;

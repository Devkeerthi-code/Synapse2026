// server/server.js (minimal runnable version)
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// DB connection
connectDB();

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Simple health endpoint
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'TaskFlow API is up' });
});

// API routes
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const protect = require('./middleware/auth');

app.use('/api/auth', authRoutes);
app.use('/api/projects', protect, projectRoutes);
app.use('/api/tasks', protect, taskRoutes);

// Serve static client (if any)
app.use(express.static(path.join(__dirname, '..', 'client')));

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

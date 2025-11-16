// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

const authRoutes = require('./api/routes/auth');
const userRoutes = require('./api/routes/users');
const interviewRoutes = require('./api/routes/interviews');
const sessionRoutes = require('./api/routes/sessions');
const aiRoutes = require('./api/routes/ai');
const codingRoutes = require('./api/routes/coding');
const authMiddleware = require('./api/middleware/authMiddleware').protect;

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check Endpoint (moved to top for early verification)
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/interviews', authMiddleware, interviewRoutes);
app.use('/api/sessions', authMiddleware, sessionRoutes);
app.use('/api/ai', authMiddleware, aiRoutes);
app.use('/api/coding', authMiddleware, codingRoutes);

// --- WebSocket Server Logic ---
const clients = new Map(); // Map to store userId -> WebSocket connection

wss.on('connection', (ws, req) => {
  const token = new URL(req.url, `http://${req.headers.host}`).searchParams.get('token');

  if (!token) {
    ws.close(1008, 'Token not provided');
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.user.id;
    clients.set(userId, ws);
    console.log(`WebSocket client connected: user ${userId}`);

    ws.on('message', message => {
        // Handle incoming messages if needed in the future
        console.log(`Received message from user ${userId}: ${message}`);
    });

    ws.on('close', () => {
        clients.delete(userId);
        console.log(`WebSocket client disconnected: user ${userId}`);
    });

    ws.on('error', (error) => {
        console.error(`WebSocket error for user ${userId}:`, error);
    });

  } catch (err) {
    console.error('WebSocket auth error:', err.message);
    ws.close(1008, 'Invalid token');
  }
});

// Make the WebSocket clients map available to other modules (e.g., controllers)
app.set('webSocketClients', clients);


// --- Static File Serving ---
// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// All other GET requests not handled before will return the Angular app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Generic error handling middleware
app.use((err, req, res, next) => {
  console.error('Express Error Handler:', err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'An unexpected server error occurred.',
  });
});


// --- Server Startup ---
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
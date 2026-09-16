require('dotenv').config();
console.log('[ENV TEST] MongoDB URI loaded:', process.env.MONGODB_URI ? 'YES' : 'NO');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./config/db');

// Import routes
const authRoutes = require('./routes/authRoutes');
const presentationRoutes = require('./routes/presentationRoutes');
const videoRoutes = require('./routes/videoRoutes');
const analysisRoutes = require('./routes/analysisRoutes');
const weakSectionRoutes = require('./routes/weakSectionRoutes');
const practiceRoutes = require('./routes/practiceRoutes');
const historyRoutes = require('./routes/historyRoutes');

const app = express();
const server = http.createServer(app);

// Socket.IO configuration
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/presentations', presentationRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/weak-sections', weakSectionRoutes);
app.use('/api/practice', practiceRoutes);
app.use('/api/history', historyRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'AI Confidence Analyzer Backend',
    timestamp: new Date().toISOString()
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  socket.on('join_presentation', (presentationId) => {
    socket.join(`presentation_${presentationId}`);
    console.log(`[Socket] Client ${socket.id} joined room presentation_${presentationId}`);
  });

  socket.on('join_practice', (weakSectionId) => {
    socket.join(`weakSection_${weakSectionId}`);
    console.log(`[Socket] Client ${socket.id} joined room weakSection_${weakSectionId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// Connect to Database and start server
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 AI Confidence Analyzer Backend running on port ${PORT}`);
    console.log(`📡 WebSocket server initialized`);
    console.log(`📁 Uploads served at http://localhost:${PORT}/uploads`);
    console.log(`=======================================================`);
  });
});

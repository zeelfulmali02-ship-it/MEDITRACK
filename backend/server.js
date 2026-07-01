const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Make io accessible in routes/controllers
app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('../frontend'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/medicines', require('./routes/medicines'));
app.use('/api/pharmacy', require('./routes/pharmacy'));
app.use('/api/reservation', require('./routes/reservation'));
app.use('/api/admin', require('./routes/admin'));

// Error handling middleware
app.use(require('./middleware/errorHandler'));

// Socket.IO events
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

// Connect to MongoDB and start server
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    server.listen(process.env.PORT, () =>
      console.log(`Server running on http://localhost:${process.env.PORT}`)
    );
  })
  .catch(err => { console.error('DB connection error:', err); process.exit(1); });

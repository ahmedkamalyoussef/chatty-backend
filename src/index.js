import express from 'express';
import authRoutes from './routes/auth.route.js';
import messageRoutes from './routes/message.route.js';
import friendshipRoutes from './routes/friends.route.js';
import groupRoutes from './routes/group.route.js';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { connectDB } from './lib/db.js';
import { app, server } from './lib/socket.js';

dotenv.config();

const ALLOWED_ORIGINS = [
  'http://localhost:5173',  // Development
  'http://localhost:4173',  // Vite preview
  process.env.FRONTEND_URL, // Production URL from env
].filter(Boolean);

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl)
    if (!origin) return callback(null, true);
    
    if (ALLOWED_ORIGINS.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

const PORT = process.env.PORT || 5001;

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/messages", messageRoutes);
app.use("/api/v1/friends", friendshipRoutes);
app.use("/api/v1/groups", groupRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something broke!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDB();
});
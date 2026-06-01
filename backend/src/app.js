const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

// Routes imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const songRoutes = require('./routes/songRoutes');
const playlistRoutes = require('./routes/playlistRoutes');
const albumRoutes = require('./routes/albumRoutes');
const artistRoutes = require('./routes/artistRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Custom error handling middleware
const errorHandler = require('./middleware/errorMiddleware');

const app = express();

// 1. HTTP Security Headers
app.use(helmet());

// 2. Rate Limiting Protection - Throttles malicious brute-force attempts
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // Limit each IP to 150 requests per window
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again in 15 minutes.',
  },
});
app.use('/api', apiLimiter);

// 3. CORS Configuration
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// 4. Request Parsers
app.use(express.json({ limit: '10mb' })); // support larger JSON payloads for cover-arts
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// 5. API Endpoints Mounting
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/songs', songRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/albums', albumRoutes);
app.use('/api/artists', artistRoutes);
app.use('/api/admin', adminRoutes);

// 6. Base API Status Route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Enterprise Spotify Clone API is online and fully secured.',
    version: '2.0.0',
    env: process.env.NODE_ENV,
  });
});

// 7. Undefined Route Handler (404)
app.use('*', (req, res, next) => {
  const ApiError = require('./utils/ApiError');
  next(new ApiError(404, `Endpoint ${req.originalUrl} does not exist`));
});

// 8. Global Exception Mapping Handler
app.use(errorHandler);

module.exports = app;

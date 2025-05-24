import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { errorHandler } from './middleware/errorHandler.js';
import { initScheduledJobs } from './scheduledJobs.js';

// Routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import organizationRoutes from './routes/organizations.js';
import workflowRoutes from './routes/workflows.js';
import inspectionRoutes from './routes/inspections.js';
import reportRoutes from './routes/reports.js';
import mediaRoutes from './routes/media.js';
import dashboardRoutes from './routes/dashboard.js';
import statsRoutes from './routes/stats.js';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure CORS for both development and production
app.use(cors({
  origin: [
    'http://localhost:3000',               // Local development
    'http://localhost:5173',               // Vite dev server
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    'https://localhost:3000',
    process.env.FRONTEND_URL || '*',       // Production frontend URL from env
    'https://snapcheckv1.s3-website.ap-south-1.amazonaws.com', // S3 bucket URL
    'http://snapcheckv1.s3-website.ap-south-1.amazonaws.com'   // S3 bucket URL (non-HTTPS)
  ],
  credentials: true
}));

// Static files folder
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/inspections', inspectionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/stats', statsRoutes);

// Error handling middleware
app.use(errorHandler);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://exim_test:5pzZt0QlPJoj4iA6@eximtest.xovvhdm.mongodb.net/exim', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log('MongoDB connected');
    
    // Initialize scheduled jobs after DB connection
    initScheduledJobs();
    console.log('Scheduled jobs initialized');
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
console.log(process.env.MONGODB_URI);
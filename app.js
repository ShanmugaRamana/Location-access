import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import locationRoutes from './routes/locationRoutes.js';
import mime from 'mime';

const app = express();
const port = process.env.PORT || 3000;

// Get directory name when using ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(express.json());

// Serve static files with correct MIME types
app.use(express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, path) => {
        const mimeType = mime.getType(path);
        if (mimeType) {
            res.setHeader('Content-Type', mimeType);
        }
    }
}));

// Serve the favicon explicitly
app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'favicon.ico'));
});

// Routes
app.use('/location', locationRoutes);

// Catch-all route
app.use((req, res) => {
  res.status(404).send("Sorry, that route doesn't exist.");
});

// Error-handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Internal Server Error');
});

// Unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

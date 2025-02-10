import 'dotenv/config'; // Use import for dotenv
import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url'; // Import fileURLToPath
import locationRoutes from './routes/locationRoutes.js'; // Add .js extension

const app = express();
const port = process.env.PORT || 3000;

// Get directory name when using ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/location', locationRoutes);

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

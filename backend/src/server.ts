import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Database } from './database';
import { mealsRouter } from './routes/meals';
import { llmRouter } from './routes/llm';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3002', 10);

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
const database = new Database();

// Routes
app.use('/api/meals', mealsRouter);
app.use('/api/llm', llmRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Accessible at: http://localhost:${PORT}`);
  console.log(`Network access: http://192.168.1.67:${PORT}`);
});

export default app;
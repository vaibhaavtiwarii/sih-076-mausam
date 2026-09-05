app.set('trust proxy', 1);

// backend/server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const weatherRoutes = require('./routes/weatherRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const alertRoutes = require('./routes/alertRoutes');
const assistantRoutes = require('./routes/assistantRoutes');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => res.send('Backend API is running!'));
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'MAUSAM AI Backend' });
});

// Routes
app.use('/api/weather', weatherRoutes);
app.use('/api/recommend', recommendationRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/assistant', assistantRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

app.listen(PORT, () => {
  console.log(`✅ MAUSAM AI Backend running on http://localhost:${PORT}`);
});
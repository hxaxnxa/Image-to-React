const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const uploadRoutes = require('./routes/upload');
const geminiRoutes = require('./routes/gemini');
const publishRoutes = require('./routes/publish');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/upload', uploadRoutes);
app.use('/api/gemini', geminiRoutes);
app.use('/api/publish', publishRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const GeminiService = require('../services/geminiService');

const geminiService = new GeminiService();

router.post('/', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No images provided' });
    }

    const descriptions = await Promise.all(
      req.files.map(async (file) => {
        const description = await geminiService.generateUIDescription(file.buffer);
        return { description, filename: file.originalname };
      })
    );

    res.json({ descriptions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
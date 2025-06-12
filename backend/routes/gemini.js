const express = require('express');
const router = express.Router();
const GeminiService = require('../services/geminiService');

const geminiService = new GeminiService();

router.post('/generate-description', async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }
    const description = await geminiService.generateUIDescription(req.file.buffer);
    res.json({ description });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/generate-code', async (req, res) => {
  const { uiDescription, userPrompt, deviceType } = req.body;
  try {
    if (!uiDescription || !userPrompt) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const code = await geminiService.generateReactCode(uiDescription, userPrompt, deviceType);
    res.json({ code });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
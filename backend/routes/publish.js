const express = require('express');
const router = express.Router();
const ProjectManager = require('../services/projectManager');

const projectManager = new ProjectManager();

router.post('/', async (req, res) => {
  const { reactCode, deviceType, metadata } = req.body;

  try {
    if (!reactCode) {
      return res.status(400).json({ error: 'No code provided' });
    }
    const result = await projectManager.publishProject(reactCode, deviceType, metadata);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;